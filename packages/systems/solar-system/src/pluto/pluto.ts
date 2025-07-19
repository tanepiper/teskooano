import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";
import { AU, KM } from "@teskooano/core-physics";
import {
  CelestialStatus,
  CelestialType,
  PlanetType,
  SurfaceType,
  type PlanetProperties,
} from "@teskooano/data-types";

const PLUTO_MASS_KG = 1.303e22;
const PLUTO_RADIUS_M = 1188.3 * KM; // Mean radius
const PLUTO_TEMP_K = 44; // Mean surface temperature
const PLUTO_ALBEDO = 0.52; // Bond albedo
const PLUTO_SMA_AU = 39.482;
const PLUTO_ECC = 0.2488;
const PLUTO_INC_DEG = 17.16;
const PLUTO_LAN_DEG = 110.299;
const PLUTO_AOP_DEG = 113.834;
const PLUTO_MA_DEG = 14.53;
const PLUTO_ORBITAL_PERIOD_S = 7.82e9; // 248.09 Earth years
const PLUTO_SIDEREAL_ROTATION_PERIOD_S = 5.514e5; // 6.387 Earth days
const PLUTO_AXIAL_TILT_DEG = 122.53;

/**
 * Pluto configuration object for modular solar system initialization.
 */
export const pluto = {
  id: "pluto",
  name: "Pluto",
  seed: "pluto",
  type: CelestialType.PLANET,
  status: CelestialStatus.ACTIVE,
  parentId: "sun", // Will be replaced during initialization
  realMass_kg: PLUTO_MASS_KG,
  realRadius_m: PLUTO_RADIUS_M,
  temperature: PLUTO_TEMP_K,
  albedo: PLUTO_ALBEDO,
  orbit: {
    realSemiMajorAxis_m: PLUTO_SMA_AU * AU,
    eccentricity: PLUTO_ECC,
    inclination: PLUTO_INC_DEG * DEG_TO_RAD,
    longitudeOfAscendingNode: PLUTO_LAN_DEG * DEG_TO_RAD,
    argumentOfPeriapsis: PLUTO_AOP_DEG * DEG_TO_RAD,
    meanAnomaly: PLUTO_MA_DEG * DEG_TO_RAD,
    period_s: PLUTO_ORBITAL_PERIOD_S,
    siderealRotationPeriod_s: PLUTO_SIDEREAL_ROTATION_PERIOD_S,
    axialTilt: new OSVector3(
      0,
      Math.cos(PLUTO_AXIAL_TILT_DEG * DEG_TO_RAD),
      Math.sin(PLUTO_AXIAL_TILT_DEG * DEG_TO_RAD),
    ).normalize(),
  },
  properties: {
    type: CelestialType.PLANET,
    classType: PlanetType.ICE,
    isMoon: false,
    composition: [
      "nitrogen ice",
      "methane ice",
      "carbon monoxide ice",
      "rocky core",
    ],
    surface: {
      type: SurfaceType.VARIED,
      color: "#E6E6FA",
      roughness: 0.7,
      classType: PlanetType.ICE,
      persistence: 0.7,
      lacunarity: 2.0,
      simplePeriod: 4.0,
      octaves: 8,
      bumpScale: 2.0,
      color1: "#F0F8FF",
      color2: "#E6E6FA",
      color3: "#D8BFD8",
      color4: "#DDA0DD",
      color5: "#E6E6FA",
      height1: 0.1,
      height2: 0.3,
      height3: 0.5,
      height4: 0.7,
      height5: 0.9,
      shininess: 15,
      specularStrength: 0.3,
      ambientLightIntensity: 0.01, // Minimal ambient for dynamic lighting
      undulation: 0.3,
      terrainType: 2,
      terrainAmplitude: 0.6,
      terrainSharpness: 1.2,
      terrainOffset: 0.0,
    },
  } as PlanetProperties,
};

/**
 * Legacy function for backward compatibility.
 * @deprecated Use the pluto configuration object instead.
 */
export function initializePluto(parentId: string): string {
  return pluto.id;
}
