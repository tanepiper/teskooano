import { OSVector3 } from "@teskooano/core-math";
import { AU_METERS, type OrbitalParameters } from "@teskooano/data-types";
import { createOrbitalElements } from "./helpers";

/**
 * Parsed TLE data structure
 */
export interface TLEData {
  /** Satellite catalog number */
  catalogNumber: string;
  /** International designator */
  internationalDesignator: string;
  /** Epoch year (last two digits) */
  epochYear: number;
  /** Epoch day of year */
  epochDay: number;
  /** First derivative of mean motion */
  meanMotionDot: number;
  /** Second derivative of mean motion */
  meanMotionDotDot: number;
  /** B* drag term */
  bStar: number;
  /** Ephemeris type */
  ephemerisType: number;
  /** Element set number */
  elementSetNumber: number;
  /** Inclination (degrees) */
  inclination: number;
  /** Right ascension of ascending node (degrees) */
  raan: number;
  /** Eccentricity */
  eccentricity: number;
  /** Argument of perigee (degrees) */
  argumentOfPerigee: number;
  /** Mean anomaly (degrees) */
  meanAnomaly: number;
  /** Mean motion (revolutions per day) */
  meanMotion: number;
  /** Revolution number at epoch */
  revolutionNumber: number;
}

/**
 * Parses TLE data from the standard two-line format
 *
 * @param line1 First line of TLE data
 * @param line2 Second line of TLE data
 * @returns Parsed TLE data structure
 */
export function parseTLE(line1: string, line2: string): TLEData {
  // Validate line lengths
  if (line1.length !== 69 || line2.length !== 69) {
    throw new Error("TLE lines must be exactly 69 characters long");
  }

  // Parse line 1
  const catalogNumber = line1.substring(2, 7).trim();
  const internationalDesignator = line1.substring(9, 17).trim();
  const epochYear = parseInt(line1.substring(18, 20));
  const epochDay = parseFloat(line1.substring(20, 32));
  const meanMotionDot = parseFloat(line1.substring(33, 43));
  const meanMotionDotDot = parseFloat(line1.substring(44, 52));
  const bStar = parseFloat(line1.substring(53, 61));
  const ephemerisType = parseInt(line1.substring(62, 63));
  const elementSetNumber = parseInt(line1.substring(64, 68));

  // Parse line 2
  const inclination = parseFloat(line2.substring(8, 16));
  const raan = parseFloat(line2.substring(17, 25));
  const eccentricity = parseFloat("0." + line2.substring(26, 33));
  const argumentOfPerigee = parseFloat(line2.substring(34, 42));
  const meanAnomaly = parseFloat(line2.substring(43, 51));
  const meanMotion = parseFloat(line2.substring(52, 63));
  const revolutionNumber = parseInt(line2.substring(63, 69)); // Take full field to end of line

  return {
    catalogNumber,
    internationalDesignator,
    epochYear,
    epochDay,
    meanMotionDot,
    meanMotionDotDot,
    bStar,
    ephemerisType,
    elementSetNumber,
    inclination,
    raan,
    eccentricity,
    argumentOfPerigee,
    meanAnomaly,
    meanMotion,
    revolutionNumber,
  };
}

/**
 * Converts TLE data to orbital elements
 *
 * @param tle Parsed TLE data
 * @param parentMass_kg Mass of the parent body (Earth = 5.972e24 kg)
 * @returns Orbital parameters
 */
export function tleToOrbitalElements(
  tle: TLEData,
  parentMass_kg: number = 5.972e24,
): OrbitalParameters {
  // Calculate epoch date
  const epochYear =
    tle.epochYear < 57 ? 2000 + tle.epochYear : 1900 + tle.epochYear;
  const epochDate = new Date(epochYear, 0, 1); // January 1st of epoch year
  epochDate.setDate(epochDate.getDate() + tle.epochDay - 1); // Add days (subtract 1 because day 1 is January 1st)

  const epochString = `${epochYear}-${String(epochDate.getMonth() + 1).padStart(2, "0")}-${String(epochDate.getDate()).padStart(2, "0")}`;

  // Calculate orbital period from mean motion
  const period_s = (24 * 60 * 60) / tle.meanMotion; // Convert revolutions per day to seconds

  // For Earth satellites, use Earth's gravitational parameter directly
  // μ = GM = 3.986e14 m³/s² for Earth
  const EARTH_MU = 3.986e14; // m³/s²

  // Calculate semi-major axis using Kepler's third law: T = 2π * sqrt(a³/μ)
  // Solving for a: a = (T²μ/4π²)^(1/3)
  const semiMajorAxis_m = Math.pow(
    (period_s * period_s * EARTH_MU) / (4 * Math.PI * Math.PI),
    1 / 3,
  );

  return createOrbitalElements({
    semiMajorAxisAU: semiMajorAxis_m / AU_METERS, // Convert m to km, then to AU
    eccentricity: tle.eccentricity,
    inclinationDeg: tle.inclination,
    longitudeOfAscendingNodeDeg: tle.raan,
    argumentOfPeriapsisDeg: tle.argumentOfPerigee,
    meanAnomalyDeg: tle.meanAnomaly,
    period_s: period_s,
    siderealRotationPeriod_s: period_s, // Assume synchronous rotation for satellites
    axialTiltDeg: 0,
    epoch: epochString,
  });
}

/**
 * Creates orbital elements from TLE strings
 *
 * @param line1 First line of TLE data
 * @param line2 Second line of TLE data
 * @param parentMass_kg Mass of the parent body (default: Earth)
 * @returns Orbital parameters
 */
export function createOrbitalElementsFromTLE(
  line1: string,
  line2: string,
  parentMass_kg: number = 5.972e24,
): OrbitalParameters {
  const tle = parseTLE(line1, line2);
  return tleToOrbitalElements(tle, parentMass_kg);
}
