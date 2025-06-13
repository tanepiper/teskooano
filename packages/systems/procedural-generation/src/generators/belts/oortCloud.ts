import { OSVector3 } from "@teskooano/core-math";
import type {
  CelestialObject,
  OortCloudProperties,
  OrbitalParameters,
} from "@teskooano/data-types";
import { CelestialStatus, CelestialType } from "@teskooano/data-types";

/**
 * Generates data for an Oort cloud surrounding a star.
 *
 * @note This function is currently not used in the main `generateSystem` pipeline.
 *
 * @param random The seeded pseudo-random number generator function.
 * @param parentStar The parent star `CelestialObject`.
 * @returns The generated `CelestialObject` for the Oort cloud, or `null` if the
 *   parent star is invalid.
 */
export function generateOortCloud(
  random: () => number,
  parentStar: CelestialObject,
): CelestialObject | null {
  if (!parentStar || parentStar.type !== CelestialType.STAR) {
    console.error("[generateOortCloud] Invalid parent star provided.");
    return null;
  }

  const oortCloudId = `oortcloud-${parentStar.id}`;
  const oortCloudName = `${parentStar.name} Oort Cloud`;
  const innerRadiusAU = 200 + random() * 50;
  const outerRadiusAU = innerRadiusAU + 50 + random() * 50;

  const oortProperties: OortCloudProperties = {
    type: CelestialType.OORT_CLOUD,
    innerRadiusAU: innerRadiusAU,
    outerRadiusAU: outerRadiusAU,
    composition: ["ice", "methane ice", "ammonia ice"],
    visualDensity: 0.05 + random() * 0.1,
    visualParticleCount: 10000 + random() * 15000,
    visualParticleColor: "#B0D0FF",
  };

  const oortOrbit: OrbitalParameters = {
    realSemiMajorAxis_m: 0,
    eccentricity: 0,
    inclination: 0,
    longitudeOfAscendingNode: 0,
    argumentOfPeriapsis: 0,
    meanAnomaly: 0,
    period_s: 0,
  };

  const oortCloud: CelestialObject = {
    id: oortCloudId,
    name: oortCloudName,
    type: CelestialType.OORT_CLOUD,
    status: CelestialStatus.ACTIVE,
    parentId: parentStar.id,
    realMass_kg: 0,
    realRadius_m: 0,
    temperature: 10 + random() * 20,
    orbit: oortOrbit,
    properties: oortProperties,
    ignorePhysics: true,
    physicsStateReal: {
      id: oortCloudId,
      mass_kg: 0,
      position_m: new OSVector3(0, 0, 0),
      velocity_mps: new OSVector3(0, 0, 0),
    },
  };
  return oortCloud;
}
