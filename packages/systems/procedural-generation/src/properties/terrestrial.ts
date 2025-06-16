import type { ProceduralSurfaceProperties } from "@teskooano/data-types";
import { getRandomInRange, getRandomItem } from "../utils";

export function getTerrestrialProperties(
  random: () => number,
): Partial<ProceduralSurfaceProperties> {
  const color1 = getRandomItem(["#1E4F6F", "#2A6F97", "#01497C"], random); // Blues (Water)
  const color2 = getRandomItem(["#4C9341", "#6A994E", "#8AA36F"], random); // Greens (Land)
  const color3 = getRandomItem(["#D4A373", "#E6B88A", "#C09463"], random); // Browns (Mountains)
  const color4 = getRandomItem(["#FFFFFF", "#F5F5F5", "#E8E8E8"], random); // White (Peaks/Snow)
  const color5 = getRandomItem(["#FFFFFF", "#F5F5F5", "#E8E8E8"], random); // White (Peaks/Snow)

  return {
    color1,
    color2,
    color3,
    color4,
    color5,
    persistence: getRandomInRange(0.55, 0.65, random), // Slightly increased
    lacunarity: getRandomInRange(1.8, 2.2, random), // Tightened range
    simplePeriod: getRandomInRange(0.5, 0.9, random), // Higher frequency
    octaves: Math.floor(getRandomInRange(10, 14, random)), // Increased octaves
    bumpScale: getRandomInRange(1, 2, random),
    roughness: getRandomInRange(0.1, 0.2, random),
    specularStrength: getRandomInRange(0.3, 0.6, random),
    ambientLightIntensity: getRandomInRange(0.2, 0.4, random), // Higher ambient for Earth-like planets
    undulation: getRandomInRange(0.3, 0.5, random), // Higher undulation for continent-like features
    terrainType: 2, // Sharp peaks for mountains
    terrainAmplitude: getRandomInRange(0.8, 1.2, random),
    terrainSharpness: getRandomInRange(0.8, 1.2, random),
    terrainOffset: getRandomInRange(-0.1, 0.1, random),
  };
}
