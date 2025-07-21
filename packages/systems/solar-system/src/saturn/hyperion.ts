import { createOrbitalElements, kmToM } from "@teskooano/core-physics";
import {
  CelestialType,
  CelestialStatus,
  PlanetType,
  SurfaceType,
  type PlanetProperties,
  CelestialObject,
} from "@teskooano/data-types";

/**
 * Hyperion configuration object for modular solar system initialization.
 */
export const hyperion: CelestialObject<PlanetProperties> = {
  id: "hyperion",
  name: "Hyperion",
  seed: "hyperion",
  type: CelestialType.MOON,
  status: CelestialStatus.ACTIVE,
  parentId: "saturn", // Will be replaced during initialization
  realMass_kg: 5.58e18,
  realRadius_m: kmToM(135),
  temperature: 94,
  albedo: 0.3,
  orbit: createOrbitalElements({
    semiMajorAxisAU: 0.00237492,
    eccentricity: 0.123,
    inclinationDeg: 0.648,
    longitudeOfAscendingNodeDeg: 161.4,
    argumentOfPeriapsisDeg: 156.4,
    meanAnomalyDeg: 199.3,
    period_s: 1838531,
    siderealRotationPeriod_s: 1838531,
    axialTiltDeg: 0,
  }),
  properties: {
    type: CelestialType.MOON,
    classType: PlanetType.ICE,
    isMoon: true,
    composition: ["water ice", "rocky material"],
    atmosphere: undefined,
    surface: {
      roughness: 0.9,
      persistence: 0.45,
      lacunarity: 2.5,
      simplePeriod: 1.5,
      octaves: 10,
      bumpScale: 5.0,
      color1: "#A9A190",
      color2: "#BDB7AB",
      color3: "#D1CDC1",
      color4: "#E0E0E0",
      color5: "#F0F0F0",
      height1: 0.1,
      height2: 0.3,
      height3: 0.5,
      height4: 0.7,
      height5: 0.9,
      shininess: 20,
      specularStrength: 0.3,
      ambientLightIntensity: 0.01, // Minimal ambient for dynamic lighting
      undulation: 0.4,
      terrainType: 1,
      terrainAmplitude: 0.9,
      terrainSharpness: 2.0,
      terrainOffset: 0.1,
    },
  },
};
