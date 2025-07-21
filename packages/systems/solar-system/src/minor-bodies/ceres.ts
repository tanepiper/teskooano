import { createOrbitalElements, kmToM } from "@teskooano/core-physics";
import {
  CelestialType,
  PlanetType,
  CelestialStatus,
  type PlanetProperties,
  CelestialObject,
} from "@teskooano/data-types";

const CERES_MASS_KG = 9.3839e20; // Updated from Wikipedia
const CERES_RADIUS_KM = 469.7; // Updated mean radius from Wikipedia
const CERES_TEMP_K = 172.5; // Updated mean temperature from Wikipedia
const CERES_ALBEDO = 0.09; // Updated from Wikipedia
const CERES_SMA_AU = 2.77; // Updated from Wikipedia
const CERES_ECC = 0.0785; // Updated from Wikipedia
const CERES_INC_DEG = 10.6; // Updated from Wikipedia
const CERES_LAN_DEG = 80.3; // Updated from Wikipedia
const CERES_AOP_DEG = 73.6; // Updated from Wikipedia
const CERES_MA_DEG = 291.4; // Updated from Wikipedia
const CERES_ORBITAL_PERIOD_S = 4.60358 * 365.25 * 24 * 3600; // 4.60358 years in seconds
const CERES_SIDEREAL_ROTATION_PERIOD_S = 9.07417 * 3600; // 9.074170 hours in seconds
const CERES_AXIAL_TILT_DEG = 4.0; // Kept the same

/**
 * Ceres dwarf planet configuration object for modular solar system initialization.
 */
export const ceres: CelestialObject<PlanetProperties> = {
  id: "ceres",
  name: "Ceres",
  seed: "ceres",
  type: CelestialType.DWARF_PLANET,
  status: CelestialStatus.ACTIVE,
  parentId: "sun", // Will be replaced during initialization
  realMass_kg: CERES_MASS_KG,
  realRadius_m: kmToM(CERES_RADIUS_KM),
  temperature: CERES_TEMP_K,
  albedo: CERES_ALBEDO,
  orbit: createOrbitalElements({
    semiMajorAxisAU: CERES_SMA_AU,
    eccentricity: CERES_ECC,
    inclinationDeg: CERES_INC_DEG,
    longitudeOfAscendingNodeDeg: CERES_LAN_DEG,
    argumentOfPeriapsisDeg: CERES_AOP_DEG,
    meanAnomalyDeg: CERES_MA_DEG,
    period_s: CERES_ORBITAL_PERIOD_S,
    siderealRotationPeriod_s: CERES_SIDEREAL_ROTATION_PERIOD_S,
    axialTiltDeg: CERES_AXIAL_TILT_DEG,
    epoch: "JD 2459600.5",
  }),
  properties: {
    type: CelestialType.DWARF_PLANET,
    classType: PlanetType.ROCKY,
    isMoon: false,
    composition: [
      "water ice",
      "hydrated minerals",
      "carbonates",
      "clay minerals",
      "salts",
      "carbonaceous material",
      "organic compounds",
    ],
    atmosphere: undefined,
    surface: {
      roughness: 0.9, // Increased for more rugged surface
      persistence: 0.6, // Increased for more variation
      lacunarity: 2.3, // Increased for more detail
      simplePeriod: 3.2, // Increased for larger features
      octaves: 8, // Slightly reduced for performance
      bumpScale: 3.0, // Increased for more pronounced surface features
      color1: "#2A1F1A", // Darker carbonaceous material
      color2: "#3D2B24", // Dark brown
      color3: "#4A3528", // Medium brown
      color4: "#5A4030", // Lighter brown
      color5: "#6B4A38", // Lightest brown
      height1: 0.05, // Lower base height
      height2: 0.2, // Reduced variation
      height3: 0.4, // Moderate variation
      height4: 0.65, // Higher features
      height5: 0.85, // Peak features
      shininess: 2, // Reduced for darker surface
      specularStrength: 0.08, // Reduced for darker surface
      ambientLightIntensity: 0.02, // Slightly increased for visibility
      undulation: 0.4, // Increased for more varied terrain
      terrainType: 2,
      terrainAmplitude: 0.9, // Increased for more dramatic terrain
      terrainSharpness: 1.6, // Increased for sharper features
      terrainOffset: -0.15, // Adjusted for darker base
    },
  },
};
