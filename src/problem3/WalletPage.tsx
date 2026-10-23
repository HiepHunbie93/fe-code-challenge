import React, { useMemo } from 'react';

// `useWalletBalances`, `usePrices`, `useStyles`, `WalletRow` and `BoxProps` come from elsewhere
// in the codebase, as in the original snippet. `externals.d.ts` declares their assumed shapes
// so this file can be type-checked on its own.

export type Blockchain = 'Osmosis' | 'Ethereum' | 'Arbitrum' | 'Zilliqa' | 'Neo';

export interface WalletBalance {
  currency: string;
  amount: number;
  blockchain: Blockchain;
}

export interface FormattedWalletBalance extends WalletBalance {
  formatted: string;
  usdValue: number;
}

type Props = BoxProps;

// Pure data, so it lives outside the component: created once, not on every render,
// and it never needs to be a hook dependency.
const BLOCKCHAIN_PRIORITY: Record<Blockchain, number> = {
  Osmosis: 100,
  Ethereum: 50,
  Arbitrum: 30,
  Zilliqa: 20,
  Neo: 20,
};
export const UNKNOWN_PRIORITY = -99;

export const getPriority = (blockchain: string): number =>
  BLOCKCHAIN_PRIORITY[blockchain as Blockchain] ?? UNKNOWN_PRIORITY;

/**
 * Balances worth showing (supported chain, positive amount), highest-priority chain first.
 * Each priority is computed once rather than on every comparison, and ties keep their
 * original order (Array.prototype.sort is stable).
 */
export const prioritizeBalances = (balances: readonly WalletBalance[]): WalletBalance[] =>
  balances
    .map((balance) => ({ balance, priority: getPriority(balance.blockchain) }))
    .filter(({ balance, priority }) => priority > UNKNOWN_PRIORITY && balance.amount > 0)
    .sort((lhs, rhs) => rhs.priority - lhs.priority)
    .map(({ balance }) => balance);

export const formatBalances = (
  balances: readonly WalletBalance[],
  prices: Readonly<Record<string, number>>,
): FormattedWalletBalance[] =>
  balances.map((balance) => ({
    ...balance,
    formatted: balance.amount.toLocaleString(undefined, { maximumFractionDigits: 6 }),
    usdValue: (prices[balance.currency] ?? 0) * balance.amount,
  }));

const WalletPage: React.FC<Props> = ({ children, ...rest }) => {
  const balances = useWalletBalances();
  const prices = usePrices();
  const classes = useStyles();

  // Filtering and sorting depend only on `balances`, so price updates don't redo them.
  const sortedBalances = useMemo(() => prioritizeBalances(balances), [balances]);

  // USD values depend on prices too, so they get their own memo.
  const formattedBalances = useMemo(() => formatBalances(sortedBalances, prices), [sortedBalances, prices]);

  return (
    <div {...rest}>
      {formattedBalances.map((balance) => (
        <WalletRow
          key={`${balance.blockchain}-${balance.currency}`}
          className={classes.row}
          amount={balance.amount}
          usdValue={balance.usdValue}
          formattedAmount={balance.formatted}
        />
      ))}
      {children}
    </div>
  );
};

export default WalletPage;
