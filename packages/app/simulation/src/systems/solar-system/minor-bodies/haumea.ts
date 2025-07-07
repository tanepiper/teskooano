import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";
import { AU } from "@teskooano/core-physics";
import { actions } from "@teskooano/core-state";
import {
  CelestialType,
  PlanetType,
  RockyType,
  SurfaceType,
  type PlanetProperties,
  type RingProperties,
} from "@teskooano/data-types";

const HAUMEA_MASS_KG = 4.006e21;
const HAUMEA_RADIUS_M = 816000; // Mean radius of triaxial ellipsoid
const HAUMEA_TEMP_K = 32;
const HAUMEA_ALBEDO = 0.84;
const HAUMEA_SMA_AU = 43.12;
const HAUMEA_ECC = 0.189;
const HAUMEA_INC_DEG = 28.19;
const HAUMEA_LAN_DEG = 122.02;
const HAUMEA_AOP_DEG = 238.84;
const HAUMEA_MA_DEG = 218.21;
const HAUMEA_ORBITAL_PERIOD_S = 283.12 * 365.25 * 24 * 3600; // 283.12 years
const HAUMEA_SIDEREAL_ROTATION_PERIOD_S = 3.915 * 3600; // 3.915 hours - fastest rotating large body
const HAUMEA_AXIAL_TILT_DEG = 0.0;

// Hi'iaka - Haumea's larger moon
const HIIAKA_MASS_KG = 1.79e19; // Estimated based on ~310 km diameter
const HIIAKA_RADIUS_M = 155000; // ~310 km diameter
const HIIAKA_SMA_M = 49500000; // ~49,500 km from Haumea
const HIIAKA_ECC = 0.0513;
const HIIAKA_INC_DEG = 126.356;
const HIIAKA_LAN_DEG = 205.0;
const HIIAKA_AOP_DEG = 130.0;
const HIIAKA_MA_DEG = 280.0;
const HIIAKA_SIDEREAL_PERIOD_S = 49.12 * 24 * 3600; // ~49.12 days
const HIIAKA_ALBEDO = 0.08;

// Namaka - Haumea's smaller moon
const NAMAKA_MASS_KG = 1.79e18; // Estimated based on ~170 km diameter
const NAMAKA_RADIUS_M = 85000; // ~170 km diameter
const NAMAKA_SMA_M = 25657000; // ~25,657 km from Haumea
const NAMAKA_ECC = 0.249;
const NAMAKA_INC_DEG = 113.0;
const NAMAKA_LAN_DEG = 187.0;
const NAMAKA_AOP_DEG = 310.0;
const NAMAKA_MA_DEG = 140.0;
const NAMAKA_SIDEREAL_PERIOD_S = 18.28 * 24 * 3600; // ~18.28 days
const NAMAKA_ALBEDO = 0.06;

/**
 * Initializes Haumea with its two moons Hi'iaka and Namaka, and ring system using accurate data.
 * Haumea is notable for being the fastest rotating large body in the solar system and having a ring system.
 */
