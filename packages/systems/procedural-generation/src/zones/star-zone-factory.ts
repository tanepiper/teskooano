import {
  StellarType,
  GasGiantClass,
  PlanetType,
  type CelestialObject,
} from "@teskooano/data-types";
import { CelestialZone, ZoneCategory, OrbitalConfiguration } from "./types";
import { enhancedCelestialZones } from "./zone-definitions";
import * as CONST from "../constants";

/**
 * Factory for creating star-specific zones
 */
export class StarZoneFactory {
  /**
   * Creates star-specific zones based on the star's unique characteristics.
   * This is more sophisticated than just scaling generic zones.
   */
  static createStarSpecificZones(
    star: CelestialObject,
    random: () => number,
  ): CelestialZone[] {
    const starProps = star.properties as any;
    const spectralClass = starProps?.spectralClass || "G";
    const stellarType = starProps?.stellarType || "MAIN_SEQUENCE";
    const luminosity = starProps?.luminosity || 1.0;

    // Base scaling from luminosity
    const baseScaling = Math.sqrt(luminosity);

    // Create zones that are truly specific to this star type
    const zones: CelestialZone[] = [];

    switch (stellarType) {
      case "WHITE_DWARF":
        zones.push(...this.createWhiteDwarfZones(baseScaling));
        break;

      case "NEUTRON_STAR":
        zones.push(...this.createNeutronStarZones(baseScaling));
        break;

      case "BLACK_HOLE":
        zones.push(...this.createBlackHoleZones(baseScaling));
        break;

      case "RED_GIANT":
      case "SUPERGIANT":
        zones.push(...this.createGiantStarZones(baseScaling));
        break;

      case "MAIN_SEQUENCE":
      default:
        zones.push(...this.createMainSequenceZones(spectralClass, baseScaling));
        break;
    }

    // Final safety check - if no zones were created, use default G-type star zones
    if (zones.length === 0) {
      console.warn(
        `[StarZoneFactory] No zones created for star type: ${stellarType}, spectral class: ${spectralClass}, using default zones`,
      );
      zones.push(...this.createDefaultGTypeZones(baseScaling));
    }

    return zones;
  }

  /**
   * Create zones for white dwarf stars
   */
  private static createWhiteDwarfZones(baseScaling: number): CelestialZone[] {
    const scaling = baseScaling * 0.1;
    return [
      this.createZone(
        "Scorched Zone",
        ZoneCategory.SCORCHED,
        0.01,
        0.05,
        scaling,
      ),
      this.createZone("Hot Inner Zone", ZoneCategory.HOT, 0.05, 0.2, scaling),
      this.createZone(
        "Temperate Zone",
        ZoneCategory.TEMPERATE,
        0.2,
        0.5,
        scaling,
      ),
      this.createZone("Cool Zone", ZoneCategory.COOL, 0.5, 1.0, scaling),
    ];
  }

  /**
   * Create zones for neutron stars
   */
  private static createNeutronStarZones(baseScaling: number): CelestialZone[] {
    const scaling = baseScaling * 0.05;
    return [
      this.createZone(
        "Scorched Zone",
        ZoneCategory.SCORCHED,
        0.001,
        0.01,
        scaling,
      ),
      this.createZone("Hot Inner Zone", ZoneCategory.HOT, 0.01, 0.05, scaling),
      this.createZone(
        "Temperate Zone",
        ZoneCategory.TEMPERATE,
        0.05,
        0.5,
        scaling,
      ),
    ];
  }

  /**
   * Create zones for black holes (allows terrestrial planets in cooler zones)
   */
  private static createBlackHoleZones(baseScaling: number): CelestialZone[] {
    const scaling = baseScaling * 0.05;
    return [
      this.createZone(
        "Scorched Zone",
        ZoneCategory.SCORCHED,
        0.001,
        0.01,
        scaling,
      ),
      this.createZone("Hot Inner Zone", ZoneCategory.HOT, 0.01, 0.05, scaling),
      this.createZone(
        "Temperate Zone",
        ZoneCategory.TEMPERATE,
        0.05,
        0.5,
        scaling,
      ),
      this.createBlackHoleZone(
        "Cool Zone",
        ZoneCategory.COOL,
        0.5,
        2.0,
        scaling,
      ),
      this.createZone("Outer Gas Zone", ZoneCategory.COLD, 2.0, 10.0, scaling),
    ];
  }

