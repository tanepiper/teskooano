import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";
import { KM } from "@teskooano/core-physics";
import {
  CelestialType,
  PlanetType,
  SurfaceType,
  CelestialStatus,
  type PlanetProperties,
} from "@teskooano/data-types";

const MIMAS_MASS_KG = 3.75e19;
const MIMAS_RADIUS_M = 198.2 * KM;
const MIMAS_SMA_M = 185539 * KM;
const MIMAS_ECC = 0.0196;
const MIMAS_INC_DEG = 1.566;
const MIMAS_LAN_DEG = 123.5;
const MIMAS_AOP_DEG = 312.4;
const MIMAS_MA_DEG = 159.2;
const MIMAS_SIDEREAL_PERIOD_S = 81443;
const MIMAS_ALBEDO = 0.962;

/**
 * Mimas configuration object for modular solar system initialization.
 */
export const mimas = {
  id: "mimas",
  name: "Mimas",
  seed: "mimas",
  type: CelestialType.MOON,
  status: CelestialStatus.ACTIVE,
  parentId: "saturn", // Will be replaced during initialization
  realMass_kg: MIMAS_MASS_KG,
  realRadius_m: MIMAS_RADIUS_M,
  temperature: 63,
  albedo: MIMAS_ALBEDO,
  orbit: {
    realSemiMajorAxis_m: MIMAS_SMA_M,
    eccentricity: MIMAS_ECC,
    inclination: MIMAS_INC_DEG * DEG_TO_RAD,
    longitudeOfAscendingNode: MIMAS_LAN_DEG * DEG_TO_RAD,
    argumentOfPeriapsis: MIMAS_AOP_DEG * DEG_TO_RAD,
    meanAnomaly: MIMAS_MA_DEG * DEG_TO_RAD,
    period_s: MIMAS_SIDEREAL_PERIOD_S,
    siderealRotationPeriod_s: MIMAS_SIDEREAL_PERIOD_S,
    axialTilt: new OSVector3(0, 1, 0),
  },
  properties: {
    type: CelestialType.MOON,
    classType: PlanetType.BARREN,
    isMoon: true,
    composition: ["water ice", "rocky core"],
    atmosphere: undefined,
    surface: {
      type: SurfaceType.CRATERED,
      color: "#E0E0E0",
      roughness: 0.8,
      classType: PlanetType.BARREN,
      persistence: 0.6,
      lacunarity: 2.1,
      simplePeriod: 2.0,
      octaves: 8,
      bumpScale: 3.5,
      color1: "#B0B0B0",
      color2: "#D0D0D0",
      color3: "#E0E0E0",
      color4: "#F0F0F0",
      color5: "#FFFFFF",
      height1: 0.1,
      height2: 0.25,
      height3: 0.5,
      height4: 0.75,
      height5: 0.9,
      shininess: 35,
      specularStrength: 0.7,
      ambientLightIntensity: 0.01, // Minimal ambient for dynamic lighting
      undulation: 0.22,
      terrainType: 1, // Cratered terrain
      terrainAmplitude: 0.8,
      terrainSharpness: 1.8,
      terrainOffset: 0.2,
    },
  } as PlanetProperties,
};

/**
 * Legacy function for backward compatibility.
 * @deprecated Use the mimas configuration object instead.
 */
export function initializeMimas(parentId: string): void {
  const mimasConfig = { ...mimas, parentId };
  // Note: This would need celestialManager import if we want to keep the function working
  // For now, just export the config object
}
