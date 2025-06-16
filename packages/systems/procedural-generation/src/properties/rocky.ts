import type { ProceduralSurfaceProperties } from "@teskooano/data-types";
import { getRandomInRange, getRandomItem } from "../utils";

export function getRockyProperties(
  random: () => number,
): Partial<ProceduralSurfaceProperties> {
  // Brighter, more varied rock palette
  const color1 = getRandomItem(["#6B4226", "#5D4037", "#4E342E"], random); // Dark brown/earthy base
  const color2 = getRandomItem(["#8D6E63", "#795548", "#6D4C41"], random); // Mid-tone browns
  const color3 = getRandomItem(["#A1887F", "#BCAAA4", "#90A4AE"], random); // Lighter browns and grays
  const color4 = getRandomItem(["#D7CCC8", "#CFD8DC", "#B0BEC5"], random); // Lightest grays/tans for highlights
  const color5 = getRandomItem(["#5D4037", "#455A64", "#37474F"], random); // Darkest rock/shadow color

  return {
    color1,
    color2,
    color3,
    color4,
    color5,
    persistence: getRandomInRange(0.45, 0.6, random),
    lacunarity: getRandomInRange(1.9, 2.3, random),
    simplePeriod: getRandomInRange(1.0, 3.0, random),
    octaves: Math.floor(getRandomInRange(9, 13, random)),
    bumpScale: getRandomInRange(2, 3, random),
    roughness: getRandomInRange(0.7, 0.95, random),
    specularStrength: getRandomInRange(0.3, 0.6, random),
    ambientLightIntensity: getRandomInRange(0.3, 0.5, random), // Boosted ambient light
    undulation: getRandomInRange(0.2, 0.4, random),
    terrainType: 2, // Sharp peaks for rocky terrain
    terrainAmplitude: getRandomInRange(1.0, 1.5, random),
    terrainSharpness: getRandomInRange(1.2, 1.8, random),
    terrainOffset: getRandomInRange(-0.2, 0.0, random),
  };
}
