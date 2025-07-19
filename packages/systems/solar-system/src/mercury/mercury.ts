import { createOrbitalElements, kmToM } from "@teskooano/core-physics";
import {
  CelestialObject,
  CelestialStatus,
  CelestialType,
  PlanetProperties,
  PlanetType,
} from "@teskooano/data-types";

const MERCURY_MASS_KG = 3.285e23;
const MERCURY_RADIUS_KM = 2439.7; // Mean radius
const MERCURY_TEMP_K = 440; // Mean surface temperature
const MERCURY_ALBEDO = 0.088; // Bond albedo

/**
 * Mercury configuration object for modular solar system initialization.
 */
export const mercury: CelestialObject<PlanetProperties> = {
  id: "mercury",
  name: "Mercury",
  seed: "mercury",
  type: CelestialType.PLANET,
  status: CelestialStatus.ACTIVE,
  parentId: "sun", // Will be replaced during initialization
  realMass_kg: MERCURY_MASS_KG,
  realRadius_m: kmToM(MERCURY_RADIUS_KM),
  temperature: MERCURY_TEMP_K,
  albedo: MERCURY_ALBEDO,
  orbit: createOrbitalElements({
    semiMajorAxisAU: 0.387098, // Mercury's semi-major axis
    eccentricity: 0.20563,
    inclinationDeg: 7.00487,
    longitudeOfAscendingNodeDeg: 48.33167,
    argumentOfPeriapsisDeg: 29.12478,
    meanAnomalyDeg: 174.79577,
    period_s: 7.60052e6, // 87.969 Earth days
    siderealRotationPeriod_s: 5.067e6, // 58.646 Earth days
    axialTiltDeg: 0.034,
  }),
  properties: {
    type: CelestialType.PLANET,
    classType: PlanetType.ROCKY,
    isMoon: false,
    composition: ["silicates", "iron core", "thin exosphere", "no atmosphere"],
    surface: {
      roughness: 0.9,
      persistence: 0.6,
      lacunarity: 2.0,
      simplePeriod: 2.5,
      octaves: 8,
      bumpScale: 3.5,
      color1: "#654321",
      color2: "#8B7355",
      color3: "#A0522D",
      color4: "#CD853F",
      color5: "#DEB887",
      height1: 0.1,
      height2: 0.3,
      height3: 0.5,
      height4: 0.7,
      height5: 0.9,
      shininess: 12,
      specularStrength: 0.2,
      ambientLightIntensity: 0.01, // Minimal ambient for dynamic lighting
      undulation: 0.4,
      terrainType: 2,
      terrainAmplitude: 0.9,
      terrainSharpness: 1.3,
      terrainOffset: 0.0,
    },
  },
};
