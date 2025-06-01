import type {
  CelestialSpecificPropertiesUnion,
  GasGiantProperties,
  PlanetProperties,
  PlanetAtmosphereProperties,
} from "@teskooano/data-types";
import {
  AtmosphereType,
  CelestialType,
  GasGiantClass,
  PlanetType,
  SurfaceType,
  CompositionType,
} from "@teskooano/data-types";
import * as CONST from "../../constants";
import * as UTIL from "../../utils";
import type { PlanetBaseProperties } from "./planet-type";
import { ProceduralSurfaceProperties } from "@teskooano/data-types";

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
 * Generates properties specific to Gas Giants (including Ice Giants).
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
 * Generates properties specific to Rocky/Planet types.
 */
function generateRockyPlanetSpecificProperties(
  random: () => number,
  baseProps: PlanetBaseProperties,
): PlanetProperties {
  let rockyPlanetType: PlanetType;
  let surfaceType: SurfaceType;
  let planetComposition: string[];

  if (baseProps.rockyPlanetType === PlanetType.ICE) {
    rockyPlanetType = PlanetType.ICE;
    surfaceType = UTIL.getRandomItem(
      [SurfaceType.CRATERED, SurfaceType.SMOOTH_PLAINS, SurfaceType.ICE_PLAINS],
      random,
    );
    planetComposition = [...CONST.ICE_COMPOSITION];
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
        SurfaceType.MOUNTAINS,
        SurfaceType.VOLCANIC,
        SurfaceType.SMOOTH_PLAINS,
        SurfaceType.CANYONS,
        SurfaceType.VARIED,
      ],
      random,
    );
    const baseRockyComp = UTIL.getRandomItem(CONST.ROCKY_COMPOSITION, random);
    planetComposition = typeof baseRockyComp === 'string' ? baseRockyComp.split(",") : [...baseRockyComp];
  }

  let hasAtmosphereProperty: boolean;
  switch (baseProps.rockyPlanetType) {
    case PlanetType.TERRESTRIAL:
      hasAtmosphereProperty = true;
      break;
    case PlanetType.BARREN:
      hasAtmosphereProperty = false;
      break;
    case PlanetType.ICE:
      hasAtmosphereProperty = random() < 0.1;
      break;
    case PlanetType.ROCKY:
    case PlanetType.DESERT:
    case PlanetType.LAVA:
    default:
      hasAtmosphereProperty = random() < 0.6;
      break;
  }
  console.log(hasAtmosphereProperty);

  let atmosphereType = AtmosphereType.NONE;
  let atmosphereColor: string | undefined = undefined;
  let atmCompositionStrings: string[] = [];
  let pressure: number = 0;
  let cloudProps: PlanetProperties["clouds"] = undefined;
  let atmosphereRenderingProps: PlanetAtmosphereProperties | undefined = undefined;

  if (hasAtmosphereProperty) {
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
      CONST.ATMOSPHERE_COLORS[atmosphereType] || ["#87CEEB"],
      random,
    );
    atmCompositionStrings = UTIL.getRandomItem(
      CONST.ATMOSPHERE_COMPOSITION[atmosphereType] || [["Nitrogen", "Oxygen"]],
      random,
    );

    planetComposition.push(...atmCompositionStrings.map(gas => `${gas} atmosphere`));

    atmosphereRenderingProps = {
      glowColor: atmosphereColor || "#87CEEB",
      intensity: UTIL.getRandomInRange(0.4, 0.8, random),
      power: UTIL.getRandomInRange(1.0, 1.5, random),
      thickness: UTIL.getRandomInRange(0.1, 0.3, random),
    };

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

  let proceduralSurfaceParams: ProceduralSurfaceProperties;
  switch (rockyPlanetType) {
    case PlanetType.BARREN:
    case PlanetType.ROCKY:
    case PlanetType.TERRESTRIAL:
    case PlanetType.ICE:
    case PlanetType.DESERT:
    case PlanetType.LAVA:
      proceduralSurfaceParams = UTIL.createProceduralSurfaceProperties(
        random,
        rockyPlanetType,
      );
      break;
    default:
      console.warn(
        `Unhandled rocky planet type: ${rockyPlanetType}. Using TERRESTRIAL defaults for procedural surface.`,
      );
      proceduralSurfaceParams = UTIL.createProceduralSurfaceProperties(
        random,
        PlanetType.TERRESTRIAL,
      );
      break;
  }

  let surfaceComposition: CompositionType[];
  switch (rockyPlanetType) {
    case PlanetType.TERRESTRIAL:
      surfaceComposition = [CompositionType.SILICATE, CompositionType.WATER_ICE, CompositionType.ORGANIC];
      break;
    case PlanetType.ROCKY:
      surfaceComposition = [CompositionType.SILICATE, CompositionType.IRON, CompositionType.CARBON];
      break;
    case PlanetType.BARREN:
      surfaceComposition = [CompositionType.SILICATE, CompositionType.DUST];
      break;
    case PlanetType.DESERT:
      surfaceComposition = [CompositionType.SILICATE, CompositionType.IRON, CompositionType.DUST];
      break;
    case PlanetType.ICE:
      surfaceComposition = [CompositionType.WATER_ICE, CompositionType.AMMONIA_ICE, CompositionType.METHANE_ICE];
      break;
    case PlanetType.LAVA:
      surfaceComposition = [CompositionType.SILICATE, CompositionType.IRON, CompositionType.CARBON];
      break;
    default:
      surfaceComposition = [CompositionType.SILICATE];
      break;
  }

  const finalSurfaceProperties = {
    ...proceduralSurfaceParams,
    type: surfaceType,
    surfaceType: surfaceType,
    composition: surfaceComposition,
    planetType: rockyPlanetType,
    color: proceduralSurfaceParams.color2 || "#808080",
  };

  const finalPlanetProperties: PlanetProperties = {
    type: CelestialType.PLANET,
    planetType: rockyPlanetType,
    isMoon: false,
    composition: planetComposition,
    surface: finalSurfaceProperties,
    atmosphere: atmosphereRenderingProps,
    clouds: undefined,
  };
  console.log(finalPlanetProperties);
  return finalPlanetProperties;
}

