import { OSVector3 } from "@teskooano/core-math";
import {
  CelestialObject,
  CelestialSpecificPropertiesUnion,
  CelestialStatus,
  CelestialType,
  PlanetProperties,
  RingSystemConfiguration,
} from "@teskooano/data-types";
import { AU_METERS, EARTH_MASS } from "@teskooano/data-values";
import { Observable, Subscriber } from "rxjs";
import { generateCelestialName } from "../../generators/names/celestial-name";
import * as UTIL from "../../utils";
import { SYSTEM_MAX_DISTANCE_AU } from "../../constants";
import { calculatePlanetOrbitAndInitialState } from "./planet-orbit";
import {
  generateGasGiantSpecificProperties,
  generateRockyPlanetSpecificProperties,
} from "./planet-properties";
import { generateRings } from "./planet-rings";
import {
  determinePlanetTypeAndBaseProperties,
  type PlanetBaseProperties,
} from "./planet-type";
import { createProceduralSurfaceProperties } from "../../properties/creator";
import { calculateStellarLuminosity, estimateTemperature } from "../../utils";
import { CelestialZone } from "../../zones";

/**
 * Base configuration for planet generation
 */
export interface BasePlanetConfig {
  random: () => number;
  systemSeed: string;
  zone: CelestialZone;
}

/**
 * Configuration for regular planet generation
 */
export interface PlanetGeneratorConfig extends BasePlanetConfig {
  parentStar: CelestialObject;
  bodyDistanceAU: number;
}

/**
 * Configuration for rogue planet generation (highly eccentric orbits)
 */
export interface RoguePlanetGeneratorConfig extends BasePlanetConfig {
  parentStar: CelestialObject;
  bodyDistanceAU: number;
  slotIndex: number;
}

/**
 * Base class for planet generation with shared functionality
 */
abstract class BasePlanetGenerator {
  protected config: BasePlanetConfig;
  protected planetName: string;
  protected planetId: string;
  protected baseProps: PlanetBaseProperties | undefined;
  protected planetMass_kg: number = 0;
  protected planetRadius_m: number = 0;
  protected specificProperties!: CelestialSpecificPropertiesUnion;
  protected generatedRings: RingSystemConfiguration | undefined;

  constructor(config: BasePlanetConfig, idPrefix: string) {
    this.config = config;
    this.planetName = generateCelestialName(config.random);
    this.planetId = `${idPrefix}-${this.planetName.toLowerCase()}`;
  }

  /**
   * Generates a complete planet with all its properties and systems
   */
  generate(): Observable<CelestialObject> {
    return new Observable((subscriber: Subscriber<CelestialObject>) => {
      try {
        this.determineBaseProperties();
        if (!this.baseProps) {
          subscriber.complete();
          return;
        }

        this.calculatePhysicalProperties();
        this.generateSpecificProperties();
        this.generateRingSystem();

        const planetData = this.buildPlanetObject();
        subscriber.next(planetData);
        subscriber.complete();
      } catch (error) {
        subscriber.error(error);
      }
    });
  }

  /**
   * Determines the base type and properties of the planet
   */
  protected determineBaseProperties(): void {
    const parentStar = this.getParentStar();
    this.baseProps = determinePlanetTypeAndBaseProperties(
      this.config.random,
      parentStar,
      this.config.zone,
    );
  }

  /**
   * Calculates the planet's mass and radius based on its type
   */
  protected calculatePhysicalProperties(): void {
    if (!this.baseProps) return;

    const massMultiplier = this.getMassMultiplier();
    this.planetMass_kg = massMultiplier * EARTH_MASS;
    this.planetRadius_m = UTIL.calculateRadius(
      this.planetMass_kg,
      this.baseProps.targetDensity_kg_m3,
    );
  }

