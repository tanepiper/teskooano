import type {
  CelestialType,
  StellarType,
  MainSequenceSpectralClass,
  BrownDwarfSpectralClass,
} from "./common";
import type { CelestialBase } from "./base";

/**
 * Main sequence star or evolved star (not stellar remnants)
 */
export interface Star extends CelestialBase {
  type: CelestialType.STAR;
  stellarType: StellarType;

  // Spectral classification (for main sequence stars only)
  mainSequenceSpectralClass?: MainSequenceSpectralClass; // O, B, A, F, G, K, M

  // Physical properties
  luminosity: number; // Solar luminosities
  color: string; // Hex color for rendering

  // System properties
  isMainStar?: boolean; // Primary star in system
  partnerStars?: string[]; // IDs of companion stars

  // Variable star properties
  variablePeriod_s?: number; // Period for variable stars
  variableAmplitude?: number; // Magnitude variation

  // Evolutionary state
  age_yr?: number; // Star age in years
  metallicity?: number; // Metallicity [Fe/H]
}

/**
 * Stellar remnant (white dwarf, neutron star, black hole)
 * Uses data-driven approach - specific properties determined by StellarPhysicsData
 */
export interface StellarRemnant extends CelestialBase {
  type: CelestialType.STELLAR_REMNANT;
  stellarType:
    | StellarType.WHITE_DWARF
    | StellarType.NEUTRON_STAR
    | StellarType.BLACK_HOLE;

  // Universal remnant properties
  color: string; // Hex color for rendering
  age_yr?: number; // Age since formation

  // Specific properties are determined by physics data and classification functions
  // rather than hardcoded enum types - this supports the data-driven approach
}

/**
 * Brown dwarf - substellar object
 */
export interface BrownDwarf extends CelestialBase {
  type: CelestialType.STELLAR_REMNANT; // Classified as remnant since it's not a true star
  spectralClass: BrownDwarfSpectralClass;

  color: string; // Hex color for rendering
  age_yr: number; // Age in years
  lithiumBurning?: boolean; // Can it burn lithium?
  deuteriumBurning?: boolean; // Can it burn deuterium?
}
