/**
 * Creates a seeded pseudo-random number generator (PRNG) using the Web Crypto API.
 * Takes a string seed, hashes it using SHA-256, and uses the hash to initialize
 * a simple linear congruential generator (LCG) state.
 *
 * @param seed The input string seed.
 * @returns A function that returns a pseudo-random number between 0 (inclusive) and 1 (exclusive) when called.
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
