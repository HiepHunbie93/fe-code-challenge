import { useState } from 'react';
import { AmountField } from './components/AmountField';
import { SwapSuccess } from './components/SwapSuccess';
import { TokenPicker } from './components/TokenPicker';
import { useSwapForm, type Side } from './hooks/useSwapForm';
import { useTokens } from './hooks/useTokens';
import { formatAmount } from './lib/format';
import type { SwapReceipt, SwapRequest } from './services/swapService';

interface Props {
  /** Overrides the simulated backend (used by tests). */
  submitSwap?: (request: SwapRequest) => Promise<SwapReceipt>;
}

const STATUS_LABEL = { loading: 'Fetching prices…', error: 'Prices unavailable', ready: 'Live prices' };

export default function App({ submitSwap }: Props) {
  const prices = useTokens();
  const form = useSwapForm(prices.tokens, { submitSwap });
  const [picker, setPicker] = useState<Side | null>(null);
  const [invertRate, setInvertRate] = useState(false);

  const { fromToken, toToken, rate, submitting } = form;

  const renderBody = () => {
    if (prices.tokens.length === 0) {
      return prices.status === 'error' ? (
        <div className="notice notice--error" role="alert">
          <p>We couldn’t load token prices ({prices.error}).</p>
          <button type="button" className="btn btn--ghost" onClick={prices.retry}>
            Try again
          </button>
        </div>
      ) : (
        <div className="skeleton" aria-label="Loading prices">
          <div />
          <div />
          <div />
        </div>
      );
    }

    if (form.receipt) return <SwapSuccess receipt={form.receipt} onDone={form.dismissReceipt} />;

    return (
      <>
        <AmountField
          id="input-amount"
          label="You send"
          value={form.fromValue}
          token={fromToken}
          balance={fromToken ? form.fromBalance : undefined}
          error={form.amountError}
          disabled={submitting}
          onChange={(value) => form.setAmount('from', value)}
          onPickToken={() => setPicker('from')}
          onMax={form.setMax}
        />

        <div className="flip-wrap">
          <button
            type="button"
            className="flip"
            onClick={form.flip}
            disabled={submitting}
            aria-label="Swap send and receive tokens"
            title="Swap direction"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
              <path
                d="M7 4v14m0 0l-4-4m4 4l4-4M17 20V6m0 0l-4 4m4-4l4 4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        <AmountField
          id="output-amount"
          label="You receive"
          value={form.toValue}
          token={toToken}
          balance={toToken ? form.toBalance : undefined}
          disabled={submitting}
          onChange={(value) => form.setAmount('to', value)}
          onPickToken={() => setPicker('to')}
        />

        {rate !== undefined && fromToken && toToken && (
          <button
            type="button"
            className="rate"
            onClick={() => setInvertRate((v) => !v)}
            title="Click to invert the rate"
          >
            {invertRate
              ? `1 ${toToken.symbol} = ${formatAmount(1 / rate)} ${fromToken.symbol}`
              : `1 ${fromToken.symbol} = ${formatAmount(rate)} ${toToken.symbol}`}
            <span className="rate__swap" aria-hidden>
              ⇄
            </span>
          </button>
        )}

        {form.submitError && (
          <p className="notice-inline" role="alert">
            {form.submitError}
          </p>
        )}

        <button type="submit" className="btn btn--primary btn--block" disabled={!form.canSubmit}>
          {submitting ? (
            <>
              <span className="spinner" aria-hidden /> Swapping…
            </>
          ) : form.submitError ? (
            'Try again'
          ) : (
            (form.blocker ?? 'Confirm swap')
          )}
        </button>
      </>
    );
  };

  return (
    <main className="page">
      <div className="glow" aria-hidden />
      <form
        className="card"
        aria-label="Token swap"
        noValidate
        aria-busy={submitting}
        onSubmit={(e) => {
          e.preventDefault();
          void form.submit();
        }}
      >
        <header className="card__header">
          <h1>Swap</h1>
          <span className={`status status--${prices.status}`}>{STATUS_LABEL[prices.status]}</span>
        </header>
        {renderBody()}
      </form>

      <p className="footnote">Prices from Switcheo · balances and swaps are simulated</p>

      <TokenPicker
        open={picker !== null}
        tokens={prices.tokens}
        balances={form.balances}
        selected={(picker === 'from' ? fromToken : toToken)?.symbol}
        other={(picker === 'from' ? toToken : fromToken)?.symbol}
        onSelect={(symbol) => {
          if (picker) form.selectToken(picker, symbol);
          setPicker(null);
        }}
        onClose={() => setPicker(null)}
      />
    </main>
  );
}
