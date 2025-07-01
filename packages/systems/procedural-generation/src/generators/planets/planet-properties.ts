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
import { createProceduralSurfaceProperties } from "../../properties";

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
  if (baseProps.celestialType === CelestialType.GAS_GIANT) {
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
  const gasGiantClass = baseProps.planetType as GasGiantClass;

  if (!gasGiantClass || !Object.values(GasGiantClass).includes(gasGiantClass)) {
    // This is a critical failure in the generation pipeline.
    // It means that a celestial body was determined to be a gas giant,
    // but was not assigned a valid GasGiantClass subtype from its zone.
    throw new Error(
      `[generateGasGiantSpecificProperties] Called without a valid GasGiantClass. Received: "${gasGiantClass}". This indicates a bug in the upstream type determination logic within the CelestialZoneManager or planet-type generator.`,
    );
  }

  let atmComposition: string[];
  let atmPressure: number;
  let atmosphereColor: string;
  let cloudColor: string;
  let cloudSpeed: number;
  let atmosphereType: AtmosphereType;

  switch (gasGiantClass) {
    case GasGiantClass.CLASS_I: // Ammonia Clouds
      atmosphereType = AtmosphereType.NORMAL;
      atmComposition = ["H2", "He", "CH4", "NH3", "Tholins", "P"];
      atmPressure = 1 + random() * 10;
      atmosphereColor = UTIL.getRandomItem(
        ["#E0C0A0", "#D8B898", "#F0D0B0"],
        random,
      );
      cloudColor = UTIL.getRandomItem(
        ["#FFFFFF", "#F0F0F0", "#FEFEFE"],
        random,
      );
      cloudSpeed = random() * 0.1;
      break;

    case GasGiantClass.CLASS_II: // Water Clouds
      atmosphereType = AtmosphereType.NORMAL;
      atmComposition = ["H2", "He", "H2O", "CH4"];
      atmPressure = 5 + random() * 20;
      atmosphereColor = UTIL.getRandomItem(
        ["#D0D0E0", "#E0E0F0", "#F0F0FF"],
        random,
      );
      cloudColor = UTIL.getRandomItem(
        ["#FFFFFF", "#F0F0F0", "#E8E8E8"],
        random,
      );
      cloudSpeed = 0.05 + random() * 0.08;
      break;

    case GasGiantClass.CLASS_III: // Cloudless
      atmosphereType = AtmosphereType.DENSE;
      atmComposition = ["H2", "He", "CH4"];
      atmPressure = 10 + random() * 50;
      atmosphereColor = UTIL.getRandomItem(
        ["#4A90E2", "#3A7BC8", "#2F65A8"],
        random,
      );
      cloudColor = "transparent";
      cloudSpeed = 0;
      break;

    case GasGiantClass.CLASS_IV: // Alkali Metals
      atmosphereType = AtmosphereType.VERY_DENSE;
      atmComposition = ["H2", "He", "CO", "Na", "K", "SiO", "Fe", "TiO", "VO"];
      atmPressure = 20 + random() * 80;
      atmosphereColor = UTIL.getRandomItem(
        ["#BC8F8F", "#D2B48C", "#F5DEB3"],
        random,
      );
      cloudColor = UTIL.getRandomItem(
        ["#F5F5DC", "#FFF8DC", "#FAFAD2"],
        random,
      );
      cloudSpeed = 0.08 + random() * 0.1;
      break;

    case GasGiantClass.CLASS_V: // Silicate Clouds
      atmosphereType = AtmosphereType.VERY_DENSE;
      atmComposition = ["H2", "He", "CO", "SiO", "Fe"];
      atmPressure = 50 + random() * 150;
      atmosphereColor = UTIL.getRandomItem(
        ["#BDB76B", "#F0E68C", "#FFF5EE"],
        random,
      );
      cloudColor = UTIL.getRandomItem(
        ["#E0E0E0", "#D8D8D8", "#F5F5F5"],
        random,
      );
      cloudSpeed = 0.1 + random() * 0.15;
      break;

    default: // Fallback to Class I
      atmosphereType = AtmosphereType.NORMAL;
      atmComposition = ["H2", "He", "CH4", "NH3", "Tholins", "P"];
      atmPressure = 1 + random() * 10;
      atmosphereColor = UTIL.getRandomItem(
        ["#E0C0A0", "#D8B898", "#F0D0B0"],
        random,
      );
      cloudColor = UTIL.getRandomItem(
        ["#FFFFFF", "#F0F0F0", "#FEFEFE"],
        random,
      );
      cloudSpeed = random() * 0.1;
      break;
  }

  return {
    type: CelestialType.GAS_GIANT,
    planetType: gasGiantClass,
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
  const rockyPlanetType = baseProps.planetType as PlanetType;
  let surfaceType: SurfaceType;
  let composition: string[];

  // Handle gas giant types that might appear in rocky planet generation
  // This occurs when moons of gas giants are generated
  if (Object.values(GasGiantClass).includes(rockyPlanetType as any)) {
    // For gas giant moons, use ice composition as they're typically icy
    surfaceType = UTIL.getRandomItem(
      [SurfaceType.CRATERED, SurfaceType.FLAT, SurfaceType.ICE_FLATS],
      random,
    );
    composition = CONST.ICE_COMPOSITION;
  } else if (rockyPlanetType === PlanetType.ICE) {
    surfaceType = UTIL.getRandomItem(
      [SurfaceType.CRATERED, SurfaceType.FLAT, SurfaceType.ICE_FLATS],
      random,
    );
    composition = CONST.ICE_COMPOSITION;
  } else if (rockyPlanetType === PlanetType.OCEAN) {
    // Ocean worlds have varied surface types
    surfaceType = UTIL.getRandomItem(
      [SurfaceType.FLAT, SurfaceType.VARIED, SurfaceType.CRATERED],
      random,
    );
    composition = ["water", "rock", "ice", "salts"];
  } else if (rockyPlanetType === ("METALLIC" as any)) {
    // Metallic planets (iron-rich worlds)
    surfaceType = UTIL.getRandomItem(
      [SurfaceType.CRATERED, SurfaceType.MOUNTAINOUS, SurfaceType.FLAT],
      random,
    );
    composition = ["iron", "nickel", "silicates", "sulfides"];
  } else {
    // Standard rocky planets
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
  switch (baseProps.planetType) {
    case PlanetType.BARREN:
      hasAtmosphere = false; // Barren planets never have an atmosphere
      break;
    case PlanetType.ICE:
      hasAtmosphere = random() < 0.1; // 10% chance for Ice planets
      break;
    case PlanetType.OCEAN:
    case PlanetType.LAVA:
    case PlanetType.DESERT:
    case PlanetType.TERRESTRIAL:
      hasAtmosphere = true; // Ocean planets always have an atmosphere
      break;
    case "METALLIC" as any:
      hasAtmosphere = random() < 0.3; // 30% chance for Metallic planets
      break;
    case PlanetType.ROCKY:

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
    if (baseProps.planetType === PlanetType.ICE) {
      atmosphereType = AtmosphereType.THIN;
      pressure = random() * 0.1;
    } else if (baseProps.planetType === PlanetType.OCEAN) {
      // Ocean worlds typically have thick atmospheres
      atmosphereType = UTIL.getRandomItem(
        [AtmosphereType.NORMAL, AtmosphereType.DENSE],
        random,
      );
      pressure =
        atmosphereType === AtmosphereType.NORMAL
          ? 0.5 + random() * 1.0
          : 1.5 + random() * 3;
    } else if (baseProps.planetType === ("METALLIC" as any)) {
      // Metallic planets have thin, exotic atmospheres
      atmosphereType = AtmosphereType.THIN;
      pressure = random() * 0.3;
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

    // Enhanced atmospheric composition based on planet type
    if (baseProps.planetType === PlanetType.OCEAN) {
      atmComposition = UTIL.getRandomItem(
        [
          ["N2", "O2", "H2O"],
          ["CO2", "H2O"],
          ["N2", "H2O", "Ar"],
        ],
        random,
      );
    } else if (baseProps.planetType === ("METALLIC" as any)) {
      atmComposition = UTIL.getRandomItem(
        [
          ["Na", "K", "Fe"],
          ["SiO", "Fe", "Mg"],
          ["Ca", "Al", "O2"],
        ],
        random,
      );
    } else {
      atmComposition = UTIL.getRandomItem(
        CONST.ATMOSPHERE_COMPOSITION[atmosphereType],
        random,
      );
    }

    // Enhanced cloud properties based on planet type
    const cloudTypeKey =
      rockyPlanetType === PlanetType.ICE
        ? "ICE"
        : rockyPlanetType === PlanetType.OCEAN
          ? "OCEAN"
          : rockyPlanetType === ("METALLIC" as any)
            ? "ROCKY"
            : "ROCKY";

    cloudProps = {
      color: UTIL.getRandomItem(CONST.CLOUD_COLORS[cloudTypeKey], random),
      opacity:
        atmosphereType === AtmosphereType.THIN
          ? 0.3 + random() * 0.2
          : atmosphereType === AtmosphereType.NORMAL
            ? 0.5 + random() * 0.3
            : 0.7 + random() * 0.2,
      coverage:
        baseProps.planetType === PlanetType.OCEAN
          ? 0.7 + random() * 0.3 // Ocean worlds have high cloud coverage
          : atmosphereType === AtmosphereType.THIN
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
    case PlanetType.OCEAN:
      surfaceProperties = createProceduralSurfaceProperties(
        random,
        rockyPlanetType,
      );
      break;
    case "METALLIC" as any:
      // Create metallic surface properties
      surfaceProperties = createProceduralSurfaceProperties(
        random,
        PlanetType.ROCKY, // Use rocky as base, will be customized
      );
      // Customize for metallic properties
      surfaceProperties.color1 = "#8C7853"; // Bronze
      surfaceProperties.color2 = "#CD7F32"; // Copper
      surfaceProperties.color3 = "#C0C0C0"; // Silver
      surfaceProperties.color4 = "#FFD700"; // Gold
      surfaceProperties.color5 = "#E5E4E2"; // Platinum
      surfaceProperties.shininess = 0.8 + random() * 0.2; // Very shiny
      surfaceProperties.specularStrength = 0.7 + random() * 0.3;
      surfaceProperties.roughness = 0.1 + random() * 0.3; // Smoother
      break;
    default:
      // Handle gas giant classes that might appear as moons
      if (Object.values(GasGiantClass).includes(rockyPlanetType as any)) {
        surfaceProperties = createProceduralSurfaceProperties(
          random,
          PlanetType.ICE, // Use ice properties for gas giant moons
        );
      } else {
        console.warn(
          `Unhandled rocky planet type: ${rockyPlanetType}. Using TERRESTRIAL defaults.`,
        );
        surfaceProperties = createProceduralSurfaceProperties(
          random,
          PlanetType.TERRESTRIAL,
        );
      }
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
