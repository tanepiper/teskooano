import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";
import { AU, KM } from "@teskooano/core-physics";
import {
  CelestialObject,
  CelestialType,
  PlanetType,
  RockyType,
  CelestialStatus,
  type PlanetProperties,
  type RingProperties,
} from "@teskooano/data-types";

const HAUMEA_MASS_KG = 4.006e21;
const HAUMEA_RADIUS_M = 816 * KM;
const HAUMEA_TEMP_K = 32;
const HAUMEA_ALBEDO = 0.84;
const HAUMEA_SMA_AU = 43.12;
const HAUMEA_ECC = 0.189;
const HAUMEA_INC_DEG = 28.19;
const HAUMEA_LAN_DEG = 122.02;
const HAUMEA_AOP_DEG = 238.84;
const HAUMEA_MA_DEG = 218.21;
const HAUMEA_ORBITAL_PERIOD_S = 283.12 * 365.25 * 24 * 3600;
const HAUMEA_SIDEREAL_ROTATION_PERIOD_S = 3.915 * 3600;
const HAUMEA_AXIAL_TILT_DEG = 0.0;

const HIIAKA_MASS_KG = 1.79e19;
const HIIAKA_RADIUS_M = 155 * KM;
const HIIAKA_SMA_M = 49500 * KM;
const HIIAKA_ECC = 0.0513;
const HIIAKA_INC_DEG = 126.356;
const HIIAKA_LAN_DEG = 205.0;
const HIIAKA_AOP_DEG = 130.0;
const HIIAKA_MA_DEG = 280.0;
const HIIAKA_SIDEREAL_PERIOD_S = 49.12 * 24 * 3600;
const HIIAKA_ALBEDO = 0.08;

const NAMAKA_MASS_KG = 1.79e18;
const NAMAKA_RADIUS_M = 85 * KM;
const NAMAKA_SMA_M = 25657 * KM;
const NAMAKA_ECC = 0.249;
const NAMAKA_INC_DEG = 113.0;
const NAMAKA_LAN_DEG = 187.0;
const NAMAKA_AOP_DEG = 310.0;
const NAMAKA_MA_DEG = 140.0;
const NAMAKA_SIDEREAL_PERIOD_S = 18.28 * 24 * 3600;
const NAMAKA_ALBEDO = 0.06;

/**
 * Haumea dwarf planet configuration object for modular solar system initialization.
 */
export const haumea: CelestialObject<PlanetProperties> = {
  id: "haumea",
  name: "Haumea",
  seed: "haumea",
  type: CelestialType.DWARF_PLANET,
  status: CelestialStatus.ACTIVE,
  parentId: "sun", // Will be replaced during initialization
  realMass_kg: HAUMEA_MASS_KG,
  realRadius_m: HAUMEA_RADIUS_M,
  temperature: HAUMEA_TEMP_K,
  albedo: HAUMEA_ALBEDO,
  orbit: {
    realSemiMajorAxis_m: HAUMEA_SMA_AU * AU,
    eccentricity: HAUMEA_ECC,
    inclination: HAUMEA_INC_DEG * DEG_TO_RAD,
    longitudeOfAscendingNode: HAUMEA_LAN_DEG * DEG_TO_RAD,
    argumentOfPeriapsis: HAUMEA_AOP_DEG * DEG_TO_RAD,
    meanAnomaly: HAUMEA_MA_DEG * DEG_TO_RAD,
    period_s: HAUMEA_ORBITAL_PERIOD_S,
    siderealRotationPeriod_s: HAUMEA_SIDEREAL_ROTATION_PERIOD_S,
    axialTilt: new OSVector3(
      0,
      Math.cos(HAUMEA_AXIAL_TILT_DEG * DEG_TO_RAD),
      Math.sin(HAUMEA_AXIAL_TILT_DEG * DEG_TO_RAD),
    ).normalize(),
  },
  properties: {
    type: CelestialType.DWARF_PLANET,
    classType: PlanetType.BARREN,
    isMoon: false,
    composition: [
      "water ice",
      "crystalline water ice",
      "rocky core",
      "olivine",
      "pyroxene",
    ],
    shapeModel: "triaxial",
    rings: [
      {
        innerRadius: 2287 * KM,
        outerRadius: 2322 * KM,
        density: 0.5,
        opacity: 0.5,
        color: "#C0C0C0",
        type: RockyType.ICE,
        texture: "textures/ring_haumea.png",
        rotationRate: 0.001,
        composition: ["ice particles"],
      } as RingProperties,
    ],
    atmosphere: undefined,
    surface: {
      roughness: 0.1,
      persistence: 0.4,
      lacunarity: 2.0,
      simplePeriod: 1.2,
      octaves: 5,
      bumpScale: 0.8,
      color1: "#E0F0FF",
      color2: "#E8F4FF",
      color3: "#F0F8FF",
      color4: "#F8FCFF",
      color5: "#FFFFFF",
      height1: 0.2,
      height2: 0.4,
      height3: 0.6,
      height4: 0.8,
      height5: 0.95,
      shininess: 60,
      specularStrength: 0.84,
      ambientLightIntensity: 0.01,
      undulation: 0.03,
      terrainType: 1,
      terrainAmplitude: 0.15,
      terrainSharpness: 0.6,
      terrainOffset: 0.02,
    },
  },
};

