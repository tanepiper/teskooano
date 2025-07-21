import {
  J2000_EPOCH,
  createOrbitalElements,
  kmToM,
} from "@teskooano/core-physics";
import {
  CelestialStatus,
  CelestialType,
  PlanetType,
  SurfaceType,
  CelestialObject,
  type PlanetProperties,
} from "@teskooano/data-types";

const VENUS_MASS_KG = 4.8675e24;
const VENUS_RADIUS_KM = 6051.8; // Mean radius
const VENUS_TEMP_K = 737; // Surface temperature (extreme greenhouse effect)
const VENUS_ALBEDO = 0.76; // Bond albedo (0.689 geometric)

/**
 * Venus configuration object for modular solar system initialization.
 */
export const venus: CelestialObject<PlanetProperties> = {
  id: "venus",
  name: "Venus",
  seed: "venus",
  type: CelestialType.PLANET,
  status: CelestialStatus.ACTIVE,
  parentId: "sun", // Will be replaced during initialization
  realMass_kg: VENUS_MASS_KG,
  realRadius_m: kmToM(VENUS_RADIUS_KM),
  temperature: VENUS_TEMP_K,
  albedo: VENUS_ALBEDO,
  orbit: createOrbitalElements({
    semiMajorAxisAU: 0.723332, // Venus's semi-major axis
    eccentricity: 0.006772,
    inclinationDeg: 3.39458,
    longitudeOfAscendingNodeDeg: 76.68,
    argumentOfPeriapsisDeg: 54.884, // Argument of perihelion
    meanAnomalyDeg: 50.115, // Mean anomaly
    period_s: 1.94142e7, // 224.701 Earth days
    siderealRotationPeriod_s: -20997153, // -243.0226 Earth days (retrograde)
    axialTiltDeg: 177.36,
    epoch: J2000_EPOCH,
  }),
  properties: {
    type: CelestialType.PLANET,
    classType: PlanetType.ROCKY,
    isMoon: false,
    composition: [
      "silicates",
      "sulfur compounds",
      "dense CO2 atmosphere",
      "sulfuric acid clouds",
    ],
    atmosphere: {
      glowColor: "#FFFF99",
      intensity: 1.2,
      power: 1.8,
      thickness: 0.9,
    },
    surface: {
      roughness: 0.7,
      persistence: 0.55,
      lacunarity: 2.0,
      simplePeriod: 1.8,
      octaves: 8,
      bumpScale: 2.2,
      color1: "#B8860B", // Dark goldenrod (sulfur deposits)
      color2: "#DAA520", // Goldenrod (sulfurous rock)
      color3: "#FFFF00", // Yellow (pure sulfur areas)
      color4: "#fff52f", // Green yellow (sulfur compounds)
      color5: "#F0E68C", // Khaki (sulfuric weathering)
      height1: 0.1,
      height2: 0.25,
      height3: 0.45,
      height4: 0.7,
      height5: 0.9,
      shininess: 14,
      specularStrength: 0.25,
      ambientLightIntensity: 0.01, // Minimal ambient for dynamic lighting
      undulation: 0.3,
      terrainType: 2,
      terrainAmplitude: 0.8,
      terrainSharpness: 1.1,
      terrainOffset: 0.1,
    },
  },
};
