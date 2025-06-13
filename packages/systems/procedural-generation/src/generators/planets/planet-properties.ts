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
import * as CONST from "../../constants";
import * as UTIL from "../../utils";
import type { PlanetBaseProperties } from "./planet-type";
import { ProceduralSurfaceProperties } from "@teskooano/data-types";
import { createProceduralSurfaceProperties } from "../../utils";

/**
 * Generates the specific properties for a planet based on its high-level type.
 *
 * This function acts as a router, delegating to either
 * `generateGasGiantSpecificProperties` or `generateRockyPlanetSpecificProperties`
 * depending on the `planetType` in the base properties.
 *
 * @param random The seeded pseudo-random number generator function.
 * @param baseProps The base properties object, which includes the determined `planetType`.
 * @param bodyDistanceAU The planet's distance from the star in AU, used for
 *   temperature-dependent properties like those of gas giants.
 * @returns A `CelestialSpecificPropertiesUnion` containing the detailed
 *   properties for either a gas giant or a rocky planet.
 */
export function generatePlanetSpecificProperties(
  random: () => number,
  baseProps: PlanetBaseProperties,
  bodyDistanceAU: number,
): CelestialSpecificPropertiesUnion {
  if (baseProps.planetType === CelestialType.GAS_GIANT) {
    return generateGasGiantSpecificProperties(
      random,
      baseProps,
      bodyDistanceAU,
    );
  } else {
    return generateRockyPlanetSpecificProperties(random, baseProps);
  }
}

/**
 * @internal
 * Generates properties specific to Gas Giants, including Ice Giants.
 *
 * It determines the atmospheric composition, pressure, color, and cloud details
 * based on the planet's distance from its star, simulating different classes of
 * gas giants (e.g., Hot Jupiters vs. cold gas giants).
 *
 * @param random The seeded pseudo-random number generator function.
 * @param baseProps The planet's base properties.
 * @param bodyDistanceAU The planet's distance from the star in AU.
 * @returns A `GasGiantProperties` object.
 */
function generateGasGiantSpecificProperties(
  random: () => number,
  baseProps: PlanetBaseProperties,
  bodyDistanceAU: number,
): GasGiantProperties {
  const gasGiantClass = baseProps.gasGiantClass || GasGiantClass.CLASS_I;

  let atmComposition: string[];
  let atmPressure: number;
  let atmosphereColor: string;
  let cloudColor: string;
  let cloudSpeed: number;
  let atmosphereType: AtmosphereType;

  if (bodyDistanceAU < 2.5) {
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
    atmosphereType = AtmosphereType.THIN;
    atmComposition = ["H2", "He", "CH4"];
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
 * @internal
 * Generates properties specific to rocky planets (e.g., Terrestrial, Ice, Lava).
 *
 * This function determines the planet's detailed surface type, composition, and
 * atmosphere. It uses a probability-based approach to decide if a planet has an
 * atmosphere and, if so, its type and characteristics (color, density, clouds).
 * It then calls `createProceduralSurfaceProperties` to generate the detailed
 * data needed for shader-based rendering.
 *
 * @param random The seeded pseudo-random number generator function.
 * @param baseProps The planet's base properties.
 * @returns A `PlanetProperties` object.
 */
function generateRockyPlanetSpecificProperties(
  random: () => number,
  baseProps: PlanetBaseProperties,
): PlanetProperties {
  let rockyPlanetType: PlanetType;
  let surfaceType: SurfaceType;
  let composition: string[];

  if (baseProps.rockyPlanetType === PlanetType.ICE) {
    rockyPlanetType = PlanetType.ICE;
    surfaceType = UTIL.getRandomItem(
      [SurfaceType.CRATERED, SurfaceType.FLAT, SurfaceType.ICE_FLATS],
      random,
    );
    composition = CONST.ICE_COMPOSITION;
  } else {
    rockyPlanetType = UTIL.getRandomItem(
      [
        PlanetType.ROCKY,
        PlanetType.TERRESTRIAL,
        PlanetType.DESERT,
        PlanetType.LAVA,
        PlanetType.BARREN,
        PlanetType.ROCKY,
        PlanetType.TERRESTRIAL,
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
        SurfaceType.VARIED,
      ],
      random,
    );
    composition = UTIL.getRandomItem(CONST.ROCKY_COMPOSITION, random).split(
      ",",
    );
  }

  // Determine if the planet has an atmosphere based on its type
  let hasAtmosphere: boolean;
  switch (baseProps.rockyPlanetType) {
    case PlanetType.TERRESTRIAL:
      hasAtmosphere = true;
    case PlanetType.BARREN:
      hasAtmosphere = false; // Barren planets never have an atmosphere
      break;
    case PlanetType.ICE:
      hasAtmosphere = random() < 0.1; // 10% chance for Ice planets
      break;
    case PlanetType.ROCKY:
    case PlanetType.DESERT:
    case PlanetType.LAVA:
    default: // Assume Terran or other rocky types suitable for atmosphere
      hasAtmosphere = random() < 0.6; // 60% chance for Terran/other
      break;
  }

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

    const cloudTypeKey = rockyPlanetType === PlanetType.ICE ? "ICE" : "ROCKY";
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

  let surfaceProperties: ProceduralSurfaceProperties;
  switch (rockyPlanetType) {
    case PlanetType.BARREN:
    case PlanetType.ROCKY:
    case PlanetType.TERRESTRIAL:
    case PlanetType.ICE:
    case PlanetType.DESERT:
    case PlanetType.LAVA:
      surfaceProperties = UTIL.createProceduralSurfaceProperties(
        random,
        rockyPlanetType,
      );
      break;
    default:
      console.warn(
        `Unhandled rocky planet type: ${rockyPlanetType}. Using TERRESTRIAL defaults.`,
      );
      surfaceProperties = UTIL.createProceduralSurfaceProperties(
        random,
        PlanetType.TERRESTRIAL,
      );
      break;
  }

  return {
    type: CelestialType.PLANET,
    planetType: rockyPlanetType,
    isMoon: false,
    composition: composition,
    surface: surfaceProperties as any,
    atmosphere: hasAtmosphere
      ? {
          glowColor: atmosphereColor || "#8899ff",
          intensity:
            atmosphereType === AtmosphereType.THIN
              ? 0.5
              : atmosphereType === AtmosphereType.NORMAL
                ? 1.0
                : 1.5,
          power:
            atmosphereType === AtmosphereType.THIN
              ? 1.5
              : atmosphereType === AtmosphereType.NORMAL
                ? 2.0
                : 2.5,
          thickness:
            atmosphereType === AtmosphereType.THIN
              ? 0.05
              : atmosphereType === AtmosphereType.NORMAL
                ? 0.1
                : 0.15,
        }
      : undefined,
    clouds: cloudProps,
  };
}
