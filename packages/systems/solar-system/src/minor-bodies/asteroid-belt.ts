import { createOrbitalElements, kmToM } from "@teskooano/core-physics";
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
  realRadius_m: BELT_OUTER_AU * 149597870.7, // Convert AU to meters
  orbit: createOrbitalElements({
    semiMajorAxisAU: BELT_CENTER_AU,
    eccentricity: BELT_AVG_ECC,
    inclinationDeg: BELT_AVG_INC_DEG,
    longitudeOfAscendingNodeDeg: 80.0,
    argumentOfPeriapsisDeg: 73.0,
    meanAnomalyDeg: 0.0,
    period_s: Math.sqrt(Math.pow(BELT_CENTER_AU, 3)) * 3.15576e7,
    siderealRotationPeriod_s: 0, // Asteroid belt doesn't rotate
    axialTiltDeg: 0,
  }),
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