  /**
   * Create zones for giant stars
   */
  private static createGiantStarZones(baseScaling: number): CelestialZone[] {
    const scaling = baseScaling * 2.0;
    return [
      this.createZone(
        "Scorched Zone",
        ZoneCategory.SCORCHED,
        1.0,
        5.0,
        scaling,
      ),
      this.createZone("Hot Inner Zone", ZoneCategory.HOT, 5.0, 20.0, scaling),
      this.createZone(
        "Temperate Zone",
        ZoneCategory.TEMPERATE,
        20.0,
        100.0,
        scaling,
      ),
      this.createZone("Cool Zone", ZoneCategory.COOL, 100.0, 500.0, scaling),
      this.createZone(
        "Outer Gas Zone",
        ZoneCategory.COLD,
        500.0,
        2000.0,
        scaling,
      ),
    ];
  }

  /**
   * Create zones for main sequence stars based on spectral class
   */
  private static createMainSequenceZones(
    spectralClass: string,
    baseScaling: number,
  ): CelestialZone[] {
    if (spectralClass.startsWith("W")) {
      return this.createWolfRayetZones(baseScaling);
    } else if (spectralClass.startsWith("M")) {
      return this.createMTypeZones(baseScaling);
    } else if (spectralClass.startsWith("K")) {
      return this.createKTypeZones(baseScaling);
    } else if (spectralClass.startsWith("G")) {
      return this.createGTypeZones(baseScaling);
    } else if (spectralClass.startsWith("F")) {
      return this.createFTypeZones(baseScaling);
    } else if (spectralClass.startsWith("A")) {
      return this.createATypeZones(baseScaling);
    } else if (spectralClass.startsWith("B") || spectralClass.startsWith("O")) {
      return this.createOBTypeZones(baseScaling);
    } else {
      console.warn(
        `[StarZoneFactory] Unrecognized spectral class: ${spectralClass}, using default G-type zones`,
      );
      return this.createGTypeZones(baseScaling);
    }
  }

  /**
   * Create zones for Wolf-Rayet stars
   */
  private static createWolfRayetZones(baseScaling: number): CelestialZone[] {
    const scaling = baseScaling * 4.0;
    return [
      this.createZone(
        "Scorched Zone",
        ZoneCategory.SCORCHED,
        5.0,
        20.0,
        scaling,
      ),
      this.createZone("Hot Inner Zone", ZoneCategory.HOT, 20.0, 60.0, scaling),
      this.createZone(
        "Temperate Zone",
        ZoneCategory.TEMPERATE,
        60.0,
        200.0,
        scaling,
      ),
      this.createZone("Cool Zone", ZoneCategory.COOL, 200.0, 600.0, scaling),
      this.createZone(
        "Outer Gas Zone",
        ZoneCategory.COLD,
        600.0,
        2000.0,
        scaling,
      ),
      this.createZone(
        "Frozen Outer Zone",
        ZoneCategory.FROZEN,
        2000.0,
        5000.0,
        scaling,
      ),
    ];
  }

  /**
   * Create zones for M-type stars (red dwarfs)
   */
  private static createMTypeZones(baseScaling: number): CelestialZone[] {
    const scaling = baseScaling * 0.3;
    return [
      this.createZone(
        "Scorched Zone",
        ZoneCategory.SCORCHED,
        0.05,
        0.1,
        scaling,
      ),
      this.createZone("Hot Inner Zone", ZoneCategory.HOT, 0.1, 0.3, scaling),
      this.createZone(
        "Temperate Zone",
        ZoneCategory.TEMPERATE,
        0.3,
        0.8,
        scaling,
      ),
      this.createZone("Cool Zone", ZoneCategory.COOL, 0.8, 2.0, scaling),
    ];
  }

