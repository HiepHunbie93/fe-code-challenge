/** Display a token amount: more decimals for small numbers, thousand separators for big ones. */
export const formatAmount = (value: number): string => {
  if (!Number.isFinite(value) || value === 0) return '0';
  const abs = Math.abs(value);
  const maximumFractionDigits = abs >= 1000 ? 2 : abs >= 1 ? 4 : abs >= 0.0001 ? 6 : 10;
  return value.toLocaleString('en-US', { maximumFractionDigits });
};

export const formatUsd = (value: number): string =>
  value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: value !== 0 && Math.abs(value) < 0.01 ? 6 : 2,
  });

/** Value written back into an input box: plain digits, no separators, no exponent. */
export const toInputValue = (value: number): string => {
  if (!Number.isFinite(value) || value <= 0) return '';
  // Up to 6 decimals for normal amounts, 6 significant digits for tiny ones (0.00001234).
  const digits = value >= 1 ? 6 : Math.min(18, 5 - Math.floor(Math.log10(value)));
  // Truncate rather than round, so MAX never ends up a hair above the real balance.
  // Done on the decimal string to avoid float error (142.385 * 1e6 is not exactly 142385000).
  const plain = toPlainDecimal(value);
  const dot = plain.indexOf('.');
  if (dot === -1) return plain;
  return plain.slice(0, dot + digits + 1).replace(/\.?0+$/, '');
};

/** Shortest decimal for a positive number, without exponent notation (1e-12 -> "0.000000000001"). */
const toPlainDecimal = (value: number): string => {
  const str = String(value);
  const match = /^(\d+)(?:\.(\d+))?e([+-]\d+)$/.exec(str);
  if (!match) return str;
  const [, int, frac = '', expStr] = match;
  const digits = int + frac;
  const point = int.length + Number(expStr); // position of the decimal point within `digits`
  if (point <= 0) return `0.${'0'.repeat(-point)}${digits}`;
  if (point >= digits.length) return digits + '0'.repeat(point - digits.length);
  return `${digits.slice(0, point)}.${digits.slice(point)}`;
};

/**
 * Sanitise what the user typed into an amount field.
 * Accepts digits and a single decimal point (a comma is treated as one); returns null to reject the keystroke.
 */
export const sanitizeAmountInput = (raw: string): string | null => {
  const value = raw.replace(/,/g, '.').replace(/\s/g, '');
  if (value === '') return '';
  if (!/^\d*\.?\d*$/.test(value)) return null;
  if (value.replace('.', '').length > 30) return null;
  // "007" -> "7", but keep "0.5"
  return value.replace(/^0+(?=\d)/, '');
};
