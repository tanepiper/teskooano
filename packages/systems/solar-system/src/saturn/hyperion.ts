import { createOrbitalElements, kmToM } from "@teskooano/core-physics";
import {
  CelestialType,
  CelestialStatus,
  PlanetType,
  SurfaceType,
  type PlanetProperties,
  CelestialObject,
} from "@teskooano/data-types";

const HYPERION_MASS_KG = 5.58e18;
const HYPERION_RADIUS_KM = 135;
const HYPERION_SMA_KM = 1481109;
const HYPERION_ECC = 0.123;
const HYPERION_INC_DEG = 0.648;
const HYPERION_LAN_DEG = 161.4;
const HYPERION_AOP_DEG = 156.4;
const HYPERION_MA_DEG = 199.3;
const HYPERION_SIDEREAL_PERIOD_S = 1838531;
const HYPERION_ALBEDO = 0.3;

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
  realMass_kg: HYPERION_MASS_KG,
  realRadius_m: kmToM(HYPERION_RADIUS_KM),
  temperature: 94,
  albedo: HYPERION_ALBEDO,
  orbit: createOrbitalElements({
    semiMajorAxisAU: HYPERION_SMA_KM / 149597870.7, // Convert km to AU
    eccentricity: HYPERION_ECC,
    inclinationDeg: HYPERION_INC_DEG,
    longitudeOfAscendingNodeDeg: HYPERION_LAN_DEG,
    argumentOfPeriapsisDeg: HYPERION_AOP_DEG,
    meanAnomalyDeg: HYPERION_MA_DEG,
    period_s: HYPERION_SIDEREAL_PERIOD_S,
    siderealRotationPeriod_s: HYPERION_SIDEREAL_PERIOD_S,
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
