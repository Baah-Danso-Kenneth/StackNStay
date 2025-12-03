import {
    principalCV,
    uintCV,
    stringAsciiCV,
    fetchCallReadOnlyFunction,
    ClarityType,
    cvToValue,
} from "@stacks/transactions";

import { CONTRACT_ADDRESS, CONTRACTS, NETWORK } from './config';

// Constants
export const PLATFORM_FEE_BPS = 200; // 2% platform fee
export const BPS_DENOMINATOR = 10000;

// Booking Status Constants
export const BOOKING_STATUS = {
    CONFIRMED: "confirmed",
    COMPLETED: "completed",
    CANCELLED: "cancelled",
} as const;

// Types
export interface Property {
    owner: string;
    pricePerNight: number;
    locationTag: number;
    metadataUri: string;
    active: boolean;
    createdAt: number;
}

export interface Booking {
    propertyId: number;
    guest: string;
    host: string;
    checkIn: number;
    checkOut: number;
    totalAmount: number;
    platformFee: number;
    hostPayout: number;
    status: string;
    createdAt: number;
    escrowedAmount: number;
}

// ============================================
// PUBLIC FUNCTIONS (Write Operations)
// ============================================

/**
 * List a new property
 */
export async function listProperty({
    pricePerNight,
    locationTag,
    metadataUri,
}: {
    pricePerNight: number;
    locationTag: number;
    metadataUri: string;
}) {
    return {
        contractAddress: CONTRACT_ADDRESS,
        contractName: CONTRACTS.ESCROW,
        functionName: "list-property",
        functionArgs: [
            uintCV(pricePerNight),
            uintCV(locationTag),
            stringAsciiCV(metadataUri),
        ],
    };
}

/**
 * Book a property
 */
export async function bookProperty({
    propertyId,
    checkIn,
    checkOut,
    numNights,
}: {
    propertyId: number;
    checkIn: number;
    checkOut: number;
    numNights: number;
}) {
    return {
        contractAddress: CONTRACT_ADDRESS,
        contractName: CONTRACTS.ESCROW,
        functionName: "book-property",
        functionArgs: [
            uintCV(propertyId),
            uintCV(checkIn),
            uintCV(checkOut),
            uintCV(numNights),
        ],
    };
}

/**
 * Release payment to host after check-in
 */
export async function releasePayment(bookingId: number) {
    return {
        contractAddress: CONTRACT_ADDRESS,
        contractName: CONTRACTS.ESCROW,
        functionName: "release-payment",
        functionArgs: [uintCV(bookingId)],
    };
}

/**
 * Cancel a booking and process refund
 */
export async function cancelBooking(bookingId: number) {
    return {
        contractAddress: CONTRACT_ADDRESS,
        contractName: CONTRACTS.ESCROW,
        functionName: "cancel-booking",
        functionArgs: [uintCV(bookingId)],
    };
}

// ============================================
// READ-ONLY FUNCTIONS
// ============================================

/**
 * Get property details
 */
export async function getProperty(propertyId: number): Promise<Property | null> {
    try {
        const result = await fetchCallReadOnlyFunction({
            contractAddress: CONTRACT_ADDRESS,
            contractName: CONTRACTS.ESCROW,
            functionName: "get-property",
            functionArgs: [uintCV(propertyId)],
            senderAddress: CONTRACT_ADDRESS,
            network: NETWORK,
        });

        if (result.type === ClarityType.OptionalNone) {
            return null;
        }

        if (result.type !== ClarityType.OptionalSome || !result.value) {
            return null;
        }

        const data = cvToValue(result.value);

        // Extract the metadata-uri as a string
        // cvToValue returns objects for complex types, we need to handle strings specially
        let metadataUri = data["metadata-uri"];

        // If it's an object with a 'value' property, extract that
        if (metadataUri && typeof metadataUri === 'object' && 'value' in metadataUri) {
            metadataUri = metadataUri.value;
        }

        // Convert to string if it's a buffer or other type
        if (typeof metadataUri !== 'string') {
            metadataUri = String(metadataUri || '');
        }

        return {
            owner: data.owner,
            pricePerNight: Number(data["price-per-night"]),
            locationTag: Number(data["location-tag"]),
            metadataUri: metadataUri,
            active: data.active,
            createdAt: Number(data["created-at"]),
        };
    } catch (error) {
        console.error("Error fetching property:", error);
        return null;
    }
}

/**
 * Get booking details
 */
