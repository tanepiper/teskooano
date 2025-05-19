import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";
import { AU } from "@teskooano/core-physics";
import { actions } from "@teskooano/core-state";
import {
  CelestialType,
  PlanetType,
  SurfaceType,
  type LavaSurfaceProperties,
  type PlanetAtmosphereProperties,
} from "@teskooano/data-types";

const VENUS_MASS_KG = 4.8675e24;
const VENUS_RADIUS_M = 6051800;
const VENUS_TEMP_K = 737;
const VENUS_ALBEDO = 0.76;
const VENUS_SMA_AU = 0.723332;
const VENUS_ECC = 0.006773;
const VENUS_INC_DEG = 3.39471;
const VENUS_LAN_DEG = 76.68069;
const VENUS_AOP_DEG = 131.53298;
const VENUS_MA_DEG = 181.97973;
const VENUS_ORBITAL_PERIOD_S = 1.94142e7;
const VENUS_SIDEREAL_ROTATION_PERIOD_S = -20997151;
const VENUS_AXIAL_TILT_DEG = 177.36;

/**
 * Initializes Venus using accurate data.
 */
export function initializeVenus(parentId: string): void {
  const venusAxialTiltRad = VENUS_AXIAL_TILT_DEG * DEG_TO_RAD;

  actions.addCelestial({
    id: "venus",
    name: "Venus",
    seed: "venus",
    type: CelestialType.PLANET,
    parentId: parentId,
    realMass_kg: VENUS_MASS_KG,
    realRadius_m: VENUS_RADIUS_M,
    temperature: VENUS_TEMP_K,
    albedo: VENUS_ALBEDO,
    siderealRotationPeriod_s: VENUS_SIDEREAL_ROTATION_PERIOD_S,
    axialTilt: new OSVector3(
      0,
      Math.cos(venusAxialTiltRad),
      Math.sin(venusAxialTiltRad),
    ).normalize(),
    orbit: {
      realSemiMajorAxis_m: VENUS_SMA_AU * AU,
      eccentricity: VENUS_ECC,
      inclination: VENUS_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: VENUS_LAN_DEG * DEG_TO_RAD,
      argumentOfPeriapsis: VENUS_AOP_DEG * DEG_TO_RAD,
      meanAnomaly: VENUS_MA_DEG * DEG_TO_RAD,
      period_s: VENUS_ORBITAL_PERIOD_S,
    },
    atmosphere: {
      glowColor: "#FDD835",
      intensity: 0.7,
      power: 1.5,
      thickness: 0.4,
    } as PlanetAtmosphereProperties,
    surface: {
      type: SurfaceType.VOLCANIC,
      planetType: PlanetType.LAVA,
      color: "#B07D48",
      roughness: 0.6,
      lavaColor: "#DD2C00",
      rockColor: "#5D4037",
      lavaActivity: 0.2,
      volcanicActivity: 0.4,
    } as LavaSurfaceProperties,
    properties: {
      type: CelestialType.PLANET,
      planetType: PlanetType.LAVA,
      isMoon: false,
      composition: ["silicates", "iron core", "dense CO2 atmosphere"],
    },
  });
}
