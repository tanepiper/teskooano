import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";
import { KM } from "@teskooano/core-physics";
import { celestial } from "@teskooano/core-state";
import {
  CelestialStatus,
  CelestialType,
  PlanetType,
  SurfaceType,
  PhysicsStateReal,
  type PlanetProperties,
} from "@teskooano/data-types";

const LUNA_MASS_KG = 7.342e22; // Verified correct from NASA fact sheet
const LUNA_RADIUS_M = 1737.4 * KM; // Verified correct (mean radius)
const LUNA_SMA_M = 384399 * KM; // Verified correct from NASA fact sheet (384,399 km)
const LUNA_ECC = 0.0549; // Verified correct
const LUNA_INC_DEG = 5.145; // Verified correct to ecliptic
const LUNA_LAN_DEG = 125.08; // Current value - variable due to precession
const LUNA_AOP_DEG = 318.15; // Current value - variable due to precession
const LUNA_MA_DEG = 115.36; // Current value - variable
const LUNA_SIDEREAL_PERIOD_S = 2.36059e6; // 27.321661 days - verified correct
const LUNA_AXIAL_TILT_DEG = 6.687; // Verified correct - obliquity to orbit
const LUNA_ALBEDO = 0.11; // Corrected to Bond albedo from NASA fact sheet

/**
 * Initializes the Moon (Luna) using accurate data.
 */
export function initializeLuna(parentId: string): void {
  const lunaAxialTiltRad = LUNA_AXIAL_TILT_DEG * DEG_TO_RAD;
  celestial.addCelestial({
    id: "luna",
    name: "Moon",
    type: CelestialType.MOON,
    status: CelestialStatus.ACTIVE,
    seed: "luna",
    parentId: parentId,
    realMass_kg: LUNA_MASS_KG,
    realRadius_m: LUNA_RADIUS_M,
    temperature: 250, // Mean temperature (verified from NASA - range 95-390K equator)
    albedo: LUNA_ALBEDO,

    orbit: {
      realSemiMajorAxis_m: LUNA_SMA_M,
      eccentricity: LUNA_ECC,
      inclination: LUNA_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: LUNA_LAN_DEG * DEG_TO_RAD,
      argumentOfPeriapsis: LUNA_AOP_DEG * DEG_TO_RAD,
      meanAnomaly: LUNA_MA_DEG * DEG_TO_RAD,
      period_s: LUNA_SIDEREAL_PERIOD_S,
      siderealRotationPeriod_s: LUNA_SIDEREAL_PERIOD_S,
      axialTilt: new OSVector3(
        0,
        Math.cos(lunaAxialTiltRad),
        Math.sin(lunaAxialTiltRad),
      ).normalize(),
    },
    physicsStateReal: {
      id: "luna",
      mass_kg: LUNA_MASS_KG,
      position_m: new OSVector3(0, 0, 0), // Will be calculated by the factory
      velocity_mps: new OSVector3(0, 0, 0), // Will be calculated by the factory
    },
    properties: {
      type: CelestialType.MOON,
      classType: PlanetType.ROCKY,
      isMoon: true,
      parentPlanet: parentId,
      composition: ["silicates", "anorthosite crust", "possible small core"],
      surface: {
        type: SurfaceType.VARIED,
        classType: PlanetType.ROCKY,
        color: "#BEBEBE",
        roughness: 0.75,
        persistence: 0.5,
        lacunarity: 2.1,
        simplePeriod: 6.0,
        octaves: 7,
        bumpScale: 0.15,
        color1: "#808080",
        color2: "#A9A9A9",
        color3: "#BEBEBE",
        color4: "#D3D3D3",
        color5: "#E0E0E0",
        height1: 0.0,
        height2: 0.3,
        height3: 0.55,
        height4: 0.75,
        height5: 1.0,
        shininess: 0.02,
        specularStrength: 0.02,
        ambientLightIntensity: 0.01, // Minimal ambient for dark space
        undulation: 0.1,
        terrainType: 3,
        terrainAmplitude: 0.35,
        terrainSharpness: 0.7,
        terrainOffset: 0.0,
      },
    } as PlanetProperties,
  });
}