export async function getBooking(bookingId: number): Promise<Booking | null> {
    try {
        const result = await fetchCallReadOnlyFunction({
            contractAddress: CONTRACT_ADDRESS,
            contractName: CONTRACTS.ESCROW,
            functionName: "get-booking",
            functionArgs: [uintCV(bookingId)],
            senderAddress: CONTRACT_ADDRESS,
            network: NETWORK,
        });

        // get-booking returns (response (optional {...}))
        if (result.type !== ClarityType.ResponseOk) {
            return null;
        }

        const optionalValue = result.value;

        if (optionalValue.type === ClarityType.OptionalNone) {
            return null;
        }

        if (optionalValue.type !== ClarityType.OptionalSome || !optionalValue.value) {
            return null;
        }

        const data = cvToValue(optionalValue.value);

        return {
            propertyId: Number(data["property-id"]),
            guest: data.guest,
            host: data.host,
            checkIn: Number(data["check-in"]),
            checkOut: Number(data["check-out"]),
            totalAmount: Number(data["total-amount"]),
            platformFee: Number(data["platform-fee"]),
            hostPayout: Number(data["host-payout"]),
            status: data.status,
            createdAt: Number(data["created-at"]),
            escrowedAmount: Number(data["escrowed-amount"]),
        };
    } catch (error) {
        console.error("Error fetching booking:", error);
        return null;
    }
}

/**
 * Check if payment can be released for a booking
 */
export async function canReleasePayment(bookingId: number): Promise<boolean> {
    try {
        const result = await fetchCallReadOnlyFunction({
            contractAddress: CONTRACT_ADDRESS,
            contractName: CONTRACTS.ESCROW,
            functionName: "can-release-payment",
            functionArgs: [uintCV(bookingId)],
            senderAddress: CONTRACT_ADDRESS,
            network: NETWORK,
        });

        return result.type === ClarityType.BoolTrue;
    } catch (error) {
        console.error("Error checking if payment can be released:", error);
        return false;
    }
}

/**
 * Get all properties (utility function)
 * Note: This requires tracking property count in the contract or using events
 * For now, we'll implement a basic version that tries to fetch properties sequentially
 */
export async function getAllProperties(maxProperties: number = 100): Promise<(Property & { id: number })[]> {
    try {
        const properties: (Property & { id: number })[] = [];

        // Try to fetch properties up to maxProperties
        for (let i = 0; i < maxProperties; i++) {
            const property = await getProperty(i);

            if (property) {
                properties.push({
                    id: i,
                    ...property,
                });
            } else {
                // If we hit a null, we've likely reached the end
                break;
            }
        }

        console.log('✨ Found', properties.length, 'properties');
        return properties;
    } catch (error) {
        console.error("❌ Error fetching all properties:", error);
        return [];
    }
}

/**
 * Get all bookings (utility function)
 * Note: Similar to getAllProperties, this is a basic implementation
 */
export async function getAllBookings(maxBookings: number = 100): Promise<(Booking & { id: number })[]> {
    try {
        const bookings: (Booking & { id: number })[] = [];

        // Try to fetch bookings up to maxBookings
        for (let i = 0; i < maxBookings; i++) {
            const booking = await getBooking(i);

            if (booking) {
                bookings.push({
                    id: i,
                    ...booking,
                });
            } else {
                // If we hit a null, we've likely reached the end
                break;
            }
        }

        console.log('✨ Found', bookings.length, 'bookings');
        return bookings;
    } catch (error) {
        console.error("❌ Error fetching all bookings:", error);
        return [];
    }
}

/**
 * Get bookings for a specific user (as guest or host)
 */
export async function getUserBookings(userAddress: string, maxBookings: number = 100): Promise<(Booking & { id: number })[]> {
    try {
        const allBookings = await getAllBookings(maxBookings);

        // Filter bookings where user is either guest or host
        const userBookings = allBookings.filter(
            booking => booking.guest === userAddress || booking.host === userAddress
        );

        console.log('✨ Found', userBookings.length, 'bookings for user', userAddress);
        return userBookings;
    } catch (error) {
        console.error("❌ Error fetching user bookings:", error);
        return [];
    }
}

/**
 * Get properties owned by a specific user
 */
export async function getUserProperties(userAddress: string, maxProperties: number = 100): Promise<(Property & { id: number })[]> {
    try {
        const allProperties = await getAllProperties(maxProperties);

        // Filter properties owned by the user
        const userProperties = allProperties.filter(
            property => property.owner === userAddress
        );

        console.log('✨ Found', userProperties.length, 'properties for user', userAddress);
        return userProperties;
    } catch (error) {
        console.error("❌ Error fetching user properties:", error);
        return [];
    }
}
