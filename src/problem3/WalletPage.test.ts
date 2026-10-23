import { describe, expect, it } from 'vitest';
import { formatBalances, getPriority, prioritizeBalances, type WalletBalance } from './WalletPage';

const balance = (currency: string, blockchain: string, amount: number) =>
  ({ currency, blockchain, amount }) as WalletBalance;

describe('getPriority', () => {
  it('ranks known chains and sends unknown ones to the bottom', () => {
    expect(getPriority('Osmosis')).toBe(100);
    expect(getPriority('Neo')).toBe(20);
    expect(getPriority('Solana')).toBe(-99);
  });
});

describe('prioritizeBalances', () => {
  it('keeps positive balances and drops empty ones (the original filter was inverted)', () => {
    const result = prioritizeBalances([balance('ATOM', 'Osmosis', 0), balance('ETH', 'Ethereum', 2)]);
    expect(result.map((b) => b.currency)).toEqual(['ETH']);
  });

  it('drops balances on unsupported chains', () => {
    expect(prioritizeBalances([balance('SOL', 'Solana', 10)])).toEqual([]);
  });

  it('sorts by chain priority, highest first', () => {
    const result = prioritizeBalances([
      balance('ARB', 'Arbitrum', 1),
      balance('OSMO', 'Osmosis', 1),
      balance('ETH', 'Ethereum', 1),
    ]);
    expect(result.map((b) => b.blockchain)).toEqual(['Osmosis', 'Ethereum', 'Arbitrum']);
  });

  it('keeps ties in their original order (the original comparator returned undefined)', () => {
    const result = prioritizeBalances([balance('NEO', 'Neo', 1), balance('ZIL', 'Zilliqa', 1)]);
    expect(result.map((b) => b.currency)).toEqual(['NEO', 'ZIL']);
  });

  it('does not mutate its input', () => {
    const input = [balance('ARB', 'Arbitrum', 1), balance('OSMO', 'Osmosis', 1)];
    prioritizeBalances(input);
    expect(input.map((b) => b.currency)).toEqual(['ARB', 'OSMO']);
  });
});

describe('formatBalances', () => {
  it('adds a formatted amount that keeps decimals, and the USD value', () => {
    const [row] = formatBalances([balance('ETH', 'Ethereum', 0.0042)], { ETH: 2000 });
    expect(row.formatted).toBe((0.0042).toLocaleString(undefined, { maximumFractionDigits: 6 }));
    expect(row.usdValue).toBeCloseTo(8.4);
  });

  it('uses 0 instead of NaN when a price is missing', () => {
    const [row] = formatBalances([balance('XYZ', 'Ethereum', 5)], {});
    expect(row.usdValue).toBe(0);
  });
});
