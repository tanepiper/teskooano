import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";
import { KM } from "@teskooano/core-physics";
import {
  CelestialType,
  PlanetType,
  SurfaceType,
  CelestialStatus,
  type PlanetProperties,
} from "@teskooano/data-types";

const TITANIA_REAL_RADIUS_M = 788.4 * KM;

/**
 * Titania configuration object for modular solar system initialization.
 */
export const titania = {
  id: "titania",
  name: "Titania",
  seed: "titania_seed_8706",
  type: CelestialType.MOON,
  status: CelestialStatus.ACTIVE,
  parentId: "uranus", // Will be replaced during initialization
  realMass_kg: 3.527e21,
  realRadius_m: TITANIA_REAL_RADIUS_M,
  orbit: {
    realSemiMajorAxis_m: 436300 * KM,
    eccentricity: 0.0011,
    inclination: 0.34 * DEG_TO_RAD,
    longitudeOfAscendingNode: 169.5 * DEG_TO_RAD,
    argumentOfPeriapsis: 110.1 * DEG_TO_RAD,
    meanAnomaly: 15.9 * DEG_TO_RAD,
    period_s: 7.526e5,
    siderealRotationPeriod_s: 7.526e5,
    axialTilt: new OSVector3(0, 1, 0).normalize(),
  },
  temperature: 70,
  albedo: 0.27,
  properties: {
    type: CelestialType.MOON,
    classType: PlanetType.BARREN,
    isMoon: true,
    composition: ["water ice", "rock", "carbon dioxide ice"],
    surface: {
      // Base surface properties
      type: SurfaceType.CRATERED,
      color: "#B0B0B8", // Gray-blue ice
      roughness: 0.7,
      classType: PlanetType.BARREN,
      // Titania ice procedural properties
      persistence: 0.52,
      lacunarity: 2.1,
      simplePeriod: 2.3,
      octaves: 9,
      bumpScale: 2.8,
      color1: "#A0A8B0", // Dark gray
      color2: "#B0B0B8", // Gray-blue
      color3: "#C0C8D0", // Light gray
      color4: "#D0D8E0", // Very light
      color5: "#E0E8F0", // Brightest ice
      height1: 0.1,
      height2: 0.3,
      height3: 0.5,
      height4: 0.7,
      height5: 0.9,
      shininess: 18,
      specularStrength: 0.4,
      ambientLightIntensity: 0.01, // Minimal ambient for dynamic lighting
      undulation: 0.25,
      terrainType: 2,
      terrainAmplitude: 0.8,
      terrainSharpness: 1.5,
      terrainOffset: 0.0,
    },
  } as PlanetProperties,
};

/**
 * Legacy function for backward compatibility.
 * @deprecated Use the titania configuration object instead.
 */
export function initializeTitania(parentId: string): void {
  const titaniaConfig = { ...titania, parentId };
  // Note: This would need celestialManager import if we want to keep the function working
  // For now, just export the config object
}
