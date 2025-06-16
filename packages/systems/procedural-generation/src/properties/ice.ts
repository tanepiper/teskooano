import type { ProceduralSurfaceProperties } from "@teskooano/data-types";
import { utils } from "@teskooano/core-math";
import { getRandomItem } from "../utils";

export function getIceProperties(
  random: () => number,
): Partial<ProceduralSurfaceProperties> {
  const color1 = getRandomItem(["#E0FFFF", "#F0FFFF", "#AFEEEE"], random); // Light cyan/pale turquoise
  const color2 = getRandomItem(["#B0E0E6", "#ADD8E6", "#87CEEB"], random); // Powder blue/light blue
  const color3 = getRandomItem(["#FFFFFF", "#F5F5F5", "#FAFAFA"], random); // Off-white/snow
  const color4 = getRandomItem(["#D3D3D3", "#C0C0C0", "#B0C4DE"], random); // Light gray/silver/light steel blue
  const color5 = getRandomItem(["#778899", "#708090", "#696969"], random); // Slate gray/dim gray for deep ice

  return {
    color1,
    color2,
    color3,
    color4,
    color5,
    persistence: utils.lerp(0.45, 0.6, random()), // Adjusted persistence
    lacunarity: utils.lerp(1.9, 2.2, random()), // Corrected lacunarity for smoother ice
    simplePeriod: utils.lerp(0.8, 1.8, random()), // Adjusted for finer ice details
    octaves: Math.floor(utils.lerp(8, 12, random())), // Increased octaves
    bumpScale: 3, //utils.lerp(1, 2, random); // Lower bump for ice
    roughness: utils.lerp(0.1, 0.3, random()),
    specularStrength: utils.lerp(0.4, 0.8, random()), // Stronger specular for ice
    ambientLightIntensity: utils.lerp(0.4, 0.6, random()), // High ambient for ice planets
    undulation: utils.lerp(0.05, 0.15, random()), // Very low undulation for ice planets
    terrainType: 1, // Simple noise for ice
    terrainAmplitude: utils.lerp(0.2, 0.4, random()),
    terrainSharpness: utils.lerp(0.3, 0.6, random()),
    terrainOffset: utils.lerp(0.2, 0.4, random()),
  };
}