/**
 * Hi'iaka moon configuration object for modular solar system initialization.
 */
export const hiiaka: CelestialObject<PlanetProperties> = {
  id: "hiiaka",
  name: "Hi'iaka",
  seed: "hiiaka",
  type: CelestialType.MOON,
  status: CelestialStatus.ACTIVE,
  parentId: "haumea", // Will be replaced during initialization
  realMass_kg: HIIAKA_MASS_KG,
  realRadius_m: HIIAKA_RADIUS_M,
  temperature: 32,
  albedo: HIIAKA_ALBEDO,
  orbit: {
    realSemiMajorAxis_m: HIIAKA_SMA_M,
    eccentricity: HIIAKA_ECC,
    inclination: HIIAKA_INC_DEG * DEG_TO_RAD,
    longitudeOfAscendingNode: HIIAKA_LAN_DEG * DEG_TO_RAD,
    argumentOfPeriapsis: HIIAKA_AOP_DEG * DEG_TO_RAD,
    meanAnomaly: HIIAKA_MA_DEG * DEG_TO_RAD,
    period_s: HIIAKA_SIDEREAL_PERIOD_S,
    siderealRotationPeriod_s: HIIAKA_SIDEREAL_PERIOD_S,
    axialTilt: new OSVector3(0, 1, 0),
  },
  properties: {
    type: CelestialType.MOON,
    classType: PlanetType.BARREN,
    isMoon: true,
    composition: [
      "water ice",
      "crystalline water ice",
      "rocky material",
      "phyllosilicates",
    ],
    shapeModel: "asteroid",
    atmosphere: undefined,
    surface: {
      roughness: 0.9,
      persistence: 0.55,
      lacunarity: 2.2,
      simplePeriod: 3.8,
      octaves: 8,
      bumpScale: 3.2,
      color1: "#303030",
      color2: "#353535",
      color3: "#404040",
      color4: "#454545",
      color5: "#505050",
      height1: 0.0,
      height2: 0.25,
      height3: 0.5,
      height4: 0.75,
      height5: 1.0,
      shininess: 2,
      specularStrength: 0.08,
      ambientLightIntensity: 0.01,
      undulation: 0.45,
      terrainType: 1,
      terrainAmplitude: 0.9,
      terrainSharpness: 1.6,
      terrainOffset: 0.0,
    },
  },
};

/**
 * Namaka moon configuration object for modular solar system initialization.
 */
export const namaka: CelestialObject<PlanetProperties> = {
  id: "namaka",
  name: "Namaka",
  seed: "namaka",
  type: CelestialType.MOON,
  status: CelestialStatus.ACTIVE,
  parentId: "haumea", // Will be replaced during initialization
  realMass_kg: NAMAKA_MASS_KG,
  realRadius_m: NAMAKA_RADIUS_M,
  temperature: 32,
  albedo: NAMAKA_ALBEDO,
  orbit: {
    realSemiMajorAxis_m: NAMAKA_SMA_M,
    eccentricity: NAMAKA_ECC,
    inclination: NAMAKA_INC_DEG * DEG_TO_RAD,
    longitudeOfAscendingNode: NAMAKA_LAN_DEG * DEG_TO_RAD,
    argumentOfPeriapsis: NAMAKA_AOP_DEG * DEG_TO_RAD,
    meanAnomaly: NAMAKA_MA_DEG * DEG_TO_RAD,
    period_s: NAMAKA_SIDEREAL_PERIOD_S,
    siderealRotationPeriod_s: NAMAKA_SIDEREAL_PERIOD_S,
    axialTilt: new OSVector3(0, 1, 0),
  },
  properties: {
    type: CelestialType.MOON,
    classType: PlanetType.BARREN,
    isMoon: true,
    composition: ["water ice", "rocky material", "organic compounds"],
    shapeModel: "asteroid",
    atmosphere: {
      glowColor: "#000000",
      intensity: 0,
      power: 0,
      thickness: 0,
    },
    surface: {
      roughness: 0.95,
      persistence: 0.58,
      lacunarity: 2.4,
      simplePeriod: 4.2,
      octaves: 9,
      bumpScale: 3.8,
      color1: "#282828",
      color2: "#2D2D2D",
      color3: "#383838",
      color4: "#3D3D3D",
      color5: "#484848",
      height1: 0.0,
      height2: 0.2,
      height3: 0.4,
      height4: 0.6,
      height5: 0.8,
      shininess: 1,
      specularStrength: 0.06,
      ambientLightIntensity: 0.01,
      undulation: 0.5,
      terrainType: 1,
      terrainAmplitude: 1.1,
      terrainSharpness: 1.8,
      terrainOffset: 0.0,
    },
  },
};
