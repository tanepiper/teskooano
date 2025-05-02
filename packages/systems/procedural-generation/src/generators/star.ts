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

const G = 6.6743e-11;
const C = 299792458;

const STELLAR_TYPE_WEIGHTS: { type: StellarType; weight: number }[] = [
  { type: StellarType.MAIN_SEQUENCE, weight: 70 },
  { type: StellarType.WHITE_DWARF, weight: 15 },
  { type: StellarType.NEUTRON_STAR, weight: 5 },
  { type: StellarType.BLACK_HOLE, weight: 5 },
  { type: StellarType.WOLF_RAYET, weight: 5 },
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
 * Generates the primary star for the system.
 * @param random The seeded random function.
 * @returns The generated star's data.
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
      starMass_Solar = 0.1 + random() * 1.3;
      starRadius_Solar =
        (0.005 + random() * 0.01) *
        (CONST.EARTH_RADIUS_M / CONST.SOLAR_RADIUS_M);
      starTemperature = 8000 + random() * 50000;
      break;

    case StellarType.NEUTRON_STAR:
      starMass_Solar = 1.1 + random() * 1.4;

      const neutronStarRadiusKm = 10 + random() * 10;
      starRadius_Solar = (neutronStarRadiusKm * 1000) / CONST.SOLAR_RADIUS_M;
      starTemperature = 500000 + random() * 500000;
      break;

    case StellarType.BLACK_HOLE:
      starMass_Solar = 3 + random() * 47;

      starRadius_Solar =
        calculateSchwarzschildRadius(starMass_Solar * CONST.SOLAR_MASS_KG) /
        CONST.SOLAR_RADIUS_M;
      starTemperature = 2.7;
      break;

    case StellarType.WOLF_RAYET:
      starMass_Solar = 20 + random() * 60;
      starRadius_Solar = 5 + random() * 15;
      starTemperature = 30000 + random() * 170000;
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

      const prelimSpectralClass = UTIL.getSpectralClass(starTemperature);

      if (prelimSpectralClass === "B" && starRadius_Solar < 3) {
        starRadius_Solar = Math.max(3, starRadius_Solar * 10);
      } else if (prelimSpectralClass === "A" && starRadius_Solar < 1.5) {
        starRadius_Solar = Math.max(1.5, starRadius_Solar * 5);
      }

      chosenType = StellarType.MAIN_SEQUENCE;
      break;
  }

  const starMass = starMass_Solar * CONST.SOLAR_MASS_KG;
  let realStarRadius = starRadius_Solar * CONST.SOLAR_RADIUS_M;

  let visualStarRadius =
    realStarRadius * SCALE.SIZE * STAR_VISUAL_SCALE_MULTIPLIER;

  const starLuminosity = UTIL.calculateLuminosity(
    starRadius_Solar,
    starTemperature,
  );
  let mainSpectralClass = UTIL.getSpectralClass(starTemperature);
  let specialSpectralClass: SpecialSpectralClass | undefined = undefined;
  let luminosityClass = LuminosityClass.V;

  let spectralClassString: string;
  const starColor = UTIL.getStarColor(starTemperature);

  if (chosenType === StellarType.WHITE_DWARF) {
    specialSpectralClass = SpecialSpectralClass.D;

    spectralClassString = `${mainSpectralClass}${specialSpectralClass}`;
  } else if (chosenType === StellarType.NEUTRON_STAR) {
    specialSpectralClass = SpecialSpectralClass.P;
    spectralClassString = specialSpectralClass;
  } else if (chosenType === StellarType.MAIN_SEQUENCE) {
    spectralClassString = `${mainSpectralClass}${luminosityClass}`;
  } else if (chosenType === StellarType.BLACK_HOLE) {
    specialSpectralClass = undefined;
    mainSpectralClass = SpectralClass.M;
    luminosityClass = LuminosityClass.V;
    spectralClassString = "X";
  } else if (chosenType === StellarType.WOLF_RAYET) {
    specialSpectralClass = SpecialSpectralClass.W;
    mainSpectralClass = SpectralClass.M;
    luminosityClass = LuminosityClass.I;
    spectralClassString = `${specialSpectralClass}${
      luminosityClass ? luminosityClass : ""
    }`.replace("I", "");
  } else {
    spectralClassString = mainSpectralClass as string;
  }

  let correctedRadius = realStarRadius;
  let correctedRadius_Solar = starRadius_Solar;

  const minRadii: Record<SpectralClass, number> = {
    [SpectralClass.O]: 6.6,
    [SpectralClass.B]: 3.0,
    [SpectralClass.A]: 1.5,
    [SpectralClass.F]: 1.15,
    [SpectralClass.G]: 0.85,
    [SpectralClass.K]: 0.65,
    [SpectralClass.M]: 0.4,
    [SpectralClass.L]: 0.2,
    [SpectralClass.T]: 0.1,
    [SpectralClass.Y]: 0.05,
  };

  if (
    chosenType === StellarType.MAIN_SEQUENCE &&
    mainSpectralClass &&
    mainSpectralClass in minRadii &&
    correctedRadius_Solar < minRadii[mainSpectralClass]
  ) {
    correctedRadius_Solar = minRadii[mainSpectralClass];
    correctedRadius = correctedRadius_Solar * CONST.SOLAR_RADIUS_M;

    console.warn(
      `[StarGen Debug] Correcting undersized ${mainSpectralClass}-type star final radius: ` +
        `${(realStarRadius / 1000).toFixed(0)} km -> ${(
          correctedRadius / 1000
        ).toFixed(0)} km`,
    );

    const correctedVisualRadius =
      correctedRadius * SCALE.SIZE * STAR_VISUAL_SCALE_MULTIPLIER;

    realStarRadius = correctedRadius;
    visualStarRadius = correctedVisualRadius;
  } else {
    console.warn(
      `[StarGen Debug] Star radius validation passed or not applicable`,
    );
  }

  const starProperties: StarProperties = {
    type: CelestialType.STAR,
    isMainStar: true,
    spectralClass: spectralClassString,
    mainSpectralClass: mainSpectralClass,
    specialSpectralClass: specialSpectralClass,
    luminosityClass: luminosityClass,
    luminosity: chosenType === StellarType.BLACK_HOLE ? 0 : starLuminosity,
    color: chosenType === StellarType.BLACK_HOLE ? "#000000" : starColor,
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
