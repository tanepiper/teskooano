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

const NEPTUNE_MASS_KG = 1.024e26;
const NEPTUNE_REAL_RADIUS_M = 24622 * KM; // Equatorial radius
const NEPTUNE_TEMP_K = 72; // Effective temperature
const NEPTUNE_ALBEDO = 0.442; // Bond albedo
const NEPTUNE_SMA_AU = 30.069923;
const NEPTUNE_ECC = 0.008606;
const NEPTUNE_INC_DEG = 1.77004;
const NEPTUNE_LAN_DEG = 131.78423;
const NEPTUNE_AOP_DEG = 273.249;
const NEPTUNE_MA_DEG = 256.228;
const NEPTUNE_ORBITAL_PERIOD_S = 5.2e9; // 164.8 Earth years
const NEPTUNE_SIDEREAL_ROTATION_PERIOD_S = 5.8e4; // 16.11 hours
const NEPTUNE_AXIAL_TILT_DEG = 28.32;

/**
 * Neptune configuration object for modular solar system initialization.
 */
export const neptune: CelestialObject<GasGiantProperties> = {
  id: "neptune",
  name: "Neptune",
  seed: "neptune",
  type: CelestialType.GAS_GIANT,
  status: CelestialStatus.ACTIVE,
  parentId: "sun", // Will be replaced during initialization
  realMass_kg: NEPTUNE_MASS_KG,
  realRadius_m: NEPTUNE_REAL_RADIUS_M,
  temperature: NEPTUNE_TEMP_K,
  albedo: NEPTUNE_ALBEDO,
  orbit: {
    realSemiMajorAxis_m: NEPTUNE_SMA_AU * AU,
    eccentricity: NEPTUNE_ECC,
    inclination: NEPTUNE_INC_DEG * DEG_TO_RAD,
    longitudeOfAscendingNode: NEPTUNE_LAN_DEG * DEG_TO_RAD,
    argumentOfPeriapsis: NEPTUNE_AOP_DEG * DEG_TO_RAD,
    meanAnomaly: NEPTUNE_MA_DEG * DEG_TO_RAD,
    period_s: NEPTUNE_ORBITAL_PERIOD_S,
    siderealRotationPeriod_s: NEPTUNE_SIDEREAL_ROTATION_PERIOD_S,
    axialTilt: new OSVector3(
      0,
      Math.cos(NEPTUNE_AXIAL_TILT_DEG * DEG_TO_RAD),
      Math.sin(NEPTUNE_AXIAL_TILT_DEG * DEG_TO_RAD),
    ).normalize(),
  },
  properties: {
    type: CelestialType.GAS_GIANT,
    classType: GasGiantClass.CLASS_III,
    atmosphereColor: "#4169E1",
    cloudColor: "#87CEEB",
    cloudSpeed: 120,
    stormSpeed: 80,
    emissiveColor: "#4169E120",
    emissiveIntensity: 0.05,
    rings: [
      // Galle Ring (N42) - Broad faint ring
      {
        innerRadius: NEPTUNE_REAL_RADIUS_M + 40900 * KM,
        outerRadius: NEPTUNE_REAL_RADIUS_M + 42900 * KM,
        density: 0.1,
        opacity: 0.1, // Very faint
        color: "#4682B4",
        type: RockyType.ICE_DUST,
        texture: "textures/ring_galle.png",
        rotationRate: 0.0008,
        composition: ["ice particles", "dust"],
      },
      // Le Verrier Ring (N53) - Narrow ring
      {
        innerRadius: NEPTUNE_REAL_RADIUS_M + 53180 * KM,
        outerRadius: NEPTUNE_REAL_RADIUS_M + 53293 * KM,
        density: 0.6,
        opacity: 0.6,
        color: "#5F9EA0",
        type: RockyType.ICE,
        texture: "textures/ring_le_verrier.png",
        rotationRate: 0.0006,
        composition: ["water ice"],
      },
      // Lassell Ring - Faint sheet stretching from Le Verrier to Arago
      {
        innerRadius: NEPTUNE_REAL_RADIUS_M + 53200 * KM,
        outerRadius: NEPTUNE_REAL_RADIUS_M + 57200 * KM,
        density: 0.2,
        opacity: 0.15, // Faint
        color: "#6495ED",
        type: RockyType.ICE_DUST,
        texture: "textures/ring_lassell.png",
        rotationRate: 0.0005,
        composition: ["ice particles", "dust"],
      },
      // Arago Ring - Very narrow
      {
        innerRadius: NEPTUNE_REAL_RADIUS_M + 57200 * KM,
        outerRadius: NEPTUNE_REAL_RADIUS_M + 57300 * KM,
        density: 0.3,
        opacity: 0.2,
        color: "#87CEEB",
        type: RockyType.ICE,
        texture: "textures/ring_arago.png",
        rotationRate: 0.0004,
        composition: ["water ice"],
      },
      // Adams Ring (N63) - Five bright arcs
      {
        innerRadius: NEPTUNE_REAL_RADIUS_M + 62930 * KM,
        outerRadius: NEPTUNE_REAL_RADIUS_M + 62982 * KM,
        density: 0.8,
        opacity: 0.9, // Brightest
        color: "#B0C4DE",
        type: RockyType.ICE,
        texture: "textures/ring_adams.png",
        rotationRate: 0.0003,
        composition: ["water ice"],
      },
    ],
  },
};
