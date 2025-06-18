import type { ProceduralSurfaceProperties } from "@teskooano/data-types";
import { utils } from "@teskooano/core-math";
import { getRandomItem } from "../utils";

export function getTerrestrialProperties(
  random: () => number,
): Partial<ProceduralSurfaceProperties> {
  const color1 = getRandomItem(["#006400", "#228B22", "#008000"], random); // Dark green for forests
  const color2 = getRandomItem(["#32CD32", "#9ACD32", "#6B8E23"], random); // Lime green/olive drab for grasslands
  const color3 = getRandomItem(["#F5DEB3", "#D2B48C", "#BC8F8F"], random); // Wheat/tan/rosy brown for arid/mountainous regions
  const color4 = getRandomItem(["#4682B4", "#87CEEB", "#1E90FF"], random); // Steel blue/sky blue/dodger blue for water
  const color5 = getRandomItem(["#FFFFFF", "#F5F5F5", "#FFFAFA"], random); // White/snow for peaks and polar caps

  return {
    color1,
    color2,
    color3,
    color4,
    color5,
    persistence: utils.lerp(0.55, 0.65, random()), // Slightly increased
    lacunarity: utils.lerp(1.8, 2.2, random()), // Tightened range
    simplePeriod: utils.lerp(0.5, 0.9, random()), // Higher frequency
    octaves: Math.floor(utils.lerp(10, 14, random())), // Increased octaves
    bumpScale: utils.lerp(1, 2, random()),
    roughness: utils.lerp(0.1, 0.2, random()),
    specularStrength: utils.lerp(0.3, 0.6, random()),
    ambientLightIntensity: utils.lerp(0.2, 0.4, random()), // Higher ambient for Earth-like planets
    undulation: utils.lerp(0.3, 0.5, random()), // Higher undulation for continent-like features
    terrainType: 1,
    terrainAmplitude: utils.lerp(0.8, 1.2, random()),
    terrainSharpness: utils.lerp(0.8, 1.2, random()),
    terrainOffset: utils.lerp(-0.1, 0.1, random()),
  };
}
