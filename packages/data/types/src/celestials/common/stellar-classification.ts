// ============================================================================
// STELLAR CLASSIFICATION - REFACTORED
// ============================================================================

/**
 * Core stellar types - primarily for renderer selection and basic physics simulation
 * This enum stays as-is per user feedback since it defines renderer types
 */
export enum StellarType {
  // Pre-main sequence
  PROTOSTAR = "PROTOSTAR",
  T_TAURI = "T_TAURI",
  HERBIG_AE_BE = "HERBIG_AE_BE",

  // Main sequence
  MAIN_SEQUENCE = "MAIN_SEQUENCE",

  // Post-main sequence
  SUBGIANT = "SUBGIANT",
  RED_GIANT = "RED_GIANT",
  BLUE_GIANT = "BLUE_GIANT",
  SUPERGIANT = "SUPERGIANT",
  HYPERGIANT = "HYPERGIANT",

  // Evolved/Special types
  WOLF_RAYET = "WOLF_RAYET",
  CARBON_STAR = "CARBON_STAR",
  VARIABLE_STAR = "VARIABLE_STAR",

  // Remnants
  WHITE_DWARF = "WHITE_DWARF",
  NEUTRON_STAR = "NEUTRON_STAR",
  BLACK_HOLE = "BLACK_HOLE",
}

// ============================================================================
// LEGACY ENUMS - MARKED FOR REMOVAL
// ============================================================================
// These enums are being phased out in favor of data-driven classification

/**
 * @deprecated Use data-driven classification functions instead
 * Stellar spectral classification (Morgan-Keenan system)
 */
export enum SpectralClass {
  O = "O", // Blue, very hot
  B = "B", // Blue-white, hot
  A = "A", // White
  F = "F", // Yellow-white
  G = "G", // Yellow (like our Sun)
  K = "K", // Orange
  M = "M", // Red, cool
  L = "L", // Brown dwarf
  T = "T", // Methane brown dwarf
  Y = "Y", // Ultra-cool brown dwarf
}

/**
 * @deprecated Use data-driven classification functions instead
 * Luminosity class (Yerkes classification)
 */
export enum LuminosityClass {
  I = "I", // Supergiants
  II = "II", // Bright giants
  III = "III", // Giants
  IV = "IV", // Subgiants
  V = "V", // Main sequence (dwarfs)
  VI = "VI", // Subdwarfs
  VII = "VII", // White dwarfs
}

/**
 * @deprecated Use data-driven classification functions instead
 * Special spectral classes for peculiar stars
 */
export enum SpecialSpectralClass {
  W = "W", // Wolf-Rayet
  C = "C", // Carbon star
  S = "S", // S-type star
  D = "D", // White dwarf
  Q = "Q", // Novae
  P = "P", // Planetary nebula central star
  R = "R", // Carbon star (old classification)
  N = "N", // Carbon star (old classification)
}

// ============================================================================
// MAIN SEQUENCE SPECTRAL CLASSIFICATION
// ============================================================================

/**
 * Spectral classification - ONLY for main sequence stars
 * Other stellar types have their spectral properties determined from physical data
 */
export enum MainSequenceSpectralClass {
  O = "O", // Blue, very hot (30,000-50,000 K)
  B = "B", // Blue-white, hot (10,000-30,000 K)
  A = "A", // White (7,500-10,000 K)
  F = "F", // Yellow-white (6,000-7,500 K)
  G = "G", // Yellow like our Sun (5,200-6,000 K)
  K = "K", // Orange (3,700-5,200 K)
  M = "M", // Red, cool (2,400-3,700 K)
}

/**
 * Brown dwarf spectral classes (separate from main sequence)
 */
export enum BrownDwarfSpectralClass {
  L = "L", // 1,300-2,400 K
  T = "T", // 500-1,300 K
  Y = "Y", // <500 K
}

// ============================================================================
// STELLAR PHYSICAL DATA INTERFACES
// ============================================================================

/**
 * Core stellar physics data - what the simulation needs
 */
export interface StellarPhysicsData {
  // Core properties for physics simulation
  mass: number; // Solar masses
  radius: number; // Solar radii
  temperature: number; // Kelvin (surface temperature)
  luminosity: number; // Solar luminosities
  metallicity: number; // [Fe/H] ratio
  age: number; // Years
  rotationPeriod: number; // Hours

  // Evolution state
  coreTemperature?: number; // Kelvin
  coreDensity?: number; // g/cm³
  hydrogenFraction?: number; // Fraction of hydrogen remaining
  heliumFraction?: number; // Fraction of helium

  // For remnants
  magneticFieldStrength?: number; // Tesla (for neutron stars/pulsars)
  schwarzschildRadius?: number; // km (for black holes)
}

/**
 * Stellar rendering/visual data - what the renderer needs
 */
export interface StellarRenderingData {
  // Visual properties
  color: {
    r: number;
    g: number;
    b: number;
  };

  // Lighting properties
  lightIntensity: number;
  lightColor: {
    r: number;
    g: number;
    b: number;
  };

  // Visual effects
  coronaSize?: number;
  prominenceActivity?: number;
  surfaceActivity?: number;

  // Texture/material hints for renderer
  surfaceTextureType?: string;
  atmosphereType?: string;

  // Special effects
  accretionDisk?: boolean;
  gravitationalLensing?: boolean;
}

// NOTE: Classification functions have been moved to
// packages/systems/procedural-generation/src/generators/stars/stellar-classification-functions.ts
