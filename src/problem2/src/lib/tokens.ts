export const PRICES_URL = 'https://interview.switcheo.com/prices.json';
const ICON_BASE = 'https://raw.githubusercontent.com/Switcheo/token-icons/main/tokens';

export interface Token {
  symbol: string;
  /** USD price */
  price: number;
  /** ISO date of the price used */
  updatedAt: string;
}

interface PriceEntry {
  currency: string;
  date: string;
  price: number;
}

// The icon repo is case-sensitive and spells a few symbols differently from the price feed.
const ICON_ALIASES: Record<string, string> = {
  RATOM: 'rATOM',
  STATOM: 'stATOM',
  STEVMOS: 'stEVMOS',
  STLUNA: 'stLUNA',
  STOSMO: 'stOSMO',
};

export const tokenIconUrl = (symbol: string) => `${ICON_BASE}/${ICON_ALIASES[symbol] ?? symbol}.svg`;

/**
 * The feed can list the same currency more than once (e.g. BUSD).
 * Keep the most recent entry per currency (the later one in the feed on a tie),
 * and drop tokens without a usable price.
 */
export const normalizePrices = (entries: PriceEntry[]): Token[] => {
  const latest = new Map<string, PriceEntry>();
  for (const entry of entries) {
    if (!entry?.currency || !Number.isFinite(entry.price) || entry.price <= 0) continue;
    const current = latest.get(entry.currency);
    if (!current || Date.parse(entry.date) >= Date.parse(current.date)) {
      latest.set(entry.currency, entry);
    }
  }
  return [...latest.values()]
    .map(({ currency, price, date }) => ({ symbol: currency, price, updatedAt: date }))
    .sort((a, b) => a.symbol.localeCompare(b.symbol, undefined, { sensitivity: 'base' }));
};

export const fetchTokens = async (signal?: AbortSignal): Promise<Token[]> => {
  const res = await fetch(PRICES_URL, { signal });
  if (!res.ok) throw new Error(`Price service responded with ${res.status}`);
  return normalizePrices(await res.json());
};

/** amountIn of `from` expressed in `to`. */
export const convert = (amountIn: number, from: Token, to: Token) => (amountIn * from.price) / to.price;

/**
 * Deterministic mock wallet: each token gets a balance worth roughly $50–$5,000,
 * so the "insufficient balance" validation and the MAX button have something to work with.
 */
export const mockBalances = (tokens: Token[]): Record<string, number> => {
  const balances: Record<string, number> = {};
  for (const token of tokens) {
    let hash = 0;
    for (const ch of token.symbol) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
    const usd = 50 + (hash % 4950);
    balances[token.symbol] = Number((usd / token.price).toPrecision(6));
  }
  return balances;
};
