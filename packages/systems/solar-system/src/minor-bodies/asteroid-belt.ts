import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";
import { AU } from "@teskooano/core-physics";
import { celestial } from "@teskooano/core-state";
import {
  CelestialType,
  CelestialStatus,
  type AsteroidFieldProperties,
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
 * Initializes the main Asteroid Belt using representative data.
 */
export function initializeAsteroidBelt(parentId: string): void {
  const position = new OSVector3(BELT_CENTER_AU * AU, 0, 0);
  const velocity = new OSVector3(0, 0, 0);

  celestial.addCelestial({
    id: "asteroid-belt-main",
    name: "Main Asteroid Belt",
    type: CelestialType.ASTEROID_FIELD,
    status: CelestialStatus.ACTIVE,
    parentId: parentId,
    realMass_kg: BELT_TOTAL_MASS_KG,
    realRadius_m: BELT_OUTER_AU * AU,
    physicsStateReal: {
      id: "asteroid-belt-main",
      mass_kg: BELT_TOTAL_MASS_KG,
      position_m: position,
      velocity_mps: velocity,
    },
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
    } as AsteroidFieldProperties,
  });
}
