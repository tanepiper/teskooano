import { OSVector3, utils, getCurrentPreciseEpoch } from "@teskooano/core-math";
import type { LagrangePointType } from "@teskooano/data-types";
import { type OrbitalParameters } from "@teskooano/data-types";
import {
  AU_METERS,
  KM,
  EARTH_MASS,
  EARTH_RADIUS,
} from "@teskooano/data-values";

/**
 * Creates orbital elements from human-readable parameters.
 * All angles are in degrees and will be converted to radians automatically.
 */
export interface OrbitalElementsInput {
  /** Semi-major axis in AU */
  semiMajorAxisAU?: number; // Make optional as it might be calculated for Lagrange points
  /** Eccentricity (0-1) */
  eccentricity?: number; // Make optional for Lagrange points
  /** Inclination in degrees (relative to J2000 ecliptic) */
  inclinationDeg?: number; // Make optional for Lagrange points
  /** Longitude of ascending node in degrees (relative to J2000 ecliptic) */
  longitudeOfAscendingNodeDeg?: number; // Make optional for Lagrange points
  /** Argument of periapsis in degrees */
  argumentOfPeriapsisDeg?: number; // Make optional for Lagrange points
  /** Mean anomaly in degrees */
  meanAnomalyDeg?: number; // Make optional for Lagrange points
  /** Orbital period in seconds */
  period_s?: number; // Make optional for Lagrange points
  /** Sidereal rotation period in seconds */
  siderealRotationPeriod_s: number;
  /** Axial tilt in degrees */
  axialTiltDeg: number;
  /** Optional: Custom aphelion distance in AU (will be calculated if not provided) */
  aphelionAU?: number;
  /** Optional: Custom perihelion distance in AU (will be calculated if not provided) */
  perihelionAU?: number;
  /** Optional: Custom average orbital speed in km/s (will be calculated if not provided) */
  averageOrbitalSpeedKmps?: number;
  /** Optional: Time of perihelion as a date string */
  timeOfPerihelion?: string;
  /** Optional: Epoch for the orbital elements (defaults to J2000) */
  epoch?: string;
  /** Optional: If the object is to be placed at a specific Lagrange point. */
  lagrangePointType?: LagrangePointType;
  /** Optional: Indicates if the orbit is hyperbolic (eccentricity > 1). If true, semiMajorAxisAU will be converted to negative semi-major axis. */
  isHyperbolic?: boolean;
}

/**
 * Creates orbital elements from human-readable parameters.
 * All angles are automatically converted from degrees to radians.
 *
 * For hyperbolic orbits (isHyperbolic: true), the semiMajorAxisAU parameter represents
 * the desired distance from the central body, and the function automatically converts
 * it to the correct negative semi-major axis required for hyperbolic calculations.
 */
