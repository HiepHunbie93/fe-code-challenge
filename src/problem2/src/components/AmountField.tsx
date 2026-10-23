import type { Token } from '../lib/tokens';
import { formatAmount, formatUsd, sanitizeAmountInput } from '../lib/format';
import { TokenIcon } from './TokenIcon';

interface Props {
  id: string;
  label: string;
  value: string;
  token?: Token;
  balance?: number;
  error?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  onPickToken: () => void;
  onMax?: () => void;
}

export const AmountField = ({
  id,
  label,
  value,
  token,
  balance,
  error,
  disabled,
  onChange,
  onPickToken,
  onMax,
}: Props) => {
  const amount = Number(value);
  const usd = token && value && Number.isFinite(amount) ? amount * token.price : 0;
  // Shrink long numbers so they stay inside the box
  const fontSize = value.length > 10 ? `${Math.max(1.1, 2 - (value.length - 10) * 0.09)}rem` : undefined;

  return (
    <div className={`field${error ? ' field--error' : ''}`}>
      <div className="field__top">
        <label htmlFor={id}>{label}</label>
        {token && balance !== undefined && (
          <span className="field__balance">
            Balance: {formatAmount(balance)}
            {onMax && balance > 0 && (
              <button type="button" className="chip" onClick={onMax} disabled={disabled}>
                MAX
              </button>
            )}
          </span>
        )}
      </div>
      <div className="field__main">
        <input
          id={id}
          className="field__input"
          inputMode="decimal"
          autoComplete="off"
          placeholder="0.0"
          value={value}
          style={{ fontSize }}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          onChange={(e) => {
            const next = sanitizeAmountInput(e.target.value);
            if (next !== null) onChange(next);
          }}
        />
        <button
          type="button"
          className={`token-btn${token ? '' : ' token-btn--empty'}`}
          onClick={onPickToken}
          disabled={disabled}
          aria-label={`${label} token: ${token ? token.symbol : 'none selected'}`}
        >
          {token ? (
            <>
              <TokenIcon symbol={token.symbol} />
              <span>{token.symbol}</span>
            </>
          ) : (
            <span>Select token</span>
          )}
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
            <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <div className="field__bottom">
        <span className="field__usd">{usd ? `≈ ${formatUsd(usd)}` : ' '}</span>
        {error && (
          <span className="field__error" id={`${id}-error`} role="alert">
            {error}
          </span>
        )}
      </div>
    </div>
  );
};
