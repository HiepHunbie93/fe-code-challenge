# Problem 2: Fancy Form

A token swap form built with **Vite + React 19 + TypeScript (strict)**. It has no UI library: the components and CSS are hand-written.

**Live demo:** https://hiephunbie93.github.io/fe-code-challenge/

![Swap form](docs/screenshot.png)

```bash
npm install
npm run dev          # http://localhost:5173
npm test             # unit + integration tests (Vitest, Testing Library)
npm run check        # what CI runs: format check, lint, tests, production build
```

## What it does

- **Live prices.** Prices come from `interview.switcheo.com/prices.json`. While they load the page shows a skeleton, and if the request fails it shows the error with a retry button. Tokens without a usable price are left out.
- **Two-way conversion.** You can type into either _You send_ or _You receive_; the other field is calculated as `amount × priceFrom / priceTo`. Each field also shows its USD value.
- **Token picker:**
  - a search box, with exact and prefix matches listed first;
  - keyboard control (↑ ↓ Enter Esc);
  - focus is trapped inside the dialog and returned to the opener when it closes, and the page behind it doesn't scroll;
  - each row shows the token's price and balance;
  - icons come from `Switcheo/token-icons`, with a monogram if the image is missing.
- **Flip button** swaps the two sides. Picking the token that is already on the other side also swaps the pair, so the same token can never be on both sides.
- **Validation:**
  - the amount field only accepts numbers;
  - an amount of 0 is rejected;
  - an amount above the balance shows "insufficient balance";
  - the submit button always says what is still missing ("Select a token", "Enter an amount", …);
  - MAX fills in the whole balance.
- **Submit flow.**
  - While the swap is pending, the button shows a spinner and the form is locked.
  - On success, a receipt screen appears and balances update.
  - On failure, an inline error and a "Try again" button appear. To see this path, set DevTools to _Offline_ and submit.
- **Accessibility and layout:**
  - fields are labelled, and errors are announced through `aria-describedby` and `role="alert"`;
  - the picker uses ARIA dialog and listbox semantics, and focus rings are visible;
  - animations follow `prefers-reduced-motion`;
  - the layout works on phones from 360 px wide.

## Architecture

```
src/
  App.tsx                    layout and rendering only; no business rules
  hooks/
    useSwapForm.ts           form state, derived amounts, validation, submit lifecycle
    useTokens.ts             price fetching with loading / error / retry and abort on unmount
  services/swapService.ts    simulated backend call (Promise-based, can fail)
  components/                presentational: AmountField, TokenPicker, TokenIcon, SwapSuccess
  lib/
    tokens.ts                price normalisation, conversion, icon URLs, mock balances
    format.ts                number display, input sanitising, input-safe number strings
```

`App` → `useSwapForm` → `swapService` is the only path to the backend. `submitSwap` is injected, so the tests replace it with an instant, slow or failing fake, and a real API would plug in the same way.

## Design decisions and trade-offs

- **Store one field and derive the other.** The form keeps only the field the user typed in (`{ side, value }`) and computes the other one from prices on each render. Two fields kept in state separately would drift apart whenever a price or token changes.
- **Truncate amounts, don't round them.** Numbers written back into an input are cut off, not rounded. Rounding could make MAX produce a number slightly above the balance and trigger a false "insufficient balance" error. Truncation is done on the number's shortest decimal string instead of `Math.floor(x × 10ⁿ)`, because the multiplication loses precision: `142.385 × 1e6` is not exactly `142385000`. A property test checks thousands of random values.
- **Floating-point numbers, not a decimal library.** For a demo that only displays numbers, `number` is accurate enough. A production swap should do its arithmetic in integer base units (for example `bigint`) or with a decimal library, and let the backend compute the final quote.
- **Clean up the price feed on the client.** The feed has duplicate entries per currency; the latest one is used, and on a tie the later one in the feed wins. The icon repo spells five symbols in a different case (`STATOM` vs `stATOM.svg`), so a small alias map fixes those, with a monogram fallback for anything else.
- **No UI or state library.** The form fits comfortably in one hook, so adding Redux/Zustand or a component kit would make the bundle bigger without making anything clearer. The production bundle is about 75 kB gzipped, and almost all of that is React.
- **Mock wallet.** There is no wallet to connect, so balances are made up but deterministic (worth about $50–$5,000 per token). This gives validation and MAX real numbers to work with, and keeps the tests reproducible.
- **No fees or slippage.** The quoted rate is the plain ratio of the two USD prices.

## Tests

Tests are written against what the user sees and does. They query by role and label, so they double as a check that the accessibility labels are right.

- **`lib/*.test.ts`:**
  - feed normalisation: duplicates, ties, missing prices;
  - conversion, icon aliases and mock balances;
  - input sanitising and number formatting, including a property test that `toInputValue` never rounds up.
- **`App.test.tsx`:**
  - loading state and default pair;
  - conversion in both directions;
  - typed-input filtering;
  - insufficient-balance and zero-amount validation;
  - MAX, flip, and picking a token from the list with the keyboard;
  - the picker swapping the pair instead of allowing the same token twice;
  - Escape closing the picker and returning focus;
  - successful submit with a receipt and updated balances;
  - the pending state locking the form;
  - a failed submit followed by a retry;
  - a failed price fetch followed by a retry.
