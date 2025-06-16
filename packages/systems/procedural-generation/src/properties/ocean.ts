import type { ProceduralSurfaceProperties } from "@teskooano/data-types";
import { utils } from "@teskooano/core-math";
import { getRandomItem } from "../utils";

export function getOceanProperties(
  random: () => number,
): Partial<ProceduralSurfaceProperties> {
  const color1 = getRandomItem(["#000080", "#00008B", "#191970"], random); // Navy/midnight blue for deep ocean
  const color2 = getRandomItem(["#008080", "#20B2AA", "#4682B4"], random); // Teal/steel blue for mid-depth
  const color3 = getRandomItem(["#40E0D0", "#00CED1", "#5F9EA0"], random); // Turquoise/cadet blue for shallows
  const color4 = getRandomItem(["#AFEEEE", "#E0FFFF", "#B0E0E6"], random); // Pale turquoise/light cyan for coastlines
  const color5 = getRandomItem(["#F5DEB3", "#FFFACD", "#F0E68C"], random); // Wheat/lemon chiffon/khaki for any visible land/sand

  return {
    color1,
    color2,
    color3,
    color4,
    color5,
    persistence: utils.lerp(0.6, 0.75, random()), // Very smooth generally
    lacunarity: utils.lerp(1.8, 2.1, random()), // Few sharp transitions
    simplePeriod: utils.lerp(8.0, 15.0, random()), // Large, gentle swells
    octaves: Math.floor(utils.lerp(4, 6, random())), // Less detail needed
    bumpScale: utils.lerp(0.005, 0.02, random()), // Very low bump for water surface
    roughness: utils.lerp(0.1, 0.4, random()), // Water is smooth
    specularStrength: utils.lerp(0.5, 0.9, random()), // Strong water reflections
    ambientLightIntensity: utils.lerp(0.3, 0.5, random()), // Higher ambient for ocean planets
    undulation: utils.lerp(0.4, 0.6, random()), // High undulation for ocean planets
    terrainType: 1,
    terrainAmplitude: utils.lerp(0.4, 0.7, random()),
    terrainSharpness: utils.lerp(0.4, 0.7, random()),
    terrainOffset: utils.lerp(0.3, 0.5, random()),
  };
}
