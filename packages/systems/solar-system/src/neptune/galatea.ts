import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";
import { KM } from "@teskooano/core-physics";
import {
  CelestialType,
  CelestialStatus,
  PlanetType,
  SurfaceType,
  type PlanetProperties,
} from "@teskooano/data-types";

const GALATEA_MASS_KG = 8.0e18;
const GALATEA_RADIUS_M = 88000;
const GALATEA_SMA_M = 61953 * KM;
const GALATEA_ECC = 0.0002;
const GALATEA_INC_DEG = 0.05;
const GALATEA_SIDEREAL_PERIOD_S = 10.3 * 3600;
const GALATEA_ALBEDO = 0.08;

/**
 * Galatea configuration object for modular solar system initialization.
 */
export const galatea = {
  id: "galatea",
  name: "Galatea",
  seed: "galatea",
  type: CelestialType.MOON,
  status: CelestialStatus.ACTIVE,
  parentId: "neptune", // Will be replaced during initialization
  realMass_kg: GALATEA_MASS_KG,
  realRadius_m: GALATEA_RADIUS_M,
  temperature: 60,
  albedo: GALATEA_ALBEDO,
  orbit: {
    realSemiMajorAxis_m: GALATEA_SMA_M,
    eccentricity: GALATEA_ECC,
    inclination: GALATEA_INC_DEG * DEG_TO_RAD,
    longitudeOfAscendingNode: 0,
    argumentOfPeriapsis: 0,
    meanAnomaly: 0,
    period_s: GALATEA_SIDEREAL_PERIOD_S,
    siderealRotationPeriod_s: GALATEA_SIDEREAL_PERIOD_S,
    axialTilt: new OSVector3(0, 1, 0).normalize(),
  },
  properties: {
    type: CelestialType.MOON,
    classType: PlanetType.ROCKY,
    isMoon: true,
    composition: ["water ice", "rock"],
    surface: {
      type: SurfaceType.CRATERED,
      color: "#979797",
      roughness: 0.85,
      classType: PlanetType.ROCKY,
      persistence: 0.5,
      lacunarity: 2.1,
      simplePeriod: 3.0,
      octaves: 6,
      bumpScale: 0.6,
      color1: "#717171",
      color2: "#888888",
      color3: "#979797",
      color4: "#ABABAB",
      color5: "#C5C5C5",
      height1: 0.05,
      height2: 0.25,
      height3: 0.5,
      height4: 0.75,
      height5: 0.9,
      shininess: 4,
      specularStrength: 0.05,
      ambientLightIntensity: 0.01, // Minimal ambient for dynamic lighting
      undulation: 0.2,
      terrainType: 1,
      terrainAmplitude: 0.3,
      terrainSharpness: 1.4,
      terrainOffset: 0.0,
    },
  } as PlanetProperties,
};

/**
 * Legacy function for backward compatibility.
 * @deprecated Use the galatea configuration object instead.
 */
export function initializeGalatea(parentId: string): void {
  const galateaConfig = { ...galatea, parentId };
  // Note: This would need celestialManager import if we want to keep the function working
  // For now, just export the config object
}
