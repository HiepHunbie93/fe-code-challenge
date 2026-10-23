// Run with: node --test src/problem1/index.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const { sum_to_n_a, sum_to_n_b, sum_to_n_c } = require('./index.js');

const implementations = { sum_to_n_a, sum_to_n_b, sum_to_n_c };

const cases = [
  [5, 15], // the example from the problem
  [1, 1],
  [2, 3],
  [100, 5050],
  [1e6, 500000500000],
  [0, 1], // n <= 0: sum of the integers from n up to 1 (see assumption in index.js)
  [-1, 0],
  [-3, -5],
];

for (const [name, fn] of Object.entries(implementations)) {
  test(name, async (t) => {
    for (const [n, expected] of cases) {
      await t.test(`n = ${n}`, () => assert.equal(fn(n), expected));
    }
  });
}

test('all implementations agree on random inputs', () => {
  for (let i = 0; i < 500; i++) {
    const n = Math.floor(Math.random() * 20001) - 10000;
    const expected = sum_to_n_a(n);
    assert.equal(sum_to_n_b(n), expected, `sum_to_n_b(${n})`);
    assert.equal(sum_to_n_c(n), expected, `sum_to_n_c(${n})`);
  }
});

test('the recursive version does not overflow the stack for large n', () => {
  assert.equal(sum_to_n_c(1e7), 50000005000000);
});

test('the formula stays exact up to the largest n whose sum is a safe integer', () => {
  // n(n+1)/2 <= MAX_SAFE_INTEGER  =>  n ≈ 134,217,727
  const n = 134217727;
  assert.ok(sum_to_n_a(n) <= Number.MAX_SAFE_INTEGER);
  assert.equal(BigInt(sum_to_n_a(n)), (BigInt(n) * BigInt(n + 1)) / 2n);
});
