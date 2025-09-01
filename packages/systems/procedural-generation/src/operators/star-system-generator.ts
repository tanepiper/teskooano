import type { CelestialObject, StarProperties } from "@teskooano/data-types";
import { generateStar } from "../generators/stars/star";
import type { StellarSystemConfiguration } from "../zones/types";
import { setupBinaryOrbit } from "./binary-orbit-setup";

/**
 * Generates a complete stellar system based on the configuration
 */
export function generateStellarSystem(
  random: () => number,
  primaryStar: CelestialObject,
  config: StellarSystemConfiguration,
): CelestialObject[] {
  const stars: CelestialObject[] = [primaryStar];

  // Generate the required number of stars
  const starCount = config.stars;

  if (starCount === 1) {
    // Single star system - main star at origin
    primaryStar.parentId = undefined;
    // Ensure main star has no orbital motion (stays at origin)
    primaryStar.orbit = {
      realSemiMajorAxis_m: 0,
      eccentricity: 0,
      inclination: 0,
      longitudeOfAscendingNode: 0,
      argumentOfPeriapsis: 0,
      meanAnomaly: 0,
      period_s: 0,
      siderealRotationPeriod_s: 0,
      realAphelion_m: 0,
      realPerihelion_m: 0,
      averageOrbitalSpeed_mps: 0,
      epoch: "J2000",
    };
    return stars;
  }

  // Generate additional stars
  for (let i = 1; i < starCount; i++) {
    stars.push(generateStar(random));
  }

  // Sort by mass (most massive first)
  stars.sort((a, b) => b.realMass_kg - a.realMass_kg);

  const mainStar = stars[0];
  mainStar.parentId = undefined;

  // Ensure main star is positioned at origin (0,0,0) with no orbital motion
  mainStar.orbit = {
    realSemiMajorAxis_m: 0,
    eccentricity: 0,
    inclination: 0,
    longitudeOfAscendingNode: 0,
    argumentOfPeriapsis: 0,
    meanAnomaly: 0,
    period_s: 0,
    siderealRotationPeriod_s: 0,
    realAphelion_m: 0,
    realPerihelion_m: 0,
    averageOrbitalSpeed_mps: 0,
    epoch: "J2000",
  };

  // Set main star property
  if (mainStar.properties && mainStar.properties.type === "STAR") {
    (mainStar.properties as StarProperties).isMainStar = true;
  }

  // For multi-star systems, build hierarchy iteratively
  if (starCount >= 2) {
    // Each additional star orbits the main star
    for (let i = 1; i < stars.length; i++) {
      const companion = stars[i];
      companion.parentId = mainStar.id;

      // Set companion star property
      if (companion.properties && companion.properties.type === "STAR") {
        (companion.properties as StarProperties).isMainStar = false;
      }

      // Set up orbital parameters
      const separation = config.separationAU?.[i - 1] || 0.5 + random() * 9.5;
      const eccentricity = 0.01 + random() * 0.3;
      const inclination = (random() - 0.5) * 0.2;

      // Use setupBinaryOrbit to configure the orbital mechanics
      setupBinaryOrbit(
        mainStar,
        companion,
        separation,
        eccentricity,
        inclination,
        random,
      );
    }
  }

  return stars;
}
