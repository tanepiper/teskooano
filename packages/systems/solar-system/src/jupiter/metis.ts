import { createOrbitalElements, kmToM } from "@teskooano/core-physics";
import {
  CelestialObject,
  CelestialStatus,
  CelestialType,
  PlanetType,
  type PlanetProperties,
} from "@teskooano/data-types";

const METIS_MASS_KG = 3.6e16;
const METIS_RADIUS_KM = 21.5;
const METIS_ALBEDO = 0.061;

/**
 * Metis moon configuration object for modular solar system initialization.
 */
export const metis: CelestialObject<PlanetProperties> = {
  id: "metis",
  name: "Metis",
  seed: "metis_seed_2024",
  type: CelestialType.MOON,
  status: CelestialStatus.ACTIVE,
  parentId: "jupiter", // Will be replaced during initialization
  realMass_kg: METIS_MASS_KG,
  realRadius_m: kmToM(METIS_RADIUS_KM),
  temperature: 120, // Generic temperature
  albedo: METIS_ALBEDO,
  orbit: createOrbitalElements({
    semiMajorAxisAU: 128000 / 149597870.7, // 128,000 km converted to AU
    eccentricity: 0.0002,
    inclinationDeg: 0.06,
    longitudeOfAscendingNodeDeg: 0,
    argumentOfPeriapsisDeg: 0,
    meanAnomalyDeg: 0,
    period_s: 25470,
    siderealRotationPeriod_s: 25470, // Synchronous rotation
    axialTiltDeg: 0, // Moons don't have meaningful axial tilt
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
      ambientLightIntensity: 0.01,
      undulation: 0.1,
      terrainType: 1,
      terrainAmplitude: 0.2,
      terrainSharpness: 1.5,
      terrainOffset: 0.1,
    },
  },
};
