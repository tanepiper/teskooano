import {
  GasGiantClass,
  type ProceduralSurfaceProperties,
} from "@teskooano/data-types";
import { utils } from "@teskooano/core-math";

export function getGasGiantProperties(
  random: () => number,
  gasGiantClass: GasGiantClass,
): Partial<ProceduralSurfaceProperties> {
  const baseProperties: Partial<ProceduralSurfaceProperties> = {
    shininess: utils.lerp(2, 5, random()),
    specularStrength: utils.lerp(0.01, 0.05, random()),
    roughness: utils.lerp(0.9, 1.0, random()),
    undulation: utils.lerp(0.5, 1.0, random()),
    ambientLightIntensity: 0.01,
  };

  let specificProperties: Partial<ProceduralSurfaceProperties> = {};

  switch (gasGiantClass) {
    case GasGiantClass.CLASS_I: // Ammonia Clouds
      specificProperties = {
        color1: "#E0D8C0", // Light beige
        color2: "#C8B496", // Sandy brown
        color3: "#B5651D", // Reddish-brown (Tholins)
        color4: "#A08C78", // Deeper brown
        color5: "#6E5A4B", // Dark brown
        octaves: 9,
        persistence: 0.55,
        lacunarity: 2.2,
      };
      break;
    case GasGiantClass.CLASS_II: // Water Clouds
      specificProperties = {
        color1: "#FFFFFF", // White
        color2: "#E8E8E8", // Off-white
        color3: "#C0C0C0", // Light grey
        color4: "#A9A9A9", // Grey
        color5: "#808080", // Dark grey
        octaves: 10,
        persistence: 0.5,
        lacunarity: 2.0,
      };
      break;
    case GasGiantClass.CLASS_III: // Cloudless
      specificProperties = {
        color1: "#4A90E2", // Bright blue
        color2: "#3A7BC8", // Medium blue
        color3: "#2F65A8", // Deep blue
        color4: "#204D84", // Darker blue
        color5: "#15355B", // Navy blue
        octaves: 2, // Very few octaves for a featureless look
        persistence: 0.3, // Low persistence for smooth transitions
        lacunarity: 1.8, // Low lacunarity for less detail
        undulation: 0.1, // Minimal undulation
      };
      break;
    case GasGiantClass.CLASS_IV: // Alkali Metals
      specificProperties = {
        color1: "#4D433E", // Sooty dark brown
        color2: "#3C322F", // Very dark grey-brown
        color3: "#7B241C", // Deep, dark red
        color4: "#2E2623", // Near black
        color5: "#1A1412", // Almost black
        octaves: 6,
        persistence: 0.4, // Less defined features
        lacunarity: 2.5, // High lacunarity for "stringy" or "wispy" dark clouds
        undulation: 0.3,
      };
      break;
    case GasGiantClass.CLASS_V: // Silicate Clouds
      specificProperties = {
        color1: "#F5F5DC", // Beige (light silicate)
        color2: "#FFFACD", // Lemon Chiffon (sulfur hints)
        color3: "#D3D3D3", // Light Grey (iron/silicate mix)
        color4: "#B0C4DE", // Light Steel Blue (trace elements)
        color5: "#A9A9A9", // Dark Grey (denser silicate)
        octaves: 9,
        persistence: 0.55,
        lacunarity: 2.2,
      };
      break;
  }

  return {
    ...baseProperties,
    ...specificProperties,
  };
}
