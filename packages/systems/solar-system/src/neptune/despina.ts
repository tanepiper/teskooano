import { createOrbitalElements, kmToM } from "@teskooano/core-physics";
import {
  type CelestialObject,
  CelestialType,
  CelestialStatus,
  PlanetType,
  type PlanetProperties,
} from "@teskooano/data-types";

/**
 * Despina configuration object for modular solar system initialization.
 */
export const despina: CelestialObject<PlanetProperties> = {
  id: "despina",
  name: "Despina",
  seed: "despina",
  type: CelestialType.MOON,
  status: CelestialStatus.ACTIVE,
  parentId: "neptune", // Will be replaced during initialization
  realMass_kg: 2.1e18,
  realRadius_m: 78000,
  temperature: 60,
  albedo: 0.09,
  orbit: createOrbitalElements({
    semiMajorAxisAU: 0.00035,
    eccentricity: 0.0001,
    inclinationDeg: 0.07,
    longitudeOfAscendingNodeDeg: 0,
    argumentOfPeriapsisDeg: 0,
    meanAnomalyDeg: 0,
    period_s: 8.0 * 3600,
    siderealRotationPeriod_s: 8.0 * 3600,
    axialTiltDeg: 0,
  }),
  properties: {
    type: CelestialType.MOON,
    classType: PlanetType.ROCKY,
    isMoon: true,
    composition: ["water ice", "rock"],
    surface: {
      roughness: 0.85,
      persistence: 0.5,
      lacunarity: 2.1,
      simplePeriod: 3.0,
      octaves: 6,
      bumpScale: 0.6,
      color1: "#707070",
      color2: "#808080",
      color3: "#909090",
      color4: "#A8A8A8",
      color5: "#C0C0C0",
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
