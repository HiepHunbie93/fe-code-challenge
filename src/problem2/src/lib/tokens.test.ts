import { describe, expect, it } from 'vitest';
import { PRICE_FEED, mockFetch } from '../test/fixtures';
import { convert, fetchTokens, mockBalances, normalizePrices, tokenIconUrl } from './tokens';

describe('normalizePrices', () => {
  const tokens = normalizePrices(PRICE_FEED);

  it('keeps one entry per currency, preferring the latest date', () => {
    const usdc = tokens.filter((t) => t.symbol === 'USDC');
    expect(usdc).toHaveLength(1);
    expect(usdc[0].price).toBe(0.9998782611186441);
  });

  it('prefers the later entry in the feed when dates tie', () => {
    const [token] = normalizePrices([
      { currency: 'X', date: '2023-01-01T00:00:00Z', price: 1 },
      { currency: 'X', date: '2023-01-01T00:00:00Z', price: 2 },
    ]);
    expect(token.price).toBe(2);
  });

  it('drops tokens without a usable price', () => {
    expect(tokens.map((t) => t.symbol)).not.toContain('BROKEN');
    expect(normalizePrices([{ currency: 'NAN', date: '', price: Number.NaN }])).toEqual([]);
  });

  it('sorts alphabetically, ignoring case', () => {
    expect(tokens.map((t) => t.symbol)).toEqual(['ETH', 'STATOM', 'SWTH', 'USDC']);
  });
});

describe('fetchTokens', () => {
  it('fetches and normalises the feed', async () => {
    const fetch = mockFetch();
    const tokens = await fetchTokens();
    expect(fetch).toHaveBeenCalledOnce();
    expect(tokens).toHaveLength(4);
  });

  it('surfaces HTTP errors', async () => {
    mockFetch([], false);
    await expect(fetchTokens()).rejects.toThrow('503');
  });
});

describe('convert', () => {
  it('converts through USD prices', () => {
    const eth = { symbol: 'ETH', price: 2000, updatedAt: '' };
    const usdc = { symbol: 'USDC', price: 1, updatedAt: '' };
    expect(convert(1.5, eth, usdc)).toBe(3000);
    expect(convert(3000, usdc, eth)).toBe(1.5);
  });
});

describe('tokenIconUrl', () => {
  it('maps feed symbols to the icon repo spelling', () => {
    expect(tokenIconUrl('ETH')).toMatch(/\/ETH\.svg$/);
    expect(tokenIconUrl('STATOM')).toMatch(/\/stATOM\.svg$/);
  });
});

describe('mockBalances', () => {
  it('is deterministic and gives every token a positive balance', () => {
    const tokens = normalizePrices(PRICE_FEED);
    const a = mockBalances(tokens);
    expect(mockBalances(tokens)).toEqual(a);
    for (const t of tokens) expect(a[t.symbol]).toBeGreaterThan(0);
  });
});
