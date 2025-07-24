import { createOrbitalElements } from "@teskooano/core-physics";
import {
  CelestialObject,
  CelestialStatus,
  CelestialType,
  CometClass,
  type CometProperties,
  type OrbitalParameters,
  type StarProperties,
} from "@teskooano/data-types";
import { OSVector3 } from "@teskooano/core-math";
import * as CONST from "../../constants";
import * as UTIL from "../../utils";
import { generateCelestialName } from "../names/celestial-name";
import { Observable } from "rxjs";

/**
 * Configuration for comet generation
 */
export interface CometGeneratorConfig {
  random: () => number;
  parentStar: CelestialObject;
  bodyDistanceAU: number;
  systemSeed: string;
  slotIndex: number;
  zone: any;
}

/**
 * Generates comets with different orbital characteristics based on their type
 */
export class CometGenerator {
  private config: CometGeneratorConfig;

  constructor(config: CometGeneratorConfig) {
    this.config = config;
  }

  generate(): Observable<CelestialObject> {
    return new Observable((subscriber) => {
      try {
        const { random, parentStar, bodyDistanceAU, systemSeed, slotIndex } =
          this.config;

        // Determine comet type based on distance and random chance
        const cometType = this.determineCometType(bodyDistanceAU, random);

        // Generate orbital parameters based on comet type
        const orbitalParams = this.createOrbitalParameters(
          cometType,
          bodyDistanceAU,
          random,
        );

        // Generate physical properties
        const { classType, activity } = this.getCometClassAndActivity(
          cometType,
          random,
        );

        // Calculate temperature based on distance from star
        const starProps = parentStar.properties as StarProperties;
        const starLuminosity = starProps?.luminosity || 1.0;
        const distanceM = bodyDistanceAU * CONST.AU_TO_METERS;

        // T = (L / (16π σ d²))^(1/4) for a gray body with albedo ~0.1
        const temperature = Math.pow(
          starLuminosity /
            (16 * Math.PI * CONST.STEFAN_BOLTZMANN * distanceM * distanceM),
          0.25,
        );

        // Generate comet properties
        const cometProps: CometProperties = {
          type: CelestialType.COMET,
          classType: classType,
          composition: this.generateComposition(random),
          activity: activity,
          visualComaRadius: this.calculateComaRadius(activity, bodyDistanceAU),
          visualComaColor: this.generateComaColor(random),
          visualComaOpacity: Math.min(activity * 0.8 + 0.2, 1.0),
          visualMaxTailLength: this.calculateTailLength(
            activity,
            bodyDistanceAU,
          ),
          visualTailColor: this.generateTailColor(random),
          visualTailOpacity: Math.min(activity * 0.6 + 0.1, 1.0),
          visuals: {
            darkColorMultiplier: 0.3 + random() * 0.4,
            lightColorMultiplier: 0.6 + random() * 0.4,
            fbmScale: 0.5 + random() * 1.0,
            fineFbmScale: 2.0 + random() * 3.0,
            fineFbmMix: 0.3 + random() * 0.4,
            ambientStrength: 0.2 + random() * 0.3,
          },
        };

        // Create the comet object
        const comet: CelestialObject = {
          id: `comet-${systemSeed}-${slotIndex}`,
          name: generateCelestialName(random),
          parentId: parentStar.id,
          type: CelestialType.COMET,
          properties: cometProps,
          orbit: orbitalParams,
          realMass_kg: this.calculateMass(random),
          realRadius_m: this.calculateRadius(random),
          temperature: temperature,
          status: CelestialStatus.ACTIVE,
        };

        subscriber.next(comet);
        subscriber.complete();
      } catch (error) {
        subscriber.error(error);
      }
    });
  }

  /**
   * Determine comet type based on distance from star and random chance
   */
  private determineCometType(
    distanceAU: number,
    random: () => number,
  ): CometClass {
    // Interstellar comets are rare and typically found at great distances
    if (distanceAU > 50 && random() < 0.1) {
      return CometClass.INTERSTELLAR;
    }

    // Long-period comets are more common at medium distances
    if (distanceAU > 20 && random() < 0.6) {
      return CometClass.LONG_PERIOD;
    }

    // Short-period comets are common at all distances
    return CometClass.SHORT_PERIOD;
  }