export function createOrbitalElements(
  input: OrbitalElementsInput,
): OrbitalParameters {
  let semiMajorAxis_m: number;
  let period_s: number;
  let eccentricity = input.eccentricity ?? 0;
  let inclinationDeg = input.inclinationDeg ?? 0;
  let longitudeOfAscendingNodeDeg = input.longitudeOfAscendingNodeDeg ?? 0;
  let argumentOfPeriapsisDeg = input.argumentOfPeriapsisDeg ?? 0;
  let meanAnomalyDeg = input.meanAnomalyDeg ?? 0;
  let averageOrbitalSpeed_mps: number;
  let realAphelion_m: number;
  let realPerihelion_m: number;

  // Simplified logic for Lagrange points in createOrbitalElements:
  // If lagrangePointType is set, it means its position/velocity will be overridden later.
  // For now, set nominal Keplerian values that allow the object to be initialized.
  if (input.lagrangePointType) {
    semiMajorAxis_m = (input.semiMajorAxisAU ?? 1) * AU_METERS; // Default to 1 AU if not provided
    period_s = input.period_s ?? 365.25 * 24 * 3600; // Default to Earth's period if not provided

    eccentricity = 0;
    inclinationDeg = 0;
    longitudeOfAscendingNodeDeg = 0;
    argumentOfPeriapsisDeg = 0;
    meanAnomalyDeg = 0; // Or some arbitrary phase
    averageOrbitalSpeed_mps = (input.averageOrbitalSpeedKmps ?? 0) * 1000;
    realAphelion_m = semiMajorAxis_m;
    realPerihelion_m = semiMajorAxis_m;
  } else {
    // Original logic for Keplerian orbits
    if (input.semiMajorAxisAU === undefined) {
      throw new Error("semiMajorAxisAU is required for non-Lagrange orbits.");
    }
    if (input.period_s === undefined) {
      throw new Error("period_s is required for non-Lagrange orbits.");
    }

    // Handle hyperbolic orbits with isHyperbolic flag
    if (input.isHyperbolic) {
      // For hyperbolic orbits, eccentricity must be > 1
      if (eccentricity <= 1) {
        console.warn(
          `[OrbitalElements] Hyperbolic orbit specified but eccentricity (${eccentricity}) is not > 1. Setting to 1.5.`,
        );
        eccentricity = 1.5; // Enforce hyperbolic eccentricity
      }
      period_s = 0; // No period for hyperbolic orbits

      // Calculate semi-major axis from perihelion distance and eccentricity
      // a = rp / (e - 1), where rp is perihelion distance
      if (input.perihelionAU !== undefined) {
        realPerihelion_m = input.perihelionAU * AU_METERS;
        semiMajorAxis_m = realPerihelion_m / (eccentricity - 1);
        semiMajorAxis_m = -Math.abs(semiMajorAxis_m); // Ensure it's negative for hyperbolic
      } else if (input.semiMajorAxisAU !== undefined) {
        // If semiMajorAxisAU is provided for hyperbolic, assume it's the intended
        // absolute value of semi-major axis, and make it negative.
        semiMajorAxis_m = -Math.abs(input.semiMajorAxisAU * AU_METERS);
        realPerihelion_m = Math.abs(semiMajorAxis_m) * (eccentricity - 1);
      } else {
        // Fallback if neither perihelionAU nor semiMajorAxisAU is provided for hyperbolic
        // Use a default perihelion distance of 0.5 AU
        realPerihelion_m = 0.5 * AU_METERS;
        semiMajorAxis_m = realPerihelion_m / (eccentricity - 1);
        semiMajorAxis_m = -Math.abs(semiMajorAxis_m); // Ensure it's negative
      }

      // Aphelion is undefined for hyperbolic orbits
      realAphelion_m = 0;
      // Average orbital speed is not meaningful for hyperbolic orbits
      averageOrbitalSpeed_mps = 0;
    } else {
      // Regular elliptical/parabolic orbits
      semiMajorAxis_m = input.semiMajorAxisAU * AU_METERS;
      period_s = input.period_s;

      // Handle hyperbolic orbits (eccentricity > 1) for non-isHyperbolic case
      if (eccentricity > 1) {
        // For hyperbolic orbits, semi-major axis should be negative
        semiMajorAxis_m = -Math.abs(semiMajorAxis_m);
        // Perihelion is the closest approach distance
        realPerihelion_m = Math.abs(semiMajorAxis_m) * (eccentricity - 1);
        // Aphelion is undefined for hyperbolic orbits
        realAphelion_m = 0;
        // Average orbital speed is not meaningful for hyperbolic orbits
        averageOrbitalSpeed_mps = 0;
      } else {
        // Elliptical/parabolic orbits
        realAphelion_m =
          (input.aphelionAU ??
            calculateAphelionAU(input.semiMajorAxisAU, eccentricity)) *
          AU_METERS;
        realPerihelion_m =
          (input.perihelionAU ??
            calculatePerihelionAU(input.semiMajorAxisAU, eccentricity)) *
          AU_METERS;
        averageOrbitalSpeed_mps =
          (input.averageOrbitalSpeedKmps ??
            calculateAverageOrbitalSpeedKmps(period_s, input.semiMajorAxisAU)) *
          1000; // Convert km/s to m/s
      }
    }
  }

  return {
    realSemiMajorAxis_m: semiMajorAxis_m,
    eccentricity: eccentricity,
    inclination: utils.degToRad(inclinationDeg),
    longitudeOfAscendingNode: utils.degToRad(longitudeOfAscendingNodeDeg),
    argumentOfPeriapsis: utils.degToRad(argumentOfPeriapsisDeg),
    meanAnomaly: utils.degToRad(meanAnomalyDeg ?? 0), // Ensure we have a valid default
    period_s: period_s,
    siderealRotationPeriod_s: input.siderealRotationPeriod_s,
    axialTilt: createAxialTiltVector(input.axialTiltDeg),
    realAphelion_m: realAphelion_m,
    realPerihelion_m: realPerihelion_m,
    averageOrbitalSpeed_mps: averageOrbitalSpeed_mps,
    epoch: input.epoch ?? getCurrentPreciseEpoch(),
    timeOfPerihelion: input.timeOfPerihelion,
    lagrangePointType: input.lagrangePointType, // Include if present
  };
}

