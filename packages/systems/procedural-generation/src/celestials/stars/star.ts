import { OSVector3 } from "@teskooano/core-math";
import {
  CelestialStatus,
  CelestialType,
  SCALE,
  StellarType,
  type StellarPhysicsData,
  type StellarRenderingData,
  CelestialObject,
  OrbitalParameters,
  StarProperties,
} from "@teskooano/data-types";
import * as CONST from "../../constants";
import { generateCelestialName } from "../names/celestial-name";
import * as UTIL from "../../utils";
import { stellarClassifier } from "./stellar-classification-functions";

const G = 6.6743e-11;
const C = 299792458;

const STELLAR_TYPE_WEIGHTS: {
  type: StellarType;
  weight: number;
}[] = [
  // Still common but not overwhelming
  { type: StellarType.MAIN_SEQUENCE, weight: 35 },

  // Much more exciting evolved states
  { type: StellarType.RED_GIANT, weight: 15 },
  { type: StellarType.WHITE_DWARF, weight: 10 },
  { type: StellarType.SUPERGIANT, weight: 8 },
  { type: StellarType.BLUE_GIANT, weight: 6 },

  // Action-packed exotic types
  { type: StellarType.BLACK_HOLE, weight: 5 },
  { type: StellarType.NEUTRON_STAR, weight: 4 },
  { type: StellarType.WOLF_RAYET, weight: 4 },
  { type: StellarType.HYPERGIANT, weight: 3 },

  // Interesting evolved and variable stars
  { type: StellarType.VARIABLE_STAR, weight: 3 },
  { type: StellarType.CARBON_STAR, weight: 2 },
  { type: StellarType.SUBGIANT, weight: 2 },

  // Pre-main sequence drama
  { type: StellarType.PROTOSTAR, weight: 2 },
  { type: StellarType.T_TAURI, weight: 1 },
  { type: StellarType.HERBIG_AE_BE, weight: 1 },
];

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

function calculateSchwarzschildRadius(mass_kg: number): number {
  return (2 * G * mass_kg) / (C * C);
}

const defaultStarOrbit: OrbitalParameters = {
  realSemiMajorAxis_m: 0,
  eccentricity: 0,
  inclination: 0,
  longitudeOfAscendingNode: 0,
  argumentOfPeriapsis: 0,
  meanAnomaly: 0,
  period_s: 0,
};

const STAR_VISUAL_SCALE_MULTIPLIER = 50.0;

/**
 * Generates the primary star for the system using data-driven classification.
 * @param random The seeded random function.
 * @returns The generated star's data.
 */