/**
 * Generates the actual atmospheric properties (glow, intensity, etc.)
 * for rendering, typically used in the top-level `CelestialObject.atmosphere` field.
 *
 * This function is new and will be used in planet.ts and moon.ts.
 *
 * @param random The seeded random function.
 * @param planetAtmosphereType The descriptive type of atmosphere (e.g., THIN, NORMAL).
 * @param baseRockyPlanetType The base type of the rocky planet (e.g., TERRESTRIAL, ICE).
 * @returns PlanetAtmosphereProperties object for rendering.
 */
export function generateRenderingAtmosphereProperties(
    random: () => number,
    planetAtmosphereType: AtmosphereType,
    baseRockyPlanetType: PlanetType,
): PlanetAtmosphereProperties | undefined {
    if (planetAtmosphereType === AtmosphereType.NONE) {
        return undefined;
    }

    const availableColors = CONST.ATMOSPHERE_COLORS[planetAtmosphereType];
    let glowColor = UTIL.getRandomItem(
        availableColors && availableColors.length > 0 ? availableColors : ["#87CEEB"],
        random,
    );

    if (baseRockyPlanetType === PlanetType.LAVA) {
        glowColor = UTIL.getRandomItem(["#FF4500", "#FF6347", "#FF7F50"], random);
    } else if (baseRockyPlanetType === PlanetType.TERRESTRIAL) {
        const terrestrialColors = CONST.ATMOSPHERE_COLORS[planetAtmosphereType] || ["#87CEEB", "#ADD8E6"];
        glowColor = UTIL.getRandomItem(terrestrialColors.length > 0 ? terrestrialColors: ["#87CEEB"], random);
    }

    return {
        glowColor: glowColor || "#87CEEB",
        intensity: UTIL.getRandomInRange(0.3, 0.7, random),
        power: UTIL.getRandomInRange(1.0, 2.0, random),
        thickness: UTIL.getRandomInRange(0.05, 0.25, random),
    };
}
