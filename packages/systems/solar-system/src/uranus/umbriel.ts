import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";
import { KM } from "@teskooano/core-physics";
import {
  CelestialType,
  CelestialStatus,
  PlanetType,
  SurfaceType,
  type PlanetProperties,
} from "@teskooano/data-types";

const UMBRIEL_REAL_RADIUS_M = 584.7 * KM;

/**
 * Umbriel configuration object for modular solar system initialization.
 */
export const umbriel = {
  id: "umbriel",
  name: "Umbriel",
  seed: "umbriel_seed_4144",
  type: CelestialType.MOON,
  status: CelestialStatus.ACTIVE,
  parentId: "uranus", // Will be replaced during initialization
  realMass_kg: 1.172e21,
  realRadius_m: UMBRIEL_REAL_RADIUS_M,
  orbit: {
    realSemiMajorAxis_m: 266000 * KM,
    eccentricity: 0.0039,
    inclination: 0.128 * DEG_TO_RAD,
    longitudeOfAscendingNode: 169.5 * DEG_TO_RAD,
    argumentOfPeriapsis: 304.1 * DEG_TO_RAD,
    meanAnomaly: 198.8 * DEG_TO_RAD,
    period_s: 3.582e5,
    siderealRotationPeriod_s: 3.582e5,
    axialTilt: new OSVector3(0, 1, 0).normalize(),
  },
  temperature: 75,
  albedo: 0.21,
  properties: {
    type: CelestialType.MOON,
    classType: PlanetType.BARREN,
    isMoon: true,
    composition: ["water ice", "rock", "methane ice?", "dark material coating"],
    surface: {
      // Base surface properties
      type: SurfaceType.CRATERED,
      color: "#50505A", // Very dark
      roughness: 0.85,
      classType: PlanetType.BARREN,
      // Umbriel very dark procedural properties
      persistence: 0.58,
      lacunarity: 2.3,
      simplePeriod: 2.5,
      octaves: 11,
      bumpScale: 3.5,
      color1: "#303040", // Very dark base
      color2: "#404050", // Dark gray
      color3: "#50505A", // Umbriel's dark surface
      color4: "#606070", // Slightly lighter
      color5: "#707080", // Lightest areas
      height1: 0.05,
      height2: 0.2,
      height3: 0.4,
      height4: 0.65,
      height5: 0.85,
      shininess: 6,
      specularStrength: 0.15,
      ambientLightIntensity: 0.01, // Minimal ambient for dynamic lighting
      undulation: 0.4,
      terrainType: 2,
      terrainAmplitude: 1.2,
      terrainSharpness: 2.2,
      terrainOffset: -0.2,
    },
  } as PlanetProperties,
};

/**
 * Legacy function for backward compatibility.
 * @deprecated Use the umbriel configuration object instead.
 */
export function initializeUmbriel(parentId: string): void {
  const umbrielConfig = { ...umbriel, parentId };
  // Note: This would need celestialManager import if we want to keep the function working
  // For now, just export the config object
}
