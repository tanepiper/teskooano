/**
 * Creates a seeded pseudo-random number generator (PRNG) using the Web Crypto API.
 * Takes a string seed, hashes it using SHA-256, and uses the hash to initialize
 * a simple linear congruential generator (LCG) state.
 *
 * @param seed The input string seed.
 * @returns A function that returns a pseudo-random number between 0 (inclusive) and 1 (exclusive) when called.
 */
export async function createSeededRandom(seed: string): Promise<() => number> {
  // 1. Hash the seed using SHA-256
  const encoder = new TextEncoder();
  const data = encoder.encode(seed);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);

  // 2. Convert the first 4 bytes of the hash to an initial integer state for the LCG.
  // We only need 32 bits for a simple LCG seed.
  const hashArray = new Uint8Array(hashBuffer);
  let state = 0;
  for (let i = 0; i < 4; i++) {
    state = (state << 8) | hashArray[i];
  }
  // Ensure state is positive, LCGs work better with positive seeds.
  state = Math.abs(state);

  // 3. Define the LCG parameters (these are common parameters, can be tuned)
  const a = 1664525; // Multiplier
  const c = 1013904223; // Increment
  const m = 2 ** 32; // Modulus (use 2^32 for standard 32-bit integers)

  // 4. Return the PRNG function
  return () => {
    state = (a * state + c) % m;
    // Return a float between 0 (inclusive) and 1 (exclusive)
    return state / m;
  };
} 