import { SYSTEM_MAX_DISTANCE_AU } from "../../constants";
import { SOLAR_MASS } from "@teskooano/data-types";

/**
 * Validates if the given distance is appropriate for asteroid belt formation
 */
export function isValidAsteroidBeltDistance(
  distanceAU: number,
  starMass_kg: number,
): boolean {
  // Reject any distance beyond system boundary
  if (distanceAU > SYSTEM_MAX_DISTANCE_AU) {
    return false;
  }

  const massRatio = starMass_kg / SOLAR_MASS;

  // Scale frost line and belt formation zone with stellar mass
  const innerLimit = 1.5 * Math.sqrt(massRatio); // Too close for belt stability
  const outerLimit = 6.0 * Math.sqrt(massRatio); // Too far for main belt

  // Main asteroid belt: between Mars and Jupiter orbits (scaled)
  // Also allow for outer belts (like Kuiper belt analogs)
  // The two ranges are combined to prevent gaps for low-mass stars.
  return distanceAU >= innerLimit && distanceAU <= Math.max(outerLimit, 100);
}
