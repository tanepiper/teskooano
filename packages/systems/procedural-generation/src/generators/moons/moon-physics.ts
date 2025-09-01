import { OSVector3 } from "@teskooano/core-math";
import { EARTH_MASS } from "@teskooano/data-values";
import * as UTIL from "../../utils-functions";

/**
 * Moon physical properties generation
 *
 * This module handles the generation of realistic moon physical
 * properties including mass, density, radius, and rotation based
 * on formation mechanisms and astronomical observations.
 */

/**
 * Generate realistic moon mass based on formation mechanism
 */
export function generateRealisticMoonMass(
  random: () => number,
  planetMass: number,
  formation: string,
): number {
  switch (formation) {
    case "co-accretion":
      // Co-accreted moons: 0.001% - 0.1% of planet mass (like Galilean moons)
      return planetMass * (0.00001 + random() * 0.001);

    case "impact":
      // Impact-formed moons: larger, like Earth's Moon (1.2% of Earth's mass)
      return planetMass * (0.005 + random() * 0.02);

    case "capture":
      // Captured objects: highly variable, generally smaller
      return planetMass * (0.000001 + random() * 0.0001);

    default:
      return planetMass * (0.00001 + random() * 0.001);
  }
}

/**
 * Generate moon density based on formation mechanism
 */
export function generateMoonDensity(
  random: () => number,
  formation: string,
): number {
  switch (formation) {
    case "co-accretion":
      // Similar to parent planet, moderate density
      return 2000 + random() * 2500; // 2.0 - 4.5 g/cm³

    case "impact":
      // Iron-depleted, rocky (like Earth's Moon: 3.34 g/cm³)
      return 3000 + random() * 1000; // 3.0 - 4.0 g/cm³

    case "capture":
      // Variable density, often low (asteroids/comets)
      return 1000 + random() * 3000; // 1.0 - 4.0 g/cm³

    default:
      return 2000 + random() * 2000;
  }
}

/**
 * Calculate moon radius from mass and density
 */
export function calculateMoonRadius(
  moonMass: number,
  moonDensity: number,
): number {
  return UTIL.calculateRadius(moonMass, moonDensity);
}

/**
 * Generate realistic moon rotation period (many moons are tidally locked)
 */
export function generateMoonRotation(
  random: () => number,
  orbitalPeriod: number,
  moonDistance: number,
  planetRadius: number,
): number {
  // Close moons are likely tidally locked
  const tidal_locking_threshold = planetRadius * 15;

  if (moonDistance < tidal_locking_threshold) {
    // Tidally locked: rotation period = orbital period
    return orbitalPeriod * (0.95 + random() * 0.1); // Some variation
  } else {
    // Non-tidally locked: independent rotation
    return 50000 + random() * 500000; // 14 hours to 6 days
  }
}

/**
 * Generate axial tilt for moon (generally small due to tidal forces)
 */
export function generateMoonAxialTilt(random: () => number): OSVector3 {
  const tilt_deg = random() * 10; // Most moons have low obliquity
  const tilt_rad = tilt_deg * (Math.PI / 180);
  return new OSVector3(0, Math.cos(tilt_rad), Math.sin(tilt_rad));
}
