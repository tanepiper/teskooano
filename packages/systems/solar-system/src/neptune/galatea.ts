import { createOrbitalElements, kmToM } from "@teskooano/core-physics";
import {
  type CelestialObject,
  CelestialType,
  CelestialStatus,
  PlanetType,
  type PlanetProperties,
} from "@teskooano/data-types";

/**
 * Galatea configuration object for modular solar system initialization.
 */
export const galatea: CelestialObject<PlanetProperties> = {
  id: "galatea",
  name: "Galatea",
  seed: "galatea",
  type: CelestialType.MOON,
  status: CelestialStatus.ACTIVE,
  parentId: "neptune", // Will be replaced during initialization
  realMass_kg: 8.0e18,
  realRadius_m: 88000,
  temperature: 60,
  albedo: 0.08,
  orbit: createOrbitalElements({
    semiMajorAxisAU: 0.0004,
    eccentricity: 0.0002,
    inclinationDeg: 0.05,
    longitudeOfAscendingNodeDeg: 0,
    argumentOfPeriapsisDeg: 0,
    meanAnomalyDeg: 0,
    period_s: 10.3 * 3600,
    siderealRotationPeriod_s: 10.3 * 3600,
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
      color1: "#717171",
      color2: "#888888",
      color3: "#979797",
      color4: "#ABABAB",
      color5: "#C5C5C5",
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
