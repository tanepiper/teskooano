import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";
import { AU } from "@teskooano/core-physics";
import { actions } from "@teskooano/core-state";
import {
  CelestialType,
  GasGiantClass,
  RockyType,
  CelestialStatus,
  type GasGiantProperties,
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

/**
 * Initializes Jupiter planet with accurate orbital and physical data.
 * @returns The Jupiter planet ID for moon initialization.
 */
export function initializeJupiterPlanet(parentId: string): string {
  const jupiterId = "jupiter";
  const jupiterAxialTiltRad = JUPITER_AXIAL_TILT_DEG * DEG_TO_RAD;

  actions.addCelestial({
    id: jupiterId,
    name: "Jupiter",
    seed: "jupiter",
    type: CelestialType.GAS_GIANT,
    status: CelestialStatus.ACTIVE,
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
    physicsStateReal: {
      id: jupiterId,
      mass_kg: JUPITER_REAL_MASS_KG,
      position_m: new OSVector3(0, 0, 0), // Will be calculated by the factory
      velocity_mps: new OSVector3(0, 0, 0), // Will be calculated by the factory
    },
    properties: {
      type: CelestialType.GAS_GIANT,
      classType: GasGiantClass.CLASS_I,
      atmosphereColor: "#D2B48C",
      cloudColor: "#FFFFFF",
      cloudSpeed: 120,
      stormSpeed: 80,
      emissiveColor: "#D2B48C1A",
      emissiveIntensity: 0.1,
      rings: [
        {
          // Main Ring (corresponds to the brightest part of Jupiter's ring system)
          innerRadius: 1.72 * JUPITER_REAL_RADIUS_M, // ~122,500 km from Jupiter's center
          outerRadius: 1.8 * JUPITER_REAL_RADIUS_M, // ~129,000 km from Jupiter's center
          density: 0.05,
          opacity: 0.2,
          color: "#b86139",
          type: RockyType.DUST,
          texture: "textures/ring_dust.png",
          rotationRate: 0.002, // Faster rotation rate based on Keplerian mechanics
          composition: ["dust", "micron-sized particles"],
        } as RingProperties,
        {
          // Halo Ring (inner, thicker part of Jupiter's ring system)
          innerRadius: 1.4 * JUPITER_REAL_RADIUS_M, // ~100,000 km from Jupiter's center
          outerRadius: 1.72 * JUPITER_REAL_RADIUS_M, // ~122,500 km from Jupiter's center
          density: 0.01,
          opacity: 0.2,
          color: "#904826",
          type: RockyType.DUST,
          texture: "textures/ring_dust_faint.png",
          rotationRate: 0.003, // Faster rotation for inner ring
          composition: ["submicron dust"],
        } as RingProperties,
        {
          // Amalthea Gossamer Ring
          innerRadius: 1.8 * JUPITER_REAL_RADIUS_M, // ~129,000 km from Jupiter's center
          outerRadius: 2.54 * JUPITER_REAL_RADIUS_M, // ~182,000 km from Jupiter's center
          density: 0.002,
          opacity: 0.01,
          color: "#8B4513",
          type: RockyType.DUST,
          texture: "textures/ring_dust_very_faint.png",
          rotationRate: 0.0015,
          composition: ["fine dust"],
        } as RingProperties,
        {
          // Thebe Gossamer Ring
          innerRadius: 2.54 * JUPITER_REAL_RADIUS_M, // ~182,000 km from Jupiter's center
          outerRadius: 3.1 * JUPITER_REAL_RADIUS_M, // ~221,900 km from Jupiter's center
          density: 0.001,
          opacity: 0.005,
          color: "#8B4513",
          type: RockyType.DUST,
          texture: "textures/ring_dust_very_faint.png",
          rotationRate: 0.001,
          composition: ["very fine dust"],
        } as RingProperties,
      ],
    } as GasGiantProperties,
  });

  return jupiterId;
}
