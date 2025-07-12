import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";
import { AU } from "@teskooano/core-physics";
import { actions } from "@teskooano/core-state";
import {
  CelestialType,
  PlanetType,
  SurfaceType,
  CelestialStatus,
  PhysicsStateReal,
  type PlanetProperties,
} from "@teskooano/data-types";

const CERES_MASS_KG = 9.393e20;
const CERES_RADIUS_M = 473000;
const CERES_TEMP_K = 167;
const CERES_ALBEDO = 0.09;
const CERES_SMA_AU = 2.766;
const CERES_ECC = 0.0758;
const CERES_INC_DEG = 10.593;
const CERES_LAN_DEG = 80.329;
const CERES_AOP_DEG = 72.522;
const CERES_MA_DEG = 95.989;
const CERES_ORBITAL_PERIOD_S = 1.4425e8;
const CERES_SIDEREAL_ROTATION_PERIOD_S = 32668.8;
const CERES_AXIAL_TILT_DEG = 4.0;

/**
 * Initializes Ceres, the largest object in the asteroid belt and a dwarf planet.
 */
export function initializeCeres(parentId: string): void {
  const ceresId = "ceres";
  const ceresAxialTiltRad = CERES_AXIAL_TILT_DEG * DEG_TO_RAD;

  actions.addCelestial({
    id: ceresId,
    name: "Ceres",
    seed: "ceres",
    type: CelestialType.DWARF_PLANET,
    status: CelestialStatus.ACTIVE,
    parentId: parentId,
    realMass_kg: CERES_MASS_KG,
    realRadius_m: CERES_RADIUS_M,
    temperature: CERES_TEMP_K,
    albedo: CERES_ALBEDO,

    orbit: {
      realSemiMajorAxis_m: CERES_SMA_AU * AU,
      eccentricity: CERES_ECC,
      inclination: CERES_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: CERES_LAN_DEG * DEG_TO_RAD,
      argumentOfPeriapsis: CERES_AOP_DEG * DEG_TO_RAD,
      meanAnomaly: CERES_MA_DEG * DEG_TO_RAD,
      period_s: CERES_ORBITAL_PERIOD_S,
      siderealRotationPeriod_s: CERES_SIDEREAL_ROTATION_PERIOD_S,
      axialTilt: new OSVector3(
        0,
        Math.cos(ceresAxialTiltRad),
        Math.sin(ceresAxialTiltRad),
      ).normalize(),
    },
    physicsStateReal: {
      id: ceresId,
      mass_kg: CERES_MASS_KG,
      position_m: new OSVector3(0, 0, 0), // Will be calculated by the factory
      velocity_mps: new OSVector3(0, 0, 0), // Will be calculated by the factory
    },
    properties: {
      type: CelestialType.DWARF_PLANET,
      classType: PlanetType.ROCKY,
      isMoon: false,
      composition: [
        "water ice",
        "hydrated minerals",
        "carbonates",
        "clay minerals",
        "salts",
      ],
      atmosphere: undefined,
      surface: {
        type: SurfaceType.CRATERED,
        color: "#8C7853",
        roughness: 0.8,
        classType: PlanetType.ROCKY,
        persistence: 0.52,
        lacunarity: 2.1,
        simplePeriod: 2.8,
        octaves: 9,
        bumpScale: 2.5,
        color1: "#6D5D4D",
        color2: "#8C7853",
        color3: "#A69080",
        color4: "#C0B0A0",
        color5: "#D4C4B4",
        height1: 0.08,
        height2: 0.25,
        height3: 0.45,
        height4: 0.7,
        height5: 0.9,
        shininess: 4,
        specularStrength: 0.15,
        ambientLightIntensity: 0.01, // Minimal ambient for dynamic lighting
        undulation: 0.3,
        terrainType: 2,
        terrainAmplitude: 0.8,
        terrainSharpness: 1.4,
        terrainOffset: -0.1,
      },
    } as PlanetProperties,
  });
}
