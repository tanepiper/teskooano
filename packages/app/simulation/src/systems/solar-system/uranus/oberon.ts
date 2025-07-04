import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";
import { KM } from "@teskooano/core-physics";
import { actions } from "@teskooano/core-state";
import {
  CelestialType,
  PlanetType,
  SurfaceType,
  type PlanetProperties,
} from "@teskooano/data-types";

const OBERON_REAL_RADIUS_M = 761400;

/**
 * Creates Oberon.
 * @param parentId The ID of the parent object (Uranus).
 */
export function initializeOberon(parentId: string): void {
  const defaultMoonAxialTilt = new OSVector3(0, 1, 0).normalize();

  actions.addCelestial({
    id: "oberon",
    name: "Oberon",
    seed: "oberon_seed_1346",
    type: CelestialType.MOON,
    parentId: parentId,
    realMass_kg: 3.014e21,
    realRadius_m: OBERON_REAL_RADIUS_M,
    siderealRotationPeriod_s: 1.162e6,
    axialTilt: defaultMoonAxialTilt,
    orbit: {
      realSemiMajorAxis_m: 583520 * KM,
      eccentricity: 0.0014,
      inclination: 0.058 * DEG_TO_RAD,
      longitudeOfAscendingNode: 169.5 * DEG_TO_RAD,
      argumentOfPeriapsis: 218.8 * DEG_TO_RAD,
      meanAnomaly: 108.6 * DEG_TO_RAD,
      period_s: 1.162e6,
    },
    temperature: 75,
    albedo: 0.35,
    properties: {
      type: CelestialType.MOON,
      classType: PlanetType.BARREN,
      isMoon: true,
      parentPlanet: parentId,
      composition: ["water ice", "rock", "dark carbonaceous material"],
      surface: {
        // Base surface properties
        type: SurfaceType.CRATERED,
        color: "#9898A0", // Dark gray
        roughness: 0.8,
        classType: PlanetType.BARREN,
        // Oberon dark surface procedural properties
        persistence: 0.55,
        lacunarity: 2.2,
        simplePeriod: 2.8,
        octaves: 10,
        bumpScale: 3.0,
        color1: "#603838", // Dark carbonaceous
        color2: "#808080", // Medium gray
        color3: "#9898A0", // Oberon's gray
        color4: "#B0B0B8", // Lighter areas
        color5: "#C8C8D0", // Brightest spots
        height1: 0.08,
        height2: 0.25,
        height3: 0.45,
        height4: 0.7,
        height5: 0.9,
        shininess: 12,
        specularStrength: 0.3,
        ambientLightIntensity: 0.32,
        undulation: 0.3,
        terrainType: 2,
        terrainAmplitude: 0.9,
        terrainSharpness: 1.6,
        terrainOffset: -0.1,
      },
    } as PlanetProperties,
  });
}
