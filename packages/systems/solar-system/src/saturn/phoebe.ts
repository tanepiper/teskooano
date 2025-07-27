import { createOrbitalElements, kmToM } from "@teskooano/core-physics";
import {
  CelestialType,
  CelestialStatus,
  PlanetType,
  type PlanetProperties,
  CelestialObject,
} from "@teskooano/data-types";

const PHOEBE_MASS_KG = 8.28e18;
// Radius and semi-major axis are now handled directly in km and converted with kmToM where needed.
const PHOEBE_ECC = 0.158;
const PHOEBE_INC_DEG = 173.04; // Retrograde orbit
const PHOEBE_LAN_DEG = 229.3;
const PHOEBE_AOP_DEG = 102.7;
const PHOEBE_MA_DEG = 308.2;
const PHOEBE_ORBITAL_PERIOD_S = -47369347; // Retrograde
const PHOEBE_ROTATION_PERIOD_S = 33419;
const PHOEBE_ALBEDO = 0.081;

/**
 * Phoebe configuration object for modular solar system initialization.
 */
export const phoebe: CelestialObject<PlanetProperties> = {
  id: "phoebe",
  name: "Phoebe",
  seed: "phoebe",
  type: CelestialType.MOON,
  status: CelestialStatus.ACTIVE,
  parentId: "saturn", // Will be replaced during initialization
  realMass_kg: PHOEBE_MASS_KG,
  realRadius_m: kmToM(106.5),
  temperature: 75,
  albedo: PHOEBE_ALBEDO,
  orbit: createOrbitalElements({
    semiMajorAxisAU: 0.00087039,
    eccentricity: PHOEBE_ECC,
    inclinationDeg: PHOEBE_INC_DEG,
    longitudeOfAscendingNodeDeg: PHOEBE_LAN_DEG,
    argumentOfPeriapsisDeg: PHOEBE_AOP_DEG,
    meanAnomalyDeg: PHOEBE_MA_DEG,
    period_s: PHOEBE_ORBITAL_PERIOD_S, // Negative for retrograde
    siderealRotationPeriod_s: PHOEBE_ROTATION_PERIOD_S,
    axialTiltDeg: 0,
  }),
  properties: {
    type: CelestialType.MOON,
    classType: PlanetType.ROCKY,
    isMoon: true,
    composition: ["water ice", "rock", "carbonaceous material"],
    atmosphere: undefined,
    surface: {
      roughness: 0.8,
      persistence: 0.5,
      lacunarity: 2.2,
      simplePeriod: 1.9,
      octaves: 9,
      bumpScale: 3.0,
      color1: "#76645b",
      color2: "#63574b",
      color3: "#7a6c5c",
      color4: "#77685a",
      color5: "#706050",
      height1: 0.1,
      height2: 0.3,
      height3: 0.5,
      height4: 0.7,
      height5: 0.9,
      shininess: 2,
      specularStrength: 0.01,
      ambientLightIntensity: 0.01, // Minimal ambient for dynamic lighting
      undulation: 0.3,
      terrainType: 2,
      terrainAmplitude: 0.7,
      terrainSharpness: 1.5,
      terrainOffset: -0.1,
    },
  },
};
