/**
 * IPFS Utilities
 * Functions to fetch and process IPFS data via Pinata gateway
 */

const PINATA_GATEWAY = "https://azure-fantastic-loon-956.mypinata.cloud/ipfs";

export interface PropertyMetadata {
    title: string;
    description: string;
    location: string;
    images: string[]; // IPFS URLs like ipfs://...
    amenities: string[];
    maxGuests: number;
    bedrooms: number;
    bathrooms: number;
}

/**
 * Convert IPFS URI to HTTP URL
 * ipfs://QmXxx... -> https://gateway.pinata.cloud/ipfs/QmXxx...
 */
export function ipfsToHttp(ipfsUri: string): string {
    if (ipfsUri.startsWith('ipfs://')) {
        const hash = ipfsUri.replace('ipfs://', '');
        return `${PINATA_GATEWAY}/${hash}`;
    }
    return ipfsUri;
}

/**
 * Fetch metadata from IPFS
 */
export async function fetchIPFSMetadata(ipfsUri: string): Promise<PropertyMetadata | null> {
    try {
        const httpUrl = ipfsToHttp(ipfsUri);
        console.log('📥 Fetching IPFS metadata from:', httpUrl);

        const response = await fetch(httpUrl);

        if (!response.ok) {
            console.error('Failed to fetch IPFS metadata:', response.statusText);
            return null;
        }

        const metadata = await response.json();
        console.log('✅ IPFS metadata fetched:', metadata);

        return metadata;
    } catch (error) {
        console.error('Error fetching IPFS metadata:', error);
        return null;
    }
}

/**
 * Fetch image from IPFS
 */
export function getIPFSImageUrl(ipfsUri: string): string {
    return ipfsToHttp(ipfsUri);
}