/**
 * Converts a distance AU to hyperbolic semi-major axis AU.
 * For hyperbolic orbits, the semi-major axis is negative and related to the perihelion distance.
 * This function helps specify current distances for hyperbolic objects like Voyager.
 *
 * @param distanceAU The current distance from the central body in AU
 * @param eccentricity The eccentricity of the hyperbolic orbit (must be > 1)
 * @returns The negative semi-major axis in AU for hyperbolic orbits
 */
export function distanceAUToHyperbolicSemiMajorAxis(
  distanceAU: number,
  eccentricity: number,
): number {
  if (eccentricity <= 1) {
    throw new Error(
      `Eccentricity must be > 1 for hyperbolic orbits, got ${eccentricity}`,
    );
  }

  // For hyperbolic orbits: r = a(e - 1) / (1 + e*cos(ν))
  // At large distances (ν ≈ π), r ≈ a(e - 1)
  // So a ≈ r / (e - 1)
  // Since a is negative for hyperbolic orbits: a = -|r / (e - 1)|
  const semiMajorAxisAU = -Math.abs(distanceAU / (eccentricity - 1));

  return semiMajorAxisAU;
}

/**
 * Converts hyperbolic semi-major axis AU to perihelion distance AU.
 *
 * @param semiMajorAxisAU The negative semi-major axis in AU
 * @param eccentricity The eccentricity of the hyperbolic orbit (must be > 1)
 * @returns The perihelion distance in AU
 */
export function hyperbolicSemiMajorAxisToPerihelionAU(
  semiMajorAxisAU: number,
  eccentricity: number,
): number {
  if (eccentricity <= 1) {
    throw new Error(
      `Eccentricity must be > 1 for hyperbolic orbits, got ${eccentricity}`,
    );
  }

  // For hyperbolic orbits: rp = |a|(e - 1)
  const perihelionAU = Math.abs(semiMajorAxisAU) * (eccentricity - 1);

  return perihelionAU;
}

/**
 * Creates an axial tilt vector from degrees.
 * The vector points in the direction of the north pole.
 */
export function createAxialTiltVector(axialTiltDeg: number): OSVector3 {
  const axialTiltRad = utils.degToRad(axialTiltDeg);
  return new OSVector3(
    0,
    Math.cos(axialTiltRad),
    Math.sin(axialTiltRad),
  ).normalize();
}

/**
 * Converts distance from kilometers to meters
 */
export function kmToM(km: number): number {
  return km * KM;
}

/**
 * Converts distance from AU to meters
 */
export function auToM(au: number): number {
  return au * AU_METERS;
}

/**
 * Converts mass from Earth masses to kilograms
 */
export function earthMassesToKg(earthMasses: number): number {
  return earthMasses * EARTH_MASS;
}

/**
 * Converts radius from Earth radii to meters
 */
export function earthRadiiToM(earthRadii: number): number {
  return earthRadii * EARTH_RADIUS;
}

/**
 * Calculates aphelion distance from semi-major axis and eccentricity
 */
export function calculateAphelionAU(
  semiMajorAxisAU: number,
  eccentricity: number,
): number {
  return semiMajorAxisAU * (1 + eccentricity);
}

/**
 * Calculates perihelion distance from semi-major axis and eccentricity
 */
export function calculatePerihelionAU(
  semiMajorAxisAU: number,
  eccentricity: number,
): number {
  return semiMajorAxisAU * (1 - eccentricity);
}

/**
 * Calculates average orbital speed in km/s from period and semi-major axis
 */
export function calculateAverageOrbitalSpeedKmps(
  period_s: number,
  semiMajorAxisAU: number,
): number {
  const circumferenceAU = 2 * Math.PI * semiMajorAxisAU;
  const circumferenceKm = (circumferenceAU * AU_METERS) / KM; // AU to km using AU constant
  const periodDays = period_s / (24 * 60 * 60);
  return circumferenceKm / (periodDays * 24 * 60 * 60);
}