export function initializeHaumea(parentId: string): void {
  const haumeaId = "haumea";
  const haumeaAxialTiltRad = HAUMEA_AXIAL_TILT_DEG * DEG_TO_RAD;

  actions.addCelestial({
    id: haumeaId,
    name: "Haumea",
    seed: "haumea",
    type: CelestialType.DWARF_PLANET,
    parentId: parentId,
    realMass_kg: HAUMEA_MASS_KG,
    realRadius_m: HAUMEA_RADIUS_M,
    temperature: HAUMEA_TEMP_K,
    albedo: HAUMEA_ALBEDO,
    siderealRotationPeriod_s: HAUMEA_SIDEREAL_ROTATION_PERIOD_S,
    axialTilt: new OSVector3(
      0,
      Math.cos(haumeaAxialTiltRad),
      Math.sin(haumeaAxialTiltRad),
    ).normalize(),
    orbit: {
      realSemiMajorAxis_m: HAUMEA_SMA_AU * AU,
      eccentricity: HAUMEA_ECC,
      inclination: HAUMEA_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: HAUMEA_LAN_DEG * DEG_TO_RAD,
      argumentOfPeriapsis: HAUMEA_AOP_DEG * DEG_TO_RAD,
      meanAnomaly: HAUMEA_MA_DEG * DEG_TO_RAD,
      period_s: HAUMEA_ORBITAL_PERIOD_S,
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
      shapeModel: "triaxial", // Triaxial ellipsoid shape
      rings: [
        {
          innerRadius: 2287000, // ~2,287 km from center
          outerRadius: 2322000, // ~2,322 km from center
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
        type: SurfaceType.ICE_FLATS,
        color: "#F0F8FF",
        roughness: 0.1,
        classType: PlanetType.BARREN,
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
        ambientLightIntensity: 0.01, // Minimal ambient for dynamic lighting
        undulation: 0.03,
        terrainType: 1,
        terrainAmplitude: 0.15,
        terrainSharpness: 0.6,
        terrainOffset: 0.02,
      },
    } as PlanetProperties,
  });

  // Add Hi'iaka moon
  const hiiakAxialTilt = new OSVector3(0, 1, 0);
  actions.addCelestial({
    id: "hiiaka",
    name: "Hi'iaka",
    seed: "hiiaka",
    type: CelestialType.MOON,
    parentId: haumeaId,
    realMass_kg: HIIAKA_MASS_KG,
    realRadius_m: HIIAKA_RADIUS_M,
    temperature: 32,
    albedo: HIIAKA_ALBEDO,
    siderealRotationPeriod_s: HIIAKA_SIDEREAL_PERIOD_S,
    axialTilt: hiiakAxialTilt,
    orbit: {
      realSemiMajorAxis_m: HIIAKA_SMA_M,
      eccentricity: HIIAKA_ECC,
      inclination: HIIAKA_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: HIIAKA_LAN_DEG * DEG_TO_RAD,
      argumentOfPeriapsis: HIIAKA_AOP_DEG * DEG_TO_RAD,
      meanAnomaly: HIIAKA_MA_DEG * DEG_TO_RAD,
      period_s: HIIAKA_SIDEREAL_PERIOD_S,
    },
    properties: {
      type: CelestialType.MOON,
      classType: PlanetType.BARREN,
      isMoon: true,
      parentPlanet: haumeaId,
      composition: [
        "water ice",
        "crystalline water ice",
        "rocky material",
        "phyllosilicates",
      ],
      shapeModel: "asteroid",
      atmosphere: undefined,
      surface: {
        type: SurfaceType.CRATERED,
        color: "#404040",
        roughness: 0.9,
        classType: PlanetType.BARREN,
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
        ambientLightIntensity: 0.01, // Minimal ambient for dynamic lighting
        undulation: 0.45,
        terrainType: 1,
        terrainAmplitude: 0.9,
        terrainSharpness: 1.6,
        terrainOffset: 0.0,
      },
    } as PlanetProperties,
  });

  // Add Namaka moon
  const namakaAxialTilt = new OSVector3(0, 1, 0);
  actions.addCelestial({
    id: "namaka",
    name: "Namaka",
    seed: "namaka",
    type: CelestialType.MOON,
    parentId: haumeaId,
    realMass_kg: NAMAKA_MASS_KG,
    realRadius_m: NAMAKA_RADIUS_M,
    temperature: 32,
    albedo: NAMAKA_ALBEDO,
    siderealRotationPeriod_s: NAMAKA_SIDEREAL_PERIOD_S,
    axialTilt: namakaAxialTilt,
    orbit: {
      realSemiMajorAxis_m: NAMAKA_SMA_M,
      eccentricity: NAMAKA_ECC,
      inclination: NAMAKA_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: NAMAKA_LAN_DEG * DEG_TO_RAD,
      argumentOfPeriapsis: NAMAKA_AOP_DEG * DEG_TO_RAD,
      meanAnomaly: NAMAKA_MA_DEG * DEG_TO_RAD,
      period_s: NAMAKA_SIDEREAL_PERIOD_S,
    },
    properties: {
      type: CelestialType.MOON,
      classType: PlanetType.BARREN,
      isMoon: true,
      parentPlanet: haumeaId,
      composition: ["water ice", "rocky material", "organic compounds"],
      shapeModel: "asteroid",
      atmosphere: {
        glowColor: "#000000",
        intensity: 0,
        power: 0,
        thickness: 0,
      },
      surface: {
        type: SurfaceType.CRATERED,
        color: "#383838",
        roughness: 0.95,
        classType: PlanetType.BARREN,
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
        ambientLightIntensity: 0.01, // Minimal ambient for dynamic lighting
        undulation: 0.5,
        terrainType: 1,
        terrainAmplitude: 1.1,
        terrainSharpness: 1.8,
        terrainOffset: 0.0,
      },
    } as PlanetProperties,
  });
}
