import type {
  CelestialType,
  PlanetType,
  PlanetSubtype,
  MoonType,
} from "./common";
import type { CelestialBase } from "./base";
import type {
  SurfaceProperties,
  AtmosphereProperties,
  CloudProperties,
} from "./components";

/**
 * Planet - primary planetary body orbiting a star
 */
export interface Planet extends CelestialBase {
  type: CelestialType.PLANET;
  planetType: PlanetType;
  planetSubtype?: PlanetSubtype; // Additional classification

  // Physical properties
  surface?: SurfaceProperties; // Solid planets only
  atmosphere?: AtmosphereProperties; // If it has an atmosphere
  clouds?: CloudProperties; // If it has clouds

  // Orbital characteristics
  isTidallyLocked?: boolean; // Tidally locked to parent star
  habitableZone?: boolean; // In the habitable zone

  // System properties
  moons?: string[]; // IDs of orbiting moons
  hasRings?: boolean; // Does it have a ring system
}

/**
 * Moon - natural satellite orbiting a planet
 */
export interface Moon extends CelestialBase {
  type: CelestialType.PLANET; // Still use PLANET type but with isMoon flag
  planetType: PlanetType; // Use same planet types
  moonType: MoonType; // Moon-specific classification

  // Physical properties
  surface: SurfaceProperties; // Moons always have surfaces
  atmosphere?: AtmosphereProperties; // Some moons have atmospheres

  // Orbital characteristics
  parentPlanet: string; // ID of parent planet
  isTidallyLocked?: boolean; // Most moons are tidally locked
  isRegular?: boolean; // Regular vs irregular orbit

  // Special properties
  subsurfaceOcean?: boolean; // Hidden ocean (Europa, Enceladus)
  geologicalActivity?: boolean; // Active geology (Io, Enceladus)

  // Legacy flag for backward compatibility
  isMoon: true; // Always true for moons
}
