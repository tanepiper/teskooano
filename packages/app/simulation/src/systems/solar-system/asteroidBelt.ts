import { DEG_TO_RAD } from "@teskooano/core-math";
import { AU } from "@teskooano/core-physics";
import { actions } from "@teskooano/core-state";
import {
  CelestialType,
  RockyType,
  type AsteroidFieldProperties,
} from "@teskooano/data-types";

// --- Asteroid Belt Constants (Approximate values) ---
const BELT_CENTER_AU = 2.7; // Approximate center of the main belt
const BELT_INNER_AU = 2.1; // Inner edge estimate
const BELT_OUTER_AU = 3.3; // Outer edge estimate
const BELT_HEIGHT_AU = 0.5; // Approximate thickness (related to average inclination)
const BELT_AVG_ECC = 0.079; // Average eccentricity (approx)
const BELT_AVG_INC_DEG = 9.0; // Average inclination (approx, varies widely)
const BELT_TOTAL_MASS_KG = 3e21; // Estimated total mass (a fraction of Moon's mass)
const BELT_ASTEROID_COUNT = 50000; // Representative number for simulation/rendering

/**
 * Initializes the main Asteroid Belt using representative data.
 */
export function initializeAsteroidBelt(parentId: string): void {
  actions.addCelestial({
    id: "asteroid-belt-main",
    name: "Main Asteroid Belt",
    type: CelestialType.ASTEROID_FIELD,
    parentId: parentId,
    realMass_kg: BELT_TOTAL_MASS_KG, // Total mass of the belt
    // Radius represents the extent/size, not a single body radius
    realRadius_m: ((BELT_OUTER_AU - BELT_INNER_AU) * AU) / 2, // Half the width
    // Orbital parameters represent the approximate orbit of the belt's barycenter
    orbit: {
      realSemiMajorAxis_m: BELT_CENTER_AU * AU,
      eccentricity: BELT_AVG_ECC,
      inclination: BELT_AVG_INC_DEG * DEG_TO_RAD,
      // LAN, AOP, MA are less meaningful for the whole belt, can be randomized or set to 0
      longitudeOfAscendingNode: Math.random() * 2 * Math.PI,
      argumentOfPeriapsis: Math.random() * 2 * Math.PI,
      meanAnomaly: Math.random() * 2 * Math.PI,
      // Period corresponds to the center SMA (Kepler's 3rd Law)
      // P^2 = a^3 (in AU/years) -> P = sqrt(2.7^3) ~ 4.4 years
      period_s: 4.4 * 3.15576e7, // Approx period in seconds
    },
    // No single temp/albedo for the field
    temperature: 165, // Approx temperature at this distance (K)
    properties: {
      type: CelestialType.ASTEROID_FIELD,
      innerRadiusAU: BELT_INNER_AU,
      outerRadiusAU: BELT_OUTER_AU,
      heightAU: BELT_HEIGHT_AU,
      count: BELT_ASTEROID_COUNT,
      color: "#8B4513", // Average color (Saddle Brown - rocky/dusty)
      composition: ["silicates", "carbonaceous", "metallic", "ice"], // Diverse composition
      asteroidType: RockyType.DARK_ROCK, // Default visual type for asteroids
    } as AsteroidFieldProperties,
  });
}
