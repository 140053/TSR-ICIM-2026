/**
 * Deterministic Fisher-Yates shuffle using a simple LCG (linear congruential
 * generator). Same `seed` always produces the same order, so a given student
 * always sees the same question sequence for a given test set — even across
 * page refreshes. Different students get different orders.
 *
 * No external dependencies; pure arithmetic.
 */
export function seededShuffle<T>(arr: T[], seed: number): T[] {
  const result = [...arr];
  // XOR-mix the seed so small seeds like 1, 2, 3 still spread well
  let s = (seed ^ 0xdeadbeef) >>> 0;
  for (let i = result.length - 1; i > 0; i--) {
    // LCG step: s = (a*s + c) mod 2^32  (Knuth coefficients)
    s = ((Math.imul(s, 1664525) + 1013904223) >>> 0);
    const j = s % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
