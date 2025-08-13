/**
 * Unit conversion utility functions
 *
 * Functions for converting between different units used throughout the simulation.
 */

import {
  AU_METERS,
  LIGHT_YEAR_METERS,
  PARSEC_METERS,
  SOLAR_MASS,
  SOLAR_RADIUS,
  SECONDS_PER_DAY,
  SECONDS_PER_YEAR,
} from "../constants";

/**
 * Convert astronomical units to meters
 */
export function auToMeters(au: number): number {
  return au * AU_METERS;
}

/**
 * Convert meters to astronomical units
 */
export function metersToAu(meters: number): number {
  return meters / AU_METERS;
}

/**
 * Convert light years to meters
 */
export function lightYearsToMeters(ly: number): number {
  return ly * LIGHT_YEAR_METERS;
}

/**
 * Convert meters to light years
 */
export function metersToLightYears(meters: number): number {
  return meters / LIGHT_YEAR_METERS;
}

/**
 * Convert parsecs to meters
 */
export function parsecsToMeters(pc: number): number {
  return pc * PARSEC_METERS;
}

/**
 * Convert meters to parsecs
 */
export function metersToParsecs(meters: number): number {
  return meters / PARSEC_METERS;
}

/**
 * Convert solar masses to kilograms
 */
export function solarMassesToKg(solarMasses: number): number {
  return solarMasses * SOLAR_MASS;
}

/**
 * Convert kilograms to solar masses
 */
export function kgToSolarMasses(kg: number): number {
  return kg / SOLAR_MASS;
}

/**
 * Convert solar radii to meters
 */
export function solarRadiiToMeters(solarRadii: number): number {
  return solarRadii * SOLAR_RADIUS;
}

/**
 * Convert meters to solar radii
 */
export function metersToSolarRadii(meters: number): number {
  return meters / SOLAR_RADIUS;
}

/**
 * Convert days to seconds
 */
export function daysToSeconds(days: number): number {
  return days * SECONDS_PER_DAY;
}

/**
 * Convert seconds to days
 */
export function secondsToDays(seconds: number): number {
  return seconds / SECONDS_PER_DAY;
}

/**
 * Convert years to seconds
 */
export function yearsToSeconds(years: number): number {
  return years * SECONDS_PER_YEAR;
}

/**
 * Convert seconds to years
 */
export function secondsToYears(seconds: number): number {
  return seconds / SECONDS_PER_YEAR;
}
