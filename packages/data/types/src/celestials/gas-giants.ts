import type { CelestialType, PlanetType, GasGiantClass } from "./common";
import type { CelestialBase } from "./base";
import type { AtmosphereProperties, CloudProperties } from "./components";

/**
 * Gas giant planet - Jupiter/Saturn-like worlds
 */
export interface GasGiant extends CelestialBase {
  type: CelestialType.PLANET;
  planetType: PlanetType.GAS_GIANT;
  gasGiantClass: GasGiantClass; // Sudarsky classification (CLASS_I through CLASS_V)

  // Atmospheric properties
  atmosphere: AtmosphereProperties; // Always has atmosphere
  atmosphereColor: string; // Primary atmospheric color (hex)
  cloudColor: string; // Cloud color (hex)
  cloudSpeed: number; // Atmospheric circulation speed
  clouds?: CloudProperties; // Detailed cloud properties

  // Internal structure
  coreComposition?: string[]; // What's in the solid core
  coreRadius_m?: number; // Radius of solid core
  coreMass_kg?: number; // Mass of solid core

  // System properties
  moons?: string[]; // IDs of orbiting moons
  hasRings?: boolean; // Does it have a ring system

  // Special characteristics
  hasGreatSpot?: boolean; // Jupiter-like storm system
  spotColor?: string; // Color of storm spot
  magneticFieldStrength_t?: number; // Magnetic field strength
  radiationLevel?: number; // Radiation around the planet
}
