# Problem 3: Messy React

The refactored component is in [`WalletPage.tsx`](./WalletPage.tsx). The issues found in the original are listed below, grouped from most to least severe.

## A. Bugs (the code is wrong or does not run)

### 1. `lhsPriority` is not defined
```ts
const balancePriority = getPriority(balance.blockchain);
if (lhsPriority > -99) {
```
`lhsPriority` doesn't exist in this scope. TypeScript fails to compile, and in plain JS it throws a `ReferenceError` the first time the filter runs, which crashes the page.
**Fix:** use `balancePriority`, the variable that was just computed.

### 2. The filter keeps the wrong balances
```ts
if (balance.amount <= 0) return true;
```
This keeps only empty or negative balances and throws away every balance the user actually holds. A wallet page should do the opposite.
**Fix:** keep a balance when `priority > -99 && amount > 0`, written as a single boolean expression with no nested `if`s.

### 3. The sort comparator never returns `0`
When two balances have the same priority (Zilliqa and Neo are both 20), the comparator falls through and returns `undefined`. A comparator must return a negative number, a positive number or `0`. An inconsistent comparator gives an unpredictable order, and the result can differ between JS engines.
**Fix:** `(lhs, rhs) => rhs.priority - lhs.priority`, which returns `0` for ties and is easier to read.

### 4. `rows` maps over the wrong array, so `formatted` is always `undefined`
`formattedBalances` is computed but never used. `rows` maps over `sortedBalances`, which has no `formatted` field, so `formattedAmount={balance.formatted}` is always `undefined`. The callback's `balance: FormattedWalletBalance` annotation claims a field that isn't there. Strict TypeScript rejects it, but with `strict` off it compiles and hides the bug.
**Fix:** render from the formatted list. In the refactor, rows are built from `formattedBalances`.

### 5. `WalletBalance` has no `blockchain` field
`balance.blockchain` is used but not declared in the interface, so it is a type error. Because `getPriority` takes `any`, the type checker can't catch a misspelled or unknown chain name either.
**Fix:** add `blockchain: Blockchain` to the interface, with `Blockchain` as a union of the supported chains.

### 6. `classes` is not defined
`className={classes.row}` refers to a variable that is never declared, so the page fails at runtime. It probably comes from a `useStyles()` hook (MUI/JSS) that was left out.
**Fix:** declare it with `const classes = useStyles()`.

### 7. A missing price produces `NaN`
`prices[balance.currency] * balance.amount` evaluates to `NaN` when a currency has no price, and the row then shows `NaN`.
**Fix:** `(prices[balance.currency] ?? 0) * balance.amount`. Hiding the USD value for that row would also work.

## B. Computational inefficiencies

### 8. `prices` is in the `useMemo` dependency list but not used inside it
Prices usually update often (polling or websockets). Every update re-runs the filter and sort even though neither uses prices, so the memo saves almost nothing.
**Fix:** the filter/sort memo depends only on `[balances]`. Price-dependent work (the USD value) goes in a separate memo that depends on `[sortedBalances, prices]`.

### 9. `getPriority` runs inside the comparator
The sort makes O(n log n) comparisons and each one calls `getPriority` twice. It also re-checks the priority that the filter already computed.
**Fix:** compute each balance's priority once (`map` to `{ balance, priority }`), then filter and sort on that value.

### 10. `formattedBalances` and `rows` are recomputed on every render and walk the list twice
Neither is memoised, so any re-render (from a parent, from `children`, or from unrelated state) re-formats and re-maps every balance. The list is also walked twice: once for `formattedBalances`, which is then thrown away, and once for `rows`.
**Fix:** build formatted values and USD values in one memoised pass, then render directly from it.

### 11. `getPriority` is recreated on every render
It is a pure function defined inside the component, so it is a new function on each render. Strictly it also belongs in the `useMemo` dependencies; `react-hooks/exhaustive-deps` would flag it.
**Fix:** move it outside the component as a constant lookup table (`Record<Blockchain, number>`) instead of a `switch`. It is then created once and never needs to be a dependency.

## C. React anti-patterns and code quality

### 12. `key={index}`
The list is filtered and sorted, so indexes don't identify balances: an item's index changes whenever the list changes. React then reuses the wrong DOM and component state for rows, and re-renders rows it didn't need to.
**Fix:** use a stable key that is unique to the item: `` `${blockchain}-${currency}` ``.

### 13. `toFixed()` with no argument rounds to 0 decimal places
`(0.5).toFixed()` gives `"1"`, and a crypto balance of `0.0042` shows as `"0"`. That is misleading for small balances.
**Fix:** pass the number of digits you want, or better, `toLocaleString`/`Intl.NumberFormat` with `maximumFractionDigits`, which also adds thousand separators.

### 14. `getPriority(blockchain: any)`
`any` turns off type checking where it matters most, the mapping from chain names to priorities.
**Fix:** type it, as in #5.

### 15. `children` is destructured and then dropped
Anything a parent passes as children disappears without a warning.
**Fix:** either render `{children}` (done in the refactor) or don't accept children.

### 16. Smaller cleanups
- `interface Props extends BoxProps {}` is an empty interface, which ESLint flags (`no-empty-interface`). `type Props = BoxProps` says the same thing.
- `React.FC<Props> = (props: Props)` annotates the same type twice. Destructuring in the parameter list (`({ children, ...rest })`) is shorter.
- `FormattedWalletBalance` repeats every field of `WalletBalance`. `extends WalletBalance` avoids the duplication.
- The magic number `-99` appears in two places and should be a named constant.
- The snippet mixes tabs and spaces.

## Verification

```bash
npm install
npm run typecheck   # strict tsc on the refactor, using the stubs in externals.d.ts
npm test            # unit tests for the extracted filter/sort/format logic
```

- **The original fails.** Running the original snippet through the same strict `tsc` config gives 10 errors, which confirm issues #1, #3, #4, #5 and #6:
  ```
  TS2304: Cannot find name 'lhsPriority'.
  TS2339: Property 'blockchain' does not exist on type 'WalletBalance'.            (×3)
  TS2345: '(lhs, rhs) => 1 | -1 | undefined' is not assignable to '(a, b) => number'.
  TS2345: Property 'formatted' is missing in type 'WalletBalance' ...
  TS2304: Cannot find name 'classes'.
  TS6133: 'formattedBalances' is declared but its value is never read.
  ```
- **The refactor passes.** It type-checks with no errors.
- **Pure helpers are tested.** The filter, sort and format logic was moved into pure functions (`prioritizeBalances`, `formatBalances`). The tests in [`WalletPage.test.ts`](./WalletPage.test.ts) pin down each behavioural fix: empty balances are dropped, unsupported chains are dropped, ties keep a stable order, a missing price gives 0 instead of `NaN`, and decimals are kept.

## Assumptions
- `useWalletBalances()` returns `WalletBalance[]` and `usePrices()` returns `Record<string, number>` (currency → USD price).
- A currency is held on at most one chain per wallet, so `blockchain-currency` is a unique key.
- Balances on chains not in the priority table are meant to be hidden, as in the original `> -99` check.
- `BoxProps`, `WalletRow` and `useStyles` come from elsewhere in the codebase and are not shown here.
