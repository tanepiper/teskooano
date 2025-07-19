import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";
import { AU, KM } from "@teskooano/core-physics";
import {
  CelestialStatus,
  CelestialType,
  PlanetType,
  SurfaceType,
  type PlanetProperties,
} from "@teskooano/data-types";

const MARS_MASS_KG = 6.39e23;
const MARS_RADIUS_M = 3389.5 * KM; // Mean radius
const MARS_TEMP_K = 210; // Mean surface temperature
const MARS_ALBEDO = 0.25; // Bond albedo
const MARS_SMA_AU = 1.523679;
const MARS_ECC = 0.093405;
const MARS_INC_DEG = 1.85061;
const MARS_LAN_DEG = 49.57854;
const MARS_AOP_DEG = 286.4966;
const MARS_MA_DEG = 18.6021;
const MARS_ORBITAL_PERIOD_S = 5.935e7; // 686.98 Earth days
const MARS_SIDEREAL_ROTATION_PERIOD_S = 8.864e4; // 24.6229 hours
const MARS_AXIAL_TILT_DEG = 25.19;

/**
 * Mars configuration object for modular solar system initialization.
 */
export const mars = {
  id: "mars",
  name: "Mars",
  seed: "mars",
  type: CelestialType.PLANET,
  status: CelestialStatus.ACTIVE,
  parentId: "sun", // Will be replaced during initialization
  realMass_kg: MARS_MASS_KG,
  realRadius_m: MARS_RADIUS_M,
  temperature: MARS_TEMP_K,
  albedo: MARS_ALBEDO,
  orbit: {
    realSemiMajorAxis_m: MARS_SMA_AU * AU,
    eccentricity: MARS_ECC,
    inclination: MARS_INC_DEG * DEG_TO_RAD,
    longitudeOfAscendingNode: MARS_LAN_DEG * DEG_TO_RAD,
    argumentOfPeriapsis: MARS_AOP_DEG * DEG_TO_RAD,
    meanAnomaly: MARS_MA_DEG * DEG_TO_RAD,
    period_s: MARS_ORBITAL_PERIOD_S,
    siderealRotationPeriod_s: MARS_SIDEREAL_ROTATION_PERIOD_S,
    axialTilt: new OSVector3(
      0,
      Math.cos(MARS_AXIAL_TILT_DEG * DEG_TO_RAD),
      Math.sin(MARS_AXIAL_TILT_DEG * DEG_TO_RAD),
    ).normalize(),
  },
  properties: {
    type: CelestialType.PLANET,
    classType: PlanetType.TERRESTRIAL,
    isMoon: false,
    composition: [
      "silicates",
      "iron oxide",
      "thin CO2 atmosphere",
      "water ice caps",
    ],
    atmosphere: {
      glowColor: "#FF6B35",
      intensity: 0.3,
      power: 1.5,
      thickness: 0.15,
    },
    surface: {
      type: SurfaceType.VARIED,
      color: "#CD5C5C",
      roughness: 0.8,
      classType: PlanetType.TERRESTRIAL,
      persistence: 0.65,
      lacunarity: 2.1,
      simplePeriod: 3.2,
      octaves: 9,
      bumpScale: 2.8,
      color1: "#8B0000",
      color2: "#CD5C5C",
      color3: "#DC143C",
      color4: "#FF6347",
      color5: "#FFA07A",
      height1: 0.1,
      height2: 0.25,
      height3: 0.45,
      height4: 0.7,
      height5: 0.9,
      shininess: 10,
      specularStrength: 0.25,
      ambientLightIntensity: 0.01, // Minimal ambient for dynamic lighting
      undulation: 0.6,
      terrainType: 3,
      terrainAmplitude: 0.8,
      terrainSharpness: 1.4,
      terrainOffset: 0.1,
    },
  } as PlanetProperties,
};

/**
 * Legacy function for backward compatibility.
 * @deprecated Use the mars configuration object instead.
 */
export function initializeMars(parentId: string): string {
  return mars.id;
}
