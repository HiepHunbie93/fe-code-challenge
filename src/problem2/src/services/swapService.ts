export interface SwapRequest {
  fromSymbol: string;
  toSymbol: string;
  fromAmount: number;
  toAmount: number;
}

export interface SwapReceipt extends SwapRequest {
  id: string;
  executedAt: string;
}

export const SWAP_DELAY_MS = 1800;

/**
 * Stand-in for the backend call that would execute the swap.
 * The UI only depends on this signature, so swapping in a real API later touches nothing else.
 */
export const submitSwap = (request: SwapRequest, delayMs = SWAP_DELAY_MS): Promise<SwapReceipt> =>
  new Promise((resolve, reject) => {
    window.setTimeout(() => {
      if (!navigator.onLine) {
        reject(new Error('You appear to be offline. Check your connection and try again.'));
        return;
      }
      resolve({
        ...request,
        id: Math.random().toString(36).slice(2, 10).toUpperCase(),
        executedAt: new Date().toISOString(),
      });
    }, delayMs);
  });
