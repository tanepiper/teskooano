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
} from "@teskooano/data-types";

const URANUS_SIDEREAL_DAY_S = -0.71833 * 24 * 3600;
const URANUS_AXIAL_TILT_DEG = 97.77;

/**
 * Creates Uranus and its major moons.
 * @param parentId The ID of the parent object (Sun).
 */
export function initializeUranus(parentId: string): void {
  const uranusId = "uranus";
  const sma_au = 19.2184;

  actions.addCelestial({
    id: uranusId,
    name: "Uranus",
    seed: "uranus_seed_84",
    type: CelestialType.GAS_GIANT,
    parentId: parentId,
    realMass_kg: 8.681e25,
    realRadius_m: 25362000,
    visualScaleRadius: 4.0,
    orbit: {
      realSemiMajorAxis_m: sma_au * AU,
      eccentricity: 0.046381,
      inclination: 0.7733 * DEG_TO_RAD,
      longitudeOfAscendingNode: 74.006 * DEG_TO_RAD,
      argumentOfPeriapsis: 96.999 * DEG_TO_RAD,
      meanAnomaly: 142.234 * DEG_TO_RAD,
      period_s: 2.651e9,
    },
    temperature: 76,
    albedo: 0.51,
    siderealRotationPeriod_s: URANUS_SIDEREAL_DAY_S,
    axialTilt: new OSVector3(
      0,
      Math.cos(URANUS_AXIAL_TILT_DEG * DEG_TO_RAD),
      Math.sin(URANUS_AXIAL_TILT_DEG * DEG_TO_RAD),
    ).normalize(),
    properties: {
      type: CelestialType.GAS_GIANT,
      gasGiantClass: GasGiantClass.CLASS_III,
      atmosphereColor: "#AFEEEE",
      cloudColor: "#E0FFFF",
      cloudSpeed: 150,
      ringTilt: {
        x: 0,
        y: -1,
        z: 0,
      },
      rings: [
        {
          innerRadius: 1.91 * 25362000,
          outerRadius: 2.01 * 25362000,
          density: 0.1,
          opacity: 0.1,
          color: "#696969",
          rotationRate: 0.00005,
          texture: "ring_texture_dark.png",
          composition: ["dark dust", "ice boulders"],
          type: RockyType.DARK_ROCK,
        },
      ],
    },
  });

  const sma_m_titania = 436300 * KM;
  actions.addCelestial({
    id: "titania",
    name: "Titania",
    seed: "titania_seed_8706",
    type: CelestialType.MOON,
    parentId: uranusId,
    realMass_kg: 3.527e21,
    realRadius_m: 788400,
    siderealRotationPeriod_s: 7.526e5,
    axialTilt: new OSVector3(0, 1, 0).normalize(),
    visualScaleRadius: 0.12,
    orbit: {
      realSemiMajorAxis_m: sma_m_titania,
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
      composition: [],
      pressure: 0,
      color: "#444444",
    },
    surface: {
      type: SurfaceType.CRATERED,
      color: "#B0B0B0",
      roughness: 0.7,
    },
    properties: {
      type: CelestialType.MOON,
      planetType: PlanetType.ICE,
      isMoon: true,
      parentPlanet: uranusId,
      composition: ["water ice", "rock"],
    },
  });

  const sma_m_oberon = 583520 * KM;
  actions.addCelestial({
    id: "oberon",
    name: "Oberon",
    seed: "oberon_seed_1346",
    type: CelestialType.MOON,
    parentId: uranusId,
    realMass_kg: 3.014e21,
    realRadius_m: 761400,
    siderealRotationPeriod_s: 1.162e6,
    axialTilt: new OSVector3(0, 1, 0).normalize(),
    visualScaleRadius: 0.12,
    orbit: {
      realSemiMajorAxis_m: sma_m_oberon,
      eccentricity: 0.0014,
      inclination: 0.058 * DEG_TO_RAD,
      longitudeOfAscendingNode: 0,
      argumentOfPeriapsis: 0,
      meanAnomaly: Math.random() * 360 * DEG_TO_RAD,
      period_s: 1.162e6,
    },
    temperature: 75,
    albedo: 0.35,
    atmosphere: { composition: [], pressure: 0, color: "#444444" },
    surface: {
      type: SurfaceType.CRATERED,
      color: "#A0A0A0",
      secondaryColor: "#505050",
      roughness: 0.8,
    },
    properties: {
      type: CelestialType.MOON,
      planetType: PlanetType.ICE,
      isMoon: true,
      parentPlanet: uranusId,
      composition: ["water ice", "rock"],
    },
  });

  const sma_m_umbriel = 266000 * KM;
  actions.addCelestial({
    id: "umbriel",
    name: "Umbriel",
    seed: "umbriel_seed_4144",
    type: CelestialType.MOON,
    parentId: uranusId,
    realMass_kg: 1.172e21,
    realRadius_m: 584700,
    siderealRotationPeriod_s: 3.582e5,
    axialTilt: new OSVector3(0, 1, 0).normalize(),
    visualScaleRadius: 0.09,
    orbit: {
      realSemiMajorAxis_m: sma_m_umbriel,
      eccentricity: 0.0039,
      inclination: 0.128 * DEG_TO_RAD,
      longitudeOfAscendingNode: 0,
      argumentOfPeriapsis: 0,
      meanAnomaly: Math.random() * 360 * DEG_TO_RAD,
      period_s: 3.582e5,
    },
    temperature: 75,
    albedo: 0.21,
    atmosphere: { composition: [], pressure: 0, color: "#444444" },
    surface: {
      type: SurfaceType.CRATERED,
      color: "#5A5A5A",
      roughness: 0.85,
    },
    properties: {
      type: CelestialType.MOON,
      planetType: PlanetType.ICE,
      isMoon: true,
      parentPlanet: uranusId,
      composition: ["water ice", "rock", "methane ice?"],
    },
  });

  const sma_m_ariel = 191020 * KM;
  actions.addCelestial({
    id: "ariel",
    name: "Ariel",
    seed: "ariel_seed_2520",
    type: CelestialType.MOON,
    parentId: uranusId,
    realMass_kg: 1.353e21,
    realRadius_m: 578900,
    siderealRotationPeriod_s: 2.178e5,
    axialTilt: new OSVector3(0, 1, 0).normalize(),
    visualScaleRadius: 0.09,
    orbit: {
      realSemiMajorAxis_m: sma_m_ariel,
      eccentricity: 0.0012,
      inclination: 0.26 * DEG_TO_RAD,
      longitudeOfAscendingNode: 0,
      argumentOfPeriapsis: 0,
      meanAnomaly: Math.random() * 360 * DEG_TO_RAD,
      period_s: 2.178e5,
    },
    temperature: 60,
    albedo: 0.39,
    atmosphere: { composition: [], pressure: 0, color: "#444444" },
    surface: {
      type: SurfaceType.VARIED,
      planetType: PlanetType.ICE,
      color: "#F0FFFF",
      secondaryColor: "#ADD8E6",
      roughness: 0.4,
    } as IceSurfaceProperties,
    properties: {
      type: CelestialType.MOON,
      planetType: PlanetType.ICE,
      isMoon: true,
      parentPlanet: uranusId,
      composition: ["water ice", "rock"],
    },
  });

  const sma_m_miranda = 129390 * KM;
  actions.addCelestial({
    id: "miranda",
    name: "Miranda",
    seed: "miranda_seed_1413",
    type: CelestialType.MOON,
    parentId: uranusId,
    realMass_kg: 6.59e19,
    realRadius_m: 235800,
    siderealRotationPeriod_s: 1.22e5,
    axialTilt: new OSVector3(0, 1, 0).normalize(),
    visualScaleRadius: 0.04,
    orbit: {
      realSemiMajorAxis_m: sma_m_miranda,
      eccentricity: 0.0013,
      inclination: 4.232 * DEG_TO_RAD,
      longitudeOfAscendingNode: 0,
      argumentOfPeriapsis: 0,
      meanAnomaly: Math.random() * 360 * DEG_TO_RAD,
      period_s: 1.22e5,
    },
    temperature: 60,
    albedo: 0.32,
    atmosphere: { composition: [], pressure: 0, color: "#444444" },
    surface: {
      type: SurfaceType.CANYONOUS,
      planetType: PlanetType.ICE,
      color: "#C0C0C0",
      secondaryColor: "#808080",
      roughness: 0.7,
    } as IceSurfaceProperties,
    properties: {
      type: CelestialType.MOON,
      planetType: PlanetType.ICE,
      isMoon: true,
      parentPlanet: uranusId,
      composition: ["water ice", "silicates"],
    },
  });
}
