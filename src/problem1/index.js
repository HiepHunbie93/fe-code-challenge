/**
 * Problem 1: Three ways to sum to n
 *
 * Assumptions:
 * - n is an integer. The problem only defines the positive case
 *   (sum_to_n(5) === 1 + 2 + 3 + 4 + 5), so for n <= 0 we sum from n up to 1,
 *   e.g. sum_to_n(-3) === -3 + -2 + -1 + 0 + 1 === -5, and sum_to_n(0) === 0 + 1 === 1.
 *   This is the natural "sum of every integer between 1 and n inclusive" reading.
 *   (If the reviewer expects 0 for n <= 0, only the `n < 1` branches need to change.)
 * - The result always stays below Number.MAX_SAFE_INTEGER (given by the problem).
 */

/**
 * A) Closed-form formula (Gauss).
 * Time O(1), space O(1). This is the one to use in practice.
 *
 * The number of terms between 1 and n inclusive is |n - 1| + 1, and the average
 * term is (1 + n) / 2, so the sum is (1 + n) * (|n - 1| + 1) / 2.
 * For n >= 1 that simplifies to the familiar n * (n + 1) / 2.
 */
var sum_to_n_a = function (n) {
  return ((1 + n) * (Math.abs(n - 1) + 1)) / 2;
};

/**
 * B) Iterative loop.
 * Time O(|n|), space O(1). Simple and obvious, but slower for large |n|.
 */
var sum_to_n_b = function (n) {
  var sum = 0;
  var step = n >= 1 ? 1 : -1;
  for (var i = 1; i !== n + step; i += step) {
    sum += i;
  }
  return sum;
};

/**
 * C) Divide and conquer (recursive range sum).
 * Time O(|n|) calls, but recursion depth is only O(log |n|), so unlike plain
 * recursion (sum(n) = n + sum(n - 1)) it never hits a stack overflow for large n.
 */
var sum_to_n_c = function (n) {
  var rangeSum = function (lo, hi) {
    if (lo === hi) return lo;
    var mid = Math.floor((lo + hi) / 2);
    return rangeSum(lo, mid) + rangeSum(mid + 1, hi);
  };
  return n >= 1 ? rangeSum(1, n) : rangeSum(n, 1);
};

module.exports = { sum_to_n_a, sum_to_n_b, sum_to_n_c };
