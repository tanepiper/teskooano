import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";
import { AU, KM } from "@teskooano/core-physics";
import { celestial } from "@teskooano/core-state";
import {
  CelestialType,
  GasGiantClass,
  RockyType,
  CelestialStatus,
  type GasGiantProperties,
} from "@teskooano/data-types";

const NEPTUNE_MASS_KG = 1.02409e26;
const NEPTUNE_RADIUS_M = 24622 * KM; // Mean radius
const NEPTUNE_TEMP_K = 72;
const NEPTUNE_ALBEDO = 0.29; // Bond albedo
const NEPTUNE_SMA_AU = 30.07;
const NEPTUNE_ECC = 0.008678;
const NEPTUNE_INC_DEG = 1.77;
const NEPTUNE_LAN_DEG = 131.783;
const NEPTUNE_AOP_DEG = 273.187;
const NEPTUNE_MA_DEG = 259.883;
const NEPTUNE_ORBITAL_PERIOD_S = 5200848000; // 60,195 days
const NEPTUNE_SIDEREAL_ROTATION_PERIOD_S = 58000; // 16h 6m 36s
const NEPTUNE_AXIAL_TILT_DEG = 28.32;

/**
 * Initializes Neptune planet with accurate data.
 * @returns The Neptune planet ID for moon initialization.
 */
export function initializeNeptunePlanet(parentId: string): string {
  const neptuneId = "neptune";
  const neptuneAxialTiltRad = NEPTUNE_AXIAL_TILT_DEG * DEG_TO_RAD;

  celestial.addCelestial({
    id: neptuneId,
    name: "Neptune",
    seed: "neptune_seed_164",
    type: CelestialType.GAS_GIANT,
    status: CelestialStatus.ACTIVE,
    parentId: parentId,
    realMass_kg: NEPTUNE_MASS_KG,
    realRadius_m: NEPTUNE_RADIUS_M,
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
        Math.cos(neptuneAxialTiltRad),
        Math.sin(neptuneAxialTiltRad),
      ).normalize(),
    },
    temperature: NEPTUNE_TEMP_K,
    albedo: NEPTUNE_ALBEDO,
    properties: {
      type: CelestialType.GAS_GIANT,
      classType: GasGiantClass.CLASS_III,
      atmosphereColor: "#3F5D9A",
      cloudColor: "#FFFFFF",
      cloudSpeed: 200,
      stormSpeed: 150,
      emissiveColor: "#3F5D9A1A",
      emissiveIntensity: 0.08,
      rings: [
        {
          innerRadius: NEPTUNE_RADIUS_M * 1.7,
          outerRadius: NEPTUNE_RADIUS_M * 1.701,
          density: 0.05,
          opacity: 0.1,
          color: "#c8c8d4",
          type: RockyType.DUST,
          texture: "textures/ring_dust_tenuous.png",
          rotationRate: 0.002,
          composition: ["dust"],
        },
        {
          innerRadius: NEPTUNE_RADIUS_M * 2.15,
          outerRadius: NEPTUNE_RADIUS_M * 2.151,
          density: 0.1,
          opacity: 0.2,
          color: "#c8c8d4",
          type: RockyType.DUST,
          texture: "textures/ring_dust_tenuous.png",
          rotationRate: 0.0018,
          composition: ["dust", "small rocks"],
        },
        {
          innerRadius: NEPTUNE_RADIUS_M * 2.29,
          outerRadius: NEPTUNE_RADIUS_M * 2.56,
          density: 0.2,
          opacity: 0.3,
          color: "#c8c8d4",
          type: RockyType.DUST,
          texture: "textures/ring_dust_broad.png",
          rotationRate: 0.0015,
          composition: ["dark dust"],
        },
        {
          innerRadius: NEPTUNE_RADIUS_M * 2.56,
          outerRadius: NEPTUNE_RADIUS_M * 2.561,
          density: 0.08,
          opacity: 0.15,
          color: "#c8c8d4",
          type: RockyType.DUST,
          texture: "textures/ring_dust_tenuous.png",
          rotationRate: 0.0014,
          composition: ["dark dust"],
        },
      ],
    } as GasGiantProperties,
  });
  return neptuneId;
}
