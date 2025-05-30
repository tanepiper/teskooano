import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";
import { AU } from "@teskooano/core-physics";
import { actions } from "@teskooano/core-state";
import {
  AtmosphereType,
  CelestialType,
  GasGiantClass,
  type GasGiantProperties,
  type RingSystemProperties,
  RockyType,
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

export function initializeUranusPlanetAndRings(parentId: string): string {
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
      emissiveColor: "#00BFFF",
      emissiveIntensity: 0.05,
      ringTilt: {
        x: 0,
        y: Math.cos(uranusAxialTiltRad),
        z: Math.sin(uranusAxialTiltRad),
      },
    } as GasGiantProperties,
  });

  // Uranus Ring System - Create as separate celestial object
  actions.addCelestial({
    id: "uranus-rings",
    name: "Uranus Rings",
    seed: "uranus-rings",
    type: CelestialType.RING_SYSTEM,
    parentId: uranusId,
    realMass_kg: 0,
    realRadius_m: 0,
    temperature: URANUS_TEMP_K,
    albedo: 0.05,
    siderealRotationPeriod_s: URANUS_SIDEREAL_ROTATION_PERIOD_S,
    axialTilt: new OSVector3(
      0,
      Math.cos(uranusAxialTiltRad),
      Math.sin(uranusAxialTiltRad),
    ).normalize(),
    orbit: {} as any, // Rings orbit the planet, so orbital parameters are relative to the planet
    properties: {
      type: CelestialType.RING_SYSTEM,
      parentId: uranusId,
      rings: [
        {
          innerRadius: 1.6,
          outerRadius: 1.62,
          density: 0.5,
          opacity: 0.3,
          color: "#B0B0B8",
          type: RockyType.DARK_ROCK,
          texture: "placeholder_ring_texture",
          rotationRate: 0.001,
          composition: ["carbon-rich particles"],
        },
        {
          innerRadius: 1.7,
          outerRadius: 1.72,
          density: 0.6,
          opacity: 0.35,
          color: "#A8A8B0",
          type: RockyType.DARK_ROCK,
          texture: "placeholder_ring_texture",
          rotationRate: 0.0009,
          composition: ["dark rock fragments"],
        },
        {
          innerRadius: 1.95,
          outerRadius: 1.97,
          density: 0.7,
          opacity: 0.4,
          color: "#C0C0C8",
          type: RockyType.DARK_ROCK,
          texture: "placeholder_ring_texture",
          rotationRate: 0.0008,
          composition: ["dark particles", "carbon compounds"],
        },
      ],
    } as RingSystemProperties,
  });
  return uranusId;
}
