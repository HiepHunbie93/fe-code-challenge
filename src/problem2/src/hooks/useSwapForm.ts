import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toInputValue } from '../lib/format';
import { convert, mockBalances, type Token } from '../lib/tokens';
import { submitSwap as defaultSubmitSwap, type SwapReceipt, type SwapRequest } from '../services/swapService';

export type Side = 'from' | 'to';

const DEFAULT_PAIR = ['ETH', 'USDC'] as const;

interface Options {
  /** Injected so tests (or a real API) can replace the simulated backend. */
  submitSwap?: (request: SwapRequest) => Promise<SwapReceipt>;
}

const derive = (value: string, from?: Token, to?: Token): string => {
  const n = Number(value);
  return from && to && value && Number.isFinite(n) ? toInputValue(convert(n, from, to)) : '';
};

/**
 * All swap form state and rules, kept out of the components so they stay presentational.
 * Only the field the user typed in is stored; the other side is derived from prices,
 * so the two can never drift out of sync.
 */
export const useSwapForm = (tokens: Token[], { submitSwap = defaultSubmitSwap }: Options = {}) => {
  const [fromSymbol, setFromSymbol] = useState<string>();
  const [toSymbol, setToSymbol] = useState<string>();
  const [input, setInput] = useState<{ side: Side; value: string }>({ side: 'from', value: '' });
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>();
  const [receipt, setReceipt] = useState<SwapReceipt | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const bySymbol = useMemo(() => new Map(tokens.map((t) => [t.symbol, t])), [tokens]);
  const fromToken = fromSymbol ? bySymbol.get(fromSymbol) : undefined;
  const toToken = toSymbol ? bySymbol.get(toSymbol) : undefined;

  // Once prices arrive: set up the mock wallet and a sensible default pair.
  useEffect(() => {
    if (tokens.length === 0) return;
    setBalances((b) => (Object.keys(b).length ? b : mockBalances(tokens)));
    setFromSymbol((s) => s ?? (bySymbol.has(DEFAULT_PAIR[0]) ? DEFAULT_PAIR[0] : tokens[0].symbol));
    setToSymbol((s) => s ?? (bySymbol.has(DEFAULT_PAIR[1]) ? DEFAULT_PAIR[1] : tokens[1]?.symbol));
  }, [tokens, bySymbol]);

  const fromValue = input.side === 'from' ? input.value : derive(input.value, toToken, fromToken);
  const toValue = input.side === 'to' ? input.value : derive(input.value, fromToken, toToken);
  const fromAmount = Number(fromValue);
  const toAmount = Number(toValue);
  const fromBalance = fromToken ? (balances[fromToken.symbol] ?? 0) : 0;
  const toBalance = toToken ? (balances[toToken.symbol] ?? 0) : 0;

  // Errors only appear once the user has typed something.
  let amountError: string | undefined;
  if (input.value) {
    const typed = Number(input.value);
    if (input.value === '.' || !Number.isFinite(typed)) amountError = 'Enter a valid number';
    else if (typed <= 0) amountError = 'Amount must be greater than 0';
    else if (fromToken && fromAmount > fromBalance) amountError = `Insufficient ${fromToken.symbol} balance`;
  }

  /** Why the form can't be submitted yet, phrased as the submit button's label. */
  const blocker = !fromToken || !toToken ? 'Select a token' : !input.value ? 'Enter an amount' : amountError;
  const canSubmit = !blocker && !submitting;

  const rate = fromToken && toToken ? convert(1, fromToken, toToken) : undefined;

  const setAmount = useCallback((side: Side, value: string) => {
    setSubmitError(undefined);
    setInput({ side, value });
  }, []);

  const flip = useCallback(() => {
    setFromSymbol(toSymbol);
    setToSymbol(fromSymbol);
    // The typed number stays with its token, which has moved to the other side.
    setInput((i) => ({ side: i.side === 'from' ? 'to' : 'from', value: i.value }));
  }, [fromSymbol, toSymbol]);

  const selectToken = useCallback(
    (side: Side, symbol: string) => {
      const other = side === 'from' ? toSymbol : fromSymbol;
      if (symbol === other)
        flip(); // picking the token from the other side swaps the pair
      else if (side === 'from') setFromSymbol(symbol);
      else setToSymbol(symbol);
    },
    [fromSymbol, toSymbol, flip],
  );

  const setMax = useCallback(() => setAmount('from', toInputValue(fromBalance)), [setAmount, fromBalance]);

  const submit = async () => {
    if (!canSubmit || !fromToken || !toToken) return;
    setSubmitting(true);
    setSubmitError(undefined);
    try {
      const result = await submitSwap({
        fromSymbol: fromToken.symbol,
        toSymbol: toToken.symbol,
        fromAmount,
        toAmount,
      });
      if (!mounted.current) return;
      setBalances((b) => ({
        ...b,
        [result.fromSymbol]: Math.max(0, (b[result.fromSymbol] ?? 0) - result.fromAmount),
        [result.toSymbol]: (b[result.toSymbol] ?? 0) + result.toAmount,
      }));
      setReceipt(result);
      setInput({ side: 'from', value: '' });
    } catch (err) {
      if (mounted.current) setSubmitError(err instanceof Error ? err.message : 'Swap failed. Please try again.');
    } finally {
      if (mounted.current) setSubmitting(false);
    }
  };

  return {
    fromToken,
    toToken,
    fromValue,
    toValue,
    fromBalance,
    toBalance,
    balances,
    rate,
    amountError,
    submitError,
    blocker,
    canSubmit,
    submitting,
    receipt,
    setAmount,
    setMax,
    flip,
    selectToken,
    submit,
    dismissReceipt: () => setReceipt(null),
  };
};
