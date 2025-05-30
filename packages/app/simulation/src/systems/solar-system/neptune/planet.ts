import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";
import { AU } from "@teskooano/core-physics";
import { actions } from "@teskooano/core-state";
import {
  AtmosphereType,
  CelestialType,
  GasGiantClass,
  RockyType,
  type GasGiantProperties,
  type RingSystemProperties,
} from "@teskooano/data-types";

const NEPTUNE_AXIAL_TILT_DEG = 28.32;
const NEPTUNE_SIDEREAL_ROTATION_PERIOD_S = 16.11 * 3600;
const NEPTUNE_ORBITAL_PERIOD_S = 5.199e9;
const NEPTUNE_REAL_RADIUS_M = 24622000;

/**
 * Initializes Neptune and its ring system.
 * @param parentId The ID of the parent celestial body (e.g., the Sun).
 * @returns The ID of Neptune.
 */
export function initializeNeptunePlanet(parentId: string): string {
  const neptuneId = "neptune";
  const neptuneAxialTiltRad = NEPTUNE_AXIAL_TILT_DEG * DEG_TO_RAD;

  actions.addCelestial({
    id: neptuneId,
    name: "Neptune",
    seed: "neptune",
    type: CelestialType.GAS_GIANT,
    parentId: parentId,
    realMass_kg: 1.024e26,
    realRadius_m: NEPTUNE_REAL_RADIUS_M,
    temperature: 72,
    albedo: 0.41,
    siderealRotationPeriod_s: NEPTUNE_SIDEREAL_ROTATION_PERIOD_S,
    axialTilt: new OSVector3(
      0,
      Math.cos(neptuneAxialTiltRad),
      Math.sin(neptuneAxialTiltRad),
    ).normalize(),
    orbit: {
      realSemiMajorAxis_m: 30.07 * AU,
      eccentricity: 0.008678,
      inclination: 1.769 * DEG_TO_RAD,
      longitudeOfAscendingNode: 131.783 * DEG_TO_RAD,
      argumentOfPeriapsis: 273.187 * DEG_TO_RAD,
      meanAnomaly: 256.328 * DEG_TO_RAD,
      period_s: NEPTUNE_ORBITAL_PERIOD_S,
    },
    properties: {
      type: CelestialType.GAS_GIANT,
      gasGiantClass: GasGiantClass.CLASS_III,
      atmosphereColor: "#4169E1",
      cloudColor: "#FFFFFF",
      cloudSpeed: 200,
      atmosphere: {
        composition: ["H2", "He", "CH4"],
        pressure: 1000000,
        type: AtmosphereType.VERY_DENSE,
        glowColor: "#4682B4",
        intensity: 0.8,
        power: 1.5,
        thickness: 0.3,
        density_kgm3: 1.76, // Example value, adjust if known
        scaleHeight_m: 19700, // Example value, adjust if known
      },
      stormColor: "#0000CD",
      stormSpeed: 150,
      emissiveColor: "#4169E1",
      emissiveIntensity: 0.1,
      ringTilt: {
        x: 0,
        y: Math.cos(neptuneAxialTiltRad),
        z: Math.sin(neptuneAxialTiltRad),
      },
    } as GasGiantProperties,
  });

  // Neptune Ring System
  actions.addCelestial({
    id: "neptune-rings",
    name: "Neptune Rings",
    seed: "neptune-rings",
    type: CelestialType.RING_SYSTEM,
    parentId: neptuneId,
    realMass_kg: 0,
    realRadius_m: 0,
    temperature: 72,
    albedo: 0.05,
    siderealRotationPeriod_s: NEPTUNE_SIDEREAL_ROTATION_PERIOD_S,
    axialTilt: new OSVector3(
      0,
      Math.cos(neptuneAxialTiltRad),
      Math.sin(neptuneAxialTiltRad),
    ).normalize(),
    orbit: {} as any,
    properties: {
      type: CelestialType.RING_SYSTEM,
      parentId: neptuneId,
      rings: [
        {
          innerRadius: 1.7,
          outerRadius: 1.72,
          density: 0.4,
          opacity: 0.25,
          color: "#A8A8B0",
          type: RockyType.DUST,
          texture: "placeholder_ring_texture",
          rotationRate: 0.001,
          composition: ["dark dust"],
        },
        {
          innerRadius: 2.1,
          outerRadius: 2.12,
          density: 0.5,
          opacity: 0.3,
          color: "#B8B8C0",
          type: RockyType.DUST,
          texture: "placeholder_ring_texture",
          rotationRate: 0.0009,
          composition: ["dust", "ice particles"],
        },
        {
          innerRadius: 2.5,
          outerRadius: 2.52,
          density: 0.45,
          opacity: 0.28,
          color: "#C8C8D0",
          type: RockyType.DUST,
          texture: "placeholder_ring_texture",
          rotationRate: 0.0008,
          composition: ["reddish arcs", "dust clumps"],
        },
      ],
    } as RingSystemProperties,
  });

  return neptuneId;
}
