import { OSVector3, utils } from "@teskooano/core-math";
import { AU, KM } from "../units/constants";
import type { OrbitalParameters } from "@teskooano/data-types";
import { getCurrentEpoch, J2000_EPOCH } from "./epoch";

/**
 * Creates orbital elements from human-readable parameters.
 * All angles are in degrees and will be converted to radians automatically.
 */
export interface OrbitalElementsInput {
  /** Semi-major axis in AU */
  semiMajorAxisAU: number;
  /** Eccentricity (0-1) */
  eccentricity: number;
  /** Inclination in degrees (relative to J2000 ecliptic) */
  inclinationDeg: number;
  /** Longitude of ascending node in degrees (relative to J2000 ecliptic) */
  longitudeOfAscendingNodeDeg: number;
  /** Argument of periapsis in degrees */
  argumentOfPeriapsisDeg: number;
  /** Mean anomaly in degrees */
  meanAnomalyDeg: number;
  /** Orbital period in seconds */
  period_s: number;
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
}

/**
 * Creates orbital elements from human-readable parameters.
 * All angles are automatically converted from degrees to radians.
 */
export function createOrbitalElements(
  input: OrbitalElementsInput,
): OrbitalParameters {
  const semiMajorAxis_m = input.semiMajorAxisAU * AU;
  const aphelion_m =
    (input.aphelionAU ??
      calculateAphelionAU(input.semiMajorAxisAU, input.eccentricity)) * AU;
  const perihelion_m =
    (input.perihelionAU ??
      calculatePerihelionAU(input.semiMajorAxisAU, input.eccentricity)) * AU;
  const averageOrbitalSpeed_mps =
    (input.averageOrbitalSpeedKmps ??
      calculateAverageOrbitalSpeedKmps(input.period_s, input.semiMajorAxisAU)) *
    1000; // Convert km/s to m/s

  return {
    realSemiMajorAxis_m: semiMajorAxis_m,
    eccentricity: input.eccentricity,
    inclination: utils.degToRad(input.inclinationDeg),
    longitudeOfAscendingNode: utils.degToRad(input.longitudeOfAscendingNodeDeg),
    argumentOfPeriapsis: utils.degToRad(input.argumentOfPeriapsisDeg),
    meanAnomaly: utils.degToRad(input.meanAnomalyDeg),
    period_s: input.period_s,
    siderealRotationPeriod_s: input.siderealRotationPeriod_s,
    axialTilt: createAxialTiltVector(input.axialTiltDeg),
    realAphelion_m: aphelion_m,
    realPerihelion_m: perihelion_m,
    averageOrbitalSpeed_mps: averageOrbitalSpeed_mps,
    epoch: input.epoch ?? J2000_EPOCH,
    timeOfPerihelion: input.timeOfPerihelion,
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
