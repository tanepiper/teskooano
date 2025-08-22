import { createOrbitalElements, kmToM } from "@teskooano/core-physics";
import {
  CelestialStatus,
  CelestialType,
  PlanetType,
  type CelestialObject,
  type PlanetProperties,
} from "@teskooano/data-types";

/**
 * Enceladus configuration object for modular solar system initialization.
 */
export const enceladus: CelestialObject<PlanetProperties> = {
  id: "enceladus",
  name: "Enceladus",
  seed: "enceladus",
  type: CelestialType.MOON,
  status: CelestialStatus.ACTIVE,
  parentId: "saturn", // Will be replaced during initialization
  realMass_kg: 1.08e20,
  realRadius_m: kmToM(252.1),
  temperature: 75,
  albedo: 1.375,
  orbit: createOrbitalElements({
    semiMajorAxisAU: 0.001594,
    eccentricity: 0.0047,
    inclinationDeg: 0.019,
    longitudeOfAscendingNodeDeg: 169.8,
    argumentOfPeriapsisDeg: 312.9,
    meanAnomalyDeg: 258.0,
    period_s: 118378,
    siderealRotationPeriod_s: 118378,
    axialTiltDeg: 0,
  }),
  properties: {
    type: CelestialType.MOON,
    classType: PlanetType.BARREN,
    isMoon: true,
    composition: [
      "water ice",
      "silicate core",
      "subsurface ocean",
      "water vapor geysers",
    ],
    atmosphere: {
      glowColor: "#FFFFFF",
      intensity: 0.05,
      power: 0.8,
      thickness: 0.02,
    },
    surface: {
      roughness: 0.3,
      persistence: 0.45,
      lacunarity: 1.8,
      simplePeriod: 1.2,
      octaves: 7,
      bumpScale: 1.8,
      color1: "#E0E8F0",
      color2: "#F0F0F8",
      color3: "#F8F8FF",
      color4: "#FFFFFF",
      color5: "#FFFFF0",
      height1: 0.15,
      height2: 0.3,
      height3: 0.5,
      height4: 0.75,
      height5: 0.9,
      shininess: 60,
      specularStrength: 0.4,
      ambientLightIntensity: 0.01, // Minimal ambient for dynamic lighting
      undulation: 0.12,
      terrainType: 3,
      terrainAmplitude: 0.4,
      terrainSharpness: 1.1,
      terrainOffset: 0.2,
    },
  },
};
