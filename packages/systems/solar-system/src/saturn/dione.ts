import { createOrbitalElements, kmToM } from "@teskooano/core-physics";
import {
  CelestialType,
  CelestialStatus,
  PlanetType,
  SurfaceType,
  type PlanetProperties,
  CelestialObject,
} from "@teskooano/data-types";

const DIONE_MASS_KG = 1.095e21;
const DIONE_RADIUS_KM = 561.4;
const DIONE_SMA_KM = 377396;
const DIONE_ECC = 0.0022;
const DIONE_INC_DEG = 0.019;
const DIONE_LAN_DEG = 128.2;
const DIONE_AOP_DEG = 91.1;
const DIONE_MA_DEG = 357.6;
const DIONE_SIDEREAL_PERIOD_S = 236518;
const DIONE_ALBEDO = 0.998;

/**
 * Dione configuration object for modular solar system initialization.
 */
export const dione: CelestialObject<PlanetProperties> = {
  id: "dione",
  name: "Dione",
  seed: "dione",
  type: CelestialType.MOON,
  status: CelestialStatus.ACTIVE,
  parentId: "saturn", // Will be replaced during initialization
  realMass_kg: DIONE_MASS_KG,
  realRadius_m: kmToM(DIONE_RADIUS_KM),
  temperature: 87,
  albedo: DIONE_ALBEDO,
  orbit: createOrbitalElements({
    semiMajorAxisAU: DIONE_SMA_KM / 149597870.7, // Convert km to AU
    eccentricity: DIONE_ECC,
    inclinationDeg: DIONE_INC_DEG,
    longitudeOfAscendingNodeDeg: DIONE_LAN_DEG,
    argumentOfPeriapsisDeg: DIONE_AOP_DEG,
    meanAnomalyDeg: DIONE_MA_DEG,
    period_s: DIONE_SIDEREAL_PERIOD_S,
    siderealRotationPeriod_s: DIONE_SIDEREAL_PERIOD_S,
    axialTiltDeg: 0,
  }),
  properties: {
    type: CelestialType.MOON,
    classType: PlanetType.BARREN,
    isMoon: true,
    composition: ["water ice", "rocky core"],
    atmosphere: undefined,
    surface: {
      roughness: 0.5,
      persistence: 0.55,
      lacunarity: 2.0,
      simplePeriod: 2.2,
      octaves: 8,
      bumpScale: 2.4,
      color1: "#B0B0B0",
      color2: "#D0D0D0",
      color3: "#E0E0E0",
      color4: "#F0F0F0",
      color5: "#FFFFFF",
      height1: 0.12,
      height2: 0.28,
      height3: 0.5,
      height4: 0.72,
      height5: 0.88,
      shininess: 28,
      specularStrength: 0.6,
      ambientLightIntensity: 0.01, // Minimal ambient for dynamic lighting
      undulation: 0.18,
      terrainType: 3,
      terrainAmplitude: 0.65,
      terrainSharpness: 1.2,
      terrainOffset: 0.1,
    },
  },
};
