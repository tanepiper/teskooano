import { createOrbitalElements, kmToM } from "@teskooano/core-physics";
import {
  CelestialType,
  PlanetType,
  CelestialStatus,
  type PlanetProperties,
  CelestialObject,
} from "@teskooano/data-types";

const PALLAS_MASS_KG = 2.11e20;
const PALLAS_RADIUS_KM = 256;
const PALLAS_TEMP_K = 160;
const PALLAS_ALBEDO = 0.155;
const PALLAS_SMA_AU = 2.77;
const PALLAS_ECC = 0.231;
const PALLAS_INC_DEG = 34.84;
const PALLAS_LAN_DEG = 173.1;
const PALLAS_AOP_DEG = 310.3;
const PALLAS_MA_DEG = 113.7;
const PALLAS_ORBITAL_PERIOD_S = 1.681e8;
const PALLAS_SIDEREAL_ROTATION_PERIOD_S = 28080;
const PALLAS_AXIAL_TILT_DEG = 84;

/**
 * Pallas asteroid configuration object for modular solar system initialization.
 */
export const pallas: CelestialObject<PlanetProperties> = {
  id: "pallas",
  name: "2 Pallas",
  seed: "pallas",
  type: CelestialType.DWARF_PLANET,
  status: CelestialStatus.ACTIVE,
  parentId: "sun", // Will be replaced during initialization
  realMass_kg: PALLAS_MASS_KG,
  realRadius_m: kmToM(PALLAS_RADIUS_KM),
  temperature: PALLAS_TEMP_K,
  albedo: PALLAS_ALBEDO,
  orbit: createOrbitalElements({
    semiMajorAxisAU: PALLAS_SMA_AU,
    eccentricity: PALLAS_ECC,
    inclinationDeg: PALLAS_INC_DEG,
    longitudeOfAscendingNodeDeg: PALLAS_LAN_DEG,
    argumentOfPeriapsisDeg: PALLAS_AOP_DEG,
    meanAnomalyDeg: PALLAS_MA_DEG,
    period_s: PALLAS_ORBITAL_PERIOD_S,
    siderealRotationPeriod_s: PALLAS_SIDEREAL_ROTATION_PERIOD_S,
    axialTiltDeg: PALLAS_AXIAL_TILT_DEG,
  }),
  properties: {
    type: CelestialType.DWARF_PLANET,
    classType: PlanetType.ROCKY,
    isMoon: false,
    composition: [
      "carbonaceous chondrite",
      "B-type asteroid material",
      "primitive material",
      "organic compounds",
    ],
    surface: {
      roughness: 0.8,
      persistence: 0.6,
      lacunarity: 2.2,
      simplePeriod: 2.8,
      octaves: 8,
      bumpScale: 2.5,
      color1: "#404040",
      color2: "#505050",
      color3: "#696969",
      color4: "#808080",
      color5: "#A0A0A0",
      height1: 0.1,
      height2: 0.3,
      height3: 0.5,
      height4: 0.7,
      height5: 0.9,
      shininess: 6,
      specularStrength: 0.1,
      ambientLightIntensity: 0.01,
      undulation: 0.5,
      terrainType: 1,
      terrainAmplitude: 1.0,
      terrainSharpness: 1.5,
      terrainOffset: 0.0,
    },
  },
};
