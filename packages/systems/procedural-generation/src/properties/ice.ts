import type { ProceduralSurfaceProperties } from "@teskooano/data-types";
import { getRandomInRange, getRandomItem } from "../utils";

export function getIceProperties(
  random: () => number,
): Partial<ProceduralSurfaceProperties> {
  const color1 = getRandomItem(["#ffffff", "#edfbff", "#def4f9"], random); // CadetBlue, CornflowerBlue, SteelBlue (Deep Ice/Shadows)
  const color2 = getRandomItem(["#fff3f3", "#ffffff", "#52c8ff"], random); // PowderBlue, LightBlue (Main Ice Field)
  const color3 = getRandomItem(["#80ecff", "#ffffff", "#f5fdff"], random); // Lighter Blues/Cyans (Snow/Frost)
  const color4 = getRandomItem(["#FFFFFF", "#F0FFFF", "#c9c9c9"], random); // White, Azure, MintCream (Glints/Pure Snow)
  const color5 = getRandomItem(["#6d4c41", "#795548", "#5d4037"], random);

  return {
    color1,
    color2,
    color3,
    color4,
    color5,
    persistence: getRandomInRange(0.45, 0.6, random), // Adjusted persistence
    lacunarity: getRandomInRange(1.9, 2.2, random), // Corrected lacunarity for smoother ice
    simplePeriod: getRandomInRange(0.8, 1.8, random), // Adjusted for finer ice details
    octaves: Math.floor(getRandomInRange(8, 12, random)), // Increased octaves
    bumpScale: 3, //getRandomInRange(1, 2, random); // Lower bump for ice
    roughness: getRandomInRange(0.1, 0.3, random),
    specularStrength: getRandomInRange(0.4, 0.8, random), // Stronger specular for ice
    ambientLightIntensity: getRandomInRange(0.4, 0.6, random), // High ambient for ice planets
    undulation: getRandomInRange(0.05, 0.15, random), // Very low undulation for ice planets
    terrainType: 1, // Simple noise for ice
    terrainAmplitude: getRandomInRange(0.2, 0.4, random),
    terrainSharpness: getRandomInRange(0.3, 0.6, random),
    terrainOffset: getRandomInRange(0.2, 0.4, random),
  };
}