  /**
   * Create zones for K-type stars
   */
  private static createKTypeZones(baseScaling: number): CelestialZone[] {
    const scaling = baseScaling * 0.7;
    return [
      this.createZone(
        "Scorched Zone",
        ZoneCategory.SCORCHED,
        0.1,
        0.2,
        scaling,
      ),
      this.createZone("Hot Inner Zone", ZoneCategory.HOT, 0.2, 0.5, scaling),
      this.createZone(
        "Temperate Zone",
        ZoneCategory.TEMPERATE,
        0.5,
        1.5,
        scaling,
      ),
      this.createZone("Cool Zone", ZoneCategory.COOL, 1.5, 4.0, scaling),
      this.createZone("Outer Gas Zone", ZoneCategory.COLD, 4.0, 25.0, scaling),
    ];
  }

  /**
   * Create zones for G-type stars (like our Sun)
   */
  private static createGTypeZones(baseScaling: number): CelestialZone[] {
    return [
      this.createZone(
        "Scorched Zone",
        ZoneCategory.SCORCHED,
        0.2,
        0.4,
        baseScaling,
      ),
      this.createZone(
        "Hot Inner Zone",
        ZoneCategory.HOT,
        0.4,
        0.8,
        baseScaling,
      ),
      this.createZone(
        "Temperate Zone",
        ZoneCategory.TEMPERATE,
        0.8,
        2.0,
        baseScaling,
      ),
      this.createZone("Cool Zone", ZoneCategory.COOL, 2.0, 5.0, baseScaling),
      this.createZone(
        "Outer Gas Zone",
        ZoneCategory.COLD,
        5.0,
        30.0,
        baseScaling,
      ),
    ];
  }

  /**
   * Create default zones for G-type stars
   */
  private static createDefaultGTypeZones(baseScaling: number): CelestialZone[] {
    return [
      this.createZone(
        "Hot Inner Zone",
        ZoneCategory.HOT,
        0.4,
        0.8,
        baseScaling,
      ),
      this.createZone(
        "Temperate Zone",
        ZoneCategory.TEMPERATE,
        0.8,
        2.0,
        baseScaling,
      ),
      this.createZone("Cool Zone", ZoneCategory.COOL, 2.0, 5.0, baseScaling),
    ];
  }

  /**
   * Create zones for F-type stars
   */
  private static createFTypeZones(baseScaling: number): CelestialZone[] {
    const scaling = baseScaling * 1.5;
    return [
      this.createZone(
        "Scorched Zone",
        ZoneCategory.SCORCHED,
        0.3,
        0.6,
        scaling,
      ),
      this.createZone("Hot Inner Zone", ZoneCategory.HOT, 0.6, 1.2, scaling),
      this.createZone(
        "Temperate Zone",
        ZoneCategory.TEMPERATE,
        1.2,
        3.0,
        scaling,
      ),
      this.createZone("Cool Zone", ZoneCategory.COOL, 3.0, 7.5, scaling),
      this.createZone("Outer Gas Zone", ZoneCategory.COLD, 7.5, 45.0, scaling),
    ];
  }

  /**
   * Create zones for A-type stars
   */
  private static createATypeZones(baseScaling: number): CelestialZone[] {
    const scaling = baseScaling * 2.0;
    return [
      this.createZone(
        "Scorched Zone",
        ZoneCategory.SCORCHED,
        0.6,
        1.2,
        scaling,
      ),
      this.createZone("Hot Inner Zone", ZoneCategory.HOT, 1.2, 2.4, scaling),
      this.createZone(
        "Temperate Zone",
        ZoneCategory.TEMPERATE,
        2.4,
        6.0,
        scaling,
      ),
      this.createZone("Cool Zone", ZoneCategory.COOL, 6.0, 15.0, scaling),
      this.createZone("Outer Gas Zone", ZoneCategory.COLD, 15.0, 90.0, scaling),
    ];
  }

