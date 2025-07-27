import type { ProceduralSurfaceProperties } from "@teskooano/data-types";
import { utils } from "@teskooano/core-math";
import { getRandomItem } from "../utils";

export function getRockyProperties(
  random: () => number,
): Partial<ProceduralSurfaceProperties> {
  // Palette of grays, browns, and dark tones
  const color1 = getRandomItem(["#363636", "#424242", "#2E2E2E"], random); // Dark gray base
  const color2 = getRandomItem(["#5A5A5A", "#616161", "#505050"], random); // Mid-tone gray
  const color3 = getRandomItem(["#808080", "#8D8D8D", "#737373"], random); // Lighter gray
  const color4 = getRandomItem(["#A9A9A9", "#B3B3B3", "#9F9F9F"], random); // Lightest gray for peaks
  const color5 = getRandomItem(["#6F4E37", "#5C4033", "#4A3728"], random); // Coffee/brown undertones

  return {
    color1,
    color2,
    color3,
    color4,
    color5,
    persistence: utils.lerp(0.45, 0.6, random()),
    lacunarity: utils.lerp(1.9, 2.3, random()),
    simplePeriod: utils.lerp(1.0, 3.0, random()),
    octaves: Math.floor(utils.lerp(9, 13, random())),
    bumpScale: utils.lerp(2, 3, random()),
    roughness: utils.lerp(0.8, 0.95, random()),
    specularStrength: utils.lerp(0.1, 0.2, random()),
    ambientLightIntensity: 0.01,
    undulation: utils.lerp(0.2, 0.4, random()),
    terrainType: 2, // Sharp peaks for rugged terrain
    terrainAmplitude: utils.lerp(1.0, 1.5, random()),
    terrainSharpness: utils.lerp(1.2, 1.8, random()),
    terrainOffset: utils.lerp(-0.2, 0.0, random()),
  };
}
