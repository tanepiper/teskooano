import type {
  CelestialObject,
  PlanetProperties,
  ProceduralSurfaceProperties,
} from "@teskooano/data-types";
import { PlanetType, SurfaceType } from "@teskooano/data-types";
import * as CONST from "../../constants";
import * as UTIL from "../../utils-functions";
import { createProceduralSurfaceProperties } from "../../properties";

/**
 * Moon surface properties and composition generation
 *
 * This module handles the determination of moon surface types,
 * compositions, and procedural surface properties based on
 * formation mechanisms and parent planet characteristics.
 */

/**
 * Determine moon type based on formation and parent planet
 */
export function determineMoonType(
  random: () => number,
  formation: string,
  parentPlanet: CelestialObject,
): PlanetType {
  const parentProps = parentPlanet.properties as PlanetProperties;

  switch (formation) {
    case "co-accretion":
      // Similar to parent planet material
      if (parentProps?.classType === PlanetType.TERRESTRIAL) {
        return PlanetType.ROCKY;
      } else {
        return PlanetType.ICE; // Moons of gas giants are often icy
      }

    case "impact":
      // Impact moons are typically rocky/barren
      return PlanetType.BARREN;

    case "capture":
      // Captured objects vary widely
      const types = [PlanetType.BARREN, PlanetType.ROCKY, PlanetType.ICE];
      return types[Math.floor(random() * types.length)];

    default:
      return PlanetType.ROCKY;
  }
}

/**
 * Determine moon surface type
 */
export function determineMoonSurface(
  moonType: PlanetType,
  formation: string,
): SurfaceType {
  if (moonType === PlanetType.ICE) {
    return SurfaceType.ICE_FLATS;
  }

  switch (formation) {
    case "impact":
      return SurfaceType.CRATERED; // Heavy bombardment
    case "capture":
      return SurfaceType.CRATERED; // Asteroid-like
    default:
      return SurfaceType.FLAT; // Processed surface
  }
}

/**
 * Determine moon composition
 */
export function determineMoonComposition(
  random: () => number,
  moonType: PlanetType,
  formation: string,
): string[] {
  if (moonType === PlanetType.ICE) {
    return CONST.ICE_COMPOSITION;
  }

  switch (formation) {
    case "impact":
      return ["silicates", "iron", "magnesium"]; // Iron-depleted
    case "capture":
      return ["carbon", "silicates", "water ice"]; // Asteroid-like
    default:
      return UTIL.getRandomItem(CONST.ROCKY_COMPOSITION, random).split(",");
  }
}

/**
 * Create moon surface properties based on planet type
 */
export function createMoonSurfaceProperties(
  random: () => number,
  moonPlanetType: PlanetType,
): ProceduralSurfaceProperties {
  switch (moonPlanetType) {
    case PlanetType.BARREN:
    case PlanetType.ROCKY:
    case PlanetType.TERRESTRIAL:
    case PlanetType.ICE:
    case PlanetType.DESERT:
    case PlanetType.LAVA:
      return createProceduralSurfaceProperties(random, moonPlanetType);
    default:
      return createProceduralSurfaceProperties(random, PlanetType.ROCKY);
  }
}

/**
 * Create moon planet properties object
 */
export function createMoonPlanetProperties(
  random: () => number,
  moonPlanetType: PlanetType,
  formation: string,
  parentPlanet: CelestialObject,
): PlanetProperties {
  const detailedSurface = createMoonSurfaceProperties(random, moonPlanetType);

  return {
    type: "PLANET" as any, // Moon properties use planet type
    classType: moonPlanetType,
    isMoon: true,
    composition: determineMoonComposition(random, moonPlanetType, formation),
    surface: detailedSurface as any,
    atmosphere: undefined, // Most moons lack significant atmospheres
  };
}
