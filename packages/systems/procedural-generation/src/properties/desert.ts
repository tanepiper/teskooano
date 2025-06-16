import type { ProceduralSurfaceProperties } from "@teskooano/data-types";
import { getRandomInRange, getRandomItem } from "../utils";

export function getDesertProperties(
  random: () => number,
): Partial<ProceduralSurfaceProperties> {
  const color1 = getRandomItem(["#A0522D", "#B8860B", "#8B4513"], random); // Sienna, DarkGoldenrod, SaddleBrown (Deep Dunes/Rock)
  const color2 = getRandomItem(["#D2B48C", "#F4A460", "#CD853F"], random); // Tan, SandyBrown, Peru (Sand)
  const color3 = getRandomItem(["#E0C9A6", "#FFDEAD", "#DEB887"], random); // Lighter Tan, NavajoWhite, BurlyWood (Highlights)
  const color4 = getRandomItem(["#F5E6CA", "#FFF8DC", "#FAF0E6"], random); // Beige, Cornsilk, Linen (Peaks/Bright Sand)
  const color5 = getRandomItem(["#6d4c41", "#795548", "#5d4037"], random);

  return {
    color1,
    color2,
    color3,
    color4,
    color5,
    persistence: getRandomInRange(0.4, 0.6, random), // Adjusted for more consistent detail
    lacunarity: getRandomInRange(1.9, 2.4, random), // Corrected from very high range
    simplePeriod: getRandomInRange(1.5, 4.0, random), // Adjusted for finer details
    octaves: Math.floor(getRandomInRange(8, 12, random)), // Increased octaves
    bumpScale: getRandomInRange(0.01, 0.04, random), // Lower bump for ice
    roughness: getRandomInRange(0.65, 0.9, random),
    specularStrength: getRandomInRange(0.05, 0.15, random), // Slightly higher than barren/rocky but still low
    ambientLightIntensity: getRandomInRange(0.3, 0.5, random), // Higher ambient for desert planets
    undulation: getRandomInRange(0.15, 0.25, random), // Moderate undulation for desert dunes
    terrainType: 1, // Simple noise for dunes
    terrainAmplitude: getRandomInRange(0.3, 0.6, random),
    terrainSharpness: getRandomInRange(0.5, 0.8, random),
    terrainOffset: getRandomInRange(0.1, 0.3, random),
  };
}
