import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";
import { AU, KM } from "@teskooano/core-physics";
import { actions } from "@teskooano/core-state";
import {
  CelestialType,
  GasGiantClass,
  type IceSurfaceProperties,
  type LavaSurfaceProperties,
  PlanetType,
  RockyType,
  SurfaceType,
  type GasGiantProperties,
  type PlanetAtmosphereProperties,
  type PlanetProperties,
  type RingProperties,
} from "@teskooano/data-types";

const JUPITER_REAL_MASS_KG = 1.89819e27;
const JUPITER_REAL_RADIUS_M = 69911000;
const JUPITER_TEMP_K = 165;
const JUPITER_ALBEDO = 0.538;
const JUPITER_SMA_AU = 5.2044;
const JUPITER_ECC = 0.0489;
const JUPITER_INC_DEG = 1.305;
const JUPITER_LAN_DEG = 100.464;
const JUPITER_AOP_DEG = 14.331 + JUPITER_LAN_DEG;
const JUPITER_MA_DEG = 34.351;
const JUPITER_ORBITAL_PERIOD_S = 3.74336e8;
const JUPITER_SIDEREAL_ROTATION_PERIOD_S = 35730.0;
const JUPITER_AXIAL_TILT_DEG = 3.13;

const IO_MASS_KG = 8.9319e22;
const IO_RADIUS_M = 1821600;
const IO_SMA_M = 421700 * KM;
const IO_ECC = 0.0041;
const IO_INC_DEG = 0.05;
const IO_SIDEREAL_PERIOD_S = 152854;
const IO_ALBEDO = 0.63;

const EUROPA_MASS_KG = 4.7998e22;
const EUROPA_RADIUS_M = 1560800;
const EUROPA_SMA_M = 671034 * KM;
const EUROPA_ECC = 0.0094;
const EUROPA_INC_DEG = 0.471;
const EUROPA_SIDEREAL_PERIOD_S = 306822;
const EUROPA_ALBEDO = 0.67;

const GANYMEDE_MASS_KG = 1.4819e23;
const GANYMEDE_RADIUS_M = 2631200;
const GANYMEDE_SMA_M = 1070412 * KM;
const GANYMEDE_ECC = 0.0013;
const GANYMEDE_INC_DEG = 0.204;
const GANYMEDE_SIDEREAL_PERIOD_S = 618153;
const GANYMEDE_ALBEDO = 0.43;

const CALLISTO_MASS_KG = 1.0759e23;
const CALLISTO_RADIUS_M = 2410300;
const CALLISTO_SMA_M = 1882709 * KM;
const CALLISTO_ECC = 0.0074;
const CALLISTO_INC_DEG = 0.205;
const CALLISTO_SIDEREAL_PERIOD_S = 1441902;
const CALLISTO_ALBEDO = 0.17;

/**
 * Initializes Jupiter and its Galilean moons using accurate data.
 */
