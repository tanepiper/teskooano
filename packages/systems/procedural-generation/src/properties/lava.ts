import type { ProceduralSurfaceProperties } from "@teskooano/data-types";
import { utils } from "@teskooano/core-math";
import { getRandomItem } from "../utils";

export function getLavaProperties(
  random: () => number,
): Partial<ProceduralSurfaceProperties> {
  const color1 = getRandomItem(["#000000", "#1B0000", "#2E0800"], random); // Black/dark red cooled rock
  const color2 = getRandomItem(["#4D0F00", "#6A1B00", "#802100"], random); // Darker reds
  const color3 = getRandomItem(["#E53900", "#FF4500", "#FF6600"], random); // Bright orange-red lava
  const color4 = getRandomItem(["#FF8C00", "#FFA500", "#FFD700"], random); // Dark orange/gold highlights
  const color5 = getRandomItem(["#FFFF00", "#FFFF66", "#FFFFAA"], random); // Yellow-white hot spots

  return {
    color1,
    color2,
    color3,
    color4,
    color5,
    persistence: utils.lerp(0.5, 0.65, random()),
    lacunarity: utils.lerp(1.9, 2.3, random()), // Adjusted range
    simplePeriod: utils.lerp(1, 4, random()),
    octaves: Math.floor(utils.lerp(9, 13, random())), // Increased octaves
    bumpScale: utils.lerp(2, 3, random()),
    roughness: utils.lerp(0.1, 1, random()),
    specularStrength: utils.lerp(0.3, 0.6, random()),
    ambientLightIntensity: utils.lerp(0.2, 0.4, random()), // Moderate ambient for lava planets
    undulation: utils.lerp(0.2, 0.3, random()), // Moderate undulation for lava flows
    terrainType: 2,
    terrainAmplitude: utils.lerp(1.2, 1.8, random()),
    terrainSharpness: utils.lerp(1.0, 1.5, random()),
    terrainOffset: utils.lerp(-0.3, -0.1, random()),
  };
}
