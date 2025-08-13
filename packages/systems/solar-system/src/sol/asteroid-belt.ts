import { createOrbitalElements, kmToM } from "@teskooano/core-physics";
import {
  CelestialType,
  CelestialStatus,
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
    semiMajorAxisAU: 2.7,
    eccentricity: 0.079,
    inclinationDeg: 9.0,
    longitudeOfAscendingNodeDeg: 80.0,
    argumentOfPeriapsisDeg: 73.0,
    meanAnomalyDeg: 0.0,
    period_s: Math.sqrt(Math.pow(2.7, 3)) * 3.15576e7,
    siderealRotationPeriod_s: 0,
    axialTiltDeg: 0,
  }),
  temperature: 165,
  albedo: 0.12,
  ignorePhysics: false,
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
