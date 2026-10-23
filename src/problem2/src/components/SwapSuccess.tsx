import { formatAmount } from '../lib/format';
import type { SwapReceipt } from '../services/swapService';
import { TokenIcon } from './TokenIcon';

interface Props {
  receipt: SwapReceipt;
  onDone: () => void;
}

export const SwapSuccess = ({ receipt, onDone }: Props) => (
  <div className="success" role="status">
    <div className="success__check" aria-hidden>
      <svg viewBox="0 0 52 52">
        <circle cx="26" cy="26" r="24" />
        <path d="M15 27l7 7 15-15" />
      </svg>
    </div>
    <h2>Swap complete</h2>
    <p className="success__pair">
      <TokenIcon symbol={receipt.fromSymbol} size={22} />
      {formatAmount(receipt.fromAmount)} {receipt.fromSymbol}
      <span className="success__arrow">→</span>
      <TokenIcon symbol={receipt.toSymbol} size={22} />
      {formatAmount(receipt.toAmount)} {receipt.toSymbol}
    </p>
    <p className="success__id">Reference #{receipt.id}</p>
    <button type="button" className="btn btn--primary" onClick={onDone} autoFocus>
      Make another swap
    </button>
  </div>
);
