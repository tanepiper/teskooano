import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";
import { AU, KM } from "@teskooano/core-physics";
import { celestialManager } from "@teskooano/core-state";
import {
  CelestialType,
  GasGiantClass,
  RockyType,
  CelestialStatus,
  type GasGiantProperties,
  type RingProperties,
} from "@teskooano/data-types";

const JUPITER_REAL_MASS_KG = 1.89819e27;
const JUPITER_REAL_RADIUS_M = 69911 * KM; // Mean radius
const JUPITER_EQUATORIAL_RADIUS_M = 71492 * KM; // Equatorial radius for ring calculations
const JUPITER_TEMP_K = 165;
const JUPITER_ALBEDO = 0.538;
const JUPITER_SMA_AU = 5.2038; // Corrected to match astronomical data
const JUPITER_ECC = 0.0489;
const JUPITER_INC_DEG = 1.303; // Corrected to match astronomical data
const JUPITER_LAN_DEG = 100.464;
const JUPITER_AOP_DEG = 273.867; // Corrected to match astronomical data
const JUPITER_MA_DEG = 20.02; // Corrected to match astronomical data
const JUPITER_ORBITAL_PERIOD_S = 374335776; // 11.862 years in seconds
const JUPITER_SIDEREAL_ROTATION_PERIOD_S = 35730.0; // 9.925 hours (already correct)
const JUPITER_AXIAL_TILT_DEG = 3.13;

/**
 * Initializes Jupiter planet with accurate orbital and physical data.
 * @returns The Jupiter planet ID for moon initialization.
 */
export function initializeJupiterPlanet(parentId: string): string {
  const jupiterId = "jupiter";
  const jupiterAxialTiltRad = JUPITER_AXIAL_TILT_DEG * DEG_TO_RAD;

  celestialManager.addCelestial({
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

    orbit: {
      realSemiMajorAxis_m: JUPITER_SMA_AU * AU,
      eccentricity: JUPITER_ECC,
      inclination: JUPITER_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: JUPITER_LAN_DEG * DEG_TO_RAD,
      argumentOfPeriapsis: (JUPITER_AOP_DEG - JUPITER_LAN_DEG) * DEG_TO_RAD, // 273.867° - 100.464° = 173.403°
      meanAnomaly: JUPITER_MA_DEG * DEG_TO_RAD,
      period_s: JUPITER_ORBITAL_PERIOD_S,
      siderealRotationPeriod_s: JUPITER_SIDEREAL_ROTATION_PERIOD_S,
      axialTilt: new OSVector3(
        0,
        Math.cos(jupiterAxialTiltRad),
        Math.sin(jupiterAxialTiltRad),
      ).normalize(),
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
          // Halo Ring (innermost, extends vertically above/below ring plane)
          innerRadius: JUPITER_EQUATORIAL_RADIUS_M + 21500 * KM, // ~92,000 km from Jupiter's center
          outerRadius: JUPITER_EQUATORIAL_RADIUS_M + 51000 * KM, // ~122,500 km from Jupiter's center
          density: 0.005,
          opacity: 0.1,
          color: "#904826",
          type: RockyType.DUST,
          texture: "textures/ring_dust_faint.png",
          rotationRate: 0.003, // Faster rotation for inner ring
          composition: ["submicron dust"],
        } as RingProperties,
        {
          // Main Ring (brightest part of Jupiter's ring system)
          innerRadius: JUPITER_EQUATORIAL_RADIUS_M + 51000 * KM, // ~122,500 km from Jupiter's center
          outerRadius: JUPITER_EQUATORIAL_RADIUS_M + 57500 * KM, // ~129,000 km from Jupiter's center
          density: 0.02,
          opacity: 0.15,
          color: "#c49f8e",
          type: RockyType.DUST,
          texture: "textures/ring_dust.png",
          rotationRate: 0.002, // Based on Keplerian mechanics
          composition: ["dust", "micron-sized particles"],
        } as RingProperties,
        {
          // Amalthea Gossamer Ring (extends to Amalthea's orbit)
          innerRadius: JUPITER_EQUATORIAL_RADIUS_M + 57500 * KM, // ~129,000 km from Jupiter's center
          outerRadius: JUPITER_EQUATORIAL_RADIUS_M + 110000 * KM, // ~181,300 km from Jupiter's center
          density: 0.001,
          opacity: 0.05,
          color: "#c49f8e",
          type: RockyType.DUST,
          texture: "textures/ring_dust_very_faint.png",
          rotationRate: 0.0015,
          composition: ["fine dust from Amalthea"],
        } as RingProperties,
        {
          // Thebe Gossamer Ring (extends to Thebe's orbit)
          innerRadius: JUPITER_EQUATORIAL_RADIUS_M + 110000 * KM, // ~181,300 km from Jupiter's center
          outerRadius: JUPITER_EQUATORIAL_RADIUS_M + 150800 * KM, // ~222,000 km from Jupiter's center
          density: 0.0005,
          opacity: 0.1,
          color: "#c49f8e",
          type: RockyType.DUST,
          texture: "textures/ring_dust_very_faint.png",
          rotationRate: 0.001,
          composition: ["very fine dust from Thebe"],
        } as RingProperties,
      ],
    } as GasGiantProperties,
  });

  return jupiterId;
}