  /**
   * Generates specific properties like atmosphere, surface, etc.
   */
  protected generateSpecificProperties(): void {
    if (!this.baseProps) return;

    // Inline the router logic directly here
    if (this.baseProps.celestialType === CelestialType.GAS_GIANT) {
      this.specificProperties = generateGasGiantSpecificProperties(
        this.config.random,
        this.baseProps,
        this.getDistanceForProperties(),
      );
    } else {
      this.specificProperties = generateRockyPlanetSpecificProperties(
        this.config.random,
        this.baseProps,
      );

      // Add procedural surface properties for planets
      if (this.baseProps.celestialType === CelestialType.PLANET) {
        const proceduralSurface = createProceduralSurfaceProperties(
          this.config.random,
          this.baseProps.celestialClass,
        );
        this.specificProperties = {
          ...this.specificProperties,
          surface: proceduralSurface,
        } as PlanetProperties;
      }
    }

    // Enhance atmosphere properties
    this.enhanceAtmosphereProperties();
  }

  /**
   * Enhances atmosphere properties based on planet type
   */
  private enhanceAtmosphereProperties(): void {
    if (
      this.specificProperties.type === CelestialType.PLANET &&
      (this.specificProperties as PlanetProperties).atmosphere
    ) {
      const planetProps = this.specificProperties as PlanetProperties;
      const atmosphereConfig = this.getAtmosphereConfig(
        String(planetProps.classType),
      );

      this.specificProperties = {
        ...this.specificProperties,
        atmosphere: atmosphereConfig,
      } as PlanetProperties;
    }
  }

  /**
   * Gets atmosphere configuration based on planet type
   */
  private getAtmosphereConfig(classType: string) {
    const configs: Record<
      string,
      {
        colors: string[];
        intensity: number;
        power: number;
        thickness: number;
      }
    > = {
      TERRESTRIAL: {
        colors: ["#dfe0e7", "#e7e9eb", "#f2f4f7"],
        intensity: 1.0,
        power: 2.0,
        thickness: 0.1,
      },
      ICE: {
        colors: ["#aaccff", "#cceeff", "#ddeeff"],
        intensity: 0.8,
        power: 1.8,
        thickness: 0.08,
      },
      DEFAULT: {
        colors: ["#ff9966", "#ffaa88", "#ffbb99"],
        intensity: 1.2,
        power: 2.2,
        thickness: 0.12,
      },
    };

    const config = configs[classType] || configs.DEFAULT;
    return {
      glowColor: UTIL.getRandomItem(config.colors, this.config.random),
      intensity: config.intensity,
      power: config.power,
      thickness: config.thickness,
    };
  }

  /**
   * Generates ring system if applicable
   */
  protected generateRingSystem(): void {
    if (!this.baseProps) return;

    if (
      this.baseProps.ringChance > 0 &&
      this.baseProps.ringAllowedTypes.length > 0
    ) {
      this.generatedRings = generateRings(
        this.config.random,
        this.baseProps.ringChance,
        this.baseProps.ringAllowedTypes,
        this.planetRadius_m,
      );
    }
  }

  /**
   * Builds the final planet object with all calculated properties
   */
  protected buildPlanetObject(): CelestialObject {
    if (!this.baseProps) {
      throw new Error("Base properties not determined");
    }

    const rotationPeriod_s = 18000 + this.config.random() * (172800 - 18000);
    const tilt_deg = this.config.random() * 45;
    const tilt_rad = tilt_deg * (Math.PI / 180);

    const tiltAxis = new OSVector3(
      0,
      Math.cos(tilt_rad),
      Math.sin(tilt_rad),
    ).normalize();

    const planetSeed = `${this.config.systemSeed}-${this.planetId}`;
    const planetTemp = this.calculateTemperature();
    const planetAlbedo = UTIL.calculateAlbedo(
      this.baseProps.celestialType,
      this.baseProps.celestialClass,
      this.config.random,
    );

    const planetData: CelestialObject = {
      id: this.planetId,
      name: this.getPlanetName(),
      status: CelestialStatus.ACTIVE,
      albedo: planetAlbedo,
      type: this.baseProps.celestialType,
      parentId: this.getParentId(),
      realMass_kg: this.planetMass_kg,
      realRadius_m: this.planetRadius_m,
      temperature: planetTemp,
      orbit: this.createOrbit(rotationPeriod_s, tilt_deg),
      properties: this.specificProperties,
      seed: planetSeed,
    };

    // Add rings if generated
    if (this.generatedRings && this.generatedRings.rings.length > 0) {
      if (planetData.properties) {
        // Add the enhanced ring system configuration
        (planetData.properties as PlanetProperties).ringSystem =
          this.generatedRings;
        // Also add the rings array for backward compatibility
        (planetData.properties as PlanetProperties).rings =
          this.generatedRings.rings;
      }
    }

    return planetData;
  }

