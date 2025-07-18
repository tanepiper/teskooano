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

const URANUS_MASS_KG = 8.681e25;
const URANUS_RADIUS_M = 25362 * KM; // Mean radius
const URANUS_TEMP_K = 76;
const URANUS_ALBEDO = 0.3; // Bond albedo
const URANUS_SMA_AU = 19.19126;
const URANUS_ECC = 0.04717;
const URANUS_INC_DEG = 0.773;
const URANUS_LAN_DEG = 74.006;
const URANUS_AOP_DEG = 96.998857;
const URANUS_MA_DEG = 142.2386;
const URANUS_ORBITAL_PERIOD_S = 2651486832; // 84.0205 years = 30,688.5 days
const URANUS_SIDEREAL_ROTATION_PERIOD_S = -62092.5104; // -0.718661 days (retrograde)
const URANUS_AXIAL_TILT_DEG = 97.77;

/**
 * Creates Uranus.
 * @param parentId The ID of the parent object (Sun).
 * @returns The ID of the Uranus object.
 */
export function initializeUranusPlanet(parentId: string): string {
  const uranusId = "uranus";
  const uranusAxialTiltRad = URANUS_AXIAL_TILT_DEG * DEG_TO_RAD;

  celestial.addCelestial({
    id: uranusId,
    name: "Uranus",
    seed: "uranus_seed_84",
    type: CelestialType.GAS_GIANT,
    status: CelestialStatus.ACTIVE,
    parentId: parentId,
    realMass_kg: URANUS_MASS_KG,
    realRadius_m: URANUS_RADIUS_M,
    orbit: {
      realSemiMajorAxis_m: URANUS_SMA_AU * AU,
      eccentricity: URANUS_ECC,
      inclination: URANUS_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: URANUS_LAN_DEG * DEG_TO_RAD,
      argumentOfPeriapsis: URANUS_AOP_DEG * DEG_TO_RAD,
      meanAnomaly: URANUS_MA_DEG * DEG_TO_RAD,
      siderealRotationPeriod_s: URANUS_SIDEREAL_ROTATION_PERIOD_S,
      axialTilt: new OSVector3(
        0,
        Math.cos(uranusAxialTiltRad),
        Math.sin(uranusAxialTiltRad),
      ).normalize(),
      period_s: URANUS_ORBITAL_PERIOD_S,
    },
    temperature: URANUS_TEMP_K,
    albedo: URANUS_ALBEDO,
    properties: {
      type: CelestialType.GAS_GIANT,
      classType: GasGiantClass.CLASS_III,
      atmosphereColor: "#B0E0E6",
      cloudColor: "#FFFFFF",
      cloudSpeed: 50,
      stormSpeed: 30,
      emissiveColor: "#B0E0E61A",
      emissiveIntensity: 0.05,
      rings: [
        {
          innerRadius: URANUS_RADIUS_M * 1.64,
          outerRadius: URANUS_RADIUS_M * 1.641,
          density: 0.1,
          opacity: 0.4,
          color: "#A0A0A0",
          type: RockyType.DUST,
          texture: "textures/ring_dust_subtle.png",
          rotationRate: 0.003,
          composition: ["dark dust"],
        },
        {
          innerRadius: URANUS_RADIUS_M * 1.7,
          outerRadius: URANUS_RADIUS_M * 1.701,
          density: 0.15,
          opacity: 0.5,
          color: "#989898",
          type: RockyType.DUST,
          texture: "textures/ring_dust_subtle.png",
          rotationRate: 0.0028,
          composition: ["dark dust"],
        },
        {
          innerRadius: URANUS_RADIUS_M * 1.74,
          outerRadius: URANUS_RADIUS_M * 1.741,
          density: 0.15,
          opacity: 0.5,
          color: "#989898",
          type: RockyType.DUST,
          texture: "textures/ring_dust_subtle.png",
          rotationRate: 0.0027,
          composition: ["dark dust"],
        },
        {
          innerRadius: URANUS_RADIUS_M * 1.77,
          outerRadius: URANUS_RADIUS_M * 1.771,
          density: 0.15,
          opacity: 0.5,
          color: "#989898",
          type: RockyType.DUST,
          texture: "textures/ring_dust_subtle.png",
          rotationRate: 0.0026,
          composition: ["dark dust"],
        },
        {
          innerRadius: URANUS_RADIUS_M * 1.8,
          outerRadius: URANUS_RADIUS_M * 1.801,
          density: 0.15,
          opacity: 0.5,
          color: "#989898",
          type: RockyType.DUST,
          texture: "textures/ring_dust_subtle.png",
          rotationRate: 0.0025,
          composition: ["dark dust"],
        },
        {
          innerRadius: URANUS_RADIUS_M * 1.81,
          outerRadius: URANUS_RADIUS_M * 1.811,
          density: 0.2,
          opacity: 0.6,
          color: "#B0B0B0",
          type: RockyType.DUST,
          texture: "textures/ring_dust_subtle.png",
          rotationRate: 0.0024,
          composition: ["dark dust", "small ice particles"],
        },
        {
          innerRadius: URANUS_RADIUS_M * 1.95,
          outerRadius: URANUS_RADIUS_M * 1.96,
          density: 0.8,
          opacity: 0.8,
          color: "#C0C0C0",
          type: RockyType.ICE_DUST,
          texture: "textures/ring_epsilon.png",
          rotationRate: 0.0022,
          composition: ["ice boulders", "dust"],
        },
        {
          innerRadius: URANUS_RADIUS_M * 2.55,
          outerRadius: URANUS_RADIUS_M * 3.8,
          density: 0.05,
          opacity: 0.1,
          color: "#87CEEB",
          type: RockyType.DUST,
          texture: "textures/ring_mu.png",
          rotationRate: 0.0015,
          composition: ["blue dust"],
        },
        {
          innerRadius: URANUS_RADIUS_M * 3.8,
          outerRadius: URANUS_RADIUS_M * 3.86,
          density: 0.02,
          opacity: 0.05,
          color: "#D3D3D3",
          type: RockyType.DUST,
          texture: "textures/ring_nu.png",
          rotationRate: 0.001,
          composition: ["faint dust"],
        },
      ],
    } as GasGiantProperties,
  });

  return uranusId;
}
