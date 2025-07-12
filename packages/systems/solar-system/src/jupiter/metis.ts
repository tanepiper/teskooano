import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";
import { KM } from "@teskooano/core-physics";
import { actions } from "@teskooano/core-state";
import {
  CelestialType,
  PlanetType,
  SurfaceType,
  CelestialStatus,
  PhysicsStateReal,
  type PlanetProperties,
} from "@teskooano/data-types";

const METIS_MASS_KG = 3.6e16;
const METIS_RADIUS_M = 21500;
const METIS_SMA_M = 128000 * KM;
const METIS_ECC = 0.0002;
const METIS_INC_DEG = 0.06;
const METIS_SIDEREAL_PERIOD_S = 25470;
const METIS_ALBEDO = 0.061;

/**
 * Initializes Metis, one of Jupiter's inner moons.
 */
export function initializeMetis(parentId: string): void {
  const defaultMoonAxialTilt = new OSVector3(0, 1, 0);

  actions.addCelestial({
    id: "metis",
    name: "Metis",
    seed: "metis_seed_2024",
    type: CelestialType.MOON,
    status: CelestialStatus.ACTIVE,
    parentId: parentId,
    realMass_kg: METIS_MASS_KG,
    realRadius_m: METIS_RADIUS_M,
    temperature: 120, // Generic temperature
    albedo: METIS_ALBEDO,
    siderealRotationPeriod_s: METIS_SIDEREAL_PERIOD_S,
    axialTilt: defaultMoonAxialTilt,
    orbit: {
      realSemiMajorAxis_m: METIS_SMA_M,
      eccentricity: METIS_ECC,
      inclination: METIS_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: 0,
      argumentOfPeriapsis: 0,
      meanAnomaly: 0,
      period_s: METIS_SIDEREAL_PERIOD_S,
    },
    physicsStateReal: {
      id: "metis",
      mass_kg: METIS_MASS_KG,
      position_m: new OSVector3(0, 0, 0), // Will be calculated by the factory
      velocity_mps: new OSVector3(0, 0, 0), // Will be calculated by the factory
    },
    properties: {
      type: CelestialType.MOON,
      classType: PlanetType.ROCKY,
      isMoon: true,
      parentPlanet: parentId,
      composition: ["rocky materials", "ice"],
      surface: {
        type: SurfaceType.CRATERED,
        color: "#888888",
        roughness: 0.8,
        classType: PlanetType.ROCKY,
        persistence: 0.5,
        lacunarity: 2.0,
        simplePeriod: 2.0,
        octaves: 6,
        bumpScale: 0.5,
        color1: "#A9A9A9",
        color2: "#696969",
        color3: "#808080",
        color4: "#BEBEBE",
        color5: "#D3D3D3",
        height1: 0.2,
        height2: 0.4,
        height3: 0.6,
        height4: 0.8,
        height5: 1.0,
        shininess: 5,
        specularStrength: 0.1,
        ambientLightIntensity: 0.01,
        undulation: 0.1,
        terrainType: 1,
        terrainAmplitude: 0.2,
        terrainSharpness: 1.5,
        terrainOffset: 0.1,
      },
    } as PlanetProperties,
  });
}
