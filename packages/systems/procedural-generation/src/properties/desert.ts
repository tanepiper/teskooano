import type { ProceduralSurfaceProperties } from "@teskooano/data-types";
import { utils } from "@teskooano/core-math";
import { getRandomItem } from "../utils";

export function getDesertProperties(
  random: () => number,
): Partial<ProceduralSurfaceProperties> {
  // Palette of sand, rock, and sun-bleached tones
  const color1 = getRandomItem(["#C2B280", "#D2B48C", "#BDB76B"], random); // Sandy base
  const color2 = getRandomItem(["#E6CBAA", "#F0E68C", "#F5DEB3"], random); // Lighter sand
  const color3 = getRandomItem(["#A0522D", "#8B4513", "#800000"], random); // Dark rock/Maroon
  const color4 = getRandomItem(["#CD853F", "#D2691E", "#BC8F8F"], random); // Lighter rock/rose
  const color5 = getRandomItem(["#FFF8DC", "#FAFAD2", "#FFEFD5"], random); // Brightest highlights

  return {
    color1,
    color2,
    color3,
    color4,
    color5,
    persistence: utils.lerp(0.4, 0.6, random()), // Adjusted for more consistent detail
    lacunarity: utils.lerp(1.9, 2.4, random()), // Corrected from very high range
    simplePeriod: utils.lerp(1.5, 4.0, random()), // Adjusted for finer details
    octaves: Math.floor(utils.lerp(8, 12, random())), // Increased octaves
    bumpScale: utils.lerp(0.01, 0.04, random()), // Lower bump for ice
    roughness: utils.lerp(0.65, 0.9, random()),
    specularStrength: utils.lerp(0.05, 0.15, random()), // Slightly higher than barren/rocky but still low
    ambientLightIntensity: utils.lerp(0.01, 0.02, random()), // Minimal ambient for dark space
    undulation: utils.lerp(0.15, 0.25, random()), // Moderate undulation for desert dunes
    terrainType: 3,
    terrainAmplitude: utils.lerp(0.3, 0.6, random()),
    terrainSharpness: utils.lerp(0.5, 0.8, random()),
    terrainOffset: utils.lerp(0.1, 0.3, random()),
  };
}
