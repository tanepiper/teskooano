import { OSVector3 } from "@teskooano/core-math";
import type {
  CelestialObject,
  OortCloudProperties,
  OrbitalParameters,
} from "@teskooano/data-types";
import { CelestialStatus, CelestialType } from "@teskooano/data-types";

/**
 * Generates data for an Oort cloud surrounding a star.
 * @param random The seeded random function.
 * @param parentStar The parent star object.
 * @returns The generated Oort cloud's data.
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
  const innerRadiusAU = 200 + random() * 50; // 200-250 AU
  const outerRadiusAU = innerRadiusAU + 50 + random() * 50; // 50-100 AU thickness (Outer: 250-350 AU)

  const oortProperties: OortCloudProperties = {
    type: CelestialType.OORT_CLOUD,
    innerRadiusAU: innerRadiusAU,
    outerRadiusAU: outerRadiusAU,
    composition: ["ice", "methane ice", "ammonia ice"],
    visualDensity: 0.05 + random() * 0.1, // Low density
    visualParticleCount: 10000 + random() * 15000, // 10k-25k particles
    visualParticleColor: "#B0D0FF", // Pale icy blue
  };

  // Oort cloud doesn't really "orbit" in the traditional sense for this simulation
  const oortOrbit: OrbitalParameters = {
    realSemiMajorAxis_m: 0, // Centered on parent
    eccentricity: 0,
    inclination: 0,
    longitudeOfAscendingNode: 0,
    argumentOfPeriapsis: 0,
    meanAnomaly: 0,
    period_s: 0, // Effectively infinite / not applicable
  };

  const oortCloud: CelestialObject = {
    id: oortCloudId,
    name: oortCloudName,
    type: CelestialType.OORT_CLOUD,
    status: CelestialStatus.ACTIVE,
    parentId: parentStar.id,
    realMass_kg: 0, // Negligible mass
    realRadius_m: 0, // Not applicable
    temperature: 10 + random() * 20, // Very cold (10-30K)
    orbit: oortOrbit,
    properties: oortProperties,
    ignorePhysics: true, // Exclude from physics calculations
    physicsStateReal: {
      // Static position relative to parent
      id: oortCloudId,
      mass_kg: 0,
      position_m: new OSVector3(0, 0, 0), // Will be updated by factory based on parent
      velocity_mps: new OSVector3(0, 0, 0), // Will be updated by factory based on parent
    },
  };
  return oortCloud;
}