  /**
   * Create orbital parameters based on comet type
   */
  private createOrbitalParameters(
    cometType: CometClass,
    distanceAU: number,
    random: () => number,
  ): OrbitalParameters {
    const { parentStar } = this.config;
    const starProps = parentStar.properties as StarProperties;
    const starMass = parentStar.realMass_kg || CONST.SOLAR_MASS_KG;

    switch (cometType) {
      case CometClass.INTERSTELLAR:
        return this.createInterstellarOrbit(distanceAU, starMass, random);
      case CometClass.LONG_PERIOD:
        return this.createLongPeriodOrbit(distanceAU, starMass, random);
      case CometClass.SHORT_PERIOD:
        return this.createShortPeriodOrbit(distanceAU, starMass, random);
      default:
        return this.createShortPeriodOrbit(distanceAU, starMass, random);
    }
  }

  /**
   * Create hyperbolic orbit for interstellar comets
   */
  private createInterstellarOrbit(
    distanceAU: number,
    starMass: number,
    random: () => number,
  ): OrbitalParameters {
    // Interstellar comets have hyperbolic orbits (e > 1)
    const eccentricity = 1.1 + random() * 1.9; // 1.1 to 3.0

    // Calculate negative semi-major axis for hyperbolic orbit
    const semiMajorAxisAU = -distanceAU / (eccentricity - 1);

    // Calculate approach distance (where they come from)
    const approachDistanceAU = Math.abs(semiMajorAxisAU) * (eccentricity + 1);

    // Ensure approach is from outside the system
    const finalApproachAU = Math.max(
      approachDistanceAU,
      CONST.SYSTEM_MAX_DISTANCE_AU * 0.8,
    );

    // Calculate orbital elements
    const orbitalElements = createOrbitalElements({
      semiMajorAxisAU: semiMajorAxisAU,
      eccentricity: eccentricity,
      inclinationDeg: (random() - 0.5) * 180, // Random inclination
      argumentOfPeriapsisDeg: random() * 360,
      longitudeOfAscendingNodeDeg: random() * 360,
      meanAnomalyDeg: random() * 360,
      period_s: 0, // No period for hyperbolic orbits
      siderealRotationPeriod_s: (12 + random() * 24) * 3600, // 12-36 hour rotation
      axialTiltDeg: 0, // Tumbling object
      isHyperbolic: true,
    });

    return orbitalElements;
  }

  /**
   * Create highly elliptical orbit for long-period comets
   */
  private createLongPeriodOrbit(
    distanceAU: number,
    starMass: number,
    random: () => number,
  ): OrbitalParameters {
    // Long-period comets have high eccentricity (0.8 to 0.99)
    const eccentricity = 0.8 + random() * 0.19;

    // Semi-major axis is much larger than current distance
    const semiMajorAxisAU = distanceAU / (1 - eccentricity);

    // Calculate orbital period
    const period_s = UTIL.calculateOrbitalPeriod_s(
      starMass,
      semiMajorAxisAU * CONST.AU_TO_METERS,
      1e12,
    );

    // Calculate orbital elements
    const orbitalElements = createOrbitalElements({
      semiMajorAxisAU: semiMajorAxisAU,
      eccentricity: eccentricity,
      inclinationDeg: (random() - 0.5) * 90, // Moderate inclination
      argumentOfPeriapsisDeg: random() * 360,
      longitudeOfAscendingNodeDeg: random() * 360,
      meanAnomalyDeg: random() * 360,
      period_s: period_s,
      siderealRotationPeriod_s: (6 + random() * 18) * 3600, // 6-24 hour rotation
      axialTiltDeg: 0, // Tumbling object
    });

    return orbitalElements;
  }

  /**
   * Create moderate eccentricity orbit for short-period comets
   */
  private createShortPeriodOrbit(
    distanceAU: number,
    starMass: number,
    random: () => number,
  ): OrbitalParameters {
    // Short-period comets have moderate eccentricity (0.1 to 0.7)
    const eccentricity = 0.1 + random() * 0.6;

    // Semi-major axis is closer to current distance
    const semiMajorAxisAU = distanceAU / (1 - eccentricity);

    // Calculate orbital period
    const period_s = UTIL.calculateOrbitalPeriod_s(
      starMass,
      semiMajorAxisAU * CONST.AU_TO_METERS,
      1e12,
    );

    // Calculate orbital elements
    const orbitalElements = createOrbitalElements({
      semiMajorAxisAU: semiMajorAxisAU,
      eccentricity: eccentricity,
      inclinationDeg: (random() - 0.5) * 60, // Low inclination
      argumentOfPeriapsisDeg: random() * 360,
      longitudeOfAscendingNodeDeg: random() * 360,
      meanAnomalyDeg: random() * 360,
      period_s: period_s,
      siderealRotationPeriod_s: (4 + random() * 12) * 3600, // 4-16 hour rotation
      axialTiltDeg: 0, // Tumbling object
    });

    return orbitalElements;
  }

