import type {
  CelestialSpecificPropertiesUnion,
  GasGiantProperties,
  PlanetProperties,
} from "@teskooano/data-types";
import {
  AtmosphereType,
  CelestialType,
  GasGiantClass,
  PlanetType,
  SurfaceType,
} from "@teskooano/data-types";
import * as CONST from "../constants";
import * as UTIL from "../utils";
import type { PlanetBaseProperties } from "./planet-type";

/**
 * Generates specific properties for a planet based on its determined type and base properties.
 *
 * @param random The seeded random function.
 * @param baseProps Base properties determined by `determinePlanetTypeAndBaseProperties`.
 * @param bodyDistanceAU Distance from the star in AU.
 * @returns The specific properties object (either PlanetProperties or GasGiantProperties).
 */
export function generatePlanetSpecificProperties(
  random: () => number,
  baseProps: PlanetBaseProperties,
  bodyDistanceAU: number, // May be needed for some property calculations
): CelestialSpecificPropertiesUnion {
  if (baseProps.planetType === CelestialType.GAS_GIANT) {
    return generateGasGiantSpecificProperties(
      random,
      baseProps,
      bodyDistanceAU,
    );
  } else {
    // Defaults to PLANET type if not GAS_GIANT
    return generateRockyPlanetSpecificProperties(random, baseProps);
  }
}

// --- Helper Functions --- //

/**
 * Generates properties specific to Gas Giants (including Ice Giants).
 */
function generateGasGiantSpecificProperties(
  random: () => number,
  baseProps: PlanetBaseProperties,
  bodyDistanceAU: number,
): GasGiantProperties {
  // Gas Giant Classification (already determined in baseProps)
  const gasGiantClass = baseProps.gasGiantClass || GasGiantClass.CLASS_I; // Default fallback

  // Determine Atmosphere-related properties based on zone/class
  let atmComposition: string[];
  let atmPressure: number;
  let atmosphereColor: string;
  let cloudColor: string;
  let cloudSpeed: number;
  let atmosphereType: AtmosphereType; // Keep track of the determined type

  if (bodyDistanceAU < 2.5) {
    // Inner Zone (Hot Jupiter)
    atmosphereType = AtmosphereType.VERY_DENSE;
    atmComposition = ["H2", "He", "Na", "K"];
    atmPressure = 10 + random() * 100;
    atmosphereColor = UTIL.getRandomItem(
      CONST.ATMOSPHERE_COLORS[AtmosphereType.VERY_DENSE],
      random,
    );
    cloudColor = UTIL.getRandomItem(["#E0E0E0", "#D8D8D8", "#F5F5F5"], random);
    cloudSpeed = 0.05 + random() * 0.1;
  } else if (bodyDistanceAU < 8) {
    // Mid Zone (Typical Gas Giant)
    atmosphereType = AtmosphereType.NORMAL;
    atmComposition = ["H2", "He", "CH4", "NH3"];
    atmPressure = 1 + random() * 10;
    atmosphereColor = UTIL.getRandomItem(
      ["#E0C0A0", "#D8B898", "#F0D0B0"],
      random,
    );
    cloudColor = UTIL.getRandomItem(["#FFFFFF", "#F0F0F0", "#FEFEFE"], random);
    cloudSpeed = random() * 0.1;
  } else {
    // Outer Zone (Ice Giant - Classes III, IV)
    atmosphereType = AtmosphereType.THIN;
    atmComposition = ["H2", "He", "CH4"]; // Maybe add H2O ice later
    atmPressure = 0.1 + random() * 1;
    atmosphereColor = UTIL.getRandomItem(
      ["#A0C0E0", "#B0D0F0", "#98B8D8"],
      random,
    );
    cloudColor = UTIL.getRandomItem(["#D0E0F0", "#E0F0FF", "#C8D8E8"], random);
    cloudSpeed = random() * 0.05;
  }

  return {
    type: CelestialType.GAS_GIANT,
    gasGiantClass: gasGiantClass,
    atmosphere: {
      composition: atmComposition,
      pressure: atmPressure,
      type: atmosphereType,
    },
    atmosphereColor: atmosphereColor,
    cloudColor: cloudColor,
    cloudSpeed: cloudSpeed,
  };
}

/**
 * Generates properties specific to Rocky/Planet types.
 */
