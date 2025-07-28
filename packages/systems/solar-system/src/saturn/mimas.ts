import { createOrbitalElements, kmToM } from "@teskooano/core-physics";
import {
  CelestialType,
  PlanetType,
  CelestialStatus,
  type PlanetProperties,
  CelestialObject,
} from "@teskooano/data-types";

const MIMAS_MASS_KG = 3.75e19;
const MIMAS_RADIUS_KM = 198.2;
const MIMAS_ECC = 0.0196;
const MIMAS_INC_DEG = 1.566;
const MIMAS_LAN_DEG = 123.5;
const MIMAS_AOP_DEG = 312.4;
const MIMAS_MA_DEG = 159.2;
const MIMAS_SIDEREAL_PERIOD_S = 81443;
const MIMAS_ALBEDO = 0.962;

/**
 * Mimas configuration object for modular solar system initialization.
 */
export const mimas: CelestialObject<PlanetProperties> = {
  id: "mimas",
  name: "Mimas",
  seed: "mimas",
  type: CelestialType.MOON,
  status: CelestialStatus.ACTIVE,
  parentId: "saturn", // Will be replaced during initialization
  realMass_kg: MIMAS_MASS_KG,
  realRadius_m: kmToM(MIMAS_RADIUS_KM),
  temperature: 63,
  albedo: MIMAS_ALBEDO,
  orbit: createOrbitalElements({
    semiMajorAxisAU: 0.00124, // Approximately 185,500 km
    eccentricity: MIMAS_ECC,
    inclinationDeg: MIMAS_INC_DEG,
    longitudeOfAscendingNodeDeg: MIMAS_LAN_DEG,
    argumentOfPeriapsisDeg: MIMAS_AOP_DEG,
    meanAnomalyDeg: MIMAS_MA_DEG,
    period_s: MIMAS_SIDEREAL_PERIOD_S,
    siderealRotationPeriod_s: MIMAS_SIDEREAL_PERIOD_S,
    axialTiltDeg: 0,
  }),
  properties: {
    type: CelestialType.MOON,
    classType: PlanetType.BARREN,
    isMoon: true,
    composition: ["water ice", "rocky core"],
    atmosphere: undefined,
    surface: {
      roughness: 0.8,
      persistence: 0.6,
      lacunarity: 2.1,
      simplePeriod: 2.0,
      octaves: 8,
      bumpScale: 3.5,
      color1: "#B0B0B0",
      color2: "#D0D0D0",
      color3: "#E0E0E0",
      color4: "#F0F0F0",
      color5: "#FFFFFF",
      height1: 0.1,
      height2: 0.25,
      height3: 0.5,
      height4: 0.75,
      height5: 0.9,
      shininess: 40,
      specularStrength: 0.25,
      ambientLightIntensity: 0.01, // Minimal ambient for dynamic lighting
      undulation: 0.22,
      terrainType: 1, // Cratered terrain
      terrainAmplitude: 0.8,
      terrainSharpness: 1.8,
      terrainOffset: 0.2,
    },
  },
};
