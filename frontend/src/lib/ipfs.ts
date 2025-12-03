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
 * Handles both formats:
 * - ipfs://QmXxx... -> https://gateway.pinata.cloud/ipfs/QmXxx...
 * - QmXxx... (bare hash) -> https://gateway.pinata.cloud/ipfs/QmXxx...
 */
export function ipfsToHttp(ipfsUri: string): string {
    if (!ipfsUri) return '';

    // Remove ipfs:// prefix if present
    if (ipfsUri.startsWith('ipfs://')) {
        const hash = ipfsUri.replace('ipfs://', '');
        return `${PINATA_GATEWAY}/${hash}`;
    }

    // If it's already an HTTP URL, return as is
    if (ipfsUri.startsWith('http://') || ipfsUri.startsWith('https://')) {
        return ipfsUri;
    }

    // Otherwise, treat it as a bare IPFS hash
    // This handles cases where the blockchain stores just "Qm..." or "baf..."
    return `${PINATA_GATEWAY}/${ipfsUri}`;
}

/**
 * Fetch metadata from IPFS with retry logic
 */
export async function fetchIPFSMetadata(ipfsUri: string): Promise<PropertyMetadata | null> {
    try {
        const httpUrl = ipfsToHttp(ipfsUri);
        console.log('📥 Fetching IPFS metadata from:', httpUrl);

        const response = await fetch(httpUrl, {
            headers: {
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            console.error('Failed to fetch IPFS metadata:', response.status, response.statusText);
            return null;
        }

        // Check if response is actually JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            console.error('Response is not JSON, got content-type:', contentType);
            const text = await response.text();
            console.error('Response preview:', text.substring(0, 200));
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