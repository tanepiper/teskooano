import { AU } from "@teskooano/core-physics";
import { actions } from "@teskooano/core-state";
import { CelestialType, CelestialStatus } from "@teskooano/data-types";
import { OSVector3 } from "@teskooano/core-math";

const OORT_INNER_AU = 2000;
const OORT_OUTER_AU = 100000;
const OORT_TOTAL_MASS_KG = 1e25;
const OORT_PARTICLE_COUNT = 50000;

/**
 * Initializes the Oort Cloud using representative estimated data.
 */
export function initializeOortCloud(parentId: string): void {
  actions.addCelestial({
    id: "oort-cloud",
    name: "Oort Cloud",
    type: CelestialType.OORT_CLOUD,
    status: CelestialStatus.ACTIVE,
    parentId: parentId,
    realMass_kg: OORT_TOTAL_MASS_KG,
    realRadius_m: OORT_OUTER_AU * AU,

    orbit: {
      realSemiMajorAxis_m: ((OORT_INNER_AU + OORT_OUTER_AU) / 2) * AU,
      eccentricity: 0,
      inclination: 0,
      longitudeOfAscendingNode: 0,
      argumentOfPeriapsis: 0,
      meanAnomaly: 0,
      period_s: 1e13,
      siderealRotationPeriod_s: 1e13,
      axialTilt: new OSVector3(0, 1, 0).normalize(),
    },
    temperature: 4,
    ignorePhysics: true,
    physicsStateReal: {
      id: "oort-cloud",
      mass_kg: OORT_TOTAL_MASS_KG,
      position_m: new OSVector3(0, 0, 0), // Will be calculated by the factory
      velocity_mps: new OSVector3(0, 0, 0), // Will be calculated by the factory
    },
    properties: {
      type: CelestialType.OORT_CLOUD,
      composition: ["water ice", "ammonia ice", "methane ice"],
      innerRadiusAU: OORT_INNER_AU,
      outerRadiusAU: OORT_OUTER_AU,

      visualDensity: 1e-15,
      visualParticleCount: OORT_PARTICLE_COUNT,
      visualParticleColor: "#B0C4DE",
    },
  });
}
