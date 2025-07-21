import { createOrbitalElements, kmToM } from "@teskooano/core-physics";
import {
  CelestialObject,
  CelestialType,
  PlanetType,
  CelestialStatus,
  type PlanetProperties,
} from "@teskooano/data-types";

const SEDNA_MASS_KG = 1.0e21; // Approximate mass, as not directly provided
const SEDNA_RADIUS_KM = 468; // Derived from mean diameter of 936km
const SEDNA_TEMP_K = 12;
const SEDNA_ALBEDO = 0.41;
const SEDNA_SMA_AU = 506;
const SEDNA_ECC = 0.8496;
const SEDNA_INC_DEG = 11.9307;
const SEDNA_LAN_DEG = 144.248;
const SEDNA_AOP_DEG = 311.352;
const SEDNA_MA_DEG = 358.117;
const SEDNA_ORBITAL_PERIOD_S = 11390 * 365.25 * 24 * 60 * 60; // Convert years to seconds
const SEDNA_SIDEREAL_ROTATION_PERIOD_S = 10.273 * 60 * 60; // Convert hours to seconds
const SEDNA_AXIAL_TILT_DEG = 0; // Not provided, assuming 0

/**
 * Sedna dwarf planet configuration object for modular solar system initialization.
 */
export const sedna: CelestialObject<PlanetProperties> = {
  id: "sedna",
  name: "90377 Sedna",
  seed: "sedna",
  type: CelestialType.DWARF_PLANET,
  status: CelestialStatus.ACTIVE,
  parentId: "sun", // Or system barycenter, depending on context
  realMass_kg: SEDNA_MASS_KG,
  realRadius_m: kmToM(SEDNA_RADIUS_KM),
  temperature: SEDNA_TEMP_K,
  albedo: SEDNA_ALBEDO,
  orbit: createOrbitalElements({
    semiMajorAxisAU: SEDNA_SMA_AU,
    eccentricity: SEDNA_ECC,
    inclinationDeg: SEDNA_INC_DEG,
    longitudeOfAscendingNodeDeg: SEDNA_LAN_DEG,
    argumentOfPeriapsisDeg: SEDNA_AOP_DEG,
    meanAnomalyDeg: SEDNA_MA_DEG,
    period_s: SEDNA_ORBITAL_PERIOD_S,
    siderealRotationPeriod_s: SEDNA_SIDEREAL_ROTATION_PERIOD_S,
    axialTiltDeg: SEDNA_AXIAL_TILT_DEG,
    epoch: "JD 2458900.5", // Epoch 31 May 2020
  }),
  properties: {
    type: CelestialType.DWARF_PLANET,
    classType: PlanetType.ROCKY, // Closest type, though Sedna is very red
    isMoon: false,
    composition: ["silicates", "tholins", "water ice", "methane ice"],
    surface: {
      roughness: 0.8,
      persistence: 0.6,
      lacunarity: 2.2,
      simplePeriod: 0.8,
      octaves: 8,
      bumpScale: 3.0,
      color1: "#5C0000", // Deep red/brown for Sedna
      color2: "#7D0000",
      color3: "#A00000",
      color4: "#C30000",
      color5: "#E60000",
      height1: 0.1,
      height2: 0.3,
      height3: 0.5,
      height4: 0.7,
      height5: 0.9,
      shininess: 2,
      specularStrength: 0.05,
      ambientLightIntensity: 0.005, // Very low ambient for distant object
      undulation: 0.2,
      terrainType: 2,
      terrainAmplitude: 0.9,
      terrainSharpness: 1.5,
      terrainOffset: 0.0,
    },
  },
};
