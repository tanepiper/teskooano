import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";
import { AU } from "@teskooano/core-physics";
import { actions } from "@teskooano/core-state";
import {
  CelestialType,
  GasGiantClass,
  RockyType,
  type GasGiantProperties,
} from "@teskooano/data-types";

const NEPTUNE_AXIAL_TILT_DEG = 28.32;
const NEPTUNE_SIDEREAL_ROTATION_PERIOD_S = 16.11 * 3600; // 16.11 hours
const NEPTUNE_ORBITAL_PERIOD_S = 5.199e9; // 164.8 years
const NEPTUNE_REAL_RADIUS_M = 24622000; // Equatorial radius

/**
 * Initializes Neptune planet with accurate data.
 * @returns The Neptune planet ID for moon initialization.
 */
export function initializeNeptunePlanet(parentId: string): string {
  const neptuneId = "neptune";
  const neptuneAxialTiltRad = NEPTUNE_AXIAL_TILT_DEG * DEG_TO_RAD;

  actions.addCelestial({
    id: neptuneId,
    name: "Neptune",
    seed: "neptune_seed_164",
    type: CelestialType.GAS_GIANT,
    parentId: parentId,
    realMass_kg: 1.02413e26, // Corrected mass
    realRadius_m: NEPTUNE_REAL_RADIUS_M,
    orbit: {
      realSemiMajorAxis_m: 30.07 * AU, // Verified correct
      eccentricity: 0.00859048, // Corrected eccentricity
      inclination: 1.77004 * DEG_TO_RAD, // Corrected inclination
      longitudeOfAscendingNode: 131.78422 * DEG_TO_RAD, // Corrected longitude of ascending node
      argumentOfPeriapsis: 273.187 * DEG_TO_RAD, // Verified correct
      meanAnomaly: 256.228 * DEG_TO_RAD, // Corrected mean anomaly
      period_s: NEPTUNE_ORBITAL_PERIOD_S,
    },
    temperature: 72, // Verified correct
    albedo: 0.442, // Corrected Bond albedo
    siderealRotationPeriod_s: NEPTUNE_SIDEREAL_ROTATION_PERIOD_S,
    axialTilt: new OSVector3(
      0,
      Math.cos(neptuneAxialTiltRad),
      Math.sin(neptuneAxialTiltRad),
    ).normalize(),
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
          innerRadius: NEPTUNE_REAL_RADIUS_M * 1.7,
          outerRadius: NEPTUNE_REAL_RADIUS_M * 1.701,
          density: 0.05,
          opacity: 0.1,
          color: "#A0A0B0",
          type: RockyType.DUST,
          texture: "textures/ring_dust_tenuous.png",
          rotationRate: 0.002,
          composition: ["dust"],
        },
        {
          innerRadius: NEPTUNE_REAL_RADIUS_M * 2.15,
          outerRadius: NEPTUNE_REAL_RADIUS_M * 2.151,
          density: 0.1,
          opacity: 0.2,
          color: "#A0A0B0",
          type: RockyType.DUST,
          texture: "textures/ring_dust_tenuous.png",
          rotationRate: 0.0018,
          composition: ["dust", "small rocks"],
        },
        {
          innerRadius: NEPTUNE_REAL_RADIUS_M * 2.29,
          outerRadius: NEPTUNE_REAL_RADIUS_M * 2.56,
          density: 0.2,
          opacity: 0.3,
          color: "#9090A0",
          type: RockyType.DUST,
          texture: "textures/ring_dust_broad.png",
          rotationRate: 0.0015,
          composition: ["dark dust"],
        },
        {
          innerRadius: NEPTUNE_REAL_RADIUS_M * 2.56,
          outerRadius: NEPTUNE_REAL_RADIUS_M * 2.561,
          density: 0.08,
          opacity: 0.15,
          color: "#B0B0C0",
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
