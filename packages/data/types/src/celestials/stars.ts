import type {
  CelestialType,
  StellarType,
  StellarRemnantType,
  SpectralClass,
  SpecialSpectralClass,
  LuminosityClass,
  WhiteDwarfType,
  BlackHoleType,
} from "./common";
import type { CelestialBase } from "./base";

/**
 * Main sequence star or evolved star (not stellar remnants)
 */
export interface Star extends CelestialBase {
  type: CelestialType.STAR;
  stellarType: StellarType;

  // Spectral classification
  spectralClass?: SpectralClass; // O, B, A, F, G, K, M, L, T, Y
  specialSpectralClass?: SpecialSpectralClass; // W, C, S, etc.
  luminosityClass?: LuminosityClass; // I, II, III, IV, V, VI, VII

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
 */
export interface StellarRemnant extends CelestialBase {
  type: CelestialType.STELLAR_REMNANT;
  remnantType: StellarRemnantType;

  // Universal remnant properties
  color: string; // Hex color for rendering
  age_yr?: number; // Age since formation

  // White dwarf specific
  whiteDwarfType?: WhiteDwarfType; // DA, DB, DC, etc.
  coolingAge_yr?: number; // Age since white dwarf formation

  // Neutron star specific
  isPulsar?: boolean; // Is it a pulsar?
  pulseFrequency_hz?: number; // Pulse frequency if pulsar
  isMagnetar?: boolean; // Is it a magnetar?
  magneticFieldStrength_t?: number; // Magnetic field strength

  // Black hole specific
  blackHoleType?: BlackHoleType; // Stellar, intermediate, supermassive, etc.
  isRotating?: boolean; // Kerr (true) vs Schwarzschild (false)
  spinParameter?: number; // a/M for Kerr black holes (0-1)
  accretionDiskRadius_m?: number; // Radius of accretion disk if present
  hawkingTemperature_k?: number; // Hawking temperature

  // Jets and emissions
  hasJets?: boolean; // Does it emit jets?
  jetLength_m?: number; // Length of jets if present
  xrayLuminosity?: number; // X-ray luminosity for active objects
}

/**
 * Brown dwarf - substellar object
 */
export interface BrownDwarf extends CelestialBase {
  type: CelestialType.STELLAR_REMNANT; // Classified as remnant since it's not a true star
  remnantType: StellarRemnantType.WHITE_DWARF; // Will update enum to include brown dwarf
  spectralClass: SpectralClass.L | SpectralClass.T | SpectralClass.Y;

  color: string; // Hex color for rendering
  age_yr: number; // Age in years
  lithiumBurning?: boolean; // Can it burn lithium?
  deuteriumBurning?: boolean; // Can it burn deuterium?
}
