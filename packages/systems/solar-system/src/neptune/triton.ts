import { createOrbitalElements, kmToM } from "@teskooano/core-physics";
import {
  CelestialObject,
  CelestialType,
  CelestialStatus,
  PlanetType,
  type PlanetProperties,
} from "@teskooano/data-types";

const TRITON_RADIUS_KM = 1353.4;
const TRITON_SMA_KM = 354759;
const TRITON_ECC = 0.000016;
const TRITON_INC_DEG = 156.885;
const TRITON_LAN_DEG = 249.7;
const TRITON_AOP_DEG = 275.1;
const TRITON_MA_DEG = 296.6;
const TRITON_SIDEREAL_ROTATION_PERIOD_S = -5.877 * 24 * 3600; // Retrograde rotation
const NEPTUNE_MASS_KG = 1.024e26; // Neptune's mass for orbital period calculation

// Calculate orbital period using Kepler's third law
const TRITON_ORBITAL_PERIOD_S =
  2 *
  Math.PI *
  Math.sqrt(Math.pow(TRITON_SMA_KM * 1000, 3) / (6.6743e-11 * NEPTUNE_MASS_KG));

export const triton: CelestialObject<PlanetProperties> = {
  id: "triton",
  name: "Triton",
  seed: "triton_seed_5877",
  type: CelestialType.MOON,
  status: CelestialStatus.ACTIVE,
  parentId: "neptune", // Will be replaced during initialization
  realMass_kg: 2.139e22,
  realRadius_m: kmToM(TRITON_RADIUS_KM),
  temperature: 38,
  albedo: 0.76,
  orbit: createOrbitalElements({
    semiMajorAxisAU: TRITON_SMA_KM / 149597870.7,
    eccentricity: TRITON_ECC,
    inclinationDeg: TRITON_INC_DEG,
    longitudeOfAscendingNodeDeg: TRITON_LAN_DEG,
    argumentOfPeriapsisDeg: TRITON_AOP_DEG,
    meanAnomalyDeg: TRITON_MA_DEG,
    period_s: TRITON_ORBITAL_PERIOD_S,
    siderealRotationPeriod_s: TRITON_SIDEREAL_ROTATION_PERIOD_S,
    axialTiltDeg: 0,
  }),
  properties: {
    type: CelestialType.MOON,
    classType: PlanetType.BARREN,
    isMoon: true,
    composition: ["nitrogen ice", "water ice", "methane ice", "rocky core"],
    surface: {
      roughness: 0.5,
      persistence: 0.53,
      lacunarity: 2.14,
      simplePeriod: 0.87,
      octaves: 8,
      bumpScale: 10,
      color1: "#B0C0D0",
      color2: "#D0E0F0",
      color3: "#E0F0F0",
      color4: "#F0F8FF",
      color5: "#FFFFFF",
      height1: 0.088,
      height2: 0.41,
      height3: 0.4,
      height4: 0.43,
      height5: 0.43,
      shininess: 23,
      specularStrength: 0.47,
      ambientLightIntensity: 0.01, // Minimal ambient for dynamic lighting
      undulation: 0.1,
      terrainType: 3,
      terrainAmplitude: 0.2,
      terrainSharpness: 1.3,
      terrainOffset: 0.25,
    },
  },
};
