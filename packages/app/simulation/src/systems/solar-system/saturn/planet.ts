import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";
import { AU, KM } from "@teskooano/core-physics";
import { actions } from "@teskooano/core-state";
import {
  AtmosphereType,
  CelestialType,
  GasGiantClass,
  RockyType,
  type GasGiantProperties,
  type RingSystemProperties,
} from "@teskooano/data-types";

const SATURN_MASS_KG = 5.6834e26;
const SATURN_REAL_RADIUS_M = 58232 * KM;
const SATURN_TEMP_K = 134;
const SATURN_ALBEDO = 0.499;
const SATURN_SMA_AU = 9.5826;
const SATURN_ECC = 0.0565;
const SATURN_INC_DEG = 2.485;
const SATURN_LAN_DEG = 113.665;
const SATURN_AOP_DEG = 93.056 + SATURN_LAN_DEG;
const SATURN_MA_DEG = 49.954;
const SATURN_ORBITAL_PERIOD_S = 9.29598e8;
const SATURN_SIDEREAL_ROTATION_PERIOD_S = 38362.0;
const SATURN_AXIAL_TILT_DEG = 26.73;

/**
 * Initializes Saturn and its ring system.
 * @param parentId The ID of the parent celestial body (e.g., the Sun).
 * @returns The ID of Saturn.
 */
export function initializeSaturnPlanet(parentId: string): string {
  const saturnId = "saturn";
  const saturnAxialTiltRad = SATURN_AXIAL_TILT_DEG * DEG_TO_RAD;

  actions.addCelestial({
    id: saturnId,
    name: "Saturn",
    seed: "saturn",
    type: CelestialType.GAS_GIANT,
    parentId: parentId,
    realMass_kg: SATURN_MASS_KG,
    realRadius_m: SATURN_REAL_RADIUS_M,
    temperature: SATURN_TEMP_K,
    albedo: SATURN_ALBEDO,
    siderealRotationPeriod_s: SATURN_SIDEREAL_ROTATION_PERIOD_S,
    axialTilt: new OSVector3(
      0,
      Math.cos(saturnAxialTiltRad),
      Math.sin(saturnAxialTiltRad),
    ).normalize(),
    orbit: {
      realSemiMajorAxis_m: SATURN_SMA_AU * AU,
      eccentricity: SATURN_ECC,
      inclination: SATURN_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: SATURN_LAN_DEG * DEG_TO_RAD,
      argumentOfPeriapsis: (SATURN_AOP_DEG - SATURN_LAN_DEG) * DEG_TO_RAD,
      meanAnomaly: SATURN_MA_DEG * DEG_TO_RAD,
      period_s: SATURN_ORBITAL_PERIOD_S,
    },
    properties: {
      type: CelestialType.GAS_GIANT,
      gasGiantClass: GasGiantClass.CLASS_II,
      atmosphereColor: "#F0E68C",
      cloudColor: "#FFF8DC",
      cloudSpeed: 80,
      atmosphere: {
        composition: ["H2", "He", "CH4"],
        pressure: 900000, // Example value, adjust as needed
        type: AtmosphereType.VERY_DENSE, // Example, adjust
        density_kgm3: 0.19, // Example
        scaleHeight_m: 59500, // Example
        glowColor: "#F0E68C",
        intensity: 0.6,
        power: 1.2,
        thickness: 0.25,
      },
      stormColor: "#E6D9A3",
      stormSpeed: 50,
      emissiveColor: "#F0E68C",
      emissiveIntensity: 0.05,
      ringTilt: {
        x: 0,
        y: Math.cos(saturnAxialTiltRad),
        z: Math.sin(saturnAxialTiltRad),
      }, // Align with axial tilt
    } as GasGiantProperties,
  });

  // Saturn Ring System
  actions.addCelestial({
    id: "saturn-rings",
    name: "Saturn Rings",
    seed: "saturn-rings",
    type: CelestialType.RING_SYSTEM,
    parentId: saturnId,
    realMass_kg: 0,
    realRadius_m: 0,
    temperature: SATURN_TEMP_K,
    albedo: 0.1,
    siderealRotationPeriod_s: SATURN_SIDEREAL_ROTATION_PERIOD_S,
    axialTilt: new OSVector3(
      0,
      Math.cos(saturnAxialTiltRad),
      Math.sin(saturnAxialTiltRad),
    ).normalize(),
    orbit: {} as any,
    properties: {
      type: CelestialType.RING_SYSTEM,
      parentId: saturnId,
      rings: [
        {
          innerRadius: 1.15,
          outerRadius: 1.28,
          density: 0.2,
          opacity: 0.25,
          color: "#BDB7AB",
          type: RockyType.DUST,
          texture: "placeholder_ring_texture",
          rotationRate: 0.002,
          composition: ["fine dust"],
        },
        {
          innerRadius: 1.28,
          outerRadius: 1.58,
          density: 0.4,
          opacity: 0.45,
          color: "#A9A190",
          type: RockyType.ICE_DUST,
          texture: "placeholder_ring_texture",
          rotationRate: 0.0018,
          composition: ["dirty ice", "dust"],
        },
        {
          innerRadius: 1.58,
          outerRadius: 2.02,
          density: 0.9,
          opacity: 0.8,
          color: "#E0DDCF",
          type: RockyType.ICE,
          texture: "placeholder_ring_texture",
          rotationRate: 0.0015,
          composition: ["water ice particles"],
        },
        {
          innerRadius: 2.1,
          outerRadius: 2.35,
          density: 0.7,
          opacity: 0.7,
          color: "#DAD4C5",
          type: RockyType.ICE,
          texture: "placeholder_ring_texture",
          rotationRate: 0.0012,
          composition: ["water ice"],
        },
        {
          innerRadius: 2.41,
          outerRadius: 2.42,
          density: 0.3,
          opacity: 0.5,
          color: "#CCC5B8",
          type: RockyType.ICE_DUST,
          texture: "placeholder_ring_texture",
          rotationRate: 0.0011,
          composition: ["ice particles", "dust"],
        },
      ],
    } as RingSystemProperties,
  });

  return saturnId;
}
