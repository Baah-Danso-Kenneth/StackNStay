import { useState } from "react";
import { useAuth } from "./use-auth";
import { listProperty } from "@/lib/escrow";
import { useToast } from "./use-toast";
import { openContractCall } from "@stacks/connect";
import {
    uploadMetadataToIPFS,
    uploadImagesToIPFS,
    type PropertyMetadata,
} from "@/lib/ipfs";

export interface ListingFormData {
    title: string;
    description: string;
    pricePerNight: string;
    location: string;
    locationTag: string;
    images: File[];
    amenities: string[];
    maxGuests: string;
    bedrooms: string;
    bathrooms: string;
}

export function useListing() {
    const { userData } = useAuth();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    /**
     * Create a new property listing
     */
    const createListing = async (formData: ListingFormData) => {
        if (!userData) {
            toast({
                title: "Authentication Required",
                description: "Please connect your wallet to create a listing",
                variant: "destructive",
            });
            return;
        }

        setIsSubmitting(true);
        setUploadProgress(0);

        try {
            // Step 1: Upload images to IPFS (0-50%)
            toast({
                title: "Uploading Images",
                description: "Uploading your property images to IPFS...",
            });

            const imageUrls = formData.images.length > 0
                ? await uploadImagesToIPFS(formData.images, (progress) => {
                    // Map image upload progress to 0-50% range
                    setUploadProgress((progress / 100) * 50);
                })
                : [];

            console.log('📸 Image URLs:', imageUrls);

            // Step 2: Create metadata object (50-60%)
            setUploadProgress(50);
            const metadata: PropertyMetadata = {
                title: formData.title,
                description: formData.description,
                location: formData.location,
                location_city: formData.locationTag,
                images: imageUrls, // Already in ipfs:// format
                amenities: formData.amenities,
                maxGuests: parseInt(formData.maxGuests) || 1,
                bedrooms: parseInt(formData.bedrooms) || 1,
                bathrooms: parseInt(formData.bathrooms) || 1,
            };

            console.log('📋 Metadata to upload:', metadata);

            // Step 3: Upload metadata to IPFS (60-80%)
            toast({
                title: "Creating Metadata",
                description: "Uploading property metadata to IPFS...",
            });

            const metadataHash = await uploadMetadataToIPFS(metadata);
            
            console.log('✅ Metadata IPFS Hash:', metadataHash);
            setUploadProgress(80);

            // Step 4: Prepare contract call (80-90%)
            toast({
                title: "Preparing Transaction",
                description: "Preparing blockchain transaction...",
            });

            // Convert price to microSTX (1 STX = 1,000,000 microSTX)
            const priceInMicroSTX = Math.floor(parseFloat(formData.pricePerNight) * 1_000_000);
            const locationTagNum = parseInt(formData.locationTag) || 0;

            // Get contract call options - send bare hash to blockchain
            const contractCallOptions = await listProperty({
                pricePerNight: priceInMicroSTX,
                locationTag: locationTagNum,
                metadataUri: metadataHash, // Send bare hash to contract
            });

            setUploadProgress(90);

            // Step 5: Execute contract call (90-100%)
            toast({
                title: "Confirm Transaction",
                description: "Please confirm the transaction in your wallet",
            });

            await openContractCall({
                ...contractCallOptions,
                onFinish: async (data) => {
                    console.log('✅ Transaction submitted:', data);
                    setUploadProgress(95);

                    try {
                        toast({
                            title: "Transaction Submitted",
                            description: "Waiting for blockchain confirmation...",
                        });

                        console.log('⏳ Waiting for transaction to confirm...');
                        console.log('Transaction ID:', data.txId);

                        // Poll for transaction confirmation
                        const maxAttempts = 30;
                        let attempts = 0;
                        let propertyId: number | null = null;

                        while (attempts < maxAttempts && propertyId === null) {
                            attempts++;
                            await new Promise(resolve => setTimeout(resolve, 2000));

                            try {
                                const txStatusResponse = await fetch(
                                    `https://api.testnet.hiro.so/extended/v1/tx/${data.txId}`
                                );

                                if (txStatusResponse.ok) {
                                    const txStatus = await txStatusResponse.json();
                                    console.log(`Attempt ${attempts}: Transaction status:`, txStatus.tx_status);

                                    if (txStatus.tx_status === 'success') {
                                        const txResult = txStatus.tx_result;

                                        if (txResult && txResult.repr) {
                                            const match = txResult.repr.match(/\(ok u(\d+)\)/);
                                            if (match && match[1]) {
                                                propertyId = parseInt(match[1]);
                                                console.log('✅ Property ID extracted:', propertyId);
                                                break;
                                            }
                                        }
                                    } else if (txStatus.tx_status === 'abort_by_response' || 
                                             txStatus.tx_status === 'abort_by_post_condition') {
                                        throw new Error(`Transaction failed: ${txStatus.tx_status}`);
                                    }
                                }
                            } catch (pollError) {
                                console.warn(`Attempt ${attempts} failed:`, pollError);
                            }
                        }

                        if (propertyId === null) {
                            throw new Error('Transaction confirmation timeout. Please check blockchain explorer.');
                        }

                        // Sync to backend database (if backend exists)
                        if (import.meta.env.VITE_BACKEND_URL) {
                            toast({
                                title: "Syncing to Database",
                                description: `Saving property #${propertyId} details...`,
                            });

                            const syncPayload = {
                                blockchain_id: propertyId,
                                owner_address: userData.profile.stxAddress.testnet,
                                price_per_night: priceInMicroSTX,
                                location_tag: locationTagNum,
                                metadata_uri: metadataHash,
                                ipfs_hash: metadataHash,
                                active: true
                            };

                            console.log('📤 Syncing to backend:', syncPayload);

                            try {
                                const syncResponse = await fetch(
                                    `${import.meta.env.VITE_BACKEND_URL}/api/properties/sync`,
                                    {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/json',
                                        },
                                        body: JSON.stringify(syncPayload),
                                    }
                                );

                                if (syncResponse.ok) {
                                    console.log('✅ Property synced to database');
                                } else {
                                    console.warn('⚠️ Failed to sync to database, but property is on blockchain');
                                }
                            } catch (syncError) {
                                console.warn('⚠️ Database sync failed, but property is on blockchain:', syncError);
                            }
                        }

                        toast({
                            title: "Success!",
                            description: `Property #${propertyId} has been listed successfully!`,
                        });

                    } catch (confirmError) {
                        console.error('Error during confirmation:', confirmError);
                        toast({
                            title: "Listed on Blockchain",
                            description: confirmError instanceof Error ? confirmError.message : "Property listed on blockchain. Confirmation may take time.",
                        });
                    } finally {
                        setUploadProgress(100);
                        // Reset after 2 seconds
                        setTimeout(() => {
                            setIsSubmitting(false);
                            setUploadProgress(0);
                        }, 2000);
                    }
                },
                onCancel: () => {
                    toast({
                        title: "Transaction Cancelled",
                        description: "You cancelled the transaction",
                        variant: "destructive",
                    });
                    setIsSubmitting(false);
                    setUploadProgress(0);
                },
            });

        } catch (error) {
            console.error('Error creating listing:', error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to create listing",
                variant: "destructive",
            });
            setIsSubmitting(false);
            setUploadProgress(0);
        }
    };

    /**
     * Validate listing form data
     */
    const validateListing = (formData: ListingFormData): { valid: boolean; errors: string[] } => {
        const errors: string[] = [];

        if (!formData.title || formData.title.trim().length < 3) {
            errors.push("Title must be at least 3 characters");
        }

        if (!formData.description || formData.description.trim().length < 20) {
            errors.push("Description must be at least 20 characters");
        }

        if (!formData.location || formData.location.trim().length < 3) {
            errors.push("Location is required");
        }

        const price = parseFloat(formData.pricePerNight);
        if (isNaN(price) || price <= 0) {
            errors.push("Price must be greater than 0");
        }

        const locationTag = parseInt(formData.locationTag);
        if (isNaN(locationTag) || locationTag < 0) {
            errors.push("Location tag must be a valid number");
        }

        const maxGuests = parseInt(formData.maxGuests);
        if (isNaN(maxGuests) || maxGuests < 1) {
            errors.push("Maximum guests must be at least 1");
        }

        if (formData.images.length === 0) {
            errors.push("At least one image is required");
        }

        return {
            valid: errors.length === 0,
            errors,
        };
    };

    return {
        createListing,
        validateListing,
        isSubmitting,
        uploadProgress,
    };
}