import { OSVector3 } from "@teskooano/core-math";
import type {
  CelestialObject,
  OrbitalParameters,
  StarProperties,
} from "@teskooano/data-types";
import {
  CelestialStatus,
  CelestialType,
  LuminosityClass,
  SCALE,
  SpecialSpectralClass,
  SpectralClass,
  StellarType,
} from "@teskooano/data-types";
import * as CONST from "../constants";
import { generateCelestialName } from "../name-generator";
import * as UTIL from "../utils";

// --- Physical Constants (Add G and C) ---
const G = 6.6743e-11; // Gravitational constant (m^3 kg^-1 s^-2)
const C = 299792458; // Speed of light (m/s)

// --- Constants for Star Generation ---

// Weighted list of stellar types
const STELLAR_TYPE_WEIGHTS: { type: StellarType; weight: number }[] = [
  { type: StellarType.MAIN_SEQUENCE, weight: 70 },
  { type: StellarType.WHITE_DWARF, weight: 15 },
  { type: StellarType.NEUTRON_STAR, weight: 5 },
  { type: StellarType.BLACK_HOLE, weight: 5 },
  { type: StellarType.WOLF_RAYET, weight: 5 },
];

// Approximate Main Sequence Relationships (Mass in Solar Masses)
// Returns [Radius (Solar Radii), Temperature (K)]
function getMainSequenceProperties(mass: number): [number, number] {
  let radius, temp;

  if (mass < 0.4) {
    radius = Math.pow(mass, 0.8);
    temp = 2400 + (mass / 0.4) * (3700 - 2400);
  } else if (mass < 0.8) {
    radius = Math.pow(mass, 0.7);
    temp = 3700 + ((mass - 0.4) / 0.4) * (5200 - 3700);
  } else if (mass < 1.05) {
    radius = Math.pow(mass, 0.6);
    temp = 5200 + ((mass - 0.8) / 0.25) * (6000 - 5200);
  } else if (mass < 1.4) {
    radius = Math.pow(mass, 0.55);
    temp = 6000 + ((mass - 1.05) / 0.35) * (7500 - 6000);
  } else if (mass < 3) {
    radius = Math.pow(mass, 0.5);
    temp = 7500 + ((mass - 1.4) / 1.6) * (10000 - 7500);
  } else if (mass < 16) {
    radius = Math.pow(mass, 0.45);
    temp = 10000 + ((mass - 3) / 13) * (30000 - 10000);
  } else {
    radius = Math.pow(mass, 0.4);
    temp = 30000 + ((mass - 16) / 40) * (50000 - 30000);
  }

  return [radius, temp];
}

// Function to calculate Schwarzschild radius for black holes
function calculateSchwarzschildRadius(mass_kg: number): number {
  return (2 * G * mass_kg) / (C * C);
}

// Default orbital parameters for a central star (stationary)
const defaultStarOrbit: OrbitalParameters = {
  realSemiMajorAxis_m: 0,
  eccentricity: 0,
  inclination: 0,
  longitudeOfAscendingNode: 0,
  argumentOfPeriapsis: 0,
  meanAnomaly: 0,
  period_s: 0,
};

// Increase star visual scale for all stars to make them easier to see
// This doesn't affect physics, only visual appearance
const STAR_VISUAL_SCALE_MULTIPLIER = 50.0; // Increased from 1.0 to make stars visibly larger

/**
 * Generates the primary star for the system.
 * @param random The seeded random function.
 * @returns The generated star's data.
 */
