import { NETWORK } from "./config";

/**
 * Fetch the current Stacks block height from the network API
 */
interface NetworkWithApi {
    coreApiUrl: string;
}

export async function getCurrentBlockHeight(): Promise<number> {
    try {
        const response = await fetch(`${(NETWORK as unknown as NetworkWithApi).coreApiUrl}/v2/info`);
        if (!response.ok) {
            throw new Error(`Failed to fetch network info: ${response.statusText}`);
        }
        const data = await response.json();
        return data.stacks_tip_height;
    } catch (error) {
        console.error("Error fetching block height:", error);
        // Fallback to a safe default if API fails, but log the error
        return 100000;
    }
}
