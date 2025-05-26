import type {
  CelestialType,
  SmallBodyType,
  AsteroidType,
  ExtendedStructureType,
  CompositionType,
} from "./common";
import type { CelestialBase } from "./base";
import type { SurfaceProperties } from "./components";

/**
 * Individual asteroid or small rocky body
 */
export interface Asteroid extends CelestialBase {
  type: CelestialType.SMALL_BODY;
  smallBodyType:
    | SmallBodyType.ASTEROID
    | SmallBodyType.NEAR_EARTH_ASTEROID
    | SmallBodyType.TROJAN_ASTEROID;
  asteroidType: AsteroidType; // Orbital and compositional classification

  // Physical properties
  surface: SurfaceProperties; // Surface composition and terrain
  composition: CompositionType[]; // Bulk composition

  // Orbital characteristics
  isNearEarth?: boolean; // Potentially hazardous object
  isTrojan?: boolean; // Trojan asteroid
  parentBody?: string; // What it's a trojan of

  // Special properties
  isContact?: boolean; // Contact binary asteroid
  rotationPeriod_h?: number; // Rotation period in hours
  shape?: string; // Irregular, elongated, etc.
}

/**
 * Asteroid belt or field - extended structure containing many asteroids
 */
export interface AsteroidField extends CelestialBase {
  type: CelestialType.EXTENDED_STRUCTURE;
  structureType: ExtendedStructureType.ASTEROID_BELT;

  // Spatial properties
  innerRadiusAU: number; // Inner edge in AU
  outerRadiusAU: number; // Outer edge in AU
  heightAU: number; // Vertical thickness in AU

  // Population properties
  asteroidCount: number; // Approximate number of asteroids
  totalMass_kg?: number; // Total belt mass
  composition: CompositionType[]; // Average composition
  color: string; // Visual color for rendering

  // Notable members
  largestMembers?: string[]; // IDs of largest asteroids
  dwarfPlanets?: string[]; // IDs of dwarf planets in belt
}

/**
 * Dwarf planet - planet-like body that hasn't cleared its orbit
 */
export interface DwarfPlanet extends CelestialBase {
  type: CelestialType.SMALL_BODY;
  smallBodyType: SmallBodyType.DWARF_PLANET | SmallBodyType.PLUTOID;

  // Physical properties
  surface: SurfaceProperties; // Always has a surface
  composition: CompositionType[]; // Bulk composition

  // Orbital characteristics
  isKuiperBelt?: boolean; // In Kuiper Belt
  isScattered?: boolean; // Scattered disc object
  isDetached?: boolean; // Detached object

  // Special properties
  moons?: string[]; // Some have moons (Pluto-Charon)
  hasAtmosphere?: boolean; // Thin atmosphere (Pluto)
  hydrostatic?: boolean; // In hydrostatic equilibrium
}

/**
 * Oort cloud - spherical shell of icy objects
 */
export interface OortCloud extends CelestialBase {
  type: CelestialType.EXTENDED_STRUCTURE;
  structureType: ExtendedStructureType.OORT_CLOUD;

  // Spatial properties
  innerRadiusAU: number; // Inner edge in AU
  outerRadiusAU: number; // Outer edge in AU

  // Population properties
  cometCount: number; // Approximate number of comets
  totalMass_kg?: number; // Total cloud mass
  composition: CompositionType[]; // Average composition

  // Special properties
  isInner?: boolean; // Inner Oort cloud (Hills cloud)
  isOuter?: boolean; // Outer Oort cloud
  isSpherical?: boolean; // Spherical vs disc-like
}
