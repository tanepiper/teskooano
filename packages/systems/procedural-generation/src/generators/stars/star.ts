import { OSVector3 } from "@teskooano/core-math";
import type {
  CelestialObject,
  OrbitalParameters,
  StarProperties,
  SystemLightingProperties,
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
import * as CONST from "../../constants";
import { generateCelestialName } from "../names/celestial-name";
import * as UTIL from "../../utils";

const G = 6.6743e-11;
const C = 299792458;

/**
 * Realistic stellar type distribution based on Milky Way statistics
 * Main sequence stars dominate (~95%), with evolved stars being much rarer
 */
const STELLAR_TYPE_WEIGHTS: { type: StellarType; weight: number }[] = [
  { type: StellarType.MAIN_SEQUENCE, weight: 95.2 }, // Vast majority are main sequence
  { type: StellarType.WHITE_DWARF, weight: 3.5 },   // Common stellar remnants
  { type: StellarType.WOLF_RAYET, weight: 0.8 },    // Rare massive evolved stars
  { type: StellarType.NEUTRON_STAR, weight: 0.4 },  // Very rare stellar remnants
  { type: StellarType.BLACK_HOLE, weight: 0.1 },    // Extremely rare
];

/**
 * Enhanced main sequence mass-radius-temperature relationships
 * Based on stellar structure models and observational data
 */
function getMainSequenceProperties(mass: number): [number, number] {
  let radius, temp;

  // Very low mass stars (M-dwarfs, red dwarfs)
  if (mass < 0.08) {
    // Brown dwarf territory - not quite stars
    radius = Math.pow(mass / 0.08, 0.8) * 0.1;
    temp = 1800 + (mass / 0.08) * (2300 - 1800);
  } else if (mass < 0.3) {
    // Very low mass M-dwarfs
    radius = Math.pow(mass / 0.3, 0.8) * 0.3;
    temp = 2300 + ((mass - 0.08) / 0.22) * (3200 - 2300);
  } else if (mass < 0.5) {
    // Low mass M-dwarfs
    radius = Math.pow(mass / 0.5, 0.75) * 0.5;
    temp = 3200 + ((mass - 0.3) / 0.2) * (3700 - 3200);
  } else if (mass < 0.8) {
    // High mass M-dwarfs to K-dwarfs
    radius = Math.pow(mass / 0.8, 0.7) * 0.8;
    temp = 3700 + ((mass - 0.5) / 0.3) * (5200 - 3700);
  } else if (mass < 1.0) {
    // K-dwarfs to G-dwarfs (like our Sun)
    radius = Math.pow(mass, 0.6);
    temp = 5200 + ((mass - 0.8) / 0.2) * (5778 - 5200);
  } else if (mass < 1.3) {
    // G-dwarfs to early F-dwarfs
    radius = Math.pow(mass, 0.55);
    temp = 5778 + ((mass - 1.0) / 0.3) * (6500 - 5778);
  } else if (mass < 1.8) {
    // F-dwarfs
    radius = Math.pow(mass, 0.5);
    temp = 6500 + ((mass - 1.3) / 0.5) * (7500 - 6500);
  } else if (mass < 3.0) {
    // A-dwarfs
    radius = Math.pow(mass, 0.45);
    temp = 7500 + ((mass - 1.8) / 1.2) * (10000 - 7500);
  } else if (mass < 8.0) {
    // Early A to B-dwarfs
    radius = Math.pow(mass, 0.4);
    temp = 10000 + ((mass - 3.0) / 5.0) * (20000 - 10000);
  } else if (mass < 20.0) {
    // B-dwarfs to early O-dwarfs
    radius = Math.pow(mass, 0.35);
    temp = 20000 + ((mass - 8.0) / 12.0) * (35000 - 20000);
  } else {
    // Massive O-type stars
    radius = Math.pow(mass, 0.3);
    temp = 35000 + ((mass - 20.0) / 100.0) * (50000 - 35000);
  }

  return [radius, temp];
}

/**
 * Realistic stellar mass distribution based on Initial Mass Function (IMF)
 * Heavily weighted toward lower mass stars (Salpeter/Kroupa IMF)
 */
function generateRealisticStellarMass(random: () => number): number {
  const roll = random();
  
  // Based on Kroupa IMF - most stars are low mass
  if (roll < 0.85) {
    // M-dwarfs (0.08 - 0.6 solar masses) - most common
    return 0.08 + Math.pow(random(), 2.5) * 0.52;
  } else if (roll < 0.95) {
    // K and G dwarfs (0.6 - 1.2 solar masses)
    return 0.6 + Math.pow(random(), 1.8) * 0.6;
  } else if (roll < 0.98) {
    // F and A stars (1.2 - 3.0 solar masses)
    return 1.2 + Math.pow(random(), 1.5) * 1.8;
  } else if (roll < 0.995) {
    // B stars (3.0 - 15.0 solar masses)
    return 3.0 + Math.pow(random(), 1.2) * 12.0;
  } else {
    // O stars (15.0 - 120.0 solar masses) - extremely rare
    return 15.0 + Math.pow(random(), 0.8) * 105.0;
  }
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

/**
 * More reasonable visual scale for stars to balance visibility with realism
 */
const STAR_VISUAL_SCALE_MULTIPLIER = 25.0;

/**
 * Generates scientifically accurate stellar data with realistic properties
 * based on stellar evolution models and observational astronomy
 */
export function generateStar(random: () => number): CelestialObject {
  const starName = generateCelestialName(random);

  const totalWeight = STELLAR_TYPE_WEIGHTS.reduce(
    (sum, item) => sum + item.weight,
    0,
  );
  let roll = random() * totalWeight;
  let chosenType = StellarType.MAIN_SEQUENCE;
  for (const item of STELLAR_TYPE_WEIGHTS) {
    if (roll < item.weight) {
      chosenType = item.type;
      break;
    }
    roll -= item.weight;
  }

  let starMass_Solar: number;
  let starRadius_Solar: number;
  let starTemperature: number;

  switch (chosenType) {
    case StellarType.WHITE_DWARF:
      // White dwarfs: 0.3-1.4 solar masses, Earth-sized, very hot
      starMass_Solar = 0.3 + random() * 1.1; // Chandrasekhar limit ~1.4
      starRadius_Solar = 0.008 + random() * 0.012; // Earth-sized (~0.01 solar radii)
      starTemperature = 5000 + random() * 100000; // 5,000K to 150,000K
      break;

    case StellarType.NEUTRON_STAR:
      // Neutron stars: 1.1-2.3 solar masses, ~20km diameter, extremely hot
      starMass_Solar = 1.1 + random() * 1.2; // Tolman-Oppenheimer-Volkoff limit ~2.3
      const neutronStarRadiusKm = 10 + random() * 15; // 10-25 km typical
      starRadius_Solar = (neutronStarRadiusKm * 1000) / CONST.SOLAR_RADIUS_M;
      starTemperature = 600000 + random() * 1400000; // 0.6-2 million K surface
      break;

    case StellarType.BLACK_HOLE:
      // Stellar black holes: 3-50 solar masses typically
      starMass_Solar = 3 + random() * 47; // Stellar mass black holes
      starRadius_Solar = calculateSchwarzschildRadius(starMass_Solar * CONST.SOLAR_MASS_KG) / CONST.SOLAR_RADIUS_M;
      starTemperature = 2.7; // CMB temperature (no surface)
      break;

    case StellarType.WOLF_RAYET:
      // Wolf-Rayet stars: 5-50 solar masses, compact, very hot
      starMass_Solar = 5 + random() * 45; // Typically 5-50 solar masses
      starRadius_Solar = 0.5 + random() * 4.5; // Very compact for their mass
      starTemperature = 30000 + random() * 170000; // 30,000-200,000K
      break;

    case StellarType.MAIN_SEQUENCE:
    default:
      // Use realistic mass distribution
      starMass_Solar = generateRealisticStellarMass(random);
      [starRadius_Solar, starTemperature] = getMainSequenceProperties(starMass_Solar);
      chosenType = StellarType.MAIN_SEQUENCE;
      break;
  }

  const starMass = starMass_Solar * CONST.SOLAR_MASS_KG;
  let realStarRadius = starRadius_Solar * CONST.SOLAR_RADIUS_M;
  let visualStarRadius = realStarRadius * SCALE.SIZE * STAR_VISUAL_SCALE_MULTIPLIER;

  const starLuminosity = UTIL.calculateVisualLuminosity(realStarRadius, starTemperature);
  let mainSpectralClass = UTIL.getSpectralClass(starTemperature);
  let specialSpectralClass: SpecialSpectralClass | undefined = undefined;
  let luminosityClass = LuminosityClass.V; // Main sequence default

  let spectralClassString: string;
  const starColor = UTIL.getStarColor(starTemperature);

  // Set appropriate spectral classifications
  if (chosenType === StellarType.WHITE_DWARF) {
    specialSpectralClass = SpecialSpectralClass.D;
    luminosityClass = LuminosityClass.VII; // White dwarf luminosity class
    spectralClassString = `${mainSpectralClass}${specialSpectralClass}${luminosityClass}`;
  } else if (chosenType === StellarType.NEUTRON_STAR) {
    specialSpectralClass = SpecialSpectralClass.P; // Pulsar designation
    spectralClassString = specialSpectralClass;
  } else if (chosenType === StellarType.MAIN_SEQUENCE) {
    // Assign luminosity class based on mass (evolutionary state)
    if (starMass_Solar > 15) {
      luminosityClass = LuminosityClass.V; // Still main sequence but could be Ib
    } else if (starMass_Solar > 8) {
      luminosityClass = LuminosityClass.V; // Main sequence
    } else {
      luminosityClass = LuminosityClass.V; // Dwarf stars
    }
    spectralClassString = `${mainSpectralClass}${luminosityClass}`;
  } else if (chosenType === StellarType.BLACK_HOLE) {
    spectralClassString = "BH"; // Black hole designation
  } else if (chosenType === StellarType.WOLF_RAYET) {
    specialSpectralClass = SpecialSpectralClass.W;
    // Wolf-Rayet subtypes: WN (nitrogen), WC (carbon), WO (oxygen)
    const wrSubtype = random() < 0.6 ? "WN" : random() < 0.8 ? "WC" : "WO";
    spectralClassString = wrSubtype;
  } else {
    spectralClassString = mainSpectralClass as string;
  }

  // Calculate realistic system lighting based on stellar properties
  const clampedLuminosity = Math.max(0.001, Math.min(starLuminosity, 10000));
  const starLightIntensity = Math.pow(clampedLuminosity, 0.25); // Fourth root for more reasonable scaling
  const ambientLightIntensity = Math.max(0.1, Math.min(starLightIntensity * 0.15, 0.6));

  const systemLighting: SystemLightingProperties = {
    ambientLightColor: starColor,
    ambientLightIntensity: parseFloat(ambientLightIntensity.toFixed(3)),
    starLightIntensity: parseFloat(starLightIntensity.toFixed(2)),
  };

  // Apply realistic minimum radii for spectral classes
  const minRadii: Record<SpectralClass, number> = {
    [SpectralClass.O]: 6.6,   // O-type giants
    [SpectralClass.B]: 1.8,   // B-type dwarfs
    [SpectralClass.A]: 1.4,   // A-type dwarfs
    [SpectralClass.F]: 1.15,  // F-type dwarfs
    [SpectralClass.G]: 0.85,  // G-type dwarfs (like Sun)
    [SpectralClass.K]: 0.65,  // K-type dwarfs
    [SpectralClass.M]: 0.1,   // M-type dwarfs (very small)
    [SpectralClass.L]: 0.08,  // Brown dwarfs
    [SpectralClass.T]: 0.08,  // Brown dwarfs
    [SpectralClass.Y]: 0.08,  // Brown dwarfs
  };

  let correctedRadius = realStarRadius;
  let correctedRadius_Solar = starRadius_Solar;

  if (
    chosenType === StellarType.MAIN_SEQUENCE &&
    mainSpectralClass &&
    mainSpectralClass in minRadii &&
    correctedRadius_Solar < minRadii[mainSpectralClass]
  ) {
    correctedRadius_Solar = minRadii[mainSpectralClass];
    correctedRadius = correctedRadius_Solar * CONST.SOLAR_RADIUS_M;
    visualStarRadius = correctedRadius * SCALE.SIZE * STAR_VISUAL_SCALE_MULTIPLIER;
  }

  const starProperties: StarProperties = {
    type: CelestialType.STAR,
    isMainStar: true,
    spectralClass: spectralClassString,
    luminosity: starLuminosity,
    color: starColor,
    stellarType: chosenType,
    mainSpectralClass: mainSpectralClass as SpectralClass,
    luminosityClass,
    specialSpectralClass,
    systemLighting,
  };

  const starData: CelestialObject = {
    id: `${starProperties.spectralClass}-${starName}`,
    name: starName,
    type: CelestialType.STAR,
    status: CelestialStatus.ACTIVE,
    parentId: undefined,
    realMass_kg: starMass,
    realRadius_m: correctedRadius,
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

  return starData;
}
