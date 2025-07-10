/**
 * Creates a seeded pseudo-random number generator (PRNG) using a synchronous hashing algorithm.
 * This is suitable for performance-critical contexts where an async operation is not feasible.
 * It uses the cyrb128 hash to generate a seed for the Mulberry32 PRNG.
 *
 * @param seed The input string seed.
 * @returns A function that, when called, returns a pseudo-random number between 0 (inclusive) and 1 (exclusive).
 */
export function createSeededRandomSync(seed: string): () => number {
  // cyrb128 hash function
  let h1 = 1779033703,
    h2 = 3144134277,
    h3 = 1013904242,
    h4 = 2773480762;

  for (let i = 0, k; i < seed.length; i++) {
    k = seed.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }

  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);

  let state = (h1 ^ h2 ^ h3 ^ h4) >>> 0;

  // Mulberry32 PRNG
  const a = 1664525;
  const c = 1013904223;
  const m = 2 ** 32;

  return () => {
    state = (a * state + c) % m;
    return state / m;
  };
}

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
