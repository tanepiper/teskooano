// ============================================================================
// STELLAR CLASSIFICATION FUNCTIONS
// ============================================================================
// Functions for data-driven stellar classification
// Types/interfaces are imported from @teskooano/data-types

import {
  StellarType,
  MainSequenceSpectralClass,
  BrownDwarfSpectralClass,
} from "../../../../../data/types/src/celestials/common/stellar-classification";

import type {
  StellarPhysicsData,
  StellarRenderingData,
} from "../../../../../data/types/src/celestials/common/stellar-classification";

// ============================================================================
// DATA-DRIVEN CLASSIFICATION FUNCTIONS
// ============================================================================

/**
 * Determines luminosity class from stellar physical data
 */
export function determineLuminosityClass(
  physicsData: StellarPhysicsData,
  stellarType: StellarType,
): string {
  const { mass, radius, luminosity } = physicsData;

  // Calculate surface gravity log(g)
  const surfaceGravity = Math.log10(
    (mass * 1.989e33) / (radius * 6.96e10) ** 2 / 9.81,
  );

  switch (stellarType) {
    case StellarType.MAIN_SEQUENCE:
      if (surfaceGravity > 4.0) return "V"; // Main sequence dwarf
      if (surfaceGravity > 3.5) return "VI"; // Subdwarf
      return "V";

    case StellarType.SUBGIANT:
      return "IV";

    case StellarType.RED_GIANT:
    case StellarType.BLUE_GIANT:
      return "III";

    case StellarType.SUPERGIANT:
      if (luminosity > 100000) return "I"; // Supergiant
      return "II"; // Bright giant

    case StellarType.HYPERGIANT:
      return "0"; // Hypergiant (sometimes written as "0" or "I+")

    case StellarType.WHITE_DWARF:
      return "VII";

    case StellarType.WOLF_RAYET:
      return "I"; // Wolf-Rayet stars are typically very luminous

    case StellarType.CARBON_STAR:
      return "III"; // Carbon stars are typically giants

    case StellarType.VARIABLE_STAR:
      // Variable stars can be various luminosity classes, determine from physical properties
      if (luminosity > 10000) return "I"; // Supergiant variables (like Cepheids)
      if (luminosity > 100) return "III"; // Giant variables
      return "V"; // Main sequence variables

    case StellarType.PROTOSTAR:
      return "V-"; // Pre-main sequence, sometimes written as V- or "PMS"

    case StellarType.T_TAURI:
      return "V-"; // Pre-main sequence

    case StellarType.HERBIG_AE_BE:
      return "V-"; // Pre-main sequence intermediate mass

    default:
      return "Unknown";
  }
}

/**
 * Determines spectral class from physical data for main sequence stars
 */
export function determineMainSequenceSpectralClass(
  temperature: number,
): MainSequenceSpectralClass | null {
  if (temperature >= 30000) return MainSequenceSpectralClass.O;
  if (temperature >= 10000) return MainSequenceSpectralClass.B;
  if (temperature >= 7500) return MainSequenceSpectralClass.A;
  if (temperature >= 6000) return MainSequenceSpectralClass.F;
  if (temperature >= 5200) return MainSequenceSpectralClass.G;
  if (temperature >= 3700) return MainSequenceSpectralClass.K;
  if (temperature >= 2400) return MainSequenceSpectralClass.M;
  return null; // Too cool for main sequence
}

/**
 * Determines brown dwarf spectral class from temperature
 */
export function determineBrownDwarfSpectralClass(
  temperature: number,
): BrownDwarfSpectralClass | null {
  if (temperature >= 1300 && temperature < 2400)
    return BrownDwarfSpectralClass.L;
  if (temperature >= 500 && temperature < 1300)
    return BrownDwarfSpectralClass.T;
  if (temperature < 500) return BrownDwarfSpectralClass.Y;
  return null;
}

/**
 * Determines black hole subtype from physical data
 */
export function determineBlackHoleCharacteristics(
  physicsData: StellarPhysicsData,
): {
  massCategory: "stellar" | "intermediate" | "supermassive" | "primordial";
  rotationType: "kerr" | "schwarzschild";
} {
  const { mass } = physicsData;

  let massCategory: "stellar" | "intermediate" | "supermassive" | "primordial";
  if (mass < 100) massCategory = "stellar";
  else if (mass < 100000) massCategory = "intermediate";
  else if (mass >= 100000) massCategory = "supermassive";
  else massCategory = "primordial"; // For very small primordial black holes

  // Simplified rotation determination - in reality this would need angular momentum data
  const rotationType =
    physicsData.rotationPeriod && physicsData.rotationPeriod > 0
      ? "kerr"
      : "schwarzschild";

  return { massCategory, rotationType };
}

/**
 * Determines white dwarf atmospheric composition from physical data
 */
export function determineWhiteDwarfType(
  physicsData: StellarPhysicsData,
  composition?: {
    hydrogen?: number;
    helium?: number;
    carbon?: number;
    metals?: number;
  },
): string {
  if (!composition) return "DX"; // Unclassified

  const { hydrogen = 0, helium = 0, carbon = 0, metals = 0 } = composition;

  if (hydrogen > 0.5) return "DA"; // Hydrogen atmosphere
  if (helium > 0.5) return "DB"; // Helium atmosphere
  if (carbon > 0.1) return "DQ"; // Carbon features
  if (metals > 0.1) return "DZ"; // Metal lines only
  if (physicsData.temperature > 45000) return "DO"; // Very hot, ionized helium

  return "DC"; // No strong lines
}

// ============================================================================
// STELLAR FACTORY FUNCTIONS
// ============================================================================

/**
 * Creates a main sequence star with proper classification
 */
