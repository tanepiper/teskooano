import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";
import { AU, KM } from "@teskooano/core-physics";
import { celestial } from "@teskooano/core-state";
import {
  CelestialType,
  GasGiantClass,
  RockyType,
  CelestialStatus,
  PhysicsStateReal,
  type GasGiantProperties,
  type RingProperties,
} from "@teskooano/data-types";

const SATURN_MASS_KG = 5.6834e26;
const SATURN_REAL_RADIUS_M = 58232 * KM; // Mean radius
const SATURN_EQUATORIAL_RADIUS_M = 60268 * KM; // Equatorial radius for ring calculations
const SATURN_TEMP_K = 134;
const SATURN_ALBEDO = 0.342; // Bond albedo
const SATURN_SMA_AU = 9.5826;
const SATURN_ECC = 0.0565;
const SATURN_INC_DEG = 2.485;
const SATURN_LAN_DEG = 113.665;
const SATURN_AOP_DEG = 339.392; // Corrected to match astronomical data
const SATURN_MA_DEG = 317.02;
const SATURN_ORBITAL_PERIOD_S = 929292480; // 10,755.70 days in seconds
const SATURN_SIDEREAL_ROTATION_PERIOD_S = 38018; // 10h 33m 38s in seconds
const SATURN_AXIAL_TILT_DEG = 26.73;

/**
 * Initializes Saturn planet with its magnificent ring system.
 * @returns The Saturn planet ID for moon initialization.
 */
export function initializeSaturnPlanet(parentId: string): string {
  const saturnId = "saturn";
  const saturnAxialTiltRad = SATURN_AXIAL_TILT_DEG * DEG_TO_RAD;

  celestial.addCelestial({
    id: saturnId,
    name: "Saturn",
    seed: "saturn",
    type: CelestialType.GAS_GIANT,
    status: CelestialStatus.ACTIVE,
    parentId: parentId,
    realMass_kg: SATURN_MASS_KG,
    realRadius_m: SATURN_REAL_RADIUS_M,
    temperature: SATURN_TEMP_K,
    albedo: SATURN_ALBEDO,

    orbit: {
      realSemiMajorAxis_m: SATURN_SMA_AU * AU,
      eccentricity: SATURN_ECC,
      inclination: SATURN_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: SATURN_LAN_DEG * DEG_TO_RAD,
      argumentOfPeriapsis: SATURN_AOP_DEG * DEG_TO_RAD,
      meanAnomaly: SATURN_MA_DEG * DEG_TO_RAD,
      period_s: SATURN_ORBITAL_PERIOD_S,
      siderealRotationPeriod_s: SATURN_SIDEREAL_ROTATION_PERIOD_S,
      axialTilt: new OSVector3(
        0,
        Math.cos(saturnAxialTiltRad),
        Math.sin(saturnAxialTiltRad),
      ).normalize(),
    },
    physicsStateReal: {
      id: saturnId,
      mass_kg: SATURN_MASS_KG,
      position_m: new OSVector3(0, 0, 0), // Will be calculated by the factory
      velocity_mps: new OSVector3(0, 0, 0), // Will be calculated by the factory
    },
    properties: {
      type: CelestialType.GAS_GIANT,
      classType: GasGiantClass.CLASS_II,
      atmosphereColor: "#F0E68C",
      cloudColor: "#FFF8DC",
      cloudSpeed: 80,
      stormSpeed: 50,
      emissiveColor: "#F0E68C20",
      emissiveIntensity: 0.05,
      rings: [
        // D Ring (innermost, very sparse)
        {
          innerRadius: SATURN_EQUATORIAL_RADIUS_M + 7000 * KM,
          outerRadius: SATURN_EQUATORIAL_RADIUS_M + 14600 * KM,
          density: 0.001,
          opacity: 0.01,
          color: "#BDB7AB",
          type: RockyType.DUST,
          texture: "textures/ring_dust_subtle.png",
          rotationRate: 0.002,
          composition: ["fine dust"],
        } as RingProperties,
        // C Ring (sparse, ice and dust)
        {
          innerRadius: SATURN_EQUATORIAL_RADIUS_M + 14600 * KM,
          outerRadius: SATURN_EQUATORIAL_RADIUS_M + 32000 * KM,
          density: 0.05,
          opacity: 0.1,
          color: "#A9A190",
          type: RockyType.ICE_DUST,
          texture: "textures/ring_c_ring.png",
          rotationRate: 0.0018,
          composition: ["dirty ice", "dust"],
        } as RingProperties,
        // B Ring (densest, bright ice particles)
        {
          innerRadius: SATURN_EQUATORIAL_RADIUS_M + 32000 * KM,
          outerRadius: SATURN_EQUATORIAL_RADIUS_M + 51800 * KM,
          density: 0.9,
          opacity: 0.8,
          color: "#E0DDCF",
          type: RockyType.ICE,
          texture: "textures/ring_b_ring.png",
          rotationRate: 0.0015,
          composition: ["water ice particles"],
        } as RingProperties,
        // Cassini Division (gap - represented as very sparse ring)
        {
          innerRadius: SATURN_EQUATORIAL_RADIUS_M + 51800 * KM,
          outerRadius: SATURN_EQUATORIAL_RADIUS_M + 56200 * KM,
          density: 0.001,
          opacity: 0.02,
          color: "#555555",
          type: RockyType.DUST,
          texture: "textures/ring_dust_subtle.png",
          rotationRate: 0.0014,
          composition: ["sparse particles"],
        } as RingProperties,
        // A Ring (bright, ice particles)
        {
          innerRadius: SATURN_EQUATORIAL_RADIUS_M + 56200 * KM,
          outerRadius: SATURN_EQUATORIAL_RADIUS_M + 80000 * KM,
          density: 0.6,
          opacity: 0.6,
          color: "#DAD4C5",
          type: RockyType.ICE,
          texture: "textures/ring_a_ring.png",
          rotationRate: 0.0012,
          composition: ["water ice"],
        } as RingProperties,
        // F Ring (narrow, dynamic)
        {
          innerRadius: SATURN_EQUATORIAL_RADIUS_M + 80200 * KM,
          outerRadius: SATURN_EQUATORIAL_RADIUS_M + 80800 * KM,
          density: 0.1,
          opacity: 0.3,
          color: "#CCC5B8",
          type: RockyType.ICE_DUST,
          texture: "textures/ring_f_ring.png",
          rotationRate: 0.0011,
          composition: ["ice particles", "dust"],
        } as RingProperties,
        // G Ring (very sparse)
        {
          innerRadius: SATURN_EQUATORIAL_RADIUS_M + 166000 * KM,
          outerRadius: SATURN_EQUATORIAL_RADIUS_M + 175000 * KM,
          density: 0.0001,
          opacity: 0.005,
          color: "#B8B0A2",
          type: RockyType.DUST,
          texture: "textures/ring_g_ring.png",
          rotationRate: 0.0009,
          composition: ["micrometer dust"],
        } as RingProperties,
        // E Ring (extremely sparse, extends very far)
        {
          innerRadius: SATURN_EQUATORIAL_RADIUS_M + 180000 * KM,
          outerRadius: SATURN_EQUATORIAL_RADIUS_M + 480000 * KM,
          density: 0.00001,
          opacity: 0.001,
          color: "#95a0a8",
          type: RockyType.ICE_DUST,
          texture: "textures/ring_e_ring.png",
          rotationRate: 0.0005,
          composition: ["ice crystals", "dust"],
        } as RingProperties,
      ],
    } as GasGiantProperties,
  });

  return saturnId;
}
