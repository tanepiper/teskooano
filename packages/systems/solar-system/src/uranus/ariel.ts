import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";
import { KM } from "@teskooano/core-physics";
import { celestialManager } from "@teskooano/core-state";
import {
  CelestialType,
  CelestialStatus,
  PlanetType,
  SurfaceType,
  type PlanetProperties,
} from "@teskooano/data-types";

const ARIEL_REAL_RADIUS_M = 578.9 * KM;

/**
 * Creates Ariel.
 * @param parentId The ID of the parent object (Uranus).
 */
export function initializeAriel(parentId: string): void {
  const defaultMoonAxialTilt = new OSVector3(0, 1, 0).normalize();

  celestialManager.addCelestial({
    id: "ariel",
    name: "Ariel",
    seed: "ariel_seed_2520",
    type: CelestialType.MOON,
    status: CelestialStatus.ACTIVE,
    parentId: parentId,
    realMass_kg: 1.353e21,
    realRadius_m: ARIEL_REAL_RADIUS_M,
    orbit: {
      realSemiMajorAxis_m: 191020 * KM,
      eccentricity: 0.0012,
      inclination: 0.26 * DEG_TO_RAD,
      longitudeOfAscendingNode: 169.5 * DEG_TO_RAD,
      argumentOfPeriapsis: 83.4 * DEG_TO_RAD,
      meanAnomaly: 310.4 * DEG_TO_RAD,
      period_s: 2.178e5,
      siderealRotationPeriod_s: 2.178e5,
      axialTilt: defaultMoonAxialTilt,
    },
    temperature: 60,
    albedo: 0.39,
    properties: {
      type: CelestialType.MOON,
      classType: PlanetType.BARREN,
      isMoon: true,
      composition: ["water ice", "rock", "possible ammonia"],
      surface: {
        // Base surface properties
        type: SurfaceType.VARIED,
        color: "#E8E8F0", // Light ice
        roughness: 0.4,
        classType: PlanetType.BARREN,
        // Ariel bright fractured procedural properties
        persistence: 0.5,
        lacunarity: 2.0,
        simplePeriod: 1.8,
        octaves: 8,
        bumpScale: 2.2,
        color1: "#B0C4DE", // Light steel blue
        color2: "#D0D8E0", // Light gray
        color3: "#E8E8F0", // Very light
        color4: "#F0F0F8", // Almost white
        color5: "#F8F8FF", // Ghost white
        height1: 0.12,
        height2: 0.3,
        height3: 0.5,
        height4: 0.75,
        height5: 0.9,
        shininess: 22,
        specularStrength: 0.5,
        ambientLightIntensity: 0.01, // Minimal ambient for dynamic lighting
        undulation: 0.35,
        terrainType: 3,
        terrainAmplitude: 0.8,
        terrainSharpness: 1.4,
        terrainOffset: 0.1,
      },
    } as PlanetProperties,
  });
}
