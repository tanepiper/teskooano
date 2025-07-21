import { createOrbitalElements, kmToM } from "@teskooano/core-physics";
import {
  CelestialObject,
  CelestialType,
  PlanetType,
  CelestialStatus,
  type PlanetProperties,
} from "@teskooano/data-types";

const MAKEMAKE_MASS_KG = 3.1e21;
const MAKEMAKE_RADIUS_KM = 715;
const MAKEMAKE_TEMP_K = 34;
const MAKEMAKE_ALBEDO = 0.82;
const MAKEMAKE_SMA_AU = 45.43;
const MAKEMAKE_ECC = 0.16126;
const MAKEMAKE_INC_DEG = 28.9835;
const MAKEMAKE_LAN_DEG = 79.62;
const MAKEMAKE_AOP_DEG = 294.834;
const MAKEMAKE_MA_DEG = 165.514;
const MAKEMAKE_ORBITAL_PERIOD_S = 306.21 * 365.25 * 24 * 3600;
const MAKEMAKE_SIDEREAL_ROTATION_PERIOD_S = 22.8266 * 3600;
const MAKEMAKE_AXIAL_TILT_DEG = 0.0;

const MK2_MASS_KG = 1.0e17; // Keep existing estimate
const MK2_RADIUS_KM = 175; // Updated to mean diameter from Wikipedia
const MK2_SMA_KM = 21000; // Updated to minimum semi-major axis from Wikipedia
const MK2_ECC = 0.0; // Keep as unknown/zero since eccentricity is unknown
const MK2_INC_DEG = 75.0; // Updated to middle of 63°–87° range from Wikipedia
const MK2_LAN_DEG = 0.0; // Keep as default
const MK2_AOP_DEG = 0.0; // Keep as default
const MK2_MA_DEG = 0.0; // Keep as default
const MK2_SIDEREAL_PERIOD_S = 12.4 * 24 * 3600; // Updated to minimum period from Wikipedia
const MK2_ALBEDO = 0.04; // Updated to best fit albedo from Wikipedia

/**
 * Makemake dwarf planet configuration object for modular solar system initialization.
 */
export const makemake: CelestialObject<PlanetProperties> = {
  id: "makemake",
  name: "Makemake",
  seed: "makemake",
  type: CelestialType.DWARF_PLANET,
  status: CelestialStatus.ACTIVE,
  parentId: "sun", // Will be replaced during initialization
  realMass_kg: MAKEMAKE_MASS_KG,
  realRadius_m: kmToM(MAKEMAKE_RADIUS_KM),
  temperature: MAKEMAKE_TEMP_K,
  albedo: MAKEMAKE_ALBEDO,
  orbit: createOrbitalElements({
    semiMajorAxisAU: MAKEMAKE_SMA_AU,
    eccentricity: MAKEMAKE_ECC,
    inclinationDeg: MAKEMAKE_INC_DEG,
    longitudeOfAscendingNodeDeg: MAKEMAKE_LAN_DEG,
    argumentOfPeriapsisDeg: MAKEMAKE_AOP_DEG,
    meanAnomalyDeg: MAKEMAKE_MA_DEG,
    period_s: MAKEMAKE_ORBITAL_PERIOD_S,
    siderealRotationPeriod_s: MAKEMAKE_SIDEREAL_ROTATION_PERIOD_S,
    axialTiltDeg: MAKEMAKE_AXIAL_TILT_DEG,
    epoch: "JD 2458900.5",
  }),
  properties: {
    type: CelestialType.DWARF_PLANET,
    classType: PlanetType.BARREN,
    isMoon: false,
    composition: [
      "methane ice",
      "nitrogen ice",
      "water ice",
      "rocky core",
      "ethane",
      "tholins",
      "frozen gases",
    ],
    atmosphere: undefined,
    surface: {
      roughness: 0.1, // Reduced for smoother icy surface
      persistence: 0.3, // Reduced for less variation
      lacunarity: 1.8, // Reduced for smoother features
      simplePeriod: 1.5, // Reduced for smaller features
      octaves: 5, // Reduced for smoother surface
      bumpScale: 0.5, // Reduced for subtle surface features
      color1: "#F8F8FF", // Very bright white
      color2: "#F0F0FF", // Bright white
      color3: "#E8E8FF", // Light white
      color4: "#E0E0FF", // Slightly off-white
      color5: "#D8D8FF", // Very light blue-white
      height1: 0.1, // Lower base height
      height2: 0.25, // Reduced variation
      height3: 0.4, // Moderate variation
      height4: 0.6, // Higher features
      height5: 0.8, // Peak features
      shininess: 80, // Increased for icy surface
      specularStrength: 0.9, // Increased for icy surface
      ambientLightIntensity: 0.02, // Slightly increased for visibility
      undulation: 0.1, // Reduced for smoother surface
      terrainType: 1,
      terrainAmplitude: 0.2, // Reduced for smoother terrain
      terrainSharpness: 0.5, // Reduced for smoother features
      terrainOffset: 0.1, // Adjusted for bright base
    },
  },
};