function generateRockyPlanetSpecificProperties(
  random: () => number,
  baseProps: PlanetBaseProperties,
): PlanetProperties {
  let rockyPlanetType: PlanetType;
  let surfaceType: SurfaceType;
  let composition: string[];

  // Determine specific rocky type based on zone
  if (baseProps.rockyPlanetType === PlanetType.ICE) {
    // Outer Icy Rocky was pre-determined
    rockyPlanetType = PlanetType.ICE;
    surfaceType = UTIL.getRandomItem(
      [SurfaceType.CRATERED, SurfaceType.FLAT, SurfaceType.ICE_FLATS],
      random,
    );
    composition = CONST.ICE_COMPOSITION;
  } else {
    // Inner Rocky - choose from various types
    rockyPlanetType = UTIL.getRandomItem(
      [
        PlanetType.ROCKY,
        PlanetType.TERRESTRIAL,
        PlanetType.DESERT,
        PlanetType.LAVA,
        PlanetType.BARREN,
      ],
      random,
    );
    surfaceType = UTIL.getRandomItem(
      [
        SurfaceType.CRATERED,
        SurfaceType.MOUNTAINOUS,
        SurfaceType.VOLCANIC,
        SurfaceType.FLAT,
        SurfaceType.CANYONOUS,
      ],
      random,
    );
    composition = UTIL.getRandomItem(CONST.ROCKY_COMPOSITION, random).split(
      ",",
    );
  }

  // Determine Atmosphere (more likely in inner zone)
  const hasAtmosphere =
    baseProps.rockyPlanetType === PlanetType.ICE
      ? random() < 0.1
      : random() < 0.6;
  let atmosphereType = AtmosphereType.NONE;
  let atmosphereColor: string | undefined = undefined;
  let atmComposition: string[] = [];
  let pressure: number = 0;
  let cloudProps: PlanetProperties["clouds"] = undefined;

  if (hasAtmosphere) {
    if (baseProps.rockyPlanetType === PlanetType.ICE) {
      atmosphereType = AtmosphereType.THIN;
      pressure = random() * 0.1;
    } else {
      atmosphereType = UTIL.getRandomItem(
        [AtmosphereType.THIN, AtmosphereType.NORMAL, AtmosphereType.DENSE],
        random,
      );
      pressure =
        atmosphereType === AtmosphereType.THIN
          ? random() * 0.5
          : atmosphereType === AtmosphereType.NORMAL
            ? 0.5 + random() * 1.0
            : 1.5 + random() * 5;
    }
    atmosphereColor = UTIL.getRandomItem(
      CONST.ATMOSPHERE_COLORS[atmosphereType],
      random,
    );
    atmComposition = UTIL.getRandomItem(
      CONST.ATMOSPHERE_COMPOSITION[atmosphereType],
      random,
    );

    // Generate cloud properties
    const cloudTypeKey = rockyPlanetType === PlanetType.ICE ? "ICE" : "ROCKY"; // Simplified key for now
    cloudProps = {
      color: UTIL.getRandomItem(CONST.CLOUD_COLORS[cloudTypeKey], random),
      opacity:
        atmosphereType === AtmosphereType.THIN
          ? 0.3 + random() * 0.2
          : atmosphereType === AtmosphereType.NORMAL
            ? 0.5 + random() * 0.3
            : 0.7 + random() * 0.2,
      coverage:
        atmosphereType === AtmosphereType.THIN
          ? 0.1 + random() * 0.3
          : atmosphereType === AtmosphereType.NORMAL
            ? 0.4 + random() * 0.4
            : 0.7 + random() * 0.3,
      speed:
        atmosphereType === AtmosphereType.THIN
          ? 0.1 + random() * 0.2
          : atmosphereType === AtmosphereType.NORMAL
            ? 0.5 + random() * 0.5
            : 0.8 + random() * 0.7,
    };
  }

  // Generate detailed surface properties
  const detailedSurface = UTIL.createDetailedSurfaceProperties(
    random,
    rockyPlanetType,
    surfaceType,
  );

  return {
    type: CelestialType.PLANET,
    planetType: rockyPlanetType,
    isMoon: false,
    composition: composition,
    surface: detailedSurface,
    atmosphere: hasAtmosphere
      ? {
          composition: atmComposition,
          pressure: pressure,
          color: atmosphereColor!, // Non-null assertion as it's set if hasAtmosphere is true
          density: UTIL.getRandomInRange(
            CONST.ATMOSPHERE_DENSITY_RANGES[atmosphereType].min,
            CONST.ATMOSPHERE_DENSITY_RANGES[atmosphereType].max,
            random,
          ),
        }
      : undefined,
    clouds: cloudProps, // Assign generated cloud properties
  };
}
