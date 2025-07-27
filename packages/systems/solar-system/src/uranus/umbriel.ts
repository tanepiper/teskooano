import {
  createOrbitalElements,
  J2000_EPOCH,
  kmToM,
} from "@teskooano/core-physics";
import {
  CelestialType,
  CelestialStatus,
  PlanetType,
  SurfaceType,
  type PlanetProperties,
  CelestialObject,
} from "@teskooano/data-types";

const UMBRIEL_REAL_RADIUS_KM = 584.7;

/**
 * Umbriel configuration object for modular solar system initialization.
 */
export const umbriel: CelestialObject<PlanetProperties> = {
  id: "umbriel",
  name: "Umbriel",
  seed: "umbriel_seed_4144",
  type: CelestialType.MOON,
  status: CelestialStatus.ACTIVE,
  parentId: "uranus", // Will be replaced during initialization
  realMass_kg: 1.172e21,
  realRadius_m: kmToM(UMBRIEL_REAL_RADIUS_KM),
  orbit: createOrbitalElements({
    semiMajorAxisAU: 0.0017781,
    eccentricity: 0.0039,
    inclinationDeg: 0.128,
    longitudeOfAscendingNodeDeg: 169.5,
    argumentOfPeriapsisDeg: 304.1,
    meanAnomalyDeg: 198.8,
    period_s: 3.582e5,
    siderealRotationPeriod_s: 3.582e5, // Synchronous rotation
    axialTiltDeg: 0, // Moons don't have meaningful axial tilt
    epoch: J2000_EPOCH,
  }),
  temperature: 75,
  albedo: 0.21,
  properties: {
    type: CelestialType.MOON,
    classType: PlanetType.BARREN,
    isMoon: true,
    composition: ["water ice", "rock", "methane ice?", "dark material coating"],
    surface: {
      roughness: 0.85,
      persistence: 0.58,
      lacunarity: 2.3,
      simplePeriod: 2.5,
      octaves: 11,
      bumpScale: 3.5,
      color1: "#303040",
      color2: "#404050",
      color3: "#50505A",
      color4: "#606070",
      color5: "#707080",
      height1: 0.05,
      height2: 0.2,
      height3: 0.4,
      height4: 0.65,
      height5: 0.85,
      shininess: 4,
      specularStrength: 0.05,
      ambientLightIntensity: 0.01,
      undulation: 0.4,
      terrainType: 2,
      terrainAmplitude: 1.2,
      terrainSharpness: 2.2,
      terrainOffset: -0.2,
    },
  },
};
