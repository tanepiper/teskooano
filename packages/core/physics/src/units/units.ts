/**
 * Unit conversion constants and functions for the physics engine
 */
import { OSVector3 } from "@teskooano/core-math";

// Base units (SI)
export const SI = {
  METER: 1,
  KILOGRAM: 1,
  SECOND: 1,
  NEWTON: 1,
} as const;

// Game units
export const GAME = {
  AU: 149597870700, // 1 AU in meters
  DAY: 86400, // 1 day in seconds
  KM_PER_S: 1000, // 1 km/s in m/s
} as const;

// Conversion factors
export const CONVERSION = {
  // Distance
  M_TO_AU: 1 / GAME.AU,
  AU_TO_M: GAME.AU,
  KM_TO_M: 1000,
  M_TO_KM: 1 / 1000,

  // Time
  S_TO_DAYS: 1 / GAME.DAY,
  DAYS_TO_S: GAME.DAY,
  HOURS_TO_S: 3600,
  S_TO_HOURS: 1 / 3600,

  // Velocity
  M_S_TO_AU_DAY: (1 / GAME.AU) * GAME.DAY,
  AU_DAY_TO_M_S: GAME.AU / GAME.DAY,
  KM_S_TO_M_S: GAME.KM_PER_S,
  M_S_TO_KM_S: 1 / GAME.KM_PER_S,
} as const;

/**
 * Converts a value from one unit to another
 * @param value The value to convert
 * @param fromFactor The conversion factor to multiply by to get to base units
 * @param toFactor The conversion factor to multiply by to get to target units
 */
export const convert = (
  value: number,
  fromFactor: number,
  toFactor: number,
): number => {
  return value * fromFactor * toFactor;
};

/**
 * Converts a vector from one unit to another
 * @param vector The vector to convert
 * @param fromFactor The conversion factor to multiply by to get to base units
 * @param toFactor The conversion factor to multiply by to get to target units
 */
export const convertVector = (
  vector: OSVector3,
  fromFactor: number,
  toFactor: number,
): OSVector3 => {
  // Modify vector in place
  vector.x = convert(vector.x, fromFactor, toFactor);
  vector.y = convert(vector.y, fromFactor, toFactor);
  vector.z = convert(vector.z, fromFactor, toFactor);
  return vector;
};

/**
 * Converts a value from meters to astronomical units
 */
export const metersToAU = (meters: number): number => {
  return convert(meters, CONVERSION.M_TO_AU, 1);
};

/**
 * Converts a value from astronomical units to meters
 */
export const auToMeters = (au: number): number => {
  return convert(au, CONVERSION.AU_TO_M, 1);
};

/**
 * Converts a velocity from m/s to AU/day
 */
export const metersPerSecondToAUDay = (mps: number): number => {
  // Convert m/s to m/day, then to AU/day
  const metersPerDay = mps * CONVERSION.S_TO_DAYS;
  return metersPerDay * CONVERSION.M_TO_AU;
};

/**
 * Converts a velocity from AU/day to m/s
 */
export const auDayToMetersPerSecond = (auDay: number): number => {
  // Convert AU/day to m/day, then to m/s
  const metersPerDay = auDay * CONVERSION.AU_TO_M;
  return metersPerDay * CONVERSION.DAYS_TO_S;
};