  // Abstract methods that subclasses must implement
  protected abstract getParentStar(): CelestialObject;
  protected abstract getMassMultiplier(): number;
  protected abstract getDistanceForProperties(): number;
  protected abstract calculateTemperature(): number;
  protected abstract getPlanetName(): string;
  protected abstract getParentId(): string | undefined;
  protected abstract createOrbit(
    rotationPeriod_s: number,
    tilt_deg: number,
  ): any;
}

/**
 * Generates planets orbiting stars
 */
export class PlanetGenerator extends BasePlanetGenerator {
  private planetConfig: PlanetGeneratorConfig;

  constructor(config: PlanetGeneratorConfig) {
    super(config, `planet-${config.parentStar.id}`);
    this.planetConfig = config;
  }

  protected getParentStar(): CelestialObject {
    return this.planetConfig.parentStar;
  }

  protected getMassMultiplier(): number {
    const massRangeMultiplier = Math.min(
      1 + this.planetConfig.bodyDistanceAU / 10,
      5,
    );
    return (
      (0.1 + this.config.random() * 10) *
      massRangeMultiplier *
      this.baseProps!.massMultiplierFactor
    );
  }

  protected getDistanceForProperties(): number {
    return this.config.zone.minAU;
  }

  protected calculateTemperature(): number {
    const starLuminosity = calculateStellarLuminosity(
      this.planetConfig.parentStar.realRadius_m,
      this.planetConfig.parentStar.temperature,
    );
    return estimateTemperature(
      starLuminosity,
      this.planetConfig.bodyDistanceAU,
    );
  }

  protected getPlanetName(): string {
    return this.planetName;
  }

  protected getParentId(): string {
    return this.planetConfig.parentStar.id;
  }

  protected createOrbit(rotationPeriod_s: number, tilt_deg: number): any {
    const { orbit } = calculatePlanetOrbitAndInitialState(
      this.config.random,
      this.planetConfig.parentStar.realMass_kg,
      this.planetMass_kg,
      this.planetConfig.bodyDistanceAU,
      this.planetId,
    );

    if (!orbit) {
      throw new Error("Failed to calculate orbital parameters");
    }

    const tilt_rad = tilt_deg * (Math.PI / 180);
    const tiltAxis = new OSVector3(
      0,
      Math.cos(tilt_rad),
      Math.sin(tilt_rad),
    ).normalize();

    return {
      ...orbit,
      siderealRotationPeriod_s: rotationPeriod_s,
      axialTilt: tiltAxis,
    };
  }
}

/**
 * Generates rogue planets (planets with highly eccentric orbits > 1)
 */
export class RoguePlanetGenerator extends BasePlanetGenerator {
  private rogueConfig: RoguePlanetGeneratorConfig;

  constructor(config: RoguePlanetGeneratorConfig) {
    super(config, `planet-rogue-${config.slotIndex}`);
    this.rogueConfig = config;
  }

  protected getParentStar(): CelestialObject {
    return this.rogueConfig.parentStar;
  }

  protected getMassMultiplier(): number {
    // Rogue planets can be more massive due to their formation history
    return (
      (0.5 + this.config.random() * 5) * this.baseProps!.massMultiplierFactor
    );
  }

  protected getDistanceForProperties(): number {
    return this.config.zone.minAU;
  }

  protected calculateTemperature(): number {
    // Rogue planets are cold due to their distance from stars
    const starLuminosity = calculateStellarLuminosity(
      this.rogueConfig.parentStar.realRadius_m,
      this.rogueConfig.parentStar.temperature,
    );
    return estimateTemperature(starLuminosity, this.rogueConfig.bodyDistanceAU);
  }

