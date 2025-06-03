import { CelestialType } from "@teskooano/celestial-object";

export const AU_METERS = 149597870700;

export const SCALE = {
  DISTANCE: 1.0,
  SIZE: 1.0, // Default size multiplier
  TIME: 1.0,
  MASS: 1.0e-20,
  RENDER_SCALE_AU: 1000,
  GAS_GIANT_SIZE: 1.0,
  STAR_SIZE: 1.0,
  MOON_DISTANCE: 50.0, // Note: This is for MOON_DISTANCE, not MOON_SIZE.
  // We might need a SCALE.MOON_SIZE if moons need specific size scaling.
};

export const METERS_TO_SCENE_UNITS = SCALE.RENDER_SCALE_AU / AU_METERS;

/**
 * Convert a physical size (radius, meters) to a visualization size (in Scene Units)
 * Uses the new CelestialType from @teskooano/celestial-object
 */
export function scaleSize(
  realSize: number,
  objectType: string, // Expects string values from the new CelestialType object
): number {
  const baseScaledSize = realSize * METERS_TO_SCENE_UNITS;

  switch (objectType) {
    // Star Types
    case CelestialType.STAR:
    case CelestialType.MAIN_SEQUENCE_STAR:
    case CelestialType.POST_MAIN_SEQUENCE_STAR:
    case CelestialType.PRE_MAIN_SEQUENCE_STAR:
    case CelestialType.EVOLVED_STAR:
      return baseScaledSize * SCALE.STAR_SIZE;

    // Gas Giant
    case CelestialType.GAS_GIANT:
      return baseScaledSize * SCALE.GAS_GIANT_SIZE;

    // Planets (non-Gas Giant), Moons, Dwarf Planets
    case CelestialType.PLANET:
    case CelestialType.MOON:
    case CelestialType.DWARF_PLANET:
      return baseScaledSize * SCALE.SIZE;

    // Small Bodies & Fields
    case CelestialType.ASTEROID_FIELD:
    case CelestialType.ASTEROID_RING:
    case CelestialType.COMET:
    case CelestialType.OORT_CLOUD:
      return baseScaledSize * SCALE.SIZE;

    // Stellar Remnants
    case CelestialType.REMNANT_STAR:
    case CelestialType.BLACK_HOLE:
      return baseScaledSize * SCALE.SIZE;

    // Other Structures & Fallback
    case CelestialType.RING_SYSTEM: // Ring systems themselves often have visual size determined differently
    case CelestialType.DUST_CLOUD:
    case CelestialType.OTHER:
    default:
      return baseScaledSize * SCALE.SIZE;
  }
}
