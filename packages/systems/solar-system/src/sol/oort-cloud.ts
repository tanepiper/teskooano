import { createOrbitalElements } from "@teskooano/core-physics";
import {
  CelestialType,
  CelestialStatus,
  type OortCloudProperties,
  type CelestialObject,
  AU_METERS,
} from "@teskooano/data-types";
import { SolarSystemBodies } from "../shared/const";

/**
 * Oort Cloud configuration object for modular solar system initialization.
 */
export const oortCloud: CelestialObject<OortCloudProperties> = {
  id: "oort-cloud-main",
  name: "Oort Cloud",
  type: CelestialType.OORT_CLOUD,
  status: CelestialStatus.ACTIVE,
  parentId: SolarSystemBodies.SUN, // Oort cloud generally orbits the primary star
  realMass_kg: 5e22, // Estimated mass (higher than asteroid belt)
  realRadius_m: 20000 * AU_METERS, // Use outer radius for the representative size
  orbit: createOrbitalElements({
    semiMajorAxisAU: 10000, // Very distant, average orbital distance
    eccentricity: 0.0, // Assumed near-circular for the cloud center
    inclinationDeg: 0.0, // Assumed distributed spherically
    longitudeOfAscendingNodeDeg: 0.0,
    argumentOfPeriapsisDeg: 0.0,
    meanAnomalyDeg: 0.0,
    // Period is enormous, can be approximate or left for calculation based on semi-major axis
    period_s: Math.sqrt(Math.pow(10000, 3)) * 3.15576e7,
    siderealRotationPeriod_s: 0,
    axialTiltDeg: 0,
  }),
  temperature: 10, // Very cold
  albedo: 0.05, // Very dark, icy bodies
  ignorePhysics: true, // Oort cloud particles usually don't participate in N-body physics directly
  ignoreCollisions: true,
  properties: {
    type: CelestialType.OORT_CLOUD,
    innerRadiusAU: 200,
    outerRadiusAU: 600,
    visualParticleCount: 100000, // Number of instanced particles
    visualDensity: 1.0,
    visualParticleColor: "#161717", // Dark, icy color
    composition: ["ice", "rock", "methane", "ammonia"],
    texturePaths: [
      "space/textures/asteroids/asteroid_1.png",
      "space/textures/asteroids/asteroid_2.png",
      "space/textures/asteroids/asteroid_3.png",
      "space/textures/asteroids/asteroid_4.png",
      "space/textures/asteroids/asteroid_5.png",
    ],
    // Additional properties for consistency
    count: 100000, // Alternative to visualParticleCount
    color: "#161717", // Alternative to visualParticleColor
  },
};
