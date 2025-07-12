import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";
import { AU } from "@teskooano/core-physics";
import { actions } from "@teskooano/core-state";
import {
  CelestialStatus,
  CelestialType,
  PlanetType,
  SurfaceType,
  PhysicsStateReal,
  type PlanetProperties,
} from "@teskooano/data-types";

const EARTH_MASS_KG = 5.97237e24;
const EARTH_RADIUS_M = 6371000;
const EARTH_TEMP_K = 288;
const EARTH_ALBEDO = 0.8;
const EARTH_SMA_AU = 1.0;
const EARTH_ECC = 0.01671;
const EARTH_INC_DEG = 0.00005;
const EARTH_LAN_DEG = -11.26064;
const EARTH_AOP_DEG = 102.94719;
const EARTH_MA_DEG = 100.46435;
const EARTH_ORBITAL_PERIOD_S = 3.15581e7;
const EARTH_SIDEREAL_ROTATION_PERIOD_S = 86164.1;
const EARTH_AXIAL_TILT_DEG = 23.43928;

/**
 * Initializes Earth using accurate data.
 * @returns The ID of the Earth object.
 */
export function initializeEarthPlanet(parentId: string): string {
  const earthId = "earth";
  const earthAxialTiltRad = EARTH_AXIAL_TILT_DEG * DEG_TO_RAD;

  actions.addCelestial({
    id: earthId,
    name: "Earth",
    seed: "earth",
    type: CelestialType.PLANET,
    status: CelestialStatus.ACTIVE,
    parentId: parentId,
    realMass_kg: EARTH_MASS_KG,
    realRadius_m: EARTH_RADIUS_M,
    temperature: EARTH_TEMP_K,
    albedo: EARTH_ALBEDO,
    orbit: {
      realSemiMajorAxis_m: EARTH_SMA_AU * AU,
      eccentricity: EARTH_ECC,
      inclination: EARTH_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: EARTH_LAN_DEG * DEG_TO_RAD,
      argumentOfPeriapsis: EARTH_AOP_DEG * DEG_TO_RAD,
      meanAnomaly: EARTH_MA_DEG * DEG_TO_RAD,
      period_s: EARTH_ORBITAL_PERIOD_S,
      siderealRotationPeriod_s: EARTH_SIDEREAL_ROTATION_PERIOD_S,
      axialTilt: new OSVector3(
        0,
        Math.cos(earthAxialTiltRad),
        Math.sin(earthAxialTiltRad),
      ).normalize(),
    },
    physicsStateReal: {
      id: earthId,
      mass_kg: EARTH_MASS_KG,
      position_m: new OSVector3(0, 0, 0), // Will be calculated by the factory
      velocity_mps: new OSVector3(0, 0, 0), // Will be calculated by the factory
    },
    properties: {
      type: CelestialType.PLANET,
      classType: PlanetType.TERRESTRIAL,
      isMoon: false,
      composition: [
        "silicates",
        "iron core",
        "liquid water",
        "nitrogen-oxygen atmosphere",
      ],
      atmosphere: {
        glowColor: "#87CEEB",
        intensity: 0.6,
        power: 1.2,
        thickness: 0.25,
      },
      surface: {
        type: SurfaceType.VARIED,
        color: "#15e267",
        roughness: 0.12,
        classType: PlanetType.TERRESTRIAL,
        persistence: 0.54,
        lacunarity: 2.2,
        simplePeriod: 18,
        octaves: 9,
        bumpScale: 2.7,
        color1: "#1E3A5F",
        color2: "#3F7CAC",
        color3: "#8FBC8F",
        color4: "#9ACD32",
        color5: "#FFFAFA",
        height1: 0,
        height2: 0.09,
        height3: 0.26,
        height4: 0.4,
        height5: 0.67,
        shininess: 8.5,
        specularStrength: 0.32,
        ambientLightIntensity: 0.01, // Minimal ambient for dark space
        undulation: 0.8,
        terrainType: 3,
        terrainAmplitude: 0.8,
        terrainSharpness: 1.7,
        terrainOffset: -0.5,
      },
    } as PlanetProperties,
  });

  return earthId;
}
