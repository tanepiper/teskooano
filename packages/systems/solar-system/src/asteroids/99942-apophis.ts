import { createOrbitalElements, kmToM } from "@teskooano/core-physics";
import { CONVERSION } from "@teskooano/core-physics";
import {
  type CelestialObject,
  CelestialStatus,
  CelestialType,
  type AsteroidProperties,
  AsteroidClass,
} from "@teskooano/data-types";
import * as THREE from "three";

/**
 * 99942 Apophis asteroid configuration object.
 * Data sourced from: https://en.wikipedia.org/wiki/99942_Apophis
 *
 * Notable for its close approach to Earth on April 13, 2029, when it will pass
 * within 31,000 km of Earth's surface - closer than many satellites.
 */
export const apophis: CelestialObject<AsteroidProperties> = {
  id: "99942-apophis",
  name: "99942 Apophis",
  seed: "99942-apophis",
  type: CelestialType.ASTEROID,
  status: CelestialStatus.ACTIVE,
  parentId: "sun",
  realMass_kg: 6.1e10, // 6.1×10^10 kg (assumed)
  realRadius_m: 450, // Mean radius: 0.185 km (0.17±0.02 km)
  temperature: 270, // 270 K
  albedo: 0.23, // Geometric albedo: 0.23 (range 0.35±0.10)
  orbit: createOrbitalElements({
    semiMajorAxisAU: 0.9224, // 0.9224 AU (137.99 million km)
    eccentricity: 0.1911, // 0.1911
    inclinationDeg: 3.341, // 3.341°
    longitudeOfAscendingNodeDeg: 203.9, // 203.9°
    argumentOfPeriapsisDeg: 126.7, // Argument of perihelion: 126.7°
    meanAnomalyDeg: 90.28, // Mean anomaly: 90.28°
    period_s: 323.6 * CONVERSION.DAYS_TO_S, // 323.6 days (0.886 yr)
    siderealRotationPeriod_s: 30.56 * CONVERSION.HOURS_TO_S, // 30.56±0.01 h (strongest harmonic)
    axialTiltDeg: 0, // Not specified, assuming 0
    epoch: "2025-05-05", // Epoch: May 5, 2025 (JD 2460800.5)
  }),
  properties: {
    type: CelestialType.ASTEROID,
    classType: AsteroidClass.SHORT_PERIOD, // Aten-type NEO with short period
    color: "#8b7355", // Brownish color typical for Sq-type asteroids
    composition: "silicates, metals", // Sq spectral type indicates silicate-metal composition
    density: 3.2, // ~3.2 g/cm³ (range 2.6 g/cm³ assumed)
    temperature: 270, // 270 K
    activity: 0.0, // Asteroids are generally inactive
    visuals: {
      darkColorMultiplier: 0.75,
      lightColorMultiplier: 1.25,
      fbmScale: 2.0, // Slightly larger scale for the smaller asteroid
      fineFbmScale: 20.0,
      fineFbmMix: 0.12,
      ambientStrength: 0.025,
      metallicFactor: 0.25, // Sq-type has moderate metallic content
      roughness: 0.8, // Rough surface typical of small asteroids
      specularColor: new THREE.Color("#b8b8b8"), // Grayish specular highlights
      shininess: 0.4,
      undulation: 0.08, // Smaller undulations for smaller body
      terrainType: 2, // Different terrain type from Eros
      terrainAmplitude: 0.12, // Moderate terrain variation
    },
  },
};
