import {
  createOrbitalElements,
  kmToM,
  J2000_EPOCH,
} from "@teskooano/core-physics";
import {
  CelestialStatus,
  CelestialType,
  CelestialObject,
  PlanetType,
  type PlanetProperties,
} from "@teskooano/data-types";

const ADRASTEA_MASS_KG = 2e15;
const ADRASTEA_RADIUS_KM = 8.2;
const ADRASTEA_ALBEDO = 0.05;

/**
 * Adrastea moon configuration object for modular solar system initialization.
 */
export const adrastea: CelestialObject<PlanetProperties> = {
  id: "adrastea",
  name: "Adrastea",
  seed: "adrastea_seed_2024",
  type: CelestialType.MOON,
  status: CelestialStatus.ACTIVE,
  parentId: "jupiter", // Will be replaced during initialization
  realMass_kg: ADRASTEA_MASS_KG,
  realRadius_m: kmToM(ADRASTEA_RADIUS_KM),
  temperature: 120, // Generic temperature
  albedo: ADRASTEA_ALBEDO,
  orbit: createOrbitalElements({
    semiMajorAxisAU: 129000 / 149597870.7, // 129,000 km converted to AU
    eccentricity: 0.0015,
    inclinationDeg: 0.03,
    longitudeOfAscendingNodeDeg: 0,
    argumentOfPeriapsisDeg: 0,
    meanAnomalyDeg: 0,
    period_s: 25770,
    siderealRotationPeriod_s: 25770, // Synchronous rotation
    axialTiltDeg: 0, // Moons don't have meaningful axial tilt
    epoch: J2000_EPOCH,
  }),
  properties: {
    type: CelestialType.MOON,
    classType: PlanetType.ROCKY,
    isMoon: true,
    composition: ["rocky materials", "ice"],
    surface: {
      roughness: 0.8,
      persistence: 0.5,
      lacunarity: 2.0,
      simplePeriod: 2.0,
      octaves: 6,
      bumpScale: 0.5,
      color1: "#A9A9A9",
      color2: "#696969",
      color3: "#808080",
      color4: "#BEBEBE",
      color5: "#D3D3D3",
      height1: 0.2,
      height2: 0.4,
      height3: 0.6,
      height4: 0.8,
      height5: 1.0,
      shininess: 5,
      specularStrength: 0.1,
      ambientLightIntensity: 0.01, // Minimal ambient for dynamic lighting
      undulation: 0.1,
      terrainType: 1,
      terrainAmplitude: 0.2,
      terrainSharpness: 1.5,
      terrainOffset: 0.1,
    },
  },
};
