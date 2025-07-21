import { createOrbitalElements, kmToM } from "@teskooano/core-physics";
import {
  CelestialType,
  CelestialStatus,
  PlanetType,
  SurfaceType,
  type PlanetProperties,
  type CelestialObject,
} from "@teskooano/data-types";

/**
 * Dione configuration object for modular solar system initialization.
 */
export const dione: CelestialObject<PlanetProperties> = {
  id: "dione",
  name: "Dione",
  seed: "dione",
  type: CelestialType.MOON,
  status: CelestialStatus.ACTIVE,
  parentId: "saturn", // Will be replaced during initialization
  realMass_kg: 1.095e21,
  realRadius_m: kmToM(561.4),
  temperature: 87,
  albedo: 0.998,
  orbit: createOrbitalElements({
    semiMajorAxisAU: 0.00266,
    eccentricity: 0.0022,
    inclinationDeg: 0.019,
    longitudeOfAscendingNodeDeg: 128.2,
    argumentOfPeriapsisDeg: 91.1,
    meanAnomalyDeg: 357.6,
    period_s: 236518,
    siderealRotationPeriod_s: 236518,
    axialTiltDeg: 0,
  }),
  properties: {
    type: CelestialType.MOON,
    classType: PlanetType.BARREN,
    isMoon: true,
    composition: ["water ice", "rocky core"],
    atmosphere: undefined,
    surface: {
      roughness: 0.5,
      persistence: 0.55,
      lacunarity: 2.0,
      simplePeriod: 2.2,
      octaves: 8,
      bumpScale: 2.4,
      color1: "#B0B0B0",
      color2: "#D0D0D0",
      color3: "#E0E0E0",
      color4: "#F0F0F0",
      color5: "#FFFFFF",
      height1: 0.12,
      height2: 0.28,
      height3: 0.5,
      height4: 0.72,
      height5: 0.88,
      shininess: 28,
      specularStrength: 0.6,
      ambientLightIntensity: 0.01, // Minimal ambient for dynamic lighting
      undulation: 0.18,
      terrainType: 3,
      terrainAmplitude: 0.65,
      terrainSharpness: 1.2,
      terrainOffset: 0.1,
    },
  },
};