/**
 * MK2 moon configuration object for modular solar system initialization.
 */
export const mk2: CelestialObject<PlanetProperties> = {
  id: "mk2",
  name: "MK2",
  seed: "mk2",
  type: CelestialType.MOON,
  status: CelestialStatus.ACTIVE,
  parentId: "makemake", // Will be replaced during initialization
  realMass_kg: MK2_MASS_KG,
  realRadius_m: kmToM(MK2_RADIUS_KM),
  temperature: 30,
  albedo: MK2_ALBEDO,
  orbit: createOrbitalElements({
    semiMajorAxisAU: MK2_SMA_KM / 149597870.7, // Convert km to AU
    eccentricity: MK2_ECC,
    inclinationDeg: MK2_INC_DEG,
    longitudeOfAscendingNodeDeg: MK2_LAN_DEG,
    argumentOfPeriapsisDeg: MK2_AOP_DEG,
    meanAnomalyDeg: MK2_MA_DEG,
    period_s: MK2_SIDEREAL_PERIOD_S,
    siderealRotationPeriod_s: MK2_SIDEREAL_PERIOD_S,
    axialTiltDeg: 0,
  }),
  properties: {
    type: CelestialType.MOON,
    classType: PlanetType.BARREN,
    isMoon: true,
    composition: [
      "water ice",
      "rocky material",
      "organic compounds",
      "carbonaceous material",
      "tholins",
    ],
    shapeModel: "asteroid",
    atmosphere: undefined,
    surface: {
      roughness: 0.9, // Increased for more rugged surface
      persistence: 0.7, // Increased for more variation
      lacunarity: 2.5, // Increased for more detail
      simplePeriod: 4.5, // Increased for larger features
      octaves: 8, // Increased for more detail
      bumpScale: 4.0, // Increased for more pronounced surface features
      color1: "#101010", // Very dark
      color2: "#151515", // Dark
      color3: "#202020", // Medium dark
      color4: "#252525", // Slightly lighter
      color5: "#303030", // Lightest
      height1: 0.0, // Lower base height
      height2: 0.15, // Reduced variation
      height3: 0.35, // Moderate variation
      height4: 0.55, // Higher features
      height5: 0.75, // Peak features
      shininess: 1, // Reduced for dark surface
      specularStrength: 0.02, // Reduced for dark surface
      ambientLightIntensity: 0.01, // Kept low for dark appearance
      undulation: 0.6, // Increased for more varied terrain
      terrainType: 1,
      terrainAmplitude: 1.2, // Increased for more dramatic terrain
      terrainSharpness: 2.0, // Increased for sharper features
      terrainOffset: -0.2, // Adjusted for darker base
    },
  },
};
