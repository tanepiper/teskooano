import { createOrbitalElements, kmToM } from "@teskooano/core-physics";
import {
  CelestialObject,
  CelestialStatus,
  CelestialType,
  PlanetType,
  type PlanetProperties,
} from "@teskooano/data-types";

const IAPETUS_MASS_KG = 1.806e21;
const IAPETUS_RADIUS_KM = 734.5;
const IAPETUS_ECC = 0.0283;
const IAPETUS_INC_DEG = 15.47;
const IAPETUS_LAN_DEG = 81.1;
const IAPETUS_AOP_DEG = 271.6;
const IAPETUS_MA_DEG = 23.9;
const IAPETUS_SIDEREAL_PERIOD_S = 6855300;
const IAPETUS_ALBEDO = 0.04;

/**
 * Iapetus configuration object for modular solar system initialization.
 */
export const iapetus: CelestialObject<PlanetProperties> = {
  id: "iapetus",
  name: "Iapetus",
  seed: "iapetus",
  type: CelestialType.MOON,
  status: CelestialStatus.ACTIVE,
  parentId: "saturn", // Will be replaced during initialization
  realMass_kg: IAPETUS_MASS_KG,
  realRadius_m: kmToM(IAPETUS_RADIUS_KM),
  temperature: 110,
  albedo: IAPETUS_ALBEDO,
  orbit: createOrbitalElements({
    semiMajorAxisAU: 0.0238, // Approximately 3,561,000 km (real value)
    eccentricity: IAPETUS_ECC,
    inclinationDeg: IAPETUS_INC_DEG,
    longitudeOfAscendingNodeDeg: IAPETUS_LAN_DEG,
    argumentOfPeriapsisDeg: IAPETUS_AOP_DEG,
    meanAnomalyDeg: IAPETUS_MA_DEG,
    period_s: IAPETUS_SIDEREAL_PERIOD_S,
    siderealRotationPeriod_s: IAPETUS_SIDEREAL_PERIOD_S,
    axialTiltDeg: 0,
  }),
  properties: {
    type: CelestialType.MOON,
    classType: PlanetType.BARREN,
    isMoon: true,
    composition: ["water ice", "rock", "carbonaceous material on one side"],
    atmosphere: undefined,
    surface: {
      roughness: 0.7,
      persistence: 0.48,
      lacunarity: 2.3,
      simplePeriod: 1.8,
      octaves: 10,
      bumpScale: 2.5,
      color1: "#201008",
      color2: "#404040",
      color3: "#808080",
      color4: "#C0C0C0",
      color5: "#F0F0F0",
      height1: 0.15,
      height2: 0.35,
      height3: 0.5,
      height4: 0.75,
      height5: 0.9,
      shininess: 20,
      specularStrength: 0.1,
      ambientLightIntensity: 0.01, // Minimal ambient for dynamic lighting
      undulation: 0.25,
      terrainType: 2,
      terrainAmplitude: 0.8,
      terrainSharpness: 1.4,
      terrainOffset: -0.05,
    },
  },
};
