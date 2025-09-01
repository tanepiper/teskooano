import type { ProceduralSurfaceProperties } from "@teskooano/data-types";
import { utils } from "@teskooano/core-math";
import { getRandomItem } from "../utils-functions";

export function getIceProperties(
  random: () => number,
): Partial<ProceduralSurfaceProperties> {
  const color1 = getRandomItem(["#F0FFFF", "#E8FFFF", "#F8FFFF"], random); // Azure Mist
  const color2 = getRandomItem(["#ADD8E6", "#A5D2DF", "#B5DDEB"], random); // Light Blue
  const color3 = getRandomItem(["#FFFFFF", "#FDFDFD", "#F8F8F8"], random); // White
  const color4 = getRandomItem(["#c2c2c2", "#B8B8B8", "#CCCCCC"], random); // Grey
  const color5 = getRandomItem(["#ada9a9", "#A39F9F", "#B7B3B3"], random); // Dusty Grey

  return {
    color1,
    color2,
    color3,
    color4,
    color5,
    persistence: utils.lerp(0.53, 0.54, random()),
    lacunarity: utils.lerp(2.14, 2.16, random()),
    simplePeriod: utils.lerp(0.86, 0.88, random()),
    octaves: Math.floor(utils.lerp(8, 9, random())),
    bumpScale: 10,
    terrainType: 3,
    terrainAmplitude: utils.lerp(0.19, 0.21, random()),
    terrainSharpness: utils.lerp(1.28, 1.32, random()),
    terrainOffset: utils.lerp(0.24, 0.26, random()),
    height1: utils.lerp(0.088, 0.092, random()),
    height2: utils.lerp(0.41, 0.43, random()),
    height3: utils.lerp(0.4, 0.42, random()),
    height4: utils.lerp(0.43, 0.45, random()),
    height5: utils.lerp(0.43, 0.45, random()),
    shininess: utils.lerp(25, 40, random()),
    specularStrength: utils.lerp(0.2, 0.4, random()),
    roughness: utils.lerp(0.2, 0.4, random()),
    ambientLightIntensity: 0.01,
    undulation: utils.lerp(0.095, 0.105, random()),
  };
}
