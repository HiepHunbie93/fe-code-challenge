import { useState } from 'react';
import { tokenIconUrl } from '../lib/tokens';

interface Props {
  symbol: string;
  size?: number;
}

/** Token logo with a coloured monogram fallback when the icon repo has no image. */
export const TokenIcon = ({ symbol, size = 28 }: Props) => {
  const [failedSymbol, setFailedSymbol] = useState<string | null>(null);

  if (failedSymbol === symbol) {
    const hue = [...symbol].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) % 360, 7);
    return (
      <span
        className="token-icon token-icon--fallback"
        style={{ width: size, height: size, fontSize: size * 0.42, background: `hsl(${hue} 55% 45%)` }}
        aria-hidden
      >
        {symbol.slice(0, 2).toUpperCase()}
      </span>
    );
  }

  return (
    <img
      className="token-icon"
      src={tokenIconUrl(symbol)}
      width={size}
      height={size}
      alt=""
      loading="lazy"
      onError={() => setFailedSymbol(symbol)}
    />
  );
};