  /**
   * Create zones for O/B-type stars
   */
  private static createOBTypeZones(baseScaling: number): CelestialZone[] {
    const scaling = baseScaling * 3.0;
    return [
      this.createZone(
        "Scorched Zone",
        ZoneCategory.SCORCHED,
        2.0,
        10.0,
        scaling,
      ),
      this.createZone("Hot Inner Zone", ZoneCategory.HOT, 10.0, 30.0, scaling),
      this.createZone(
        "Temperate Zone",
        ZoneCategory.TEMPERATE,
        30.0,
        100.0,
        scaling,
      ),
      this.createZone("Cool Zone", ZoneCategory.COOL, 100.0, 300.0, scaling),
      this.createZone(
        "Outer Gas Zone",
        ZoneCategory.COLD,
        300.0,
        1000.0,
        scaling,
      ),
    ];
  }

  /**
   * Helper method to create a zone with proper scaling
   */
  private static createZone(
    name: string,
    category: ZoneCategory,
    baseMinAU: number,
    baseMaxAU: number,
    scalingFactor: number,
  ): CelestialZone {
    const templateZone = enhancedCelestialZones.find((z) => z.name === name);
    if (!templateZone) {
      console.warn(
        `[StarZoneFactory] Template zone not found: ${name}, creating default zone`,
      );
      return this.createDefaultZone(
        name,
        category,
        baseMinAU,
        baseMaxAU,
        scalingFactor,
      );
    }

    return {
      ...templateZone,
      minAU: Math.min(baseMinAU * scalingFactor, CONST.SYSTEM_MAX_DISTANCE_AU),
      maxAU: Math.min(baseMaxAU * scalingFactor, CONST.SYSTEM_MAX_DISTANCE_AU),
    };
  }

  /**
   * Helper method to create a black hole-specific zone that allows terrestrial planets
   */
  private static createBlackHoleZone(
    name: string,
    category: ZoneCategory,
    baseMinAU: number,
    baseMaxAU: number,
    scalingFactor: number,
  ): CelestialZone {
    const templateZone = enhancedCelestialZones.find((z) => z.name === name);
    if (!templateZone) {
      console.warn(
        `[StarZoneFactory] Template zone not found for black hole: ${name}, creating default zone`,
      );
      return this.createDefaultZone(
        name,
        category,
        baseMinAU,
        baseMaxAU,
        scalingFactor,
      );
    }

    // For black holes, modify the Cool Zone to allow terrestrial planets
    let modifiedZone = { ...templateZone };
    if (name === "Cool Zone") {
      modifiedZone = {
        ...templateZone,
        allowedPlanetTypes: [
          PlanetType.TERRESTRIAL,
          PlanetType.OCEAN,
          PlanetType.ICE,
          PlanetType.ROCKY,
        ],
      };
    }

    return {
      ...modifiedZone,
      minAU: Math.min(baseMinAU * scalingFactor, CONST.SYSTEM_MAX_DISTANCE_AU),
      maxAU: Math.min(baseMaxAU * scalingFactor, CONST.SYSTEM_MAX_DISTANCE_AU),
    };
  }

  /**
   * Create a default zone when template is not found
   */
  private static createDefaultZone(
    name: string,
    category: ZoneCategory,
    baseMinAU: number,
    baseMaxAU: number,
    scalingFactor: number,
  ): CelestialZone {
    return {
      name,
      category,
      baseMinAU,
      baseMaxAU,
      minAU: Math.min(baseMinAU * scalingFactor, CONST.SYSTEM_MAX_DISTANCE_AU),
      maxAU: Math.min(baseMaxAU * scalingFactor, CONST.SYSTEM_MAX_DISTANCE_AU),
      temperatureRange: { min: 100, max: 400 },
      allowedPlanetTypes: [
        PlanetType.TERRESTRIAL,
        PlanetType.ROCKY,
        PlanetType.ICE,
      ],
      allowedGasGiantClasses: [GasGiantClass.CLASS_I, GasGiantClass.CLASS_II],
      cometChance: 0.05,
      asteroidBeltChance: 0.1,
      formationProbability: 0.7,
      specialConfigurations: [OrbitalConfiguration.STANDARD],
      maxBodies: 3,
      minBodies: 1,
    };
  }
}
