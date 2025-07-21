import { createOrbitalElements, kmToM } from "@teskooano/core-physics";
import {
  CelestialType,
  CelestialStatus,
  PlanetType,
  SurfaceType,
  type PlanetProperties,
  CelestialObject,
} from "@teskooano/data-types";

const ARIEL_REAL_RADIUS_KM = 578.9;

/**
 * Ariel configuration object for modular solar system initialization.
 */
export const ariel: CelestialObject<PlanetProperties> = {
  id: "ariel",
  name: "Ariel",
  seed: "ariel_seed_2520",
  type: CelestialType.MOON,
  status: CelestialStatus.ACTIVE,
  parentId: "uranus", // Will be replaced during initialization
  realMass_kg: 1.353e21,
  realRadius_m: kmToM(ARIEL_REAL_RADIUS_KM),
  orbit: createOrbitalElements({
    semiMajorAxisAU: 0.00129025,
    eccentricity: 0.0012,
    inclinationDeg: 0.26,
    longitudeOfAscendingNodeDeg: 169.5,
    argumentOfPeriapsisDeg: 83.4,
    meanAnomalyDeg: 310.4,
    period_s: 2.178e5,
    siderealRotationPeriod_s: 2.178e5, // Synchronous rotation
    axialTiltDeg: 0, // Moons don't have meaningful axial tilt
  }),
  temperature: 60,
  albedo: 0.39,
  properties: {
    type: CelestialType.MOON,
    classType: PlanetType.BARREN,
    isMoon: true,
    composition: ["water ice", "rock", "possible ammonia"],
    surface: {
      roughness: 0.4,
      persistence: 0.5,
      lacunarity: 2.0,
      simplePeriod: 1.8,
      octaves: 8,
      bumpScale: 2.2,
      color1: "#B0C4DE",
      color2: "#D0D8E0",
      color3: "#E8E8F0",
      color4: "#F0F0F8",
      color5: "#F8F8FF",
      height1: 0.12,
      height2: 0.3,
      height3: 0.5,
      height4: 0.75,
      height5: 0.9,
      shininess: 22,
      specularStrength: 0.5,
      ambientLightIntensity: 0.01,
      undulation: 0.35,
      terrainType: 3,
      terrainAmplitude: 0.8,
      terrainSharpness: 1.4,
      terrainOffset: 0.1,
    },
  },
};
