import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";
import { AU, KM } from "@teskooano/core-physics";
import { actions } from "@teskooano/core-state";
import {
  AtmosphereType,
  CelestialType,
  GasGiantClass,
  PlanetType,
  RockyType,
  SurfaceType,
  type GasGiantProperties,
  type IceSurfaceProperties,
  type PlanetAtmosphereProperties,
  type PlanetProperties,
  type RingProperties,
} from "@teskooano/data-types";

const URANUS_REAL_MASS_KG = 8.681e25;
const URANUS_SIDEREAL_ROTATION_PERIOD_S = -0.71833 * 24 * 3600;
const URANUS_AXIAL_TILT_DEG = 97.77;
const URANUS_ORBITAL_PERIOD_S = 2.651e9;
const URANUS_REAL_RADIUS_M = 25362000;
const URANUS_TEMP_K = 76;
const URANUS_ALBEDO = 0.3;
const URANUS_SMA_AU = 19.201;
const URANUS_ECC = 0.0463;
const URANUS_INC_DEG = 0.769;
const URANUS_LAN_DEG = 74.23;
const URANUS_AOP_DEG = 96.999 + URANUS_LAN_DEG;
const URANUS_MA_DEG = 142.238;

const TITANIA_REAL_RADIUS_M = 788400;
const TITANIA_MASS_KG = 3.42e21;
const TITANIA_RADIUS_M = TITANIA_REAL_RADIUS_M;
const TITANIA_TEMP_K = 70;
const TITANIA_ALBEDO = 0.22;
const TITANIA_SMA_M = 435910 * KM;
const TITANIA_ECC = 0.0011;
const TITANIA_INC_DEG = 0.34;
const TITANIA_SIDEREAL_PERIOD_S = 8.706e5;

const OBERON_REAL_RADIUS_M = 761400;
const OBERON_MASS_KG = 2.88e21;
const OBERON_RADIUS_M = OBERON_REAL_RADIUS_M;
const OBERON_TEMP_K = 61;
const OBERON_ALBEDO = 0.23;
const OBERON_SMA_M = 583520 * KM;
const OBERON_ECC = 0.0014;
const OBERON_INC_DEG = 0.058;
const OBERON_SIDEREAL_PERIOD_S = 1.377e6;

const UMBRIEL_REAL_RADIUS_M = 584700;
const UMBRIEL_MASS_KG = 1.28e21;
const UMBRIEL_RADIUS_M = UMBRIEL_REAL_RADIUS_M;
const UMBRIEL_TEMP_K = 75;
const UMBRIEL_ALBEDO = 0.18;
const UMBRIEL_SMA_M = 266000 * KM;
const UMBRIEL_ECC = 0.0039;
const UMBRIEL_INC_DEG = 0.128;
const UMBRIEL_SIDEREAL_PERIOD_S = 3.58e5;

const ARIEL_REAL_RADIUS_M = 578900;
const ARIEL_MASS_KG = 1.29e21;
const ARIEL_RADIUS_M = ARIEL_REAL_RADIUS_M;
const ARIEL_TEMP_K = 76;
const ARIEL_ALBEDO = 0.39;
const ARIEL_SMA_M = 190900 * KM;
const ARIEL_ECC = 0.0012;
const ARIEL_INC_DEG = 0.041;
const ARIEL_SIDEREAL_PERIOD_S = 2.156e5;

const MIRANDA_REAL_RADIUS_M = 235800;
const MIRANDA_MASS_KG = 6.6e19;
const MIRANDA_RADIUS_M = MIRANDA_REAL_RADIUS_M;
const MIRANDA_TEMP_K = 77;
const MIRANDA_ALBEDO = 0.32;
const MIRANDA_SMA_M = 129900 * KM;
const MIRANDA_ECC = 0.0013;
const MIRANDA_INC_DEG = 4.232;
const MIRANDA_SIDEREAL_PERIOD_S = 1.236e5;

/**
 * Initializes Uranus, its rings, and major moons using accurate data.
 */
