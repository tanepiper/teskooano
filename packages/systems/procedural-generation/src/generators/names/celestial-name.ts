const vowels = "aeiou";
const consonants = "bcdfghjklmnpqrstvwxyz";

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

const vowelDoubles = ["a", "e", "o"];

/**
 * Generates a procedural, pronounceable name for a celestial body.
 *
 * It constructs names by pseudo-randomly combining consonants and vowels,
 * following simple grammatical rules to create natural-sounding results. It allows
 * for occasional double letters and handles special cases like 'qu' to improve
 * the quality of the generated names.
 *
 * @param random A function returning a pseudo-random number between 0 (inclusive) and 1 (exclusive).
 * @returns A generated name string, capitalized.
 */
export function generateCelestialName(random: () => number): string {
  const nameLength = 5 + Math.floor(random() * 5);
  let name = "";
  let lastCharType: "vowel" | "consonant" | "none" = "none";

  for (let i = 0; i < nameLength; i++) {
    let nextChar = "";
    const allowDoubleConsonant = random() < 0.1;
    const allowDoubleVowel = random() < 0.08;

    if (lastCharType === "vowel") {
      if (
        allowDoubleVowel &&
        name.length > 0 &&
        vowelDoubles.includes(name[name.length - 1])
      ) {
        nextChar = name[name.length - 1];
        lastCharType = "vowel";
      } else {
        const consonantIndex = Math.floor(random() * consonants.length);
        nextChar = consonants[consonantIndex];

        if (nextChar === "q" && i < nameLength - 1) {
          nextChar = "qu";
          i++;
        }
        lastCharType = "consonant";
      }
    } else if (lastCharType === "consonant") {
      if (
        allowDoubleConsonant &&
        name.length > 0 &&
        consonantDoubles.includes(name[name.length - 1])
      ) {
        nextChar = name[name.length - 1];
        lastCharType = "consonant";
      } else {
        const vowelIndex = Math.floor(random() * vowels.length);
        nextChar = vowels[vowelIndex];
        lastCharType = "vowel";
      }
    } else {
      if (random() < 0.6) {
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

  if (name.endsWith("q")) {
    name += "u";
  }

  return name.charAt(0).toUpperCase() + name.slice(1);
}
