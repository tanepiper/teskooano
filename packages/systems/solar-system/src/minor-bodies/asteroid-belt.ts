import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";
import { AU } from "@teskooano/core-physics";
import {
  CelestialType,
  CelestialStatus,
  type AsteroidFieldProperties,
  CelestialObject,
} from "@teskooano/data-types";

const BELT_CENTER_AU = 2.7;
const BELT_INNER_AU = 2.1;
const BELT_OUTER_AU = 3.3;
const BELT_HEIGHT_AU = 0.5;
const BELT_AVG_ECC = 0.079;
const BELT_AVG_INC_DEG = 9.0;
const BELT_TOTAL_MASS_KG = 3e21;
const BELT_ASTEROID_COUNT = 50000;

/**
 * Main asteroid belt configuration object for modular solar system initialization.
 */
export const asteroidBelt: CelestialObject<AsteroidFieldProperties> = {
  id: "asteroid-belt-main",
  name: "Main Asteroid Belt",
  type: CelestialType.ASTEROID_FIELD,
  status: CelestialStatus.ACTIVE,
  parentId: "sun", // Will be replaced during initialization
  realMass_kg: BELT_TOTAL_MASS_KG,
  realRadius_m: BELT_OUTER_AU * AU,
  orbit: {
    realSemiMajorAxis_m: BELT_CENTER_AU * AU,
    eccentricity: BELT_AVG_ECC,
    inclination: BELT_AVG_INC_DEG * DEG_TO_RAD,
    longitudeOfAscendingNode: 80.0 * DEG_TO_RAD,
    argumentOfPeriapsis: 73.0 * DEG_TO_RAD,
    meanAnomaly: 0.0 * DEG_TO_RAD,
    period_s: Math.sqrt(Math.pow(BELT_CENTER_AU, 3)) * 3.15576e7,
  },
  temperature: 165,
  albedo: 0.12, // Typical asteroid belt albedo (similar to dark asteroids)
  ignorePhysics: false,
  ignoreCollisions: true,
  properties: {
    type: CelestialType.ASTEROID_FIELD,
    innerRadiusAU: BELT_INNER_AU,
    outerRadiusAU: BELT_OUTER_AU,
    heightAU: BELT_HEIGHT_AU,
    count: BELT_ASTEROID_COUNT,
    color: "#b4afac",
    composition: ["silicates", "carbonaceous", "metallic", "icy fragments"],
  },
};
