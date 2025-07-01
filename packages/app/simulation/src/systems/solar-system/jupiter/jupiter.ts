import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";
import { AU } from "@teskooano/core-physics";
import { actions } from "@teskooano/core-state";
import {
  CelestialType,
  GasGiantClass,
  RockyType,
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
      planetType: GasGiantClass.CLASS_I,
      atmosphereColor: "#D2B48C",
      cloudColor: "#FFFFFF",
      cloudSpeed: 120,
      stormSpeed: 80,
      emissiveColor: "#D2B48C1A",
      emissiveIntensity: 0.1,
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

  return jupiterId;
}