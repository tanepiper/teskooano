import { type CelestialObject } from "@teskooano/data-types";
import { AU_METERS } from "@teskooano/data-values";

/**
 * Calculates binary stability constraints to prevent orbital decay
 */
export interface BinaryStabilityResult {
  isStable: boolean;
  minSeparationAU: number;
  recommendedSeparationAU: number;
  warnings: string[];
}

/**
 * Validates and calculates binary stability constraints
 */
export function calculateBinaryStability(
  star1: CelestialObject,
  star2: CelestialObject,
  proposedSeparationAU: number,
): BinaryStabilityResult {
  const warnings: string[] = [];

  // Convert stellar radii to AU for calculations
  const star1RadiusAU = star1.realRadius_m / AU_METERS;
  const star2RadiusAU = star2.realRadius_m / AU_METERS;

  // Minimum separation: must be outside both stellar photospheres with safety margin
  const minSeparationAU = (star1RadiusAU + star2RadiusAU) * 3.0; // 3x safety margin

  // Calculate Roche limit for stability (simplified calculation)
  const massRatio = star2.realMass_kg / star1.realMass_kg;
  const rocheLimit =
    (proposedSeparationAU * 0.49 * Math.pow(massRatio, 2 / 3)) /
    (0.6 * Math.pow(massRatio, 2 / 3) +
      Math.log(1 + Math.pow(massRatio, 1 / 3)));

  // Minimum stable separation (conservative estimate)
  const rocheStableSeparation = Math.max(minSeparationAU, rocheLimit * 2.5);

  // For n-body stability, close binaries should have circular orbits
  // Recommended separation for numerical stability
  const recommendedSeparationAU = Math.max(rocheStableSeparation, 0.5); // At least 0.5 AU for close binaries

  // Check various stability conditions
  let isStable = true;

  if (proposedSeparationAU < minSeparationAU) {
    isStable = false;
    warnings.push(
      `Stars too close: ${proposedSeparationAU.toFixed(3)} AU < minimum ${minSeparationAU.toFixed(3)} AU`,
    );
  }

  if (proposedSeparationAU < rocheStableSeparation) {
    isStable = false;
    warnings.push(
      `Within Roche limit: potential mass transfer and instability`,
    );
  }

  // Warning for very tight systems that might need smaller timesteps
  if (proposedSeparationAU < 1.0 && isStable) {
    warnings.push(
      `Close binary detected: may require smaller simulation timesteps for stability`,
    );
  }

  return {
    isStable,
    minSeparationAU,
    recommendedSeparationAU,
    warnings,
  };
}
