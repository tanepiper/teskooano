import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";
import { AU, KM } from "@teskooano/core-physics";
import {
  CelestialObject,
  CelestialStatus,
  CelestialType,
  GasGiantClass,
  RockyType,
  type GasGiantProperties,
} from "@teskooano/data-types";

const JUPITER_MASS_KG = 1.898e27;
const JUPITER_REAL_RADIUS_M = 69911 * KM; // Equatorial radius
const JUPITER_TEMP_K = 165; // Effective temperature
const JUPITER_ALBEDO = 0.503; // Bond albedo
const JUPITER_SMA_AU = 5.202887;
const JUPITER_ECC = 0.048498;
const JUPITER_INC_DEG = 1.3053;
const JUPITER_LAN_DEG = 100.55615;
const JUPITER_AOP_DEG = 275.066;
const JUPITER_MA_DEG = 34.404;
const JUPITER_ORBITAL_PERIOD_S = 3.743e8; // 11.86 Earth years
const JUPITER_SIDEREAL_ROTATION_PERIOD_S = 3.573e4; // 9.925 hours
const JUPITER_AXIAL_TILT_DEG = 3.13;

/**
 * Jupiter configuration object for modular solar system initialization.
 */
export const jupiter: CelestialObject<GasGiantProperties> = {
  id: "jupiter",
  name: "Jupiter",
  seed: "jupiter",
  type: CelestialType.GAS_GIANT,
  status: CelestialStatus.ACTIVE,
  parentId: "sun", // Will be replaced during initialization
  realMass_kg: JUPITER_MASS_KG,
  realRadius_m: JUPITER_REAL_RADIUS_M,
  temperature: JUPITER_TEMP_K,
  albedo: JUPITER_ALBEDO,
  orbit: {
    realSemiMajorAxis_m: JUPITER_SMA_AU * AU,
    eccentricity: JUPITER_ECC,
    inclination: JUPITER_INC_DEG * DEG_TO_RAD,
    longitudeOfAscendingNode: JUPITER_LAN_DEG * DEG_TO_RAD,
    argumentOfPeriapsis: JUPITER_AOP_DEG * DEG_TO_RAD,
    meanAnomaly: JUPITER_MA_DEG * DEG_TO_RAD,
    period_s: JUPITER_ORBITAL_PERIOD_S,
    siderealRotationPeriod_s: JUPITER_SIDEREAL_ROTATION_PERIOD_S,
    axialTilt: new OSVector3(
      0,
      Math.cos(JUPITER_AXIAL_TILT_DEG * DEG_TO_RAD),
      Math.sin(JUPITER_AXIAL_TILT_DEG * DEG_TO_RAD),
    ).normalize(),
  },
  properties: {
    type: CelestialType.GAS_GIANT,
    classType: GasGiantClass.CLASS_I,
    atmosphereColor: "#DAA520",
    cloudColor: "#F5DEB3",
    cloudSpeed: 100,
    stormSpeed: 60,
    emissiveColor: "#DAA52020",
    emissiveIntensity: 0.05,
    rings: [
      // Halo Ring (innermost, very faint)
      {
        innerRadius: JUPITER_REAL_RADIUS_M + 92000 * KM,
        outerRadius: JUPITER_REAL_RADIUS_M + 122500 * KM,
        density: 0.001,
        opacity: 0.005,
        color: "#8B7355",
        type: RockyType.DUST,
        texture: "textures/ring_dust_subtle.png",
        rotationRate: 0.001,
        composition: ["fine dust"],
      },
      // Main Ring (brightest)
      {
        innerRadius: JUPITER_REAL_RADIUS_M + 122500 * KM,
        outerRadius: JUPITER_REAL_RADIUS_M + 129000 * KM,
        density: 0.3,
        opacity: 0.4,
        color: "#DAA520",
        type: RockyType.ICE_DUST,
        texture: "textures/ring_main.png",
        rotationRate: 0.0008,
        composition: ["ice particles", "dust"],
      },
      // Gossamer Ring (outer, very faint)
      {
        innerRadius: JUPITER_REAL_RADIUS_M + 129000 * KM,
        outerRadius: JUPITER_REAL_RADIUS_M + 226000 * KM,
        density: 0.0001,
        opacity: 0.001,
        color: "#A0522D",
        type: RockyType.DUST,
        texture: "textures/ring_dust_subtle.png",
        rotationRate: 0.0005,
        composition: ["micrometer dust"],
      },
    ],
  },
};