export function initializeUranus(parentId: string): void {
  const uranusId = "uranus";
  const uranusAxialTiltRad = URANUS_AXIAL_TILT_DEG * DEG_TO_RAD;

  actions.addCelestial({
    id: uranusId,
    name: "Uranus",
    seed: "uranus",
    type: CelestialType.GAS_GIANT,
    parentId: parentId,
    realMass_kg: URANUS_REAL_MASS_KG,
    realRadius_m: URANUS_REAL_RADIUS_M,
    temperature: URANUS_TEMP_K,
    albedo: URANUS_ALBEDO,
    siderealRotationPeriod_s: URANUS_SIDEREAL_ROTATION_PERIOD_S,
    axialTilt: new OSVector3(
      0,
      Math.cos(uranusAxialTiltRad),
      Math.sin(uranusAxialTiltRad),
    ).normalize(),
    orbit: {
      realSemiMajorAxis_m: URANUS_SMA_AU * AU,
      eccentricity: URANUS_ECC,
      inclination: URANUS_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: URANUS_LAN_DEG * DEG_TO_RAD,
      argumentOfPeriapsis: (URANUS_AOP_DEG - URANUS_LAN_DEG) * DEG_TO_RAD,
      meanAnomaly: URANUS_MA_DEG * DEG_TO_RAD,
      period_s: URANUS_ORBITAL_PERIOD_S,
    },
    properties: {
      type: CelestialType.GAS_GIANT,
      gasGiantClass: GasGiantClass.CLASS_III,
      atmosphereColor: "#00BFFF",
      cloudColor: "#E0FFFF",
      cloudSpeed: 150,
      atmosphere: {
        composition: ["H2", "He", "CH4"],
        pressure: 800000,
        type: AtmosphereType.VERY_DENSE,
        glowColor: "#00BFFF",
        intensity: 0.5,
        power: 1.2,
        thickness: 0.25,
      },
      stormColor: "#006994",
      stormSpeed: 100,
      emissiveColor: "#00BFFF20",
      emissiveIntensity: 0.05,
      rings: [
        {
          innerRadius: 38000 * KM,
          outerRadius: 51149 * KM,
          density: 0.1,
          opacity: 0.2,
          color: "#303030",
          type: RockyType.DARK_ROCK,
          texture: "textures/ring_dust.png",
          rotationRate: 0.001,
          composition: ["dust", "dark particles"],
        } as RingProperties,
      ],
    } as GasGiantProperties,
  });

  // Add Miranda
  actions.addCelestial({
    id: "miranda",
    name: "Miranda",
    seed: "miranda",
    type: CelestialType.MOON,
    parentId: uranusId,
    realMass_kg: MIRANDA_MASS_KG,
    realRadius_m: MIRANDA_RADIUS_M,
    temperature: MIRANDA_TEMP_K,
    albedo: MIRANDA_ALBEDO,
    siderealRotationPeriod_s: MIRANDA_SIDEREAL_PERIOD_S,
    axialTilt: new OSVector3(0, 1, 0),
    orbit: {
      realSemiMajorAxis_m: MIRANDA_SMA_M,
      eccentricity: MIRANDA_ECC,
      inclination: MIRANDA_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: Math.random() * 2 * Math.PI,
      argumentOfPeriapsis: Math.random() * 2 * Math.PI,
      meanAnomaly: Math.random() * 2 * Math.PI,
      period_s: MIRANDA_SIDEREAL_PERIOD_S,
    },
    properties: {
      type: CelestialType.MOON,
      planetType: PlanetType.ICE,
      isMoon: true,
      parentPlanet: uranusId,
      composition: ["water ice", "silicates", "possibly organic compounds"],
      atmosphere: {
        glowColor: "#FFFFFF01",
        intensity: 0.0,
        power: 0.0,
        thickness: 0.0,
      },
      surface: {
        type: SurfaceType.VARIED,
        planetType: PlanetType.ICE,
        color: "#D0D0D8",
        roughness: 0.8,
        crackIntensity: 0.7,
        glossiness: 0.3,
        iceThickness: 20.0,
      },
    } as PlanetProperties,
  });

  // Add Ariel
  actions.addCelestial({
    id: "ariel",
    name: "Ariel",
    seed: "ariel",
    type: CelestialType.MOON,
    parentId: uranusId,
    realMass_kg: ARIEL_MASS_KG,
    realRadius_m: ARIEL_RADIUS_M,
    temperature: ARIEL_TEMP_K,
    albedo: ARIEL_ALBEDO,
    siderealRotationPeriod_s: ARIEL_SIDEREAL_PERIOD_S,
    axialTilt: new OSVector3(0, 1, 0),
    orbit: {
      realSemiMajorAxis_m: ARIEL_SMA_M,
      eccentricity: ARIEL_ECC,
      inclination: ARIEL_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: Math.random() * 2 * Math.PI,
      argumentOfPeriapsis: Math.random() * 2 * Math.PI,
      meanAnomaly: Math.random() * 2 * Math.PI,
      period_s: ARIEL_SIDEREAL_PERIOD_S,
    },
    properties: {
      type: CelestialType.MOON,
      planetType: PlanetType.ICE,
      isMoon: true,
      parentPlanet: uranusId,
      composition: ["water ice", "silicates", "carbon dioxide ice"],
      atmosphere: {
        glowColor: "#FFFFFF01",
        intensity: 0.0,
        power: 0.0,
        thickness: 0.0,
      },
      surface: {
        type: SurfaceType.VARIED,
        planetType: PlanetType.ICE,
        color: "#E0E0E8",
        roughness: 0.7,
        crackIntensity: 0.5,
        glossiness: 0.4,
        iceThickness: 30.0,
      },
    } as PlanetProperties,
  });

  // Add Umbriel
  actions.addCelestial({
    id: "umbriel",
    name: "Umbriel",
    seed: "umbriel",
    type: CelestialType.MOON,
    parentId: uranusId,
    realMass_kg: UMBRIEL_MASS_KG,
    realRadius_m: UMBRIEL_RADIUS_M,
    temperature: UMBRIEL_TEMP_K,
    albedo: UMBRIEL_ALBEDO,
    siderealRotationPeriod_s: UMBRIEL_SIDEREAL_PERIOD_S,
    axialTilt: new OSVector3(0, 1, 0),
    orbit: {
      realSemiMajorAxis_m: UMBRIEL_SMA_M,
      eccentricity: UMBRIEL_ECC,
      inclination: UMBRIEL_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: Math.random() * 2 * Math.PI,
      argumentOfPeriapsis: Math.random() * 2 * Math.PI,
      meanAnomaly: Math.random() * 2 * Math.PI,
      period_s: UMBRIEL_SIDEREAL_PERIOD_S,
    },
    properties: {
      type: CelestialType.MOON,
      planetType: PlanetType.ICE,
      isMoon: true,
      parentPlanet: uranusId,
      composition: ["water ice", "silicates", "carbon compounds"],
      atmosphere: {
        glowColor: "#FFFFFF01",
        intensity: 0.0,
        power: 0.0,
        thickness: 0.0,
      },
      surface: {
        type: SurfaceType.CRATERED,
        planetType: PlanetType.ICE,
        color: "#808090",
        roughness: 0.8,
        crackIntensity: 0.3,
        glossiness: 0.2,
        iceThickness: 40.0,
      },
    } as PlanetProperties,
  });

  // Add Titania
  actions.addCelestial({
    id: "titania",
    name: "Titania",
    seed: "titania",
    type: CelestialType.MOON,
    parentId: uranusId,
    realMass_kg: TITANIA_MASS_KG,
    realRadius_m: TITANIA_RADIUS_M,
    temperature: TITANIA_TEMP_K,
    albedo: TITANIA_ALBEDO,
    siderealRotationPeriod_s: TITANIA_SIDEREAL_PERIOD_S,
    axialTilt: new OSVector3(0, 1, 0),
    orbit: {
      realSemiMajorAxis_m: TITANIA_SMA_M,
      eccentricity: TITANIA_ECC,
      inclination: TITANIA_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: Math.random() * 2 * Math.PI,
      argumentOfPeriapsis: Math.random() * 2 * Math.PI,
      meanAnomaly: Math.random() * 2 * Math.PI,
      period_s: TITANIA_SIDEREAL_PERIOD_S,
    },
    properties: {
      type: CelestialType.MOON,
      planetType: PlanetType.ICE,
      isMoon: true,
      parentPlanet: uranusId,
      composition: ["water ice", "silicates", "possible subsurface water"],
      atmosphere: {
        glowColor: "#FFFFFF01",
        intensity: 0.01,
        power: 0.1,
        thickness: 0.01,
      },
      surface: {
        type: SurfaceType.VARIED,
        planetType: PlanetType.ICE,
        color: "#C0C0C8",
        roughness: 0.7,
        crackIntensity: 0.4,
        glossiness: 0.3,
        iceThickness: 50.0,
      },
    } as PlanetProperties,
  });

  // Add Oberon
  actions.addCelestial({
    id: "oberon",
    name: "Oberon",
    seed: "oberon",
    type: CelestialType.MOON,
    parentId: uranusId,
    realMass_kg: OBERON_MASS_KG,
    realRadius_m: OBERON_RADIUS_M,
    temperature: OBERON_TEMP_K,
    albedo: OBERON_ALBEDO,
    siderealRotationPeriod_s: OBERON_SIDEREAL_PERIOD_S,
    axialTilt: new OSVector3(0, 1, 0),
    orbit: {
      realSemiMajorAxis_m: OBERON_SMA_M,
      eccentricity: OBERON_ECC,
      inclination: OBERON_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: Math.random() * 2 * Math.PI,
      argumentOfPeriapsis: Math.random() * 2 * Math.PI,
      meanAnomaly: Math.random() * 2 * Math.PI,
      period_s: OBERON_SIDEREAL_PERIOD_S,
    },
    properties: {
      type: CelestialType.MOON,
      planetType: PlanetType.ICE,
      isMoon: true,
      parentPlanet: uranusId,
      composition: ["water ice", "silicates", "carbon compounds"],
      atmosphere: {
        glowColor: "#FFFFFF01",
        intensity: 0.0,
        power: 0.0,
        thickness: 0.0,
      },
      surface: {
        type: SurfaceType.CRATERED,
        planetType: PlanetType.ICE,
        color: "#A0A0A8",
        roughness: 0.8,
        crackIntensity: 0.2,
        glossiness: 0.25,
        iceThickness: 40.0,
      },
    } as PlanetProperties,
  });
}
