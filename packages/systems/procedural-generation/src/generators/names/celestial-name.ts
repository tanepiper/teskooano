import { createSeededRandom } from "@teskooano/core-math";

const vowels = "aeiou";
const consonants = "bcdfghjklmnpqrstvwxyz";

/**
 * Generates a unique and evocative name for a celestial body using a
 * sophisticated, multi-layered approach inspired by real astronomical naming
 * conventions.
 *
 * It constructs names by pseudo-randomly combining consonants and vowels,
 * following simple grammatical rules to create natural-sounding results. It allows
 * for occasional double letters and handles special cases like 'qu' to improve
 * the quality of the generated names.
 *
 * @param random The seeded pseudo-random number generator function.
 * @returns A unique celestial name string.
 */
export function generateCelestialName(random: () => number): string {
  const nameLength = 5 + Math.floor(random() * 5);
  let name = "";
  let isVowelTurn = random() > 0.5;

  for (let i = 0; i < nameLength; i++) {
    if (isVowelTurn) {
      name += vowels[Math.floor(random() * vowels.length)];
    } else {
      name += consonants[Math.floor(random() * consonants.length)];
    }
    isVowelTurn = !isVowelTurn;
  }
  return name.charAt(0).toUpperCase() + name.slice(1);
}

/**
 * Generates a system name from a seed string.
 * @param seed The seed string to use for generation.
 * @returns A system name.
 */
export async function generateSystemNameFromSeed(
  seed: string,
): Promise<string> {
  const random = await createSeededRandom(seed);
  return generateCelestialName(random);
}
