/**
 * Creates a seeded pseudo-random number generator (PRNG) using the Web Crypto API.
 *
 * This function takes a string seed, hashes it using SHA-256, and then uses the
 * resulting hash to initialize the state of a simple linear congruential
 * generator (LCG). This ensures that for the same seed, the sequence of
 * generated numbers will always be identical.
 *
 * @param seed The input string seed.
 * @returns A Promise that resolves to a function. When called, this function
 *   returns a pseudo-random number between 0 (inclusive) and 1 (exclusive).
 */
export async function createSeededRandom(seed: string): Promise<() => number> {
  const encoder = new TextEncoder();
  const data = encoder.encode(seed);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);

  const hashArray = new Uint8Array(hashBuffer);
  let state = 0;
  for (let i = 0; i < 4; i++) {
    state = (state << 8) | hashArray[i];
  }

  state = Math.abs(state);

  const a = 1664525;
  const c = 1013904223;
  const m = 2 ** 32;

  return () => {
    state = (a * state + c) % m;

    return state / m;
  };
}
