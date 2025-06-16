import { PlanetType, ProceduralSurfaceProperties } from "@teskooano/data-types";
import { getRandomInRange } from "../utils";
import {
  getBarrenProperties,
  getDesertProperties,
  getIceProperties,
  getLavaProperties,
  getOceanProperties,
  getRockyProperties,
  getTerrestrialProperties,
} from "./";

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
 * @param planetType The `PlanetType` of the planet.
 * @returns A `ProceduralSurfaceProperties` object containing all the data
 *   needed by the planet surface shader.
 */
export function createProceduralSurfaceProperties(
  random: () => number,
  planetType: PlanetType,
): ProceduralSurfaceProperties {
  // Define base properties that can be shared or used as fallbacks
  const baseProperties: ProceduralSurfaceProperties = {
    persistence: getRandomInRange(0.5, 0.7, random),
    lacunarity: getRandomInRange(1.8, 2.2, random),
    simplePeriod: getRandomInRange(1.5, 4.0, random),
    octaves: Math.floor(getRandomInRange(8, 12, random)),
    bumpScale: getRandomInRange(2, 3, random),
    color1: "#808080",
    color2: "#A9A9A9",
    color3: "#D3D3D3",
    color4: "#FFFFFF",
    color5: "#696969",
    height1: getRandomInRange(0.1, 0.2, random),
    height2: getRandomInRange(0.2, 0.4, random),
    height3: getRandomInRange(0.4, 0.6, random),
    height4: getRandomInRange(0.6, 0.8, random),
    height5: getRandomInRange(0.8, 1.0, random),
    shininess: getRandomInRange(8, 32, random),
    specularStrength: getRandomInRange(0.1, 0.3, random),
    roughness: getRandomInRange(0.5, 0.9, random),
    ambientLightIntensity: 0.5,
    undulation: getRandomInRange(0.1, 0.3, random),
    terrainType: 2,
    terrainAmplitude: 1.0,
    terrainSharpness: 1.0,
    terrainOffset: 0.0,
  };

  let specificProperties: Partial<ProceduralSurfaceProperties> = {};

  switch (planetType) {
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
        `[createProceduralSurfaceProperties] Unhandled planetType: ${planetType}, using fallback TERRESTRIAL properties.`,
      );
      specificProperties = getTerrestrialProperties(random);
      break;
  }

  // Merge the base properties with the type-specific properties
  return {
    ...baseProperties,
    ...specificProperties,
  };
}
