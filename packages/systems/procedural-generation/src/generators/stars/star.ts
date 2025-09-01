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
  SpecialSpectralClass,
  SpectralClass,
  StellarType,
  BlackHoleSubtype,
  NeutronStarSubtype,
  WhiteDwarfSubtype,
  ProtostarSubtype,
} from "@teskooano/data-types";
import { generateCelestialName } from "../names/celestial-name";
import * as UTIL from "../../utils-functions";
import { createOrbitalElements } from "@teskooano/core-physics";
import {
  GRAVITATIONAL_CONSTANT,
  SPEED_OF_LIGHT,
  SOLAR_MASS,
  SOLAR_RADIUS,
  SOLAR_LUMINOSITY,
  SCALE,
} from "@teskooano/data-values";

/**
 * Realistic stellar type distribution based on Milky Way statistics
 * Main sequence stars dominate (~90%), with evolved stars being much rarer
 */
const STELLAR_TYPE_WEIGHTS: { type: StellarType; weight: number }[] = [
  { type: StellarType.MAIN_SEQUENCE, weight: 85 }, // 85% main sequence stars
  { type: StellarType.WHITE_DWARF, weight: 10 }, // 10% white dwarfs
  { type: StellarType.NEUTRON_STAR, weight: 2 }, // 2% neutron stars
  { type: StellarType.BLACK_HOLE, weight: 1 }, // 1% black holes
  { type: StellarType.WOLF_RAYET, weight: 1 }, // 1% Wolf-Rayet stars
  { type: StellarType.HYPERGIANT, weight: 0.5 }, // 0.5% hypergiants
  { type: StellarType.PROTOSTAR, weight: 0.3 }, // 0.3% protostars
  { type: StellarType.PRE_MAIN_SEQUENCE, weight: 0.2 }, // 0.2% pre-main-sequence stars
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
function generateMainSequenceMass(random: () => number): number {
  const u = random();
  const minMass = 0.08; // Stellar ignition limit
  const maxMass = 120; // Maximum stellar mass

  // Flatter power-law exponent for more variety (original was 2.3)
  const alpha = 1.5;

  const C =
    (1 - alpha) / (Math.pow(maxMass, 1 - alpha) - Math.pow(minMass, 1 - alpha));

  const mass = Math.pow(
    ((1 - alpha) / C) * u + Math.pow(minMass, 1 - alpha),
    1 / (1 - alpha),
  );

  return Math.max(minMass, Math.min(maxMass, mass));
}

function calculateSchwarzschildRadius(mass_kg: number): number {
  return (
    (2 * GRAVITATIONAL_CONSTANT * mass_kg) / (SPEED_OF_LIGHT * SPEED_OF_LIGHT)
  );
}

const defaultStarOrbit: OrbitalParameters = createOrbitalElements({
  semiMajorAxisAU: 0,
  eccentricity: 0,
  siderealRotationPeriod_s: 0,
  axialTiltDeg: 0,
  inclinationDeg: 0,
  longitudeOfAscendingNodeDeg: 0,
  argumentOfPeriapsisDeg: 0,
  meanAnomalyDeg: 0,
  period_s: 0,
});

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
      starRadius_Solar = (neutronStarRadiusKm * 1000) / SOLAR_RADIUS;
      starTemperature = 600000 + random() * 1400000; // 0.6-2 million K surface
      break;

    case StellarType.BLACK_HOLE:
      // Stellar black holes: 3-50 solar masses typically
      starMass_Solar = 3 + random() * 47; // Stellar mass black holes
      starRadius_Solar =
        calculateSchwarzschildRadius(starMass_Solar * SOLAR_MASS) /
        SOLAR_RADIUS;
      starTemperature = 2.7; // CMB temperature (no surface)
      break;

    case StellarType.WOLF_RAYET:
      // Wolf-Rayet stars: 5-50 solar masses, compact, very hot
      starMass_Solar = 5 + random() * 45; // Typically 5-50 solar masses
      starRadius_Solar = 0.5 + random() * 4.5; // Very compact for their mass
      starTemperature = 30000 + random() * 170000; // 30,000-200,000K
      break;

    case StellarType.HYPERGIANT:
      // Hypergiants: 20-100+ solar masses, very large and luminous
      starMass_Solar = 20 + random() * 80; // 20-100+ solar masses
      starRadius_Solar = 20 + random() * 80; // Very large radii
      starTemperature = 35000 + random() * 15000; // 35,000-50,000K
      break;

    case StellarType.PROTOSTAR:
      // Protostars: still accreting, not yet optically visible
      starMass_Solar = 0.1 + random() * 2.9; // 0.1-3 solar masses
      starRadius_Solar = 2 + random() * 8; // Large for their mass (still contracting)
      starTemperature = 2000 + random() * 2000; // 2,000-4,000K (cool due to dust)
      break;

    case StellarType.PRE_MAIN_SEQUENCE:
      // Pre-main-sequence stars: optically visible but not yet fusing hydrogen
      starMass_Solar = 0.1 + random() * 7.9; // 0.1-8 solar masses
      starRadius_Solar = 1 + random() * 5; // Larger than main sequence for their mass
      starTemperature = 3000 + random() * 5000; // 3,000-8,000K
      break;

    case StellarType.MAIN_SEQUENCE:
    default:
      // Use realistic mass distribution
      starMass_Solar = generateMainSequenceMass(random);
      [starRadius_Solar, starTemperature] =
        getMainSequenceProperties(starMass_Solar);
      chosenType = StellarType.MAIN_SEQUENCE;
      break;
  }

  const starMass = starMass_Solar * SOLAR_MASS;
  let realStarRadius = starRadius_Solar * SOLAR_RADIUS;
  let visualStarRadius =
    realStarRadius * SCALE.SIZE * STAR_VISUAL_SCALE_MULTIPLIER;

  // Determine subtypes for specific stellar types
  let neutronStarSubtype: NeutronStarSubtype | undefined;
  let blackHoleSubtype: BlackHoleSubtype | undefined;
  let whiteDwarfSubtype: WhiteDwarfSubtype | undefined;
  let protostarSubtype: ProtostarSubtype | undefined;

  if (chosenType === StellarType.NEUTRON_STAR) {
    // 70% pulsars, 20% standard, 10% magnetars
    const subtypeRoll = random();
    if (subtypeRoll < 0.7) {
      neutronStarSubtype = NeutronStarSubtype.PULSAR;
    } else if (subtypeRoll < 0.9) {
      neutronStarSubtype = NeutronStarSubtype.STANDARD;
    } else {
      neutronStarSubtype = NeutronStarSubtype.MAGNETAR;
    }
  } else if (chosenType === StellarType.BLACK_HOLE) {
    // 70% Kerr (rotating), 30% Schwarzschild (non-rotating)
    blackHoleSubtype =
      random() < 0.7 ? BlackHoleSubtype.KERR : BlackHoleSubtype.SCHWARZSCHILD;
  } else if (chosenType === StellarType.WHITE_DWARF) {
    // Most common white dwarf types
    const subtypeRoll = random();
    if (subtypeRoll < 0.8) {
      whiteDwarfSubtype = WhiteDwarfSubtype.DA; // Hydrogen-dominated
    } else if (subtypeRoll < 0.9) {
      whiteDwarfSubtype = WhiteDwarfSubtype.DB; // Helium-dominated
    } else {
      whiteDwarfSubtype = WhiteDwarfSubtype.DC; // Featureless
    }
  } else if (chosenType === StellarType.PRE_MAIN_SEQUENCE) {
    // 70% T Tauri (< 2 solar masses), 30% Herbig Ae/Be (2-8 solar masses)
    protostarSubtype =
      random() < 0.7 ? ProtostarSubtype.T_TAURI : ProtostarSubtype.HERBIG_AE_BE;
  }

  // Calculate luminosity in watts using Stefan-Boltzmann law
  const luminosityWatts = UTIL.calculateStellarLuminosity(
    realStarRadius,
    starTemperature,
  );

  // Convert watts to solar luminosities (L☉)
  const starLuminosity = luminosityWatts / SOLAR_LUMINOSITY;

  // Use the comprehensive thermal properties determination
  const thermalProps = UTIL.determineStarThermalProperties({
    mainSpectralClass: UTIL.getSpectralClass(starTemperature),
    stellarType: chosenType,
    neutronStarSubtype,
    blackHoleSubtype,
    whiteDwarfSubtype,
    protostarSubtype,
    currentTemperature: starTemperature,
    currentLuminosity: starLuminosity, // Now in solar units
    currentColor: UTIL.getStarColor(starTemperature),
  });

  // Use the corrected luminosity from thermal properties
  const finalStarLuminosity = thermalProps.luminosity;
  const starColor = thermalProps.color;
  let mainSpectralClass = UTIL.getSpectralClass(starTemperature);
  let specialSpectralClass: SpecialSpectralClass | undefined = undefined;
  let luminosityClass = LuminosityClass.V; // Main sequence default

  let spectralClassString: string;

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
  const clampedLuminosity = Math.max(
    0.001,
    Math.min(finalStarLuminosity, 500000),
  );
  // Use the new, more aggressive formula for consistency and to prevent blow-out.
  const starLightIntensity = Math.min(
    Math.pow(clampedLuminosity, 0.33) * 2.0,
    8.0,
  );
  // Stars should not contribute ambient lighting in dark space, but a minimum is needed for visuals
  const ambientLightIntensity = 0.01;

  const systemLighting: SystemLightingProperties = {
    ambientLightColor: starColor,
    ambientLightIntensity: ambientLightIntensity,
    starLightIntensity: parseFloat(starLightIntensity.toFixed(2)),
  };

  // Apply realistic minimum radii for spectral classes
  const minRadii: Record<SpectralClass, number> = {
    [SpectralClass.O]: 6.6, // O-type giants
    [SpectralClass.B]: 1.8, // B-type dwarfs
    [SpectralClass.A]: 1.4, // A-type dwarfs
    [SpectralClass.F]: 1.15, // F-type dwarfs
    [SpectralClass.G]: 0.85, // G-type dwarfs (like Sun)
    [SpectralClass.K]: 0.65, // K-type dwarfs
    [SpectralClass.M]: 0.1, // M-type dwarfs (very small)
    [SpectralClass.L]: 0.08, // Brown dwarfs
    [SpectralClass.T]: 0.08, // Brown dwarfs
    [SpectralClass.Y]: 0.08, // Brown dwarfs
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
    correctedRadius = correctedRadius_Solar * SOLAR_RADIUS;
    visualStarRadius =
      correctedRadius * SCALE.SIZE * STAR_VISUAL_SCALE_MULTIPLIER;
  }

  // Generate material parameters within sensible ranges based on stellar properties
  const materialParams = {
    // noiseScale: 0 to 1.2 - based on stellar activity
    noiseScale: Math.min(0.1 + finalStarLuminosity / 100, 1.2),
    // noiseIntensity: 0 to 0.5 - based on temperature and mass
    noiseIntensity: Math.min(0.05 + starTemperature / 50000, 0.5),
    // plasmaTurbulence: 0 to 2.0 - based on stellar winds and activity
    plasmaTurbulence: Math.min(0.1 + starMass_Solar / 10, 2.0),
    // lightingIntensity: 0 to 2.0 - based on luminosity
    lightingIntensity: Math.min(0.5 + finalStarLuminosity / 100, 2.0),
  };

  const starProperties: StarProperties = {
    type: CelestialType.STAR,
    isMainStar: true,
    spectralClass: spectralClassString,
    luminosity: finalStarLuminosity,
    color: starColor,
    stellarType: chosenType,
    mainSpectralClass: mainSpectralClass as SpectralClass,
    luminosityClass,
    specialSpectralClass,
    neutronStarSubtype,
    blackHoleSubtype,
    whiteDwarfSubtype,
    protostarSubtype,
    systemLighting,
    materialParams,
  };

  const starData: CelestialObject<StarProperties> = {
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
  };

  return starData;
}
