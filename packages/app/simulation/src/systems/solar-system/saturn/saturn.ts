import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";
import { AU, KM } from "@teskooano/core-physics";
import { actions } from "@teskooano/core-state";
import {
  CelestialType,
  GasGiantClass,
  RockyType,
  type GasGiantProperties,
  type RingProperties,
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
 * Initializes Saturn planet with its magnificent ring system.
 * @returns The Saturn planet ID for moon initialization.
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
      planetType: GasGiantClass.CLASS_II,
      atmosphereColor: "#F0E68C",
      cloudColor: "#FFF8DC",
      cloudSpeed: 80,
      stormSpeed: 50,
      emissiveColor: "#F0E68C20",
      emissiveIntensity: 0.05,
      rings: [
        {
          innerRadius: SATURN_REAL_RADIUS_M * 1.15,
          outerRadius: SATURN_REAL_RADIUS_M * 1.28,
          density: 0.02,
          opacity: 0.05,
          color: "#BDB7AB",
          type: RockyType.DUST,
          texture: "textures/ring_dust_subtle.png",
          rotationRate: 0.002,
          composition: ["fine dust"],
        } as RingProperties,
        {
          innerRadius: SATURN_REAL_RADIUS_M * 1.28,
          outerRadius: SATURN_REAL_RADIUS_M * 1.58,
          density: 0.2,
          opacity: 0.15,
          color: "#A9A190",
          type: RockyType.ICE_DUST,
          texture: "textures/ring_c_ring.png",
          rotationRate: 0.0018,
          composition: ["dirty ice", "dust"],
        } as RingProperties,
        {
          innerRadius: SATURN_REAL_RADIUS_M * 1.58,
          outerRadius: SATURN_REAL_RADIUS_M * 2.02,
          density: 0.8,
          opacity: 0.7,
          color: "#E0DDCF",
          type: RockyType.ICE,
          texture: "textures/ring_b_ring.png",
          rotationRate: 0.0015,
          composition: ["water ice particles"],
        } as RingProperties,
        {
          innerRadius: SATURN_REAL_RADIUS_M * 2.1,
          outerRadius: SATURN_REAL_RADIUS_M * 2.35,
          density: 0.5,
          opacity: 0.5,
          color: "#DAD4C5",
          type: RockyType.ICE,
          texture: "textures/ring_a_ring.png",
          rotationRate: 0.0012,
          composition: ["water ice"],
        } as RingProperties,
        {
          innerRadius: SATURN_REAL_RADIUS_M * 2.41,
          outerRadius: SATURN_REAL_RADIUS_M * 2.415,
          density: 0.1,
          opacity: 0.3,
          color: "#CCC5B8",
          type: RockyType.ICE_DUST,
          texture: "textures/ring_f_ring.png",
          rotationRate: 0.0011,
          composition: ["ice particles", "dust"],
        } as RingProperties,
        {
          innerRadius: SATURN_REAL_RADIUS_M * 2.92,
          outerRadius: SATURN_REAL_RADIUS_M * 2.93,
          density: 0.005,
          opacity: 0.02,
          color: "#B8B0A2",
          type: RockyType.DUST,
          texture: "textures/ring_g_ring.png",
          rotationRate: 0.0009,
          composition: ["micrometer dust"],
        } as RingProperties,
        {
          innerRadius: SATURN_REAL_RADIUS_M * 3.11,
          outerRadius: SATURN_REAL_RADIUS_M * 8.29,
          density: 0.0001,
          opacity: 0.005,
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
