// Define basic character sets
const vowels = "aeiou";
const consonants = "bcdfghjklmnpqrstvwxyz";
// Common consonant doubles allowed
const consonantDoubles = [
  "b",
  "d",
  "f",
  "g",
  "l",
  "m",
  "n",
  "p",
  "r",
  "s",
  "t",
];
// Common vowel doubles allowed
const vowelDoubles = ["a", "e", "o"];

/**
 * Generates a procedural celestial body name with slightly more natural structure.
 *
 * Constructs names by pseudo-randomly combining consonants and vowels,
 * allowing occasional double letters and slight variations in the C/V pattern.
 *
 * @param random - A function returning a pseudo-random number between 0 (inclusive) and 1 (exclusive).
 * @returns A generated name string, capitalized.
 */
export function generateCelestialName(random: () => number): string {
  const nameLength = 5 + Math.floor(random() * 5); // 5 to 9 chars
  let name = "";
  let lastCharType: "vowel" | "consonant" | "none" = "none";

  for (let i = 0; i < nameLength; i++) {
    let nextChar = "";
    const allowDoubleConsonant = random() < 0.1; // 10% chance
    const allowDoubleVowel = random() < 0.08; // 8% chance

    if (lastCharType === "vowel") {
      // Last was vowel, prefer consonant
      if (
        allowDoubleVowel &&
        name.length > 0 &&
        vowelDoubles.includes(name[name.length - 1])
      ) {
        nextChar = name[name.length - 1]; // Double the vowel
        lastCharType = "vowel";
      } else {
        const consonantIndex = Math.floor(random() * consonants.length);
        nextChar = consonants[consonantIndex];
        // Handle 'q' -> 'qu' sequence
        if (nextChar === "q" && i < nameLength - 1) {
          // Ensure space for 'u'
          nextChar = "qu";
          i++; // Skip next iteration as we added two chars
        }
        lastCharType = "consonant";
      }
    } else if (lastCharType === "consonant") {
      // Last was consonant, prefer vowel
      if (
        allowDoubleConsonant &&
        name.length > 0 &&
        consonantDoubles.includes(name[name.length - 1])
      ) {
        nextChar = name[name.length - 1]; // Double the consonant
        lastCharType = "consonant";
      } else {
        const vowelIndex = Math.floor(random() * vowels.length);
        nextChar = vowels[vowelIndex];
        lastCharType = "vowel";
      }
    } else {
      // First character
      if (random() < 0.6) {
        // Start with consonant ~60% of time
        const consonantIndex = Math.floor(random() * consonants.length);
        nextChar = consonants[consonantIndex];
        if (nextChar === "q" && i < nameLength - 1) {
          nextChar = "qu";
          i++;
        }
        lastCharType = "consonant";
      } else {
        const vowelIndex = Math.floor(random() * vowels.length);
        nextChar = vowels[vowelIndex];
        lastCharType = "vowel";
      }
    }
    name += nextChar;
  }

  // Final cleanup: ensure 'q' is followed by 'u' if it ended up at the end somehow
  if (name.endsWith("q")) {
    name += "u";
  }

  // Capitalize the first letter
  return name.charAt(0).toUpperCase() + name.slice(1);
}
