// Re-export all common enums and types
export * from "./common";

// Re-export all physics-related interfaces
export * from "./physics";

// Re-export base celestial interface
export * from "./base";

// Re-export component properties
export * from "./components";

// Re-export specific celestial types
export * from "./stars";
export * from "./planets";
export * from "./gas-giants";
export * from "./comets";
export * from "./asteroids";

// Import all celestial types for the union
import type { Star, StellarRemnant, BrownDwarf } from "./stars";
import type { Planet, Moon } from "./planets";
import type { GasGiant } from "./gas-giants";
import type { Comet } from "./comets";
import type {
  Asteroid,
  AsteroidField,
  DwarfPlanet,
  OortCloud,
} from "./asteroids";

// ============================================================================
// UNION TYPES
// ============================================================================

/**
 * All stellar objects (including remnants)
 */
export type StellarObject = Star | StellarRemnant | BrownDwarf;

/**
 * All planetary objects (planets, moons, gas giants)
 */
export type PlanetaryObject = Planet | Moon | GasGiant;

/**
 * All small bodies (asteroids, comets, dwarf planets)
 */
export type SmallBodyObject = Asteroid | Comet | DwarfPlanet;

/**
 * All extended structures (belts, clouds, discs)
 */
export type ExtendedStructureObject = AsteroidField | OortCloud;

/**
 * Union type of all possible celestial bodies in the simulation
 */
export type CelestialBody =
  | StellarObject
  | PlanetaryObject
  | SmallBodyObject
  | ExtendedStructureObject;

/**
 * Objects that can have solid surfaces
 */
export type SolidBodyObject = Planet | Moon | Asteroid | Comet | DwarfPlanet;

/**
 * Objects that can have atmospheres
 */
export type AtmosphericBodyObject = Planet | Moon | GasGiant;

/**
 * Objects that can have ring systems
 */
export type RingedBodyObject = Planet | GasGiant;

/**
 * Objects that can have moons
 */
export type MoonHostObject = Planet | GasGiant | DwarfPlanet;

/**
 * Objects that emit light
 */
export type LuminousObject = Star | StellarRemnant;
