import { describe, expect, it } from 'vitest';
import { formatAmount, formatUsd, sanitizeAmountInput, toInputValue } from './format';

describe('sanitizeAmountInput', () => {
  it.each([
    ['', ''],
    ['12', '12'],
    ['12.5', '12.5'],
    ['.5', '.5'],
    ['12,5', '12.5'],
    [' 1 000 ', '1000'],
    ['007', '7'],
    ['0.05', '0.05'],
  ])('accepts %j as %j', (raw, expected) => {
    expect(sanitizeAmountInput(raw)).toBe(expected);
  });

  it.each(['abc', '1.2.3', '-5', '1e5', '12$'])('rejects %j', (raw) => {
    expect(sanitizeAmountInput(raw)).toBeNull();
  });

  it('rejects absurdly long input', () => {
    expect(sanitizeAmountInput('1'.repeat(31))).toBeNull();
  });
});

describe('toInputValue', () => {
  it.each([
    [5, '5'],
    [142.385, '142.385'],
    [0.1 + 0.2, '0.3'],
    [1234567.891234567, '1234567.891234'],
    [0.0000123456789, '0.0000123456'],
    [1e-12, '0.000000000001'],
  ])('writes %d as %j', (value, expected) => {
    expect(toInputValue(value)).toBe(expected);
  });

  it('never rounds up (so MAX cannot exceed the balance)', () => {
    expect(toInputValue(0.9999999999)).toBe('0.999999');
    for (let i = 0; i < 2000; i++) {
      const value = Math.random() * 10 ** (Math.random() * 10 - 5);
      expect(Number(toInputValue(value))).toBeLessThanOrEqual(value);
    }
  });

  it('returns an empty string for nothing to show', () => {
    expect(toInputValue(0)).toBe('');
    expect(toInputValue(-1)).toBe('');
    expect(toInputValue(Number.NaN)).toBe('');
  });
});

describe('display formatting', () => {
  it('formats token amounts with precision that fits their size', () => {
    expect(formatAmount(1234567.891)).toBe('1,234,567.89');
    expect(formatAmount(2.84641234)).toBe('2.8464');
    expect(formatAmount(0.00012345)).toBe('0.000123');
    expect(formatAmount(0)).toBe('0');
  });

  it('formats USD, keeping sub-cent prices readable', () => {
    expect(formatUsd(2468.9)).toBe('$2,468.90');
    expect(formatUsd(0.00403985)).toBe('$0.00404');
  });
});
