import type { ProceduralSurfaceProperties } from "@teskooano/data-types";
import { getRandomInRange, getRandomItem } from "../utils";

export function getOceanProperties(
  random: () => number,
): Partial<ProceduralSurfaceProperties> {
  const color1 = getRandomItem(["#001F3F", "#003366", "#004080"], random); // Deep Ocean Blue
  const color2 = getRandomItem(["#0055A4", "#1E90FF", "#4169E1"], random); // Mid Ocean Blue, DodgerBlue, RoyalBlue
  const color3 = getRandomItem(["#87CEEB", "#ADD8E6", "#B0E0E6"], random); // SkyBlue, LightBlue, PowderBlue (Shallows)
  const color4 = getRandomItem(["#F0F8FF", "#E0FFFF", "#FFFFFF"], random); // AliceBlue, LightCyan, White (Foam/Ice Caps?)
  const color5 = getRandomItem(["#6d4c41", "#795548", "#5d4037"], random);

  return {
    color1,
    color2,
    color3,
    color4,
    color5,
    persistence: getRandomInRange(0.6, 0.75, random), // Very smooth generally
    lacunarity: getRandomInRange(1.8, 2.1, random), // Few sharp transitions
    simplePeriod: getRandomInRange(8.0, 15.0, random), // Large, gentle swells
    octaves: Math.floor(getRandomInRange(4, 6, random)), // Less detail needed
    bumpScale: getRandomInRange(0.005, 0.02, random), // Very low bump for water surface
    roughness: getRandomInRange(0.1, 0.4, random), // Water is smooth
    specularStrength: getRandomInRange(0.5, 0.9, random), // Strong water reflections
    ambientLightIntensity: getRandomInRange(0.3, 0.5, random), // Higher ambient for ocean planets
    undulation: getRandomInRange(0.4, 0.6, random), // High undulation for ocean planets
    terrainType: 1, // Simple noise for ocean
    terrainAmplitude: getRandomInRange(0.4, 0.7, random),
    terrainSharpness: getRandomInRange(0.4, 0.7, random),
    terrainOffset: getRandomInRange(0.3, 0.5, random),
  };
}