export function generateStar(random: () => number): CelestialObject {
  const starName = generateCelestialName(random);

  // Select stellar type using weighted random selection
  const totalWeight = STELLAR_TYPE_WEIGHTS.reduce(
    (sum, item) => sum + item.weight,
    0,
  );
  let roll = random() * totalWeight;
  let chosenType = StellarType.MAIN_SEQUENCE;
  for (const item of STELLAR_TYPE_WEIGHTS) {
    if (roll <= item.weight) {
      chosenType = item.type;
      break;
    }
    roll -= item.weight;
  }

  // Generate basic physical properties based on stellar type
  let starMass_Solar: number;
  let starRadius_Solar: number;
  let starTemperature: number;
  let additionalData: any = {};
  switch (chosenType) {
    case StellarType.WHITE_DWARF:
      starMass_Solar = 0.1 + random() * 1.3;
      starRadius_Solar =
        (0.005 + random() * 0.01) *
        (CONST.EARTH_RADIUS_M / CONST.SOLAR_RADIUS_M);
      starTemperature = 8000 + random() * 50000;
      // Generate atmospheric composition for white dwarf classification
      additionalData.composition = {
        hydrogen: random() > 0.5 ? 0.6 + random() * 0.3 : 0.1 + random() * 0.3,
        helium: random() * 0.4,
        carbon: random() * 0.1,
        metals: random() * 0.05,
      };
      break;

    case StellarType.NEUTRON_STAR:
      starMass_Solar = 1.1 + random() * 1.4;
      const neutronStarRadiusKm = 10 + random() * 10;
      starRadius_Solar = (neutronStarRadiusKm * 1000) / CONST.SOLAR_RADIUS_M;
      starTemperature = 500000 + random() * 500000;
      additionalData.rotationPeriod = random() * 20; // Fast rotation for pulsars
      break;

    case StellarType.BLACK_HOLE:
      starMass_Solar = 3 + random() * 47;
      starRadius_Solar =
        calculateSchwarzschildRadius(starMass_Solar * CONST.SOLAR_MASS_KG) /
        CONST.SOLAR_RADIUS_M;
      starTemperature = 2.7; // Cosmic microwave background
      break;

    case StellarType.WOLF_RAYET:
      starMass_Solar = 20 + random() * 60;
      starRadius_Solar = 5 + random() * 15;
      starTemperature = 30000 + random() * 170000;
      break;

    case StellarType.RED_GIANT:
      starMass_Solar = 0.8 + random() * 7;
      starRadius_Solar = 10 + random() * 90; // Much larger radius
      starTemperature = 3000 + random() * 2000; // Cooler surface
      break;

    case StellarType.BLUE_GIANT:
      starMass_Solar = 10 + random() * 40;
      starRadius_Solar = 5 + random() * 20;
      starTemperature = 20000 + random() * 30000; // Very hot
      break;

    case StellarType.SUPERGIANT:
      starMass_Solar = 15 + random() * 60;
      starRadius_Solar = 100 + random() * 1000; // Enormous radius
      starTemperature = 3000 + random() * 37000; // Wide temperature range
      break;

    case StellarType.HYPERGIANT:
      starMass_Solar = 50 + random() * 150;
      starRadius_Solar = 1000 + random() * 1500; // Extreme size
      starTemperature = 3000 + random() * 47000; // Very wide range
      break;

    case StellarType.SUBGIANT:
      starMass_Solar = 0.8 + random() * 3;
      starRadius_Solar = 1.2 + random() * 3; // Slightly larger than main sequence
      starTemperature = 4000 + random() * 2000; // Similar to main sequence
      break;

    case StellarType.CARBON_STAR:
      starMass_Solar = 1 + random() * 8;
      starRadius_Solar = 50 + random() * 300; // Large, evolved giant
      starTemperature = 2500 + random() * 1500; // Cool, carbon-rich atmosphere
      break;

    case StellarType.VARIABLE_STAR:
      starMass_Solar = 0.5 + random() * 10;
      starRadius_Solar = 1 + random() * 50; // Wide range depending on type
      starTemperature = 3000 + random() * 7000;
      additionalData.variablePeriod = 1 + random() * 365; // Days
      additionalData.variableAmplitude = 0.1 + random() * 2; // Magnitude variation
      break;

    case StellarType.PROTOSTAR:
      starMass_Solar = 0.1 + random() * 10;
      starRadius_Solar = 2 + random() * 10; // Large, contracting
      starTemperature = 1000 + random() * 3000; // Still forming, cool
      additionalData.accretionRate = random() * 1e-6; // Solar masses per year
      break;

    case StellarType.T_TAURI:
      starMass_Solar = 0.1 + random() * 3;
      starRadius_Solar = 1.5 + random() * 3; // Larger than main sequence equivalent
      starTemperature = 3000 + random() * 1500; // Pre-main sequence
      additionalData.stellarWind = 1e-8 + random() * 1e-6; // Strong stellar winds
      break;

    case StellarType.HERBIG_AE_BE:
      starMass_Solar = 2 + random() * 8; // Intermediate to high mass
      starRadius_Solar = 2 + random() * 5;
      starTemperature = 7000 + random() * 23000; // A and B type temperatures
      additionalData.accretionDisk = true; // Usually have disks
      break;

    case StellarType.MAIN_SEQUENCE:
    default:
      const massRoll = random();
      if (massRoll < 0.7) {
        starMass_Solar = 0.1 + random() * 0.7;
      } else if (massRoll < 0.9) {
        starMass_Solar = 0.8 + random() * 0.6;
      } else if (massRoll < 0.98) {
        starMass_Solar = 1.4 + random() * 8.6;
      } else {
        starMass_Solar = 10 + random() * 40;
      }

      [starRadius_Solar, starTemperature] =
        getMainSequenceProperties(starMass_Solar);
      chosenType = StellarType.MAIN_SEQUENCE;
      break;
  }

  // Create physics data for the star
  const starLuminosity = UTIL.calculateLuminosity(
    starRadius_Solar,
    starTemperature,
  );
  const physicsData: StellarPhysicsData = {
    mass: starMass_Solar,
    radius: starRadius_Solar,
    temperature: starTemperature,
    luminosity: chosenType === StellarType.BLACK_HOLE ? 0 : starLuminosity,
    metallicity: -0.5 + random() * 1.0, // Random metallicity between -0.5 and +0.5
    age: random() * 13.8e9, // Random age up to age of universe
    rotationPeriod: 24 + random() * 1000, // Random rotation period in hours
    ...(chosenType === StellarType.NEUTRON_STAR && {
      magneticFieldStrength: 1e8 + random() * 1e15,
    }),
    ...(chosenType === StellarType.BLACK_HOLE && {
      schwarzschildRadius:
        calculateSchwarzschildRadius(starMass_Solar * CONST.SOLAR_MASS_KG) /
        1000,
    }),
  };

  // Create rendering data for the star
  const starColor = UTIL.getStarColor(starTemperature);
  const renderingData: StellarRenderingData = {
    color: hexToRgb(
      chosenType === StellarType.BLACK_HOLE ? "#000000" : starColor,
    ),
    lightIntensity:
      chosenType === StellarType.BLACK_HOLE
        ? 0
        : Math.min(physicsData.luminosity, 100),
    lightColor: hexToRgb(starColor),
    ...(chosenType === StellarType.BLACK_HOLE && {
      accretionDisk: random() > 0.7,
      gravitationalLensing: true,
    }),
    ...(chosenType !== StellarType.BLACK_HOLE &&
      chosenType !== StellarType.WHITE_DWARF && {
        coronaSize: 1 + random() * 2,
        surfaceActivity: random(),
      }),
  };

  // Use factory functions for proper classification
  let classifiedStar: any;
  if (chosenType === StellarType.MAIN_SEQUENCE) {
    classifiedStar = stellarClassifier.createMainSequenceStar(
      physicsData,
      renderingData,
    );
  } else if (
    chosenType === StellarType.WHITE_DWARF ||
    chosenType === StellarType.NEUTRON_STAR ||
    chosenType === StellarType.BLACK_HOLE
  ) {
    // Stellar remnants
    classifiedStar = stellarClassifier.createStellarRemnant(
      chosenType,
      physicsData,
      renderingData,
      additionalData,
    );
  } else if (
    chosenType === StellarType.RED_GIANT ||
    chosenType === StellarType.BLUE_GIANT ||
    chosenType === StellarType.SUPERGIANT ||
    chosenType === StellarType.HYPERGIANT ||
    chosenType === StellarType.SUBGIANT ||
    chosenType === StellarType.WOLF_RAYET ||
    chosenType === StellarType.CARBON_STAR ||
    chosenType === StellarType.VARIABLE_STAR
  ) {
    // Evolved stars
    classifiedStar = stellarClassifier.createEvolvedStar(
      chosenType,
      physicsData,
      renderingData,
      additionalData,
    );
  } else if (
    chosenType === StellarType.PROTOSTAR ||
    chosenType === StellarType.T_TAURI ||
    chosenType === StellarType.HERBIG_AE_BE
  ) {
    // Pre-main sequence stars
    classifiedStar = stellarClassifier.createPreMainSequenceStar(
      chosenType,
      physicsData,
      renderingData,
      additionalData,
    );
  } else {
    // Fallback for any unhandled types
    classifiedStar = {
      stellarType: chosenType,
      spectralClass: null,
      luminosityClass: "Unknown",
      physicsData,
      renderingData,
    };
  }

  // Convert to CelestialObject format for compatibility
  const starMass = physicsData.mass * CONST.SOLAR_MASS_KG;
  const realStarRadius = physicsData.radius * CONST.SOLAR_RADIUS_M;
  const visualStarRadius =
    realStarRadius * SCALE.SIZE * STAR_VISUAL_SCALE_MULTIPLIER;

  // Build computed spectral classification string
  let spectralClassString: string;
  if (classifiedStar.spectralClass && classifiedStar.luminosityClass) {
    // Combine spectral class + luminosity class (e.g., "G2V", "M3III")
    spectralClassString = `${classifiedStar.spectralClass}${classifiedStar.luminosityClass}`;
  } else if (classifiedStar.spectralClass) {
    // Just spectral class for special types (e.g., "W", "C")
    spectralClassString = classifiedStar.spectralClass;
  } else {
    // Fallback based on stellar type
    switch (chosenType) {
      case StellarType.BLACK_HOLE:
        spectralClassString = "X";
        break;
      case StellarType.NEUTRON_STAR:
        spectralClassString = "P";
        break;
      case StellarType.WHITE_DWARF:
        spectralClassString =
          classifiedStar.characteristics?.atmosphericType || "D";
        break;
      default:
        spectralClassString = UTIL.getSpectralClass(starTemperature);
    }
  }

  const starProperties: StarProperties = {
    type: CelestialType.STAR,
    isMainStar: true,
    spectralClass: spectralClassString,
    luminosity: physicsData.luminosity,
    color: rgbToHex(renderingData.color),
    stellarType: chosenType,
    characteristics: classifiedStar.characteristics || {},
    timeOffset: random() * 1000.0,
    shaderUniforms: {
      baseStar: {
        coronaIntensity: 1,
        pulseSpeed: 0.5,
        glowIntensity: 1,
        temperatureVariation: 0.2,
        metallicEffect: 0.1,
        noiseEvolutionSpeed: 0.05,
      },
      corona: {
        opacity: 0.5,
        pulseSpeed: 0.7,
        noiseScale: 1,
        noiseEvolutionSpeed: 1.0,
      },
    },
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

// Helper functions
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255,
      }
    : { r: 1, g: 1, b: 1 };
}

function rgbToHex(rgb: { r: number; g: number; b: number }): string {
  const toHex = (n: number) =>
    Math.round(n * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}
