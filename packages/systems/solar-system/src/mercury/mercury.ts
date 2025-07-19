import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";
import { AU, KM } from "@teskooano/core-physics";
import {
  CelestialObject,
  CelestialStatus,
  CelestialType,
  PlanetProperties,
  PlanetType,
} from "@teskooano/data-types";

const MERCURY_MASS_KG = 3.285e23;
const MERCURY_RADIUS_M = 2439.7 * KM; // Mean radius
const MERCURY_TEMP_K = 440; // Mean surface temperature
const MERCURY_ALBEDO = 0.088; // Bond albedo
const MERCURY_SMA_AU = 0.387098;
const MERCURY_ECC = 0.20563;
const MERCURY_INC_DEG = 7.00487;
const MERCURY_LAN_DEG = 48.33167;
const MERCURY_AOP_DEG = 29.12478;
const MERCURY_MA_DEG = 174.79577;
const MERCURY_ORBITAL_PERIOD_S = 7.60052e6; // 87.969 Earth days
const MERCURY_SIDEREAL_ROTATION_PERIOD_S = 5.067e6; // 58.646 Earth days
const MERCURY_AXIAL_TILT_DEG = 0.034;

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
  realRadius_m: MERCURY_RADIUS_M,
  temperature: MERCURY_TEMP_K,
  albedo: MERCURY_ALBEDO,
  orbit: {
    realSemiMajorAxis_m: MERCURY_SMA_AU * AU,
    eccentricity: MERCURY_ECC,
    inclination: MERCURY_INC_DEG * DEG_TO_RAD,
    longitudeOfAscendingNode: MERCURY_LAN_DEG * DEG_TO_RAD,
    argumentOfPeriapsis: MERCURY_AOP_DEG * DEG_TO_RAD,
    meanAnomaly: MERCURY_MA_DEG * DEG_TO_RAD,
    period_s: MERCURY_ORBITAL_PERIOD_S,
    siderealRotationPeriod_s: MERCURY_SIDEREAL_ROTATION_PERIOD_S,
    axialTilt: new OSVector3(
      0,
      Math.cos(MERCURY_AXIAL_TILT_DEG * DEG_TO_RAD),
      Math.sin(MERCURY_AXIAL_TILT_DEG * DEG_TO_RAD),
    ).normalize(),
  },
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
