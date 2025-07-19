import { createOrbitalElements, kmToM } from "@teskooano/core-physics";
import {
  CelestialType,
  GasGiantClass,
  RockyType,
  CelestialStatus,
  type GasGiantProperties,
  type RingProperties,
  CelestialObject,
} from "@teskooano/data-types";

const SATURN_MASS_KG = 5.6834e26;
const SATURN_RADIUS_KM = 58232; // Mean radius
const SATURN_EQUATORIAL_RADIUS_KM = 60268; // Equatorial radius for ring calculations
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
 * Saturn configuration object for modular solar system initialization.
 */
export const saturn: CelestialObject<GasGiantProperties> = {
  id: "saturn",
  name: "Saturn",
  seed: "saturn",
  type: CelestialType.GAS_GIANT,
  status: CelestialStatus.ACTIVE,
  parentId: "sun", // Will be replaced during initialization
  realMass_kg: SATURN_MASS_KG,
  realRadius_m: kmToM(SATURN_RADIUS_KM),
  temperature: SATURN_TEMP_K,
  albedo: SATURN_ALBEDO,
  orbit: createOrbitalElements({
    semiMajorAxisAU: SATURN_SMA_AU,
    eccentricity: SATURN_ECC,
    inclinationDeg: SATURN_INC_DEG,
    longitudeOfAscendingNodeDeg: SATURN_LAN_DEG,
    argumentOfPeriapsisDeg: SATURN_AOP_DEG,
    meanAnomalyDeg: SATURN_MA_DEG,
    period_s: SATURN_ORBITAL_PERIOD_S,
    siderealRotationPeriod_s: SATURN_SIDEREAL_ROTATION_PERIOD_S,
    axialTiltDeg: SATURN_AXIAL_TILT_DEG,
  }),
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
        innerRadius: kmToM(SATURN_EQUATORIAL_RADIUS_KM + 7000),
        outerRadius: kmToM(SATURN_EQUATORIAL_RADIUS_KM + 14600),
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
        innerRadius: kmToM(SATURN_EQUATORIAL_RADIUS_KM + 14600),
        outerRadius: kmToM(SATURN_EQUATORIAL_RADIUS_KM + 32000),
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
        innerRadius: kmToM(SATURN_EQUATORIAL_RADIUS_KM + 32000),
        outerRadius: kmToM(SATURN_EQUATORIAL_RADIUS_KM + 51800),
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
        innerRadius: kmToM(SATURN_EQUATORIAL_RADIUS_KM + 51800),
        outerRadius: kmToM(SATURN_EQUATORIAL_RADIUS_KM + 56200),
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
        innerRadius: kmToM(SATURN_EQUATORIAL_RADIUS_KM + 56200),
        outerRadius: kmToM(SATURN_EQUATORIAL_RADIUS_KM + 80000),
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
        innerRadius: kmToM(SATURN_EQUATORIAL_RADIUS_KM + 80200),
        outerRadius: kmToM(SATURN_EQUATORIAL_RADIUS_KM + 80800),
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
        innerRadius: kmToM(SATURN_EQUATORIAL_RADIUS_KM + 166000),
        outerRadius: kmToM(SATURN_EQUATORIAL_RADIUS_KM + 175000),
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
        innerRadius: kmToM(SATURN_EQUATORIAL_RADIUS_KM + 180000),
        outerRadius: kmToM(SATURN_EQUATORIAL_RADIUS_KM + 480000),
        density: 0.00001,
        opacity: 0.001,
        color: "#95a0a8",
        type: RockyType.ICE_DUST,
        texture: "textures/ring_e_ring.png",
        rotationRate: 0.0005,
        composition: ["ice crystals", "dust"],
      } as RingProperties,
    ],
  },
};