  protected getPlanetName(): string {
    return `Rogue ${this.planetName}`;
  }

  protected getParentId(): string {
    return this.rogueConfig.parentStar.id;
  }

  protected createOrbit(rotationPeriod_s: number, tilt_deg: number): any {
    // Rogue planets have hyperbolic orbits (eccentricity > 1)
    // They come from outside the system, approach the star, and then leave
    const eccentricity = 1.1 + this.config.random() * 1.9; // 1.1 to 3.0 (hyperbolic)

    // Calculate negative semi-major axis for hyperbolic orbit
    // a = rp / (e - 1), where rp is perihelion distance
    const semiMajorAxisAU =
      -this.rogueConfig.bodyDistanceAU / (eccentricity - 1);

    // Calculate the approach distance (where they come from)
    const approachDistanceAU = Math.abs(semiMajorAxisAU) * (eccentricity + 1);

    // Ensure the approach distance is reasonable (not too far outside the system)
    let finalEccentricity = eccentricity;
    let finalSemiMajorAxisAU = semiMajorAxisAU;

    if (approachDistanceAU > SYSTEM_MAX_DISTANCE_AU * 3) {
      // Adjust eccentricity to keep approach distance reasonable
      const maxEccentricity =
        (SYSTEM_MAX_DISTANCE_AU * 3) / Math.abs(semiMajorAxisAU) - 1;
      if (maxEccentricity > 1.1) {
        finalEccentricity = Math.min(eccentricity, maxEccentricity);
        finalSemiMajorAxisAU =
          -this.rogueConfig.bodyDistanceAU / (finalEccentricity - 1);
      }
    }

    const { orbit } = calculatePlanetOrbitAndInitialState(
      this.config.random,
      this.rogueConfig.parentStar.realMass_kg,
      this.planetMass_kg,
      this.rogueConfig.bodyDistanceAU,
      this.planetId,
    );

    if (!orbit) {
      throw new Error("Failed to calculate orbital parameters");
    }

    const tilt_rad = tilt_deg * (Math.PI / 180);
    const tiltAxis = new OSVector3(
      0,
      Math.cos(tilt_rad),
      Math.sin(tilt_rad),
    ).normalize();

    return {
      ...orbit,
      realSemiMajorAxis_m: finalSemiMajorAxisAU * AU_METERS,
      eccentricity: finalEccentricity, // Override with hyperbolic eccentricity
      period_s: 0, // No period for hyperbolic orbits
      siderealRotationPeriod_s: rotationPeriod_s,
      axialTilt: tiltAxis,
      isHyperbolic: true, // Mark as hyperbolic orbit
    };
  }
}

/**
 * Factory functions for backward compatibility
 */

/**
 * Creates an RxJS Observable that generates and emits data for a single planet
 * and its potential ring system.
 *
 * @deprecated Use PlanetGenerator class instead
 */
export function generatePlanet(
  random: () => number,
  parentStar: CelestialObject,
  bodyDistanceAU: number,
  systemSeed: string,
  zone: CelestialZone,
): Observable<CelestialObject> {
  const generator = new PlanetGenerator({
    random,
    parentStar,
    bodyDistanceAU,
    systemSeed,
    zone,
  });
  return generator.generate();
}

/**
 * Creates an RxJS Observable that generates and emits data for a single rogue planet
 * with highly eccentric orbit (eccentricity > 1).
 *
 * @deprecated Use RoguePlanetGenerator class instead
 */
export function generateRoguePlanet(
  random: () => number,
  parentStar: CelestialObject,
  distanceAU: number,
  systemSeed: string,
  slotIndex: number,
  zone: CelestialZone,
): Observable<CelestialObject> {
  const generator = new RoguePlanetGenerator({
    random,
    parentStar,
    bodyDistanceAU: distanceAU,
    systemSeed,
    slotIndex,
    zone,
  });
  return generator.generate();
}