export function initializeJupiter(parentId: string): void {
  const jupiterId = "jupiter";
  const jupiterAxialTiltRad = JUPITER_AXIAL_TILT_DEG * DEG_TO_RAD;

  const defaultMoonAxialTilt = new OSVector3(0, 1, 0);

  actions.addCelestial({
    id: jupiterId,
    name: "Jupiter",
    seed: "jupiter",
    type: CelestialType.GAS_GIANT,
    parentId: parentId,
    realMass_kg: JUPITER_REAL_MASS_KG,
    realRadius_m: JUPITER_REAL_RADIUS_M,
    temperature: JUPITER_TEMP_K,
    albedo: JUPITER_ALBEDO,
    siderealRotationPeriod_s: JUPITER_SIDEREAL_ROTATION_PERIOD_S,
    axialTilt: new OSVector3(
      0,
      Math.cos(jupiterAxialTiltRad),
      Math.sin(jupiterAxialTiltRad),
    ).normalize(),
    orbit: {
      realSemiMajorAxis_m: JUPITER_SMA_AU * AU,
      eccentricity: JUPITER_ECC,
      inclination: JUPITER_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: JUPITER_LAN_DEG * DEG_TO_RAD,
      argumentOfPeriapsis: (JUPITER_AOP_DEG - JUPITER_LAN_DEG) * DEG_TO_RAD,
      meanAnomaly: JUPITER_MA_DEG * DEG_TO_RAD,
      period_s: JUPITER_ORBITAL_PERIOD_S,
    },
    properties: {
      type: CelestialType.GAS_GIANT,
      gasGiantClass: GasGiantClass.CLASS_I,
      atmosphereColor: "#D8C8A8",
      cloudColor: "#FFFFFF",
      cloudSpeed: 100,
      stormColor: "#B7410E",
      stormSpeed: 50,
      rings: [
        {
          innerRadius: 1.72 * JUPITER_REAL_RADIUS_M,
          outerRadius: 1.81 * JUPITER_REAL_RADIUS_M,
          density: 0.05,
          opacity: 0.05,
          color: "#A0522D",
          type: RockyType.DUST,
          texture: "textures/ring_dust.png",
          rotationRate: 0.001,
          composition: ["dust"],
        } as RingProperties,
        {
          innerRadius: 1.29 * JUPITER_REAL_RADIUS_M,
          outerRadius: 1.72 * JUPITER_REAL_RADIUS_M,
          density: 0.01,
          opacity: 0.02,
          color: "#A0522D",
          type: RockyType.DUST,
          texture: "textures/ring_dust_faint.png",
          rotationRate: 0.0015,
          composition: ["fine dust"],
        } as RingProperties,
      ],
    } as GasGiantProperties,
  });

  actions.addCelestial({
    id: "io",
    name: "Io",
    seed: "io_seed_1769",
    type: CelestialType.MOON,
    parentId: jupiterId,
    realMass_kg: IO_MASS_KG,
    realRadius_m: IO_RADIUS_M,
    temperature: 110,
    albedo: IO_ALBEDO,
    siderealRotationPeriod_s: IO_SIDEREAL_PERIOD_S,
    axialTilt: defaultMoonAxialTilt,
    orbit: {
      realSemiMajorAxis_m: IO_SMA_M,
      eccentricity: IO_ECC,
      inclination: IO_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: Math.random() * 2 * Math.PI,
      argumentOfPeriapsis: Math.random() * 2 * Math.PI,
      meanAnomaly: Math.random() * 2 * Math.PI,
      period_s: IO_SIDEREAL_PERIOD_S,
    },
    properties: {
      type: CelestialType.MOON,
      planetType: PlanetType.LAVA,
      isMoon: true,
      parentPlanet: jupiterId,
      composition: [
        "sulfur compounds",
        "silicates",
        "iron core",
        "molten interior",
      ],
      atmosphere: {
        glowColor: "#FFFF00",
        intensity: 0.1,
        power: 0.8,
        thickness: 0.05,
      },
      surface: {
        type: SurfaceType.VOLCANIC,
        planetType: PlanetType.LAVA,
        color: "#FFFFA0",
        roughness: 0.6,
        lavaColor: "#FF2000",
        rockColor: "#201000",
        lavaActivity: 0.7,
        volcanicActivity: 0.8,
      },
    } as PlanetProperties,
  });

  actions.addCelestial({
    id: "europa",
    name: "Europa",
    seed: "europa_seed_3551",
    type: CelestialType.MOON,
    parentId: jupiterId,
    realMass_kg: EUROPA_MASS_KG,
    realRadius_m: EUROPA_RADIUS_M,
    temperature: 102,
    albedo: EUROPA_ALBEDO,
    siderealRotationPeriod_s: EUROPA_SIDEREAL_PERIOD_S,
    axialTilt: defaultMoonAxialTilt,
    orbit: {
      realSemiMajorAxis_m: EUROPA_SMA_M,
      eccentricity: EUROPA_ECC,
      inclination: EUROPA_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: Math.random() * 2 * Math.PI,
      argumentOfPeriapsis: Math.random() * 2 * Math.PI,
      meanAnomaly: Math.random() * 2 * Math.PI,
      period_s: EUROPA_SIDEREAL_PERIOD_S,
    },
    properties: {
      type: CelestialType.MOON,
      planetType: PlanetType.ICE,
      isMoon: true,
      parentPlanet: jupiterId,
      composition: ["water ice", "silicates", "iron core", "subsurface ocean"],
      atmosphere: {
        glowColor: "#AAFFFF",
        intensity: 0.05,
        power: 0.5,
        thickness: 0.03,
      },
      surface: {
        type: SurfaceType.ICE_CRACKED,
        planetType: PlanetType.ICE,
        color: "#FFFFFF",
        roughness: 0.3,
        crackIntensity: 0.7,
        glossiness: 0.6,
        iceThickness: 15.0,
      },
    } as PlanetProperties,
  });

  actions.addCelestial({
    id: "ganymede",
    name: "Ganymede",
    seed: "ganymede_seed_7155",
    type: CelestialType.MOON,
    parentId: jupiterId,
    realMass_kg: GANYMEDE_MASS_KG,
    realRadius_m: GANYMEDE_RADIUS_M,
    temperature: 110,
    albedo: GANYMEDE_ALBEDO,
    siderealRotationPeriod_s: GANYMEDE_SIDEREAL_PERIOD_S,
    axialTilt: defaultMoonAxialTilt,
    orbit: {
      realSemiMajorAxis_m: GANYMEDE_SMA_M,
      eccentricity: GANYMEDE_ECC,
      inclination: GANYMEDE_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: Math.random() * 2 * Math.PI,
      argumentOfPeriapsis: Math.random() * 2 * Math.PI,
      meanAnomaly: Math.random() * 2 * Math.PI,
      period_s: GANYMEDE_SIDEREAL_PERIOD_S,
    },
    properties: {
      type: CelestialType.MOON,
      planetType: PlanetType.ICE,
      isMoon: true,
      parentPlanet: jupiterId,
      composition: ["water ice", "silicates", "iron core", "internal ocean"],
      atmosphere: {
        glowColor: "#CCDDFF",
        intensity: 0.02,
        power: 0.3,
        thickness: 0.02,
      },
      surface: {
        type: SurfaceType.VARIED,
        planetType: PlanetType.ICE,
        color: "#B8B8C0",
        roughness: 0.5,
        crackIntensity: 0.3,
        glossiness: 0.3,
        iceThickness: 800.0,
      },
    } as PlanetProperties,
  });

  actions.addCelestial({
    id: "callisto",
    name: "Callisto",
    seed: "callisto_seed_16690",
    type: CelestialType.MOON,
    parentId: jupiterId,
    realMass_kg: CALLISTO_MASS_KG,
    realRadius_m: CALLISTO_RADIUS_M,
    temperature: 134,
    albedo: CALLISTO_ALBEDO,
    siderealRotationPeriod_s: CALLISTO_SIDEREAL_PERIOD_S,
    axialTilt: defaultMoonAxialTilt,
    orbit: {
      realSemiMajorAxis_m: CALLISTO_SMA_M,
      eccentricity: CALLISTO_ECC,
      inclination: CALLISTO_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: Math.random() * 2 * Math.PI,
      argumentOfPeriapsis: Math.random() * 2 * Math.PI,
      meanAnomaly: Math.random() * 2 * Math.PI,
      period_s: CALLISTO_SIDEREAL_PERIOD_S,
    },
    properties: {
      type: CelestialType.MOON,
      planetType: PlanetType.ICE,
      isMoon: true,
      parentPlanet: jupiterId,
      composition: ["water ice", "silicates", "possible iron core"],
      atmosphere: {
        glowColor: "#333333",
        intensity: 0.01,
        power: 0.2,
        thickness: 0.01,
      },
      surface: {
        type: SurfaceType.CRATERED,
        planetType: PlanetType.ICE,
        color: "#443322",
        roughness: 0.7,
        crackIntensity: 0.1,
        glossiness: 0.1,
        iceThickness: 200.0,
      },
    } as PlanetProperties,
  });
}
