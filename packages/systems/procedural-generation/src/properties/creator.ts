import { utils } from "@teskooano/core-math";
import {
  GasGiantClass,
  PlanetType,
  type ProceduralSurfaceProperties,
} from "@teskooano/data-types";
import { getBarrenProperties } from "./barren";
import {
  getDesertProperties,
  getGasGiantProperties,
  getIceProperties,
  getLavaProperties,
  getOceanProperties,
  getRockyProperties,
} from "./";
import { getTerrestrialProperties } from "./terrestrial";

/**
 * Creates detailed procedural surface properties for a planet based on its type.
 *
 * This function is crucial for the visual appearance of planets. It defines
 * a set of parameters (noise settings, bump scales, colors, etc.) that are fed
 * into the shaders to procedurally generate the planet's surface texture. Each
 * `PlanetType` has a unique, handcrafted set of parameters to give it a distinct
 * look, from the continents of a Terrestrial world to the dunes of a Desert planet.
 *
 * @param random The seeded pseudo-random number generator function.
 * @param type The `PlanetType` or `GasGiantClass` of the celestial body.
 * @returns A `ProceduralSurfaceProperties` object containing all the data
 *   needed by the planet surface shader.
 */
export function createProceduralSurfaceProperties(
  random: () => number,
  type: PlanetType | GasGiantClass,
): ProceduralSurfaceProperties {
  // Define a base set of properties that can be overridden
  const baseProperties: ProceduralSurfaceProperties = {
    color1: "#ffffff",
    color2: "#cccccc",
    color3: "#999999",
    color4: "#666666",
    color5: "#333333",
    persistence: utils.lerp(0.5, 0.7, random()),
    lacunarity: utils.lerp(1.8, 2.2, random()),
    simplePeriod: utils.lerp(1.5, 4.0, random()),
    octaves: Math.floor(utils.lerp(8, 12, random())),
    bumpScale: utils.lerp(2, 3, random()),
    terrainType: 2, // Default to a balanced terrain
    terrainAmplitude: 1,
    terrainSharpness: 1,
    terrainOffset: 0,
    height1: utils.lerp(0.1, 0.2, random()),
    height2: utils.lerp(0.2, 0.4, random()),
    height3: utils.lerp(0.4, 0.6, random()),
    height4: utils.lerp(0.6, 0.8, random()),
    height5: utils.lerp(0.8, 1.0, random()),
    shininess: utils.lerp(8, 32, random()),
    specularStrength: utils.lerp(0.1, 0.3, random()),
    roughness: utils.lerp(0.5, 0.9, random()),
    ambientLightIntensity: 0.25, // System-wide minimum ambient for "just enough glow"
    undulation: utils.lerp(0.1, 0.3, random()),
  };

  let specificProperties: Partial<ProceduralSurfaceProperties> = {};

  if (Object.values(PlanetType).includes(type as PlanetType)) {
    switch (type as PlanetType) {
      case PlanetType.TERRESTRIAL:
        specificProperties = getTerrestrialProperties(random);
        break;
      case PlanetType.ROCKY:
        specificProperties = getRockyProperties(random);
        break;
      case PlanetType.BARREN:
        specificProperties = getBarrenProperties(random);
        break;
      case PlanetType.DESERT:
        specificProperties = getDesertProperties(random);
        break;
      case PlanetType.ICE:
        specificProperties = getIceProperties(random);
        break;
      case PlanetType.LAVA:
        specificProperties = getLavaProperties(random);
        break;
      case PlanetType.OCEAN:
        specificProperties = getOceanProperties(random);
        break;
      default:
        console.warn(
          `[createProceduralSurfaceProperties] Unhandled classType: ${type}, using fallback TERRESTRIAL properties.`,
        );
        specificProperties = getTerrestrialProperties(random);
        break;
    }
  } else if (Object.values(GasGiantClass).includes(type as GasGiantClass)) {
    specificProperties = getGasGiantProperties(random, type as GasGiantClass);
  } else {
    console.warn(
      `[createProceduralSurfaceProperties] Unknown celestial type: ${type}, using fallback properties.`,
    );
    specificProperties = getTerrestrialProperties(random);
  }

  // Merge the base properties with the type-specific properties
  return {
    ...baseProperties,
    ...specificProperties,
  };
}
