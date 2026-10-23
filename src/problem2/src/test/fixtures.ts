import { vi } from 'vitest';

/** A trimmed copy of the real feed, including its quirks (duplicates, a zero price). */
export const PRICE_FEED = [
  { currency: 'ETH', date: '2023-08-29T07:10:52.000Z', price: 1645.9337373737374 },
  { currency: 'USDC', date: '2023-08-29T07:10:30.000Z', price: 1 },
  { currency: 'USDC', date: '2023-08-29T07:10:40.000Z', price: 0.9998782611186441 },
  { currency: 'SWTH', date: '2023-08-29T07:10:40.000Z', price: 0.004039850455 },
  { currency: 'STATOM', date: '2023-08-29T07:10:40.000Z', price: 8.512162050847458 },
  { currency: 'BROKEN', date: '2023-08-29T07:10:40.000Z', price: 0 },
];

export const mockFetch = (body: unknown = PRICE_FEED, ok = true) => {
  const fetch = vi.fn().mockResolvedValue({ ok, status: ok ? 200 : 503, json: () => Promise.resolve(body) });
  vi.stubGlobal('fetch', fetch);
  return fetch;
};
