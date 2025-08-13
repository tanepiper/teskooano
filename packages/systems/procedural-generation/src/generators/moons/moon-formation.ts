/**
 * Moon formation mechanism logic and calculations
 *
 * This module handles the determination of moon formation mechanisms
 * and their associated physical constraints based on realistic
 * astronomical models.
 */

import { EARTH_MASS } from "@teskooano/data-values";

/**
 * Determine moon formation mechanism based on planet mass and realistic probabilities
 */
export function determineMoonFormation(
  random: () => number,
  planetMass: number,
): "co-accretion" | "capture" | "impact" {
  const planetMassRatio = planetMass / EARTH_MASS;

  // Larger planets more likely to have co-accreted moons
  if (planetMassRatio > 10) {
    // Gas giants
    if (random() < 0.8) return "co-accretion";
    else return "capture";
  } else if (planetMassRatio > 0.5) {
    // Large terrestrial planets
    if (random() < 0.4) return "co-accretion";
    else if (random() < 0.7) return "impact";
    else return "capture";
  } else {
    // Small planets
    if (random() < 0.6) return "capture";
    else if (random() < 0.8) return "impact";
    else return "co-accretion";
  }
}

/**
 * Calculate Hill radius for orbital stability check
 */
export function calculateHillRadius(
  orbitRadius: number,
  planetMass: number,
  starMass: number,
): number {
  return orbitRadius * Math.pow(planetMass / (3 * starMass), 1 / 3);
}

/**
 * Calculate Roche limit for moon stability
 */
export function calculateRocheLimit(
  planetRadius: number,
  planetDensity: number,
  moonDensity: number,
): number {
  return 2.44 * planetRadius * Math.pow(planetDensity / moonDensity, 1 / 3);
}
