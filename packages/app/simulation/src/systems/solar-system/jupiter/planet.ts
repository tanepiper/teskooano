import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";
import { AU } from "@teskooano/core-physics";
import { actions } from "@teskooano/core-state";
import {
  CelestialType,
  GasGiantClass,
  RockyType,
  type GasGiantProperties,
  type RingSystemProperties,
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
 * Initializes Jupiter and its ring system.
 * @param parentId The ID of the parent celestial body (e.g., the Sun).
 * @returns The ID of Jupiter.
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
      gasGiantClass: GasGiantClass.CLASS_I,
      atmosphereColor: "#D8C8A8",
      cloudColor: "#FFFFFF",
      cloudSpeed: 100,
      stormColor: "#B7410E",
      stormSpeed: 50,
      ringTilt: {
        x: 0,
        y: Math.cos(jupiterAxialTiltRad),
        z: Math.sin(jupiterAxialTiltRad),
      },
    } as GasGiantProperties,
  });

  // Jupiter Ring System
  actions.addCelestial({
    id: "jupiter-rings",
    name: "Jupiter Rings",
    seed: "jupiter-rings",
    type: CelestialType.RING_SYSTEM,
    parentId: jupiterId,
    realMass_kg: 0, // Simplified for rings
    realRadius_m: 0, // N/A for rings as a distinct body
    temperature: JUPITER_TEMP_K, // Inherits from Jupiter
    albedo: 0.05, // Typical for dusty rings
    siderealRotationPeriod_s: JUPITER_SIDEREAL_ROTATION_PERIOD_S, // Rings orbit with Jupiter's influence
    axialTilt: new OSVector3(
      0,
      Math.cos(jupiterAxialTiltRad),
      Math.sin(jupiterAxialTiltRad),
    ).normalize(), // Aligned with Jupiter's tilt
    orbit: {} as any, // Orbital parameters are implicit via parentId and ring definitions
    properties: {
      type: CelestialType.RING_SYSTEM,
      parentId: jupiterId,
      rings: [
        {
          innerRadius: 1.4, // Relative to Jupiter's radius
          outerRadius: 1.5,
          density: 0.2,
          opacity: 0.15,
          color: "#B0B0B8",
          type: RockyType.DUST,
          texture: "placeholder_ring_texture",
          rotationRate: 0.001,
          composition: ["dark dust", "meteorite debris"],
        },
        {
          innerRadius: 1.5,
          outerRadius: 1.75,
          density: 0.15,
          opacity: 0.12,
          color: "#A0A0A8",
          type: RockyType.DUST,
          texture: "placeholder_ring_texture",
          rotationRate: 0.0008,
          composition: ["fine dust", "ring moon debris"],
        },
      ],
    } as RingSystemProperties,
  });

  return jupiterId;
}