export function generateStar(random: () => number): CelestialObject {
  const starName = generateCelestialName(random);

  // 1. Determine Stellar Type
  const totalWeight = STELLAR_TYPE_WEIGHTS.reduce(
    (sum, item) => sum + item.weight,
    0
  );
  let roll = random() * totalWeight;
  let chosenType = StellarType.MAIN_SEQUENCE; // Default
  for (const item of STELLAR_TYPE_WEIGHTS) {
    if (roll < item.weight) {
      chosenType = item.type;
      break;
    }
    roll -= item.weight;
  }

  // 2. Generate Type-Specific Parameters
  let starMass_Solar: number;
  let starRadius_Solar: number;
  let starTemperature: number;

  switch (chosenType) {
    case StellarType.WHITE_DWARF:
      starMass_Solar = 0.1 + random() * 1.3; // 0.1 - 1.4 M☉
      starRadius_Solar =
        (0.005 + random() * 0.01) *
        (CONST.EARTH_RADIUS_M / CONST.SOLAR_RADIUS_M); // ~0.005 - 0.015 R☉ (Earth Radius approx)
      starTemperature = 8000 + random() * 50000; // Hot remnants (8000K - 58000K+)
      break;

    case StellarType.NEUTRON_STAR:
      starMass_Solar = 1.1 + random() * 1.4; // 1.1 - 2.5 M☉
      // Fixed: Convert km properly to solar radii (previous version was dividing value in meters by SOLAR_RADIUS_M)
      const neutronStarRadiusKm = 10 + random() * 10; // 10-20 km
      starRadius_Solar = (neutronStarRadiusKm * 1000) / CONST.SOLAR_RADIUS_M; // Convert km to meters, then to solar radii
      starTemperature = 500000 + random() * 500000; // Extremely hot initially (500,000K - 1,000,000K)
      break;

    case StellarType.BLACK_HOLE:
      starMass_Solar = 3 + random() * 47; // 3 - 50 M☉
      // Radius is the Schwarzschild radius
      starRadius_Solar =
        calculateSchwarzschildRadius(starMass_Solar * CONST.SOLAR_MASS_KG) /
        CONST.SOLAR_RADIUS_M;
      starTemperature = 2.7; // Close to CMB temperature
      break;

    case StellarType.WOLF_RAYET:
      starMass_Solar = 20 + random() * 60; // 20 - 80 M☉ (Typical range)
      starRadius_Solar = 5 + random() * 15; // 5 - 20 R☉ (Approximate)
      starTemperature = 30000 + random() * 170000; // 30,000K - 200,000K (Very hot)
      break;

    case StellarType.MAIN_SEQUENCE:
    default:
      // Skew towards lower mass stars (more common)
      const massRoll = random();

      if (massRoll < 0.7) {
        starMass_Solar = 0.1 + random() * 0.7; // 70% chance 0.1-0.8 M☉ (M/K)
      } else if (massRoll < 0.9) {
        starMass_Solar = 0.8 + random() * 0.6; // 20% chance 0.8-1.4 M☉ (G/F)
      } else if (massRoll < 0.98) {
        starMass_Solar = 1.4 + random() * 8.6; // 8% chance 1.4-10 M☉ (A/B)
      } else {
        starMass_Solar = 10 + random() * 40; // 2% chance 10-50 M☉ (O/B)
      }

      [starRadius_Solar, starTemperature] =
        getMainSequenceProperties(starMass_Solar);

      // First determine spectral class so we can use it for radius validation
      const prelimSpectralClass = UTIL.getSpectralClass(starTemperature);

      // Validate main sequence star radius to ensure it's properly sized

      // B-type stars should be 3-8 solar radii, A-type 1.5-3 solar radii
      if (prelimSpectralClass === "B" && starRadius_Solar < 3) {
        starRadius_Solar = Math.max(3, starRadius_Solar * 10);
      } else if (prelimSpectralClass === "A" && starRadius_Solar < 1.5) {
        starRadius_Solar = Math.max(1.5, starRadius_Solar * 5);
      }

      chosenType = StellarType.MAIN_SEQUENCE; // Ensure type is set
      break;
  }

  // Convert to SI units
  const starMass = starMass_Solar * CONST.SOLAR_MASS_KG;
  let realStarRadius = starRadius_Solar * CONST.SOLAR_RADIUS_M;

  // Calculate visual radius using SCALE.SIZE and multiplier
  let visualStarRadius =
    realStarRadius * SCALE.SIZE * STAR_VISUAL_SCALE_MULTIPLIER;

  // 3. Calculate Derived Properties
  const starLuminosity = UTIL.calculateLuminosity(
    starRadius_Solar,
    starTemperature
  );
  let mainSpectralClass = UTIL.getSpectralClass(starTemperature);
  let specialSpectralClass: SpecialSpectralClass | undefined = undefined;
  let luminosityClass = LuminosityClass.V; // Default to main sequence
  // Keep a string representation for display and renderer matching
  let spectralClassString: string;
  const starColor = UTIL.getStarColor(starTemperature);

  // Adjust spectral class for non-main sequence stars to avoid confusion
  if (chosenType === StellarType.WHITE_DWARF) {
    specialSpectralClass = SpecialSpectralClass.D;
    // Create string representation (e.g., "GD" for G-type white dwarf)
    spectralClassString = `${mainSpectralClass}${specialSpectralClass}`;
  } else if (chosenType === StellarType.NEUTRON_STAR) {
    // Neutron stars don't use the main spectral class system
    specialSpectralClass = SpecialSpectralClass.P; // Pulsar-like
    spectralClassString = specialSpectralClass;
    // Keep mainSpectralClass as SpectralClass.M, but we'll ignore it for display
    // this avoids undefined value issues
  } else if (chosenType === StellarType.MAIN_SEQUENCE) {
    // For main sequence stars, add the luminosity class (V for main sequence)
    spectralClassString = `${mainSpectralClass}${luminosityClass}`;
  } else if (chosenType === StellarType.BLACK_HOLE) {
    // Black holes don't have a standard spectral class in the same way
    specialSpectralClass = undefined; // Or create a specific 'X' if needed in SpecialSpectralClass enum
    mainSpectralClass = SpectralClass.M; // WORKAROUND: Assign default to satisfy linter
    luminosityClass = LuminosityClass.V; // WORKAROUND: Assign default to satisfy linter
    spectralClassString = "X"; // Use 'X' for exotic/black hole
  } else if (chosenType === StellarType.WOLF_RAYET) {
    specialSpectralClass = SpecialSpectralClass.W; // Already exists
    mainSpectralClass = SpectralClass.M; // WORKAROUND: Assign default to satisfy linter
    luminosityClass = LuminosityClass.I; // Typically supergiants/very luminous
    spectralClassString = `${specialSpectralClass}${
      luminosityClass ? luminosityClass : ""
    }`.replace("I", ""); // e.g., W
  } else {
    // Default case (should ideally not be hit if all types covered)
    spectralClassString = mainSpectralClass as string;
  }

  // Final validation - ensure star radius matches spectral class expectations
  // This is a safety check to catch any stars with incorrect radius after all calculations
  let correctedRadius = realStarRadius;
  let correctedRadius_Solar = starRadius_Solar;

  // Set minimum radii for each spectral class (in solar radii)
  const minRadii: Record<SpectralClass, number> = {
    [SpectralClass.O]: 6.6, // O-type stars: 6.6+ solar radii
    [SpectralClass.B]: 3.0, // B-type stars: 3.0+ solar radii
    [SpectralClass.A]: 1.5, // A-type stars: 1.5+ solar radii
    [SpectralClass.F]: 1.15, // F-type stars: 1.15+ solar radii
    [SpectralClass.G]: 0.85, // G-type stars: 0.85+ solar radii
    [SpectralClass.K]: 0.65, // K-type stars: 0.65+ solar radii
    [SpectralClass.M]: 0.4, // M-type stars: 0.4+ solar radii
    [SpectralClass.L]: 0.2, // Brown dwarfs
    [SpectralClass.T]: 0.1, // Brown dwarfs
    [SpectralClass.Y]: 0.05, // Brown dwarfs
  };

  // If star is a main sequence star and radius is too small, correct it
  if (
    chosenType === StellarType.MAIN_SEQUENCE &&
    mainSpectralClass && // Add check for undefined mainSpectralClass
    mainSpectralClass in minRadii &&
    correctedRadius_Solar < minRadii[mainSpectralClass]
  ) {
    correctedRadius_Solar = minRadii[mainSpectralClass];
    correctedRadius = correctedRadius_Solar * CONST.SOLAR_RADIUS_M;

    console.warn(
      `[StarGen Debug] Correcting undersized ${mainSpectralClass}-type star final radius: ` +
        `${(realStarRadius / 1000).toFixed(0)} km -> ${(
          correctedRadius / 1000
        ).toFixed(0)} km`
    );

    // Re-calculate visual radius with the corrected real radius
    const correctedVisualRadius =
      correctedRadius * SCALE.SIZE * STAR_VISUAL_SCALE_MULTIPLIER;

    // Update real and visual radius
    realStarRadius = correctedRadius;
    visualStarRadius = correctedVisualRadius;
  } else {
    console.warn(
      `[StarGen Debug] Star radius validation passed or not applicable`
    );
  }

  const starProperties: StarProperties = {
    type: CelestialType.STAR,
    isMainStar: true,
    spectralClass: spectralClassString,
    mainSpectralClass: mainSpectralClass, // Can be undefined for non-main-sequence
    specialSpectralClass: specialSpectralClass,
    luminosityClass: luminosityClass,
    luminosity: chosenType === StellarType.BLACK_HOLE ? 0 : starLuminosity, // Black holes have no luminosity
    color: chosenType === StellarType.BLACK_HOLE ? "#000000" : starColor, // Black holes are black
    stellarType: chosenType,
  };

  const star: CelestialObject = {
    id: `star-${starName.toLowerCase()}`,
    name: starName,
    type: CelestialType.STAR,
    status: CelestialStatus.ACTIVE,
    parentId: undefined,
    realMass_kg: starMass,
    realRadius_m: realStarRadius,
    temperature: starTemperature,
    orbit: defaultStarOrbit,
    properties: starProperties,
    physicsStateReal: {
      id: `star-${starName.toLowerCase()}`,
      mass_kg: starMass,
      position_m: new OSVector3(0, 0, 0),
      velocity_mps: new OSVector3(0, 0, 0),
    },
  };

  return star;
}
