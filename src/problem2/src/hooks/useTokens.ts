import { useCallback, useEffect, useState } from 'react';
import { fetchTokens, type Token } from '../lib/tokens';

type State =
  | { status: 'loading'; tokens: Token[] }
  | { status: 'error'; tokens: Token[]; error: string }
  | { status: 'ready'; tokens: Token[] };

export const useTokens = () => {
  const [state, setState] = useState<State>({ status: 'loading', tokens: [] });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState((s) => ({ status: 'loading', tokens: s.tokens }));
    fetchTokens(controller.signal)
      .then((tokens) => setState({ status: 'ready', tokens }))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setState((s) => ({
          status: 'error',
          tokens: s.tokens,
          error: err instanceof Error ? err.message : 'Could not load prices',
        }));
      });
    return () => controller.abort();
  }, [attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  return { ...state, retry };
};
