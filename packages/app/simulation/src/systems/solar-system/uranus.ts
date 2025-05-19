import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";
import { AU, KM } from "@teskooano/core-physics";
import { actions } from "@teskooano/core-state";
import {
  CelestialType,
  GasGiantClass,
  PlanetType,
  RockyType,
  SurfaceType,
  type IceSurfaceProperties,
  type GasGiantProperties,
  type PlanetAtmosphereProperties,
  type PlanetProperties,
  type RingProperties,
} from "@teskooano/data-types";

const URANUS_SIDEREAL_ROTATION_PERIOD_S = -0.71833 * 24 * 3600;
const URANUS_AXIAL_TILT_DEG = 97.77;
const URANUS_ORBITAL_PERIOD_S = 2.651e9;
const URANUS_REAL_RADIUS_M = 25362000;

const TITANIA_REAL_RADIUS_M = 788400;
const OBERON_REAL_RADIUS_M = 761400;
const UMBRIEL_REAL_RADIUS_M = 584700;
const ARIEL_REAL_RADIUS_M = 578900;
const MIRANDA_REAL_RADIUS_M = 235800;

/**
 * Creates Uranus and its major moons.
 * @param parentId The ID of the parent object (Sun).
 */
export function initializeUranus(parentId: string): void {
  const uranusId = "uranus";
  const uranusAxialTiltRad = URANUS_AXIAL_TILT_DEG * DEG_TO_RAD;
  const defaultMoonAxialTilt = new OSVector3(0, 1, 0).normalize();

  actions.addCelestial({
    id: uranusId,
    name: "Uranus",
    seed: "uranus_seed_84",
    type: CelestialType.GAS_GIANT,
    parentId: parentId,
    realMass_kg: 8.681e25,
    realRadius_m: URANUS_REAL_RADIUS_M,
    orbit: {
      realSemiMajorAxis_m: 19.2184 * AU,
      eccentricity: 0.046381,
      inclination: 0.7733 * DEG_TO_RAD,
      longitudeOfAscendingNode: 74.006 * DEG_TO_RAD,
      argumentOfPeriapsis: 96.999 * DEG_TO_RAD,
      meanAnomaly: 142.234 * DEG_TO_RAD,
      period_s: URANUS_ORBITAL_PERIOD_S,
    },
    temperature: 76,
    albedo: 0.51,
    siderealRotationPeriod_s: URANUS_SIDEREAL_ROTATION_PERIOD_S,
    axialTilt: new OSVector3(
      0,
      Math.cos(uranusAxialTiltRad),
      Math.sin(uranusAxialTiltRad),
    ).normalize(),
    properties: {
      type: CelestialType.GAS_GIANT,
      gasGiantClass: GasGiantClass.CLASS_III,
      atmosphereColor: "#AFEEEE",
      cloudColor: "#E0FFFF",
      cloudSpeed: 150,
      emissiveColor: "#AFEEEE1A",
      emissiveIntensity: 0.03,
      rings: [
        {
          innerRadius: 1.91 * URANUS_REAL_RADIUS_M,
          outerRadius: 2.01 * URANUS_REAL_RADIUS_M,
          density: 0.05,
          opacity: 0.05,
          color: "#4A4A4A",
          type: RockyType.DARK_ROCK,
          texture: "textures/ring_uranus_epsilon.png",
          rotationRate: 0.002,
          composition: ["dark particles", "ice"],
        } as RingProperties,
      ],
    } as GasGiantProperties,
  });

  actions.addCelestial({
    id: "titania",
    name: "Titania",
    seed: "titania_seed_8706",
    type: CelestialType.MOON,
    parentId: uranusId,
    realMass_kg: 3.527e21,
    realRadius_m: TITANIA_REAL_RADIUS_M,
    siderealRotationPeriod_s: 7.526e5,
    axialTilt: defaultMoonAxialTilt,
    orbit: {
      realSemiMajorAxis_m: 436300 * KM,
      eccentricity: 0.0011,
      inclination: 0.34 * DEG_TO_RAD,
      longitudeOfAscendingNode: 0,
      argumentOfPeriapsis: 0,
      meanAnomaly: 15.9 * DEG_TO_RAD,
      period_s: 7.526e5,
    },
    temperature: 70,
    albedo: 0.27,
    atmosphere: {
      glowColor: "#44444405",
      intensity: 0.01,
      power: 0.5,
      thickness: 0.005,
    } as PlanetAtmosphereProperties,
    surface: {
      type: SurfaceType.CRATERED,
      planetType: PlanetType.ICE,
      color: "#B0B0B8",
      roughness: 0.7,
      glossiness: 0.3,
      crackIntensity: 0.4,
      iceThickness: 50.0,
    } as IceSurfaceProperties,
    properties: {
      type: CelestialType.MOON,
      planetType: PlanetType.ICE,
      isMoon: true,
      parentPlanet: uranusId,
      composition: ["water ice", "rock", "carbon dioxide ice"],
    } as PlanetProperties,
  });

  actions.addCelestial({
    id: "oberon",
    name: "Oberon",
    seed: "oberon_seed_1346",
    type: CelestialType.MOON,
    parentId: uranusId,
    realMass_kg: 3.014e21,
    realRadius_m: OBERON_REAL_RADIUS_M,
    siderealRotationPeriod_s: 1.162e6,
    axialTilt: defaultMoonAxialTilt,
    orbit: {
      realSemiMajorAxis_m: 583520 * KM,
      eccentricity: 0.0014,
      inclination: 0.058 * DEG_TO_RAD,
      longitudeOfAscendingNode: Math.random() * 2 * Math.PI,
      argumentOfPeriapsis: Math.random() * 2 * Math.PI,
      meanAnomaly: Math.random() * 360 * DEG_TO_RAD,
      period_s: 1.162e6,
    },
    temperature: 75,
    albedo: 0.35,
    atmosphere: {
      glowColor: "#44444405",
      intensity: 0.01,
      power: 0.5,
      thickness: 0.005,
    } as PlanetAtmosphereProperties,
    surface: {
      type: SurfaceType.CRATERED,
      planetType: PlanetType.ICE,
      color: "#9898A0",
      secondaryColor: "#403838",
      roughness: 0.8,
      glossiness: 0.2,
      crackIntensity: 0.2,
      iceThickness: 60.0,
    } as IceSurfaceProperties,
    properties: {
      type: CelestialType.MOON,
      planetType: PlanetType.ICE,
      isMoon: true,
      parentPlanet: uranusId,
      composition: ["water ice", "rock", "dark carbonaceous material"],
    } as PlanetProperties,
  });

  actions.addCelestial({
    id: "umbriel",
    name: "Umbriel",
    seed: "umbriel_seed_4144",
    type: CelestialType.MOON,
    parentId: uranusId,
    realMass_kg: 1.172e21,
    realRadius_m: UMBRIEL_REAL_RADIUS_M,
    siderealRotationPeriod_s: 3.582e5,
    axialTilt: defaultMoonAxialTilt,
    orbit: {
      realSemiMajorAxis_m: 266000 * KM,
      eccentricity: 0.0039,
      inclination: 0.128 * DEG_TO_RAD,
      longitudeOfAscendingNode: Math.random() * 2 * Math.PI,
      argumentOfPeriapsis: Math.random() * 2 * Math.PI,
      meanAnomaly: Math.random() * 360 * DEG_TO_RAD,
      period_s: 3.582e5,
    },
    temperature: 75,
    albedo: 0.21,
    atmosphere: {
      glowColor: "#33333305",
      intensity: 0.01,
      power: 0.5,
      thickness: 0.005,
    } as PlanetAtmosphereProperties,
    surface: {
      type: SurfaceType.CRATERED,
      planetType: PlanetType.ICE,
      color: "#50505A",
      roughness: 0.85,
      glossiness: 0.1,
      crackIntensity: 0.1,
      iceThickness: 40.0,
    } as IceSurfaceProperties,
    properties: {
      type: CelestialType.MOON,
      planetType: PlanetType.ICE,
      isMoon: true,
      parentPlanet: uranusId,
      composition: [
        "water ice",
        "rock",
        "methane ice?",
        "dark material coating",
      ],
    } as PlanetProperties,
  });

  actions.addCelestial({
    id: "ariel",
    name: "Ariel",
    seed: "ariel_seed_2520",
    type: CelestialType.MOON,
    parentId: uranusId,
    realMass_kg: 1.353e21,
    realRadius_m: ARIEL_REAL_RADIUS_M,
    siderealRotationPeriod_s: 2.178e5,
    axialTilt: defaultMoonAxialTilt,
    orbit: {
      realSemiMajorAxis_m: 191020 * KM,
      eccentricity: 0.0012,
      inclination: 0.26 * DEG_TO_RAD,
      longitudeOfAscendingNode: Math.random() * 2 * Math.PI,
      argumentOfPeriapsis: Math.random() * 2 * Math.PI,
      meanAnomaly: Math.random() * 360 * DEG_TO_RAD,
      period_s: 2.178e5,
    },
    temperature: 60,
    albedo: 0.39,
    atmosphere: {
      glowColor: "#FFFFFF08",
      intensity: 0.02,
      power: 0.6,
      thickness: 0.008,
    } as PlanetAtmosphereProperties,
    surface: {
      type: SurfaceType.VARIED,
      planetType: PlanetType.ICE,
      color: "#E8E8F0",
      secondaryColor: "#B0C4DE",
      roughness: 0.4,
      glossiness: 0.5,
      crackIntensity: 0.6,
      iceThickness: 30.0,
    } as IceSurfaceProperties,
    properties: {
      type: CelestialType.MOON,
      planetType: PlanetType.ICE,
      isMoon: true,
      parentPlanet: uranusId,
      composition: ["water ice", "rock", "possible ammonia"],
    } as PlanetProperties,
  });

  actions.addCelestial({
    id: "miranda",
    name: "Miranda",
    seed: "miranda_seed_1413",
    type: CelestialType.MOON,
    parentId: uranusId,
    realMass_kg: 6.59e19,
    realRadius_m: MIRANDA_REAL_RADIUS_M,
    siderealRotationPeriod_s: 1.22e5,
    axialTilt: defaultMoonAxialTilt,
    orbit: {
      realSemiMajorAxis_m: 129390 * KM,
      eccentricity: 0.0013,
      inclination: 4.232 * DEG_TO_RAD,
      longitudeOfAscendingNode: Math.random() * 2 * Math.PI,
      argumentOfPeriapsis: Math.random() * 2 * Math.PI,
      meanAnomaly: Math.random() * 360 * DEG_TO_RAD,
      period_s: 1.22e5,
    },
    temperature: 60,
    albedo: 0.32,
    atmosphere: {
      glowColor: "#AAAAAA03",
      intensity: 0.01,
      power: 0.4,
      thickness: 0.003,
    } as PlanetAtmosphereProperties,
    surface: {
      type: SurfaceType.CANYONOUS,
      planetType: PlanetType.ICE,
      color: "#B8B8C0",
      secondaryColor: "#707078",
      roughness: 0.75,
      glossiness: 0.3,
      crackIntensity: 0.8,
      iceThickness: 15.0,
    } as IceSurfaceProperties,
    properties: {
      type: CelestialType.MOON,
      planetType: PlanetType.ICE,
      isMoon: true,
      parentPlanet: uranusId,
      composition: ["water ice", "silicates", "methane clathrates?"],
    } as PlanetProperties,
  });
}
