// Assumed shapes of the dependencies the original snippet uses but doesn't show.
// They exist only so WalletPage.tsx can be type-checked in isolation.
import type { HTMLAttributes, ReactNode, FC } from 'react';
import type { WalletBalance } from './WalletPage';

declare global {
  type BoxProps = HTMLAttributes<HTMLDivElement> & { children?: ReactNode };

  function useWalletBalances(): WalletBalance[];
  /** currency -> USD price */
  function usePrices(): Record<string, number>;
  function useStyles(): { row: string };

  const WalletRow: FC<{
    className?: string;
    amount: number;
    usdValue: number;
    formattedAmount: string;
  }>;
}
