import {
  J2000_EPOCH,
  createOrbitalElements,
  kmToM,
} from "@teskooano/core-physics";
import {
  CelestialObject,
  CelestialStatus,
  CelestialType,
  PlanetType,
  type PlanetProperties,
} from "@teskooano/data-types";

const PLUTO_MASS_KG = 1.303e22;
const PLUTO_RADIUS_KM = 1188.3; // Mean radius
const PLUTO_TEMP_K = 44; // Mean surface temperature
const PLUTO_ALBEDO = 0.52; // Bond albedo
const PLUTO_SMA_AU = 39.482;
const PLUTO_ECC = 0.2488;
const PLUTO_INC_DEG = 17.16;
const PLUTO_LAN_DEG = 110.299;
const PLUTO_AOP_DEG = 113.834;
const PLUTO_MA_DEG = 14.53;
const PLUTO_ORBITAL_PERIOD_S = 7.82e9; // 247.94 Earth years (7.82e9 seconds)
const PLUTO_SIDEREAL_ROTATION_PERIOD_S = 5.514e5; // 6.387 Earth days
const PLUTO_AXIAL_TILT_DEG = 119.51;

/**
 * Pluto configuration object for modular solar system initialization.
 */
export const pluto: CelestialObject<PlanetProperties> = {
  id: "pluto",
  name: "Pluto",
  seed: "pluto",
  type: CelestialType.PLANET,
  status: CelestialStatus.ACTIVE,
  parentId: "sun", // Will be replaced during initialization
  realMass_kg: PLUTO_MASS_KG,
  realRadius_m: kmToM(PLUTO_RADIUS_KM),
  temperature: PLUTO_TEMP_K,
  albedo: PLUTO_ALBEDO,
  orbit: createOrbitalElements({
    semiMajorAxisAU: PLUTO_SMA_AU,
    eccentricity: PLUTO_ECC,
    inclinationDeg: PLUTO_INC_DEG,
    longitudeOfAscendingNodeDeg: PLUTO_LAN_DEG,
    argumentOfPeriapsisDeg: PLUTO_AOP_DEG,
    meanAnomalyDeg: PLUTO_MA_DEG,
    period_s: PLUTO_ORBITAL_PERIOD_S,
    siderealRotationPeriod_s: PLUTO_SIDEREAL_ROTATION_PERIOD_S,
    axialTiltDeg: PLUTO_AXIAL_TILT_DEG,
    epoch: J2000_EPOCH,
  }),
  properties: {
    type: CelestialType.PLANET,
    isMoon: false,
    composition: [
      "nitrogen ice",
      "methane ice",
      "carbon monoxide ice",
      "rocky core",
    ],
    surface: {
      roughness: 0.7,
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
  },
};
