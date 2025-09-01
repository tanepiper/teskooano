import { createOrbitalElements } from "@teskooano/core-physics";
import {
  AsteroidClass,
  CelestialObject,
  CelestialStatus,
  CelestialType,
  type AsteroidProperties,
} from "@teskooano/data-types";
import * as THREE from "three";

/**
 * 1I/'Oumuamua
 *
 * The first known interstellar object to pass through our solar system.
 * Discovered in 2017, it has a hyperbolic orbit indicating it came from outside our solar system.
 * No outgassing was observed, suggesting it may be an extinct comet or asteroid.
 */
export const oumuamua: CelestialObject<AsteroidProperties> = {
  id: "1i-oumuamua",
  name: "1I/'Oumuamua",
  type: CelestialType.ASTEROID,
  status: CelestialStatus.ACTIVE,
  parentId: "sun",
  realMass_kg: 2.3e8, // ~230 million tons
  realRadius_m: 115, // ~115m radius (estimated)
  temperature: 200, // Cold interstellar object
  orbit: createOrbitalElements({
    semiMajorAxisAU: -1.28, // Negative for hyperbolic orbit
    eccentricity: 1.201,
    inclinationDeg: 122.74,
    longitudeOfAscendingNodeDeg: 24.6,
    argumentOfPeriapsisDeg: 241.8,
    meanAnomalyDeg: 0,
    period_s: 0, // No period for hyperbolic orbits
    siderealRotationPeriod_s: 8.67 * 3600, // 8.67 hours
    axialTiltDeg: 0, // Tumbling object
    isHyperbolic: true,
    epoch: "J2017.5", // Discovery epoch (mid-2017)
  }),
  properties: {
    type: CelestialType.ASTEROID,
    classType: AsteroidClass.INTERSTELLAR,
    composition: "rock", // No ice detected
    activity: 0.0, // No outgassing observed
    colors: ["#8B4513", "#7A3F11", "#69390F", "#58330D"],
    heights: [0.0, 0.4, 0.6, 0.8],
    density: 3.2, // ~3.2 g/cm³ (range 2.6 g/cm³ assumed)
    temperature: 270, // 270 K
    visuals: {
      noiseScale: 2.2,
      blendSharpness: 1.0,
      craterScale: 22.0,
      craterStrength: 0.5,
      simplePeriod: 2.0,
      undulation: 0.15,
      ambientStrength: 0.025,
      metallicFactor: 0.25, // Sq-type has moderate metallic content
      roughness: 0.8, // Rough surface typical of small asteroids
      specularColor: new THREE.Color("#b8b8b8"), // Grayish specular highlights
    },
  },
};