export function createMainSequenceStar(
  physicsData: StellarPhysicsData,
  renderingData: StellarRenderingData,
): {
  stellarType: StellarType;
  spectralClass: MainSequenceSpectralClass | null;
  luminosityClass: string;
  physicsData: StellarPhysicsData;
  renderingData: StellarRenderingData;
} {
  return {
    stellarType: StellarType.MAIN_SEQUENCE,
    spectralClass: determineMainSequenceSpectralClass(physicsData.temperature),
    luminosityClass: determineLuminosityClass(
      physicsData,
      StellarType.MAIN_SEQUENCE,
    ),
    physicsData,
    renderingData,
  };
}

/**
 * Creates a stellar remnant with proper classification
 */
export function createStellarRemnant(
  remnantType: StellarType,
  physicsData: StellarPhysicsData,
  renderingData: StellarRenderingData,
  additionalData?: any,
): {
  stellarType: StellarType;
  characteristics: any;
  physicsData: StellarPhysicsData;
  renderingData: StellarRenderingData;
} {
  let characteristics: any = {};

  switch (remnantType) {
    case StellarType.WHITE_DWARF:
      characteristics = {
        atmosphericType: determineWhiteDwarfType(
          physicsData,
          additionalData?.composition,
        ),
        luminosityClass: "VII",
      };
      break;

    case StellarType.NEUTRON_STAR:
      characteristics = {
        isPulsar:
          additionalData?.rotationPeriod && additionalData.rotationPeriod < 10,
        isMagnetar:
          physicsData.magneticFieldStrength &&
          physicsData.magneticFieldStrength > 1e11,
      };
      break;

    case StellarType.BLACK_HOLE:
      characteristics = determineBlackHoleCharacteristics(physicsData);
      break;
  }

  return {
    stellarType: remnantType,
    characteristics,
    physicsData,
    renderingData,
  };
}

/**
 * Creates an evolved star (giants, supergiants, Wolf-Rayet, etc.) with proper classification
 */
export function createEvolvedStar(
  evolvedType: StellarType,
  physicsData: StellarPhysicsData,
  renderingData: StellarRenderingData,
  additionalData?: any,
): {
  stellarType: StellarType;
  spectralClass: string | null;
  luminosityClass: string;
  characteristics?: any;
  physicsData: StellarPhysicsData;
  renderingData: StellarRenderingData;
} {
  let spectralClass: string | null = null;
  let characteristics: any = {};

  switch (evolvedType) {
    case StellarType.RED_GIANT:
    case StellarType.BLUE_GIANT:
    case StellarType.SUPERGIANT:
    case StellarType.HYPERGIANT:
    case StellarType.SUBGIANT:
      // Determine spectral class from temperature for evolved stars
      spectralClass =
        determineMainSequenceSpectralClass(physicsData.temperature) || "M";
      break;

    case StellarType.WOLF_RAYET:
      spectralClass = "W"; // Wolf-Rayet special spectral class
      characteristics = {
        windVelocity: 1000 + Math.random() * 2000, // km/s
        massLossRate: 1e-5 + Math.random() * 1e-4, // Solar masses per year
      };
      break;

    case StellarType.CARBON_STAR:
      spectralClass = "C"; // Carbon star special spectral class
      characteristics = {
        carbonToOxygenRatio: 1.1 + Math.random() * 0.5, // C/O > 1 for carbon stars
        carbonFeatures: true,
      };
      break;

    case StellarType.VARIABLE_STAR:
      spectralClass =
        determineMainSequenceSpectralClass(physicsData.temperature) || "M";
      characteristics = {
        variablePeriod: additionalData?.variablePeriod || 1,
        variableAmplitude: additionalData?.variableAmplitude || 0.5,
        variableType: "Cepheid", // Could be made more sophisticated
      };
      break;
  }

  return {
    stellarType: evolvedType,
    spectralClass,
    luminosityClass: determineLuminosityClass(physicsData, evolvedType),
    characteristics,
    physicsData,
    renderingData,
  };
}

/**
 * Creates a pre-main sequence star with proper classification
 */
export function createPreMainSequenceStar(
  preMainType: StellarType,
  physicsData: StellarPhysicsData,
  renderingData: StellarRenderingData,
  additionalData?: any,
): {
  stellarType: StellarType;
  spectralClass: string | null;
  luminosityClass: string;
  characteristics: any;
  physicsData: StellarPhysicsData;
  renderingData: StellarRenderingData;
} {
  let spectralClass: string | null = null;
  let characteristics: any = {};

  switch (preMainType) {
    case StellarType.PROTOSTAR:
      spectralClass = null; // Protostars don't have well-defined spectral classes
      characteristics = {
        isContractingOntoMainSequence: true,
        accretionRate: additionalData?.accretionRate || 1e-7,
        evolutionStage: "Class 0/I",
      };
      break;

    case StellarType.T_TAURI:
      spectralClass =
        determineMainSequenceSpectralClass(physicsData.temperature) || "M";
      characteristics = {
        isPreMainSequence: true,
        stellarWindRate: additionalData?.stellarWind || 1e-7,
        hasAccretionDisk: Math.random() > 0.5,
        evolutionStage: "Classical T Tauri",
      };
      break;

    case StellarType.HERBIG_AE_BE:
      // Herbig Ae/Be stars are A or B type temperatures
      if (physicsData.temperature >= 10000) {
        spectralClass = "B";
      } else {
        spectralClass = "A";
      }
      characteristics = {
        isPreMainSequence: true,
        hasAccretionDisk: additionalData?.accretionDisk || true,
        evolutionStage: "Herbig Ae/Be",
      };
      break;
  }

  return {
    stellarType: preMainType,
    spectralClass,
    luminosityClass: determineLuminosityClass(physicsData, preMainType),
    characteristics,
    physicsData,
    renderingData,
  };
}
