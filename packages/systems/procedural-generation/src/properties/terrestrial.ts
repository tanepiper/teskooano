import type { ProceduralSurfaceProperties } from "@teskooano/data-types";
import { utils } from "@teskooano/core-math";
import { getRandomItem } from "../utils";

export function getTerrestrialProperties(
  random: () => number,
): Partial<ProceduralSurfaceProperties> {
  const color1 = getRandomItem(["#25244c", "#201F3D", "#2A295B"], random); // Deep Blue/Purple
  const color2 = getRandomItem(["#4d6780", "#455A64", "#54728C"], random); // Greyish Blue
  const color3 = getRandomItem(["#7f683d", "#725C36", "#8C7444"], random); // Dusty Brown
  const color4 = getRandomItem(["#3e8334", "#346E2B", "#489A3D"], random); // Muted Green
  const color5 = getRandomItem(["#FFFAFA", "#F5F5F5", "#F0FFF0"], random); // Snow White/Off-white

  return {
    color1,
    color2,
    color3,
    color4,
    color5,
    persistence: utils.lerp(0.58, 0.62, random()),
    lacunarity: utils.lerp(1.8, 1.9, random()),
    simplePeriod: utils.lerp(1.4, 1.6, random()),
    octaves: Math.floor(utils.lerp(7, 9, random())),
    bumpScale: utils.lerp(2.6, 2.8, random()),
    terrainType: 3,
    terrainAmplitude: utils.lerp(0.85, 0.95, random()),
    terrainSharpness: utils.lerp(1.2, 1.4, random()),
    terrainOffset: utils.lerp(-0.4, -0.3, random()),
    height1: utils.lerp(0.07, 0.09, random()),
    height2: utils.lerp(0.14, 0.16, random()),
    height3: utils.lerp(0.24, 0.26, random()),
    height4: utils.lerp(0.43, 0.45, random()),
    height5: utils.lerp(0.96, 0.98, random()),
    shininess: utils.lerp(8, 9, random()),
    specularStrength: utils.lerp(0.3, 0.33, random()),
    roughness: utils.lerp(0.1, 0.13, random()),
    ambientLightIntensity: utils.lerp(0.25, 0.3, random()), // System-wide minimum ambient for "just enough glow"
    undulation: utils.lerp(0.38, 0.42, random()),
  };
}
