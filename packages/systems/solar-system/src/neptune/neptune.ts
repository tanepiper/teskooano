import { createOrbitalElements, kmToM } from "@teskooano/core-physics";
import {
  CelestialObject,
  CelestialStatus,
  CelestialType,
  GasGiantClass,
  RockyType,
  type GasGiantProperties,
} from "@teskooano/data-types";

const NEPTUNE_MASS_KG = 1.024e26;
const NEPTUNE_RADIUS_KM = 24622; // Equatorial radius
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

export const neptune: CelestialObject<GasGiantProperties> = {
  id: "neptune",
  name: "Neptune",
  seed: "neptune",
  type: CelestialType.GAS_GIANT,
  status: CelestialStatus.ACTIVE,
  parentId: "sun", // Will be replaced during initialization
  realMass_kg: NEPTUNE_MASS_KG,
  realRadius_m: kmToM(NEPTUNE_RADIUS_KM),
  temperature: NEPTUNE_TEMP_K,
  albedo: NEPTUNE_ALBEDO,
  orbit: createOrbitalElements({
    semiMajorAxisAU: NEPTUNE_SMA_AU,
    eccentricity: NEPTUNE_ECC,
    inclinationDeg: NEPTUNE_INC_DEG,
    longitudeOfAscendingNodeDeg: NEPTUNE_LAN_DEG,
    argumentOfPeriapsisDeg: NEPTUNE_AOP_DEG,
    meanAnomalyDeg: NEPTUNE_MA_DEG,
    period_s: NEPTUNE_ORBITAL_PERIOD_S,
    siderealRotationPeriod_s: NEPTUNE_SIDEREAL_ROTATION_PERIOD_S,
    axialTiltDeg: NEPTUNE_AXIAL_TILT_DEG,
  }),
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
        innerRadius: kmToM(NEPTUNE_RADIUS_KM + 40900),
        outerRadius: kmToM(NEPTUNE_RADIUS_KM + 42900),
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
        innerRadius: kmToM(NEPTUNE_RADIUS_KM + 53180),
        outerRadius: kmToM(NEPTUNE_RADIUS_KM + 53293),
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
        innerRadius: kmToM(NEPTUNE_RADIUS_KM + 53200),
        outerRadius: kmToM(NEPTUNE_RADIUS_KM + 57200),
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
        innerRadius: kmToM(NEPTUNE_RADIUS_KM + 57200),
        outerRadius: kmToM(NEPTUNE_RADIUS_KM + 57300),
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
        innerRadius: kmToM(NEPTUNE_RADIUS_KM + 62930),
        outerRadius: kmToM(NEPTUNE_RADIUS_KM + 62982),
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
