import { useEffect, useMemo, useRef, useState } from 'react';
import type { Token } from '../lib/tokens';
import { formatAmount, formatUsd } from '../lib/format';
import { TokenIcon } from './TokenIcon';

interface Props {
  open: boolean;
  tokens: Token[];
  balances: Record<string, number>;
  selected?: string;
  /** The token on the other side; picking it swaps the two sides instead. */
  other?: string;
  onSelect: (symbol: string) => void;
  onClose: () => void;
}

export const TokenPicker = ({ open, tokens, balances, selected, other, onSelect, onClose }: Props) => {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = q ? tokens.filter((t) => t.symbol.toLowerCase().includes(q)) : tokens;
    // Exact and prefix matches first
    return [...matches].sort((a, b) => {
      const rank = (t: Token) => {
        const s = t.symbol.toLowerCase();
        return s === q ? 0 : s.startsWith(q) ? 1 : 2;
      };
      return rank(a) - rank(b);
    });
  }, [tokens, query]);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActive(0);
    // Focus the search box, lock page scroll, and give focus back to the opener on close.
    const opener = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    inputRef.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      opener?.focus();
    };
  }, [open]);

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  if (!open) return null;

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Tab') {
      // Keep focus inside the dialog: the search box and the close button are its only stops.
      const stops = e.currentTarget.querySelectorAll<HTMLElement>('button, input');
      const first = stops[0];
      const last = stops[stops.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    } else if (e.key === 'Escape') onClose();
    else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[active]) {
      e.preventDefault();
      onSelect(results[active].symbol);
    }
  };

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="picker-title"
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        <div className="modal__header">
          <h2 id="picker-title">Select a token</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <input
          ref={inputRef}
          className="modal__search"
          placeholder="Search by symbol"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          aria-controls="token-list"
          aria-activedescendant={results[active] ? `token-${results[active].symbol}` : undefined}
        />
        <ul className="token-list" id="token-list" role="listbox" ref={listRef}>
          {results.length === 0 && <li className="token-list__empty">No token matches “{query}”</li>}
          {results.map((token, i) => {
            const balance = balances[token.symbol] ?? 0;
            return (
              <li
                key={token.symbol}
                id={`token-${token.symbol}`}
                data-index={i}
                role="option"
                aria-selected={token.symbol === selected}
                className={[
                  'token-row',
                  i === active && 'token-row--active',
                  token.symbol === selected && 'token-row--selected',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onMouseEnter={() => setActive(i)}
                onClick={() => onSelect(token.symbol)}
              >
                <TokenIcon symbol={token.symbol} size={32} />
                <span className="token-row__name">
                  <strong>{token.symbol}</strong>
                  <small>
                    {formatUsd(token.price)}
                    {token.symbol === other && ' · selected on other side'}
                  </small>
                </span>
                <span className="token-row__balance">
                  <span>{formatAmount(balance)}</span>
                  <small>{formatUsd(balance * token.price)}</small>
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};
