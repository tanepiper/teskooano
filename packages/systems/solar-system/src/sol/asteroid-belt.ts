import { createOrbitalElements } from "@teskooano/core-physics";
import {
  CelestialStatus,
  CelestialType,
  type AsteroidFieldProperties,
  type CelestialObject,
} from "@teskooano/data-types";
import { AU_METERS } from "@teskooano/data-values";

/**
 * Main asteroid belt configuration object for modular solar system initialization.
 */
export const asteroidBelt: CelestialObject<AsteroidFieldProperties> = {
  id: "asteroid-belt-main",
  name: "Main Asteroid Belt",
  type: CelestialType.ASTEROID_FIELD,
  status: CelestialStatus.ACTIVE,
  parentId: "sun",
  realMass_kg: 3e21,
  realRadius_m: (3.3 - 2.1) * AU_METERS,
  orbit: createOrbitalElements({
    semiMajorAxisAU: 0, // Belt is centered on the Sun
    eccentricity: 0,
    inclinationDeg: 0,
    longitudeOfAscendingNodeDeg: 0,
    argumentOfPeriapsisDeg: 0,
    meanAnomalyDeg: 0.0,
    period_s: 0, // No orbital motion - static visual feature
    siderealRotationPeriod_s: 0,
    axialTiltDeg: 0,
  }),
  temperature: 165,
  albedo: 0.12,
  ignorePhysics: true, // Belt is a static visual feature, not a physics object
  ignoreCollisions: true,
  properties: {
    type: CelestialType.ASTEROID_FIELD,
    innerRadiusAU: 2.1,
    outerRadiusAU: 3.3,
    heightAU: 0.5,
    count: 50000,
    color: "#b4afac",
    composition: ["silicates", "carbonaceous", "metallic", "icy fragments"],
    texturePaths: [
      "space/textures/asteroids/asteroid_1.png",
      "space/textures/asteroids/asteroid_2.png",
      "space/textures/asteroids/asteroid_3.png",
      "space/textures/asteroids/asteroid_4.png",
      "space/textures/asteroids/asteroid_5.png",
    ],
  },
};
