import { OSVector3, utils } from "@teskooano/core-math";
import { AU, KM, GRAVITATIONAL_CONSTANT } from "../units/constants";
import type { OrbitalParameters } from "@teskooano/data-types";
import { getCurrentEpoch, J2000_EPOCH } from "./epoch";
import type { LagrangePointType } from "@teskooano/data-types";
import type { PhysicsStateReal } from "@teskooano/data-types";
import {
  calculateAllLagrangePoints,
  createTwoBodySystem,
  createOrbitalElementsFromLagrangePoint,
} from "./lagrange";

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
  // Remove parentMass_kg, targetMass_kg, and parentToTargetSeparation_m here
  // parentMass_kg?: number;
  // targetMass_kg?: number;
  // parentToTargetSeparation_m?: number;
}

/**
 * Creates orbital elements from human-readable parameters.
 * All angles are automatically converted from degrees to radians.
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
    semiMajorAxis_m = (input.semiMajorAxisAU ?? 1) * AU; // Default to 1 AU if not provided
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

    semiMajorAxis_m = input.semiMajorAxisAU * AU;
    period_s = input.period_s;

    realAphelion_m =
      (input.aphelionAU ??
        calculateAphelionAU(input.semiMajorAxisAU, eccentricity)) * AU;
    realPerihelion_m =
      (input.perihelionAU ??
        calculatePerihelionAU(input.semiMajorAxisAU, eccentricity)) * AU;
    averageOrbitalSpeed_mps =
      (input.averageOrbitalSpeedKmps ??
        calculateAverageOrbitalSpeedKmps(period_s, input.semiMajorAxisAU)) *
      1000; // Convert km/s to m/s
  }

  return {
    realSemiMajorAxis_m: semiMajorAxis_m,
    eccentricity: eccentricity,
    inclination: utils.degToRad(inclinationDeg),
    longitudeOfAscendingNode: utils.degToRad(longitudeOfAscendingNodeDeg),
    argumentOfPeriapsis: utils.degToRad(argumentOfPeriapsisDeg),
    meanAnomaly: utils.degToRad(meanAnomalyDeg),
    period_s: period_s,
    siderealRotationPeriod_s: input.siderealRotationPeriod_s,
    axialTilt: createAxialTiltVector(input.axialTiltDeg),
    realAphelion_m: realAphelion_m,
    realPerihelion_m: realPerihelion_m,
    averageOrbitalSpeed_mps: averageOrbitalSpeed_mps,
    epoch: input.epoch ?? J2000_EPOCH,
    timeOfPerihelion: input.timeOfPerihelion,
    lagrangePointType: input.lagrangePointType, // Include if present
  };
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
  return au * AU;
}

/**
 * Converts mass from Earth masses to kilograms
 */
export function earthMassesToKg(earthMasses: number): number {
  return earthMasses * 5.972e24;
}

/**
 * Converts radius from Earth radii to meters
 */
export function earthRadiiToM(earthRadii: number): number {
  return earthRadii * 6.371e6;
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
  const circumferenceKm = (circumferenceAU * AU) / KM; // AU to km using AU constant
  const periodDays = period_s / (24 * 60 * 60);
  return circumferenceKm / (periodDays * 24 * 60 * 60);
}
