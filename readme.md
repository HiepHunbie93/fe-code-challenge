# 99Tech Code Challenge: Frontend (Problems 1–3)

| | Problem | Solution | Highlights |
| --- | --- | --- | --- |
| 1 | Three ways to sum to n | [`src/problem1`](src/problem1) | O(1) formula, a loop, and divide-and-conquer recursion that is safe for large n. Assumption for n ≤ 0 is documented. |
| 2 | Fancy Form | [`src/problem2`](src/problem2) · [README](src/problem2/README.md) | Vite + React + TypeScript swap form: live prices, two-way conversion, searchable keyboard token picker, validation, simulated submit with loading, error and retry. |
| 3 | Messy React | [`src/problem3`](src/problem3) · [README](src/problem3/README.md) | 16 issues grouped as bugs, inefficiencies and anti-patterns, each with a fix. Strict-TS refactor; `tsc` on the original confirms the bugs. |

<p align="center"><img src="src/problem2/docs/screenshot.png" alt="Problem 2 swap form" width="420" /></p>

## Running it

Requires Node 20+.

```bash
# Problem 1
node --test src/problem1/index.test.js

# Problem 2
cd src/problem2
npm install
npm run dev        # app at http://localhost:5173
npm run check      # format check, lint, tests, production build

# Problem 3
cd src/problem3
npm install
npm run typecheck
npm test
```

## Quality

- **Tests.**
  - Problem 1: 30 `node:test` cases, plus a check that the three implementations agree on random inputs.
  - Problem 2: 46 Vitest and Testing Library tests, covering pure logic and user-level flows (typing, picking, flipping, submitting, failing and retrying).
  - Problem 3: 8 unit tests that pin down each behavioural fix.
- **CI.** [GitHub Actions](.github/workflows/ci.yml) runs the format check, lint, type-check, tests and build for every problem on each push.
- **Conventions.** Strict TypeScript, ESLint (including `react-hooks`) and Prettier.
- **Trade-offs.** Assumptions and trade-offs are written next to the code they affect, in each problem's README.
