import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";
import { KM } from "@teskooano/core-physics";
import { actions } from "@teskooano/core-state";
import {
  CelestialType,
  CelestialStatus,
  PlanetType,
  SurfaceType,
  type PlanetProperties,
} from "@teskooano/data-types";

const NEREID_SMA_M = 5513800 * KM;
const NEREID_ORBITAL_PERIOD_S = 3.114e7;
const NEREID_SIDEREAL_ROTATION_PERIOD_S = 11.52 * 3600;

/**
 * Initializes Nereid.
 * @param parentId The ID of the parent object (Neptune).
 */
export function initializeNereid(parentId: string): void {
  const defaultMoonAxialTilt = new OSVector3(0, 1, 0).normalize();

  actions.addCelestial({
    id: "nereid",
    name: "Nereid",
    seed: "nereid_seed_360",
    type: CelestialType.MOON,
    status: CelestialStatus.ACTIVE,
    parentId: parentId,
    realMass_kg: 3.1e19,
    realRadius_m: 170000,
    siderealRotationPeriod_s: NEREID_SIDEREAL_ROTATION_PERIOD_S,
    axialTilt: defaultMoonAxialTilt,
    orbit: {
      realSemiMajorAxis_m: NEREID_SMA_M,
      eccentricity: 0.7507,
      inclination: 7.232 * DEG_TO_RAD,
      longitudeOfAscendingNode: 329.9 * DEG_TO_RAD,
      argumentOfPeriapsis: 268.2 * DEG_TO_RAD,
      meanAnomaly: 49.3 * DEG_TO_RAD,
      period_s: NEREID_ORBITAL_PERIOD_S,
    },
    temperature: 50,
    albedo: 0.14,
    physicsStateReal: {
      id: "nereid",
      mass_kg: 3.1e19,
      position_m: new OSVector3(0, 0, 0), // Will be calculated by the factory
      velocity_mps: new OSVector3(0, 0, 0), // Will be calculated by the factory
    },
    properties: {
      type: CelestialType.MOON,
      classType: PlanetType.BARREN,
      isMoon: true,
      parentPlanet: parentId,
      composition: ["water ice", "rock?"],
      shapeModel: "asteroid",
      surface: {
        // Base surface properties
        type: SurfaceType.CRATERED,
        color: "#A0A0A8", // Dark gray
        roughness: 0.7,
        classType: PlanetType.BARREN,
        // Nereid asteroid-like procedural properties
        persistence: 0.55,
        lacunarity: 2.3,
        simplePeriod: 3.2,
        octaves: 10,
        bumpScale: 3.0,
        color1: "#606068", // Dark base
        color2: "#808088", // Medium gray
        color3: "#A0A0A8", // Nereid's surface
        color4: "#C0C0C8", // Lighter areas
        color5: "#D0D0D8", // Brightest spots
        height1: 0.08,
        height2: 0.25,
        height3: 0.45,
        height4: 0.7,
        height5: 0.9,
        shininess: 8,
        specularStrength: 0.2,
        ambientLightIntensity: 0.01, // Minimal ambient for dynamic lighting
        undulation: 0.35,
        terrainType: 2,
        terrainAmplitude: 1.0,
        terrainSharpness: 1.8,
        terrainOffset: -0.1,
      },
    } as PlanetProperties,
  });
}
