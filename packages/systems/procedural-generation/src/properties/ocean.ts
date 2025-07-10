import type { ProceduralSurfaceProperties } from "@teskooano/data-types";
import { utils } from "@teskooano/core-math";
import { getRandomItem } from "../utils";

export function getOceanProperties(
  random: () => number,
): Partial<ProceduralSurfaceProperties> {
  // Your "perfect" planet has islands (color1, color2) and then water (color4).
  // This setup generates island-like features rising from the ocean.
  // color1: Deep land (dark green)
  // color2: Mid-land (olive)
  // color3: Beaches/shores (wheat)
  // color4: Water (blue-green)
  // color5: Shallow land near water (lighter green)
  const color1 = getRandomItem(["#008000", "#006400", "#007000"], random); // Dark Greens
  const color2 = getRandomItem(["#6B8E23", "#556B2F", "#667C26"], random); // Olive Drabs
  const color3 = getRandomItem(["#F5DEB3", "#D2B48C", "#E1C699"], random); // Wheats/Tans
  const color4 = getRandomItem(["#386b80", "#2E5866", "#447C99"], random); // Blue-Greens
  const color5 = getRandomItem(["#2ead30", "#3CB371", "#28a745"], random); // Lighter Greens

  return {
    color1,
    color2,
    color3,
    color4,
    color5,
    persistence: utils.lerp(0.58, 0.62, random()),
    lacunarity: utils.lerp(1.8, 1.9, random()),
    simplePeriod: utils.lerp(0.5, 0.6, random()),
    octaves: Math.floor(utils.lerp(12, 14, random())),
    bumpScale: utils.lerp(1.6, 1.7, random()),
    terrainType: 3, // Sharp valleys are key for island coastlines
    terrainAmplitude: utils.lerp(0.75, 0.85, random()),
    terrainSharpness: utils.lerp(0.9, 1.0, random()),
    terrainOffset: utils.lerp(0, 1.0, random()), // Negative offset pushes most terrain underwater
    height1: 0, // Deepest part is water
    height2: utils.lerp(0.02, 0.04, random()),
    height3: utils.lerp(0.3, 0.32, random()),
    height4: utils.lerp(0.33, 0.35, random()),
    height5: utils.lerp(0.23, 0.25, random()),
    shininess: utils.lerp(40, 50, random()),
    specularStrength: utils.lerp(0.45, 0.55, random()),
    roughness: utils.lerp(0.03, 0.05, random()),
    ambientLightIntensity: utils.lerp(0.01, 0.02, random()), // Minimal ambient for dark space
    undulation: utils.lerp(0.3, 0.34, random()),
  };
}
