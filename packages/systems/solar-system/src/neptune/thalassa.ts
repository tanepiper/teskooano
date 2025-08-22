import { createOrbitalElements } from "@teskooano/core-physics";
import {
  CelestialStatus,
  CelestialType,
  PlanetType,
  type CelestialObject,
  type PlanetProperties,
} from "@teskooano/data-types";

/**
 * Thalassa configuration object for modular solar system initialization.
 */
export const thalassa: CelestialObject<PlanetProperties> = {
  id: "thalassa",
  name: "Thalassa",
  seed: "thalassa",
  type: CelestialType.MOON,
  status: CelestialStatus.ACTIVE,
  parentId: "neptune",
  realMass_kg: 4e17,
  realRadius_m: 40000,
  temperature: 60,
  albedo: 0.07,
  orbit: createOrbitalElements({
    semiMajorAxisAU: 0.00026,
    eccentricity: 0.0002,
    inclinationDeg: 0.21,
    longitudeOfAscendingNodeDeg: 0,
    argumentOfPeriapsisDeg: 0,
    meanAnomalyDeg: 0,
    period_s: 7.5 * 3600,
    siderealRotationPeriod_s: 7.5 * 3600,
    axialTiltDeg: 0,
  }),
  properties: {
    type: CelestialType.MOON,
    classType: PlanetType.ROCKY,
    isMoon: true,
    composition: ["water ice", "rock"],
    surface: {
      roughness: 0.8,
      persistence: 0.5,
      lacunarity: 2.1,
      simplePeriod: 3.0,
      octaves: 6,
      bumpScale: 0.6,
      color1: "#666666",
      color2: "#7A7A7A",
      color3: "#888888",
      color4: "#A0A0A0",
      color5: "#B8B8B8",
      height1: 0.05,
      height2: 0.25,
      height3: 0.5,
      height4: 0.75,
      height5: 0.9,
      shininess: 4,
      specularStrength: 0.05,
      ambientLightIntensity: 0.01, // Minimal ambient for dynamic lighting
      undulation: 0.2,
      terrainType: 1,
      terrainAmplitude: 0.3,
      terrainSharpness: 1.4,
      terrainOffset: 0.0,
    },
  },
};
