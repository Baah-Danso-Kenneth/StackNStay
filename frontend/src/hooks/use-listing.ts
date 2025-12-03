import { useState } from "react";
import { useAuth } from "./use-auth";
import { listProperty } from "@/lib/escrow";
import { useToast } from "./use-toast";
import {
    openContractCall,
} from "@stacks/connect";



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

export interface ListingMetadata {
    title: string;
    description: string;
    location: string;
    images: string[]; // IPFS URLs
    amenities: string[];
    maxGuests: number;
    bedrooms: number;
    bathrooms: number;
}

export function useListing() {
    const { userData } = useAuth();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    /**
     * Upload metadata to IPFS via backend
     */
    const uploadMetadataToIPFS = async (metadata: ListingMetadata): Promise<string> => {
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}/api/ipfs/upload`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(metadata),
            });

            if (!response.ok) {
                throw new Error('Failed to upload metadata to IPFS');
            }

            const data = await response.json();
            return data.ipfsHash; // Returns the IPFS hash
        } catch (error) {
            console.error('Error uploading to IPFS:', error);
            throw error;
        }
    };

    /**
     * Upload images to IPFS via backend
     */
    const uploadImagesToIPFS = async (images: File[]): Promise<string[]> => {
        try {
            const uploadedUrls: string[] = [];

            for (let i = 0; i < images.length; i++) {
                const formData = new FormData();
                formData.append('file', images[i]);

                const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}/api/ipfs/upload-image`, {
                    method: 'POST',
                    body: formData,
                });

                if (!response.ok) {
                    throw new Error(`Failed to upload image ${i + 1}`);
                }

                const data = await response.json();
                uploadedUrls.push(data.ipfsUrl);

                // Update progress
                setUploadProgress(((i + 1) / images.length) * 50); // First 50% for images
            }

            return uploadedUrls;
        } catch (error) {
            console.error('Error uploading images:', error);
            throw error;
        }
    };

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
                ? await uploadImagesToIPFS(formData.images)
                : [];

            // Step 2: Create metadata object (50-60%)
            setUploadProgress(50);
            const metadata: ListingMetadata = {
                title: formData.title,
                description: formData.description,
                location: formData.location,
                images: imageUrls,
                amenities: formData.amenities,
                maxGuests: parseInt(formData.maxGuests) || 1,
                bedrooms: parseInt(formData.bedrooms) || 1,
                bathrooms: parseInt(formData.bathrooms) || 1,
            };

            // Step 3: Upload metadata to IPFS (60-80%)
            toast({
                title: "Creating Metadata",
                description: "Uploading property metadata to IPFS...",
            });

            const metadataUri = await uploadMetadataToIPFS(metadata);
            setUploadProgress(80);

            // Step 4: Prepare contract call (80-90%)
            toast({
                title: "Preparing Transaction",
                description: "Preparing blockchain transaction...",
            });

            // Convert price to microSTX (1 STX = 1,000,000 microSTX)
            const priceInMicroSTX = Math.floor(parseFloat(formData.pricePerNight) * 1_000_000);
            const locationTagNum = parseInt(formData.locationTag) || 0;

            // Get contract call options
            const contractCallOptions = await listProperty({
                pricePerNight: priceInMicroSTX,
                locationTag: locationTagNum,
                metadataUri: metadataUri,
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

                        // Wait for transaction confirmation
                        // The transaction needs to be confirmed before we can get the property ID
                        console.log('⏳ Waiting for transaction to confirm...');
                        console.log('Transaction ID:', data.txId);

                        // Poll for transaction confirmation
                        const maxAttempts = 30; // 30 attempts * 2 seconds = 1 minute max wait
                        let attempts = 0;
                        let propertyId: number | null = null;

                        while (attempts < maxAttempts && propertyId === null) {
                            attempts++;

                            // Wait 2 seconds between checks
                            await new Promise(resolve => setTimeout(resolve, 2000));

                            try {
                                // Check transaction status
                                const txStatusResponse = await fetch(
                                    `https://api.testnet.hiro.so/extended/v1/tx/${data.txId}`
                                );

                                if (txStatusResponse.ok) {
                                    const txStatus = await txStatusResponse.json();
                                    console.log(`Attempt ${attempts}: Transaction status:`, txStatus.tx_status);

                                    if (txStatus.tx_status === 'success') {
                                        // Transaction confirmed! Extract property ID from contract result
                                        // The list-property function returns (ok property-id)
                                        const txResult = txStatus.tx_result;

                                        if (txResult && txResult.repr) {
                                            // Parse the result, e.g., "(ok u0)" -> 0
                                            const match = txResult.repr.match(/\(ok u(\d+)\)/);
                                            if (match && match[1]) {
                                                propertyId = parseInt(match[1]);
                                                console.log('✅ Property ID extracted:', propertyId);
                                                break;
                                            }
                                        }
                                    } else if (txStatus.tx_status === 'abort_by_response' || txStatus.tx_status === 'abort_by_post_condition') {
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

                        // Sync to backend database
                        toast({
                            title: "Syncing to Database",
                            description: `Saving property #${propertyId} details...`,
                        });

                        const syncResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}/api/properties/sync`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                blockchain_id: propertyId,
                                owner_address: userData.profile.stxAddress.testnet, // Use testnet address
                                price_per_night: priceInMicroSTX,
                                location_tag: locationTagNum,
                                metadata_uri: metadataUri,
                                ipfs_hash: metadataUri,
                                active: true
                            }),
                        });

                        if (!syncResponse.ok) {
                            const errorData = await syncResponse.json();
                            console.error('Failed to sync property to database:', errorData);
                            toast({
                                title: "Warning",
                                description: `Property #${propertyId} listed on blockchain but failed to sync to database: ${errorData.detail || 'Unknown error'}`,
                                variant: "destructive",
                            });
                        } else {
                            console.log('✅ Property synced to database successfully');
                            toast({
                                title: "Success!",
                                description: `Property #${propertyId} has been listed and synced successfully!`,
                            });
                        }
                    } catch (syncError) {
                        console.error('Error during sync process:', syncError);
                        toast({
                            title: "Sync Error",
                            description: syncError instanceof Error ? syncError.message : "Failed to sync property. It may appear shortly.",
                            variant: "destructive",
                        });
                    } finally {
                        setUploadProgress(100);
                    }
                },
                onCancel: () => {
                    toast({
                        title: "Transaction Cancelled",
                        description: "You cancelled the transaction",
                        variant: "destructive",
                    });
                },
            });

        } catch (error) {
            console.error('Error creating listing:', error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to create listing",
                variant: "destructive",
            });
        } finally {
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