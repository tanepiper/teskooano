import type { ProceduralSurfaceProperties } from "@teskooano/data-types";
import { getRandomInRange, getRandomItem } from "../utils";

export function getBarrenProperties(
  random: () => number,
): Partial<ProceduralSurfaceProperties> {
  // Brighter, dusty palette
  const color1 = getRandomItem(["#6D6D6D", "#7B7B7B", "#5E5E5E"], random); // Darker gray base
  const color2 = getRandomItem(["#9C9C9C", "#A8A8A8", "#8F8F8F"], random); // Mid-tone gray
  const color3 = getRandomItem(["#BEBEBE", "#CCCCCC", "#B0B0B0"], random); // Light gray
  const color4 = getRandomItem(["#D2B48C", "#C19A6B", "#B0885F"], random); // Tan/dusty brown highlights
  const color5 = getRandomItem(["#E1E1E1", "#F0F0F0", "#D9D9D9"], random); // Brightest peaks/highlights

  return {
    color1,
    color2,
    color3,
    color4,
    color5,
    persistence: getRandomInRange(0.4, 0.55, random),
    lacunarity: getRandomInRange(2.0, 2.5, random),
    simplePeriod: getRandomInRange(1.0, 3.5, random),
    octaves: Math.floor(getRandomInRange(8, 12, random)),
    bumpScale: getRandomInRange(2, 3, random),
    roughness: getRandomInRange(0.6, 0.8, random), // More matte/dusty
    specularStrength: getRandomInRange(0.3, 0.6, random),
    ambientLightIntensity: getRandomInRange(0.3, 0.5, random), // Boosted ambient light
    undulation: getRandomInRange(0.1, 0.2, random),
    terrainType: 2, // Sharp peaks to catch light, not valleys
    terrainAmplitude: getRandomInRange(0.5, 0.8, random),
    terrainSharpness: getRandomInRange(1.5, 2.0, random),
    terrainOffset: getRandomInRange(0.0, 0.2, random),
  };
}
