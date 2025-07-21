import {
  createOrbitalElements,
  kmToM,
  J2000_EPOCH,
} from "@teskooano/core-physics";
import {
  CelestialType,
  PlanetType,
  CelestialStatus,
  type PlanetProperties,
  CelestialObject,
} from "@teskooano/data-types";

// Verified Wikipedia data for Callisto - most heavily cratered moon in Solar System
const CALLISTO_MASS_KG = 1.075938e23; // Wikipedia verified: (1.075938±0.000137)×10²³ kg
const CALLISTO_RADIUS_KM = 2410.3; // Wikipedia verified: 2410.3±1.5 km (mean radius)
const CALLISTO_ALBEDO = 0.22; // Wikipedia verified: 0.22 geometric albedo
const CALLISTO_TEMP_K = 134; // Wikipedia verified: mean 134±11 K

/**
 * Callisto moon configuration object for modular solar system initialization.
 */
export const callisto: CelestialObject<PlanetProperties> = {
  id: "callisto",
  name: "Callisto",
  seed: "callisto_seed_16689",
  type: CelestialType.MOON,
  status: CelestialStatus.ACTIVE,
  parentId: "jupiter", // Will be replaced during initialization
  realMass_kg: CALLISTO_MASS_KG,
  realRadius_m: kmToM(CALLISTO_RADIUS_KM),
  temperature: CALLISTO_TEMP_K,
  albedo: CALLISTO_ALBEDO,
  orbit: createOrbitalElements({
    semiMajorAxisAU: 1882700 / 149597870.7, // 1,882,700 km converted to AU
    eccentricity: 0.0074,
    inclinationDeg: 0.192, // To local Laplace plane
    longitudeOfAscendingNodeDeg: 298.848,
    argumentOfPeriapsisDeg: 52.643,
    meanAnomalyDeg: 181.408,
    period_s: 16.6890184 * 24 * 3600, // 16.6890184 days (synchronous)
    siderealRotationPeriod_s: 16.6890184 * 24 * 3600, // Synchronous rotation
    axialTiltDeg: 0, // Moons don't have meaningful axial tilt
    epoch: J2000_EPOCH,
  }),
  properties: {
    type: CelestialType.MOON,
    classType: PlanetType.BARREN,
    isMoon: true,
    composition: [
      "water ice",
      "rocky material",
      "subsurface ocean",
      "undifferentiated interior",
      "carbonaceous material",
    ],
    atmosphere: {
      glowColor: "#E0E0E0",
      intensity: 0.02,
      power: 0.5,
      thickness: 0.01,
    },
    surface: {
      roughness: 0.8,
      persistence: 0.6,
      lacunarity: 2.4,
      simplePeriod: 3.0,
      octaves: 11,
      bumpScale: 3.2,
      color1: "#404050",
      color2: "#505060",
      color3: "#606070",
      color4: "#707080",
      color5: "#808090",
      height1: 0.05,
      height2: 0.2,
      height3: 0.4,
      height4: 0.65,
      height5: 0.85,
      shininess: 8,
      specularStrength: 0.1,
      ambientLightIntensity: 0.01, // Minimal ambient for dynamic lighting
      undulation: 0.35,
      terrainType: 2,
      terrainAmplitude: 1.1,
      terrainSharpness: 2.0,
      terrainOffset: -0.15,
    },
  },
};
