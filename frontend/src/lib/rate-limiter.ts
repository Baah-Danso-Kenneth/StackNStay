/**
 * Global Rate Limiter for Stacks API calls
 * Ensures that we don't hit the 429 Too Many Requests limit
 * by serializing requests and enforcing a delay between them.
 */

type RequestTask<T> = () => Promise<T>;

class GlobalRateLimiter {
    private queue: { task: RequestTask<any>; resolve: (value: any) => void; reject: (reason: any) => void }[] = [];
    private isProcessing = false;
    private lastRequestTime = 0;
    // 500ms delay between requests (conservative to be safe)
    // If we still get 429s, we can increase this.
    private minDelay = 500;

    /**
     * Add a request to the queue
     */
    async add<T>(task: RequestTask<T>): Promise<T> {
        return new Promise((resolve, reject) => {
            this.queue.push({ task, resolve, reject });
            this.processQueue();
        });
    }

    /**
     * Process the queue one by one
     */
    private async processQueue() {
        if (this.isProcessing || this.queue.length === 0) {
            return;
        }

        this.isProcessing = true;

        while (this.queue.length > 0) {
            const item = this.queue.shift();
            if (!item) break;

            // Enforce delay since last request
            const now = Date.now();
            const timeSinceLastRequest = now - this.lastRequestTime;
            const timeToWait = Math.max(0, this.minDelay - timeSinceLastRequest);

            if (timeToWait > 0) {
                await new Promise(resolve => setTimeout(resolve, timeToWait));
            }

            try {
                // Execute the task
                const result = await item.task();
                this.lastRequestTime = Date.now();
                item.resolve(result);
            } catch (error: any) {
                // If we hit a 429, wait longer and retry once (optional robustness)
                if (error?.message?.includes('429') || error?.toString().includes('429')) {
                    console.warn("⚠️ Hit 429 in rate limiter, waiting 2s before retrying...");
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    try {
                        const retryResult = await item.task();
                        this.lastRequestTime = Date.now();
                        item.resolve(retryResult);
                    } catch (retryError) {
                        item.reject(retryError);
                    }
                } else {
                    item.reject(error);
                }
            }
        }

        this.isProcessing = false;
    }
}

// Export a singleton instance
export const rateLimiter = new GlobalRateLimiter();
