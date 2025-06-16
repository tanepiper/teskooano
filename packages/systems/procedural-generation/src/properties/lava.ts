import type { ProceduralSurfaceProperties } from "@teskooano/data-types";
import { getRandomInRange, getRandomItem } from "../utils";

export function getLavaProperties(
  random: () => number,
): Partial<ProceduralSurfaceProperties> {
  const color1 = getRandomItem(["#1A0000", "#2B0B00", "#000000"], random); // Very Dark Red/Black (Cooled Rock)
  const color2 = getRandomItem(["#4E0000", "#6B0000", "#8B0000"], random); // Dark Reds (Cooling Lava/Rock)
  const color3 = getRandomItem(["#AE1000", "#CC3300", "#FF4500"], random); // Bright Reds/Oranges (Hot Lava)
  const color4 = getRandomItem(["#FF8C00", "#FFA500", "#FFFF00"], random); // Orange/Yellow (Hottest Lava)
  const color5 = getRandomItem(["#6d4c41", "#795548", "#5d4037"], random);

  return {
    color1,
    color2,
    color3,
    color4,
    color5,
    persistence: getRandomInRange(0.5, 0.65, random),
    lacunarity: getRandomInRange(1.9, 2.3, random), // Adjusted range
    simplePeriod: getRandomInRange(1, 4, random),
    octaves: Math.floor(getRandomInRange(9, 13, random)), // Increased octaves
    bumpScale: getRandomInRange(2, 3, random),
    roughness: getRandomInRange(0.1, 1, random),
    specularStrength: getRandomInRange(0.3, 0.6, random),
    ambientLightIntensity: getRandomInRange(0.2, 0.4, random), // Moderate ambient for lava planets
    undulation: getRandomInRange(0.2, 0.3, random), // Moderate undulation for lava flows
    terrainType: 2, // Sharp peaks for volcanic terrain
    terrainAmplitude: getRandomInRange(1.2, 1.8, random),
    terrainSharpness: getRandomInRange(1.0, 1.5, random),
    terrainOffset: getRandomInRange(-0.3, -0.1, random),
  };
}