  /**
   * Get comet class and activity level based on orbit type
   */
  private getCometClassAndActivity(
    cometType: CometClass,
    random: () => number,
  ): { classType: CometClass; activity: number } {
    switch (cometType) {
      case CometClass.INTERSTELLAR:
        // Interstellar comets are usually active when they enter the system
        return {
          classType: CometClass.INTERSTELLAR,
          activity: random() < 0.7 ? 0.8 + random() * 0.2 : 0.0, // 70% active, 30% extinct
        };
      case CometClass.LONG_PERIOD:
        // Long-period comets are often active when they approach
        return {
          classType: CometClass.LONG_PERIOD,
          activity: random() < 0.8 ? 0.6 + random() * 0.4 : 0.0, // 80% active, 20% extinct
        };
      case CometClass.SHORT_PERIOD:
        // Short-period comets can be active or extinct depending on their history
        return {
          classType: CometClass.SHORT_PERIOD,
          activity: random() < 0.8 ? 0.4 + random() * 0.6 : 0.0, // 80% active, 20% extinct
        };
      default:
        return {
          classType: CometClass.SHORT_PERIOD,
          activity: 0.5 + random() * 0.5,
        };
    }
  }

  /**
   * Generate composition for the comet
   */
  private generateComposition(random: () => number): string[] {
    const compositions = [
      ["water ice", "CO2"],
      ["water ice", "methane"],
      ["water ice", "ammonia"],
      ["water ice", "CO2", "methane"],
      ["water ice", "methane", "ammonia"],
      ["water ice", "CO2", "ammonia"],
    ];
    return UTIL.getRandomItem(compositions, random);
  }

  /**
   * Calculate coma radius based on activity and distance
   */
  private calculateComaRadius(activity: number, distanceAU: number): number {
    // Base radius increases with activity and decreases with distance
    const baseRadius = 0.1 + activity * 0.3;
    const distanceFactor = Math.max(0.1, 1.0 - distanceAU / 100);
    return baseRadius * distanceFactor;
  }

  /**
   * Generate coma color
   */
  private generateComaColor(random: () => number): string {
    const colors = ["#87CEEB", "#98FB98", "#F0E68C", "#DDA0DD", "#FFB6C1"];
    return UTIL.getRandomItem(colors, random);
  }

  /**
   * Calculate tail length based on activity and distance
   */
  private calculateTailLength(activity: number, distanceAU: number): number {
    // Tail length increases with activity and decreases with distance
    const baseLength = 0.5 + activity * 1.5;
    const distanceFactor = Math.max(0.1, 1.0 - distanceAU / 100);
    return baseLength * distanceFactor;
  }

  /**
   * Generate tail color
   */
  private generateTailColor(random: () => number): string {
    const colors = ["#87CEEB", "#98FB98", "#F0E68C", "#DDA0DD"];
    return UTIL.getRandomItem(colors, random);
  }

  /**
   * Calculate mass for the comet
   */
  private calculateMass(random: () => number): number {
    // Comet masses range from 10^10 to 10^15 kg
    const minMass = 1e10;
    const maxMass = 1e15;
    return minMass + random() * (maxMass - minMass);
  }

  /**
   * Calculate radius for the comet nucleus
   */
  private calculateRadius(random: () => number): number {
    // Comet nucleus radii range from 0.5 to 50 km
    const minRadius = 500; // 0.5 km in meters
    const maxRadius = 50000; // 50 km in meters
    return minRadius + random() * (maxRadius - minRadius);
  }
}

/**
 * Creates an RxJS Observable that generates and emits data for a single comet
 * with orbital characteristics based on its type.
 *
 * @deprecated Use CometGenerator class instead
 */
export function generateComet(
  random: () => number,
  parentStar: CelestialObject,
  bodyDistanceAU: number,
  systemSeed: string,
  slotIndex: number,
  zone: any,
): Observable<CelestialObject> {
  const generator = new CometGenerator({
    random,
    parentStar,
    bodyDistanceAU,
    systemSeed,
    slotIndex,
    zone,
  });
  return generator.generate();
}
