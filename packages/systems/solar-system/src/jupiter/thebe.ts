import { createOrbitalElements, kmToM } from "@teskooano/core-physics";
import {
  CelestialObject,
  CelestialStatus,
  CelestialType,
  PlanetType,
  type PlanetProperties,
} from "@teskooano/data-types";

const THEBE_MASS_KG = 4.3e17;
const THEBE_RADIUS_KM = 49.3;
const THEBE_ALBEDO = 0.047;

/**
 * Thebe moon configuration object for modular solar system initialization.
 */
export const thebe: CelestialObject<PlanetProperties> = {
  id: "thebe",
  name: "Thebe",
  seed: "thebe_seed_2024",
  type: CelestialType.MOON,
  status: CelestialStatus.ACTIVE,
  parentId: "jupiter", // Will be replaced during initialization
  realMass_kg: THEBE_MASS_KG,
  realRadius_m: kmToM(THEBE_RADIUS_KM),
  temperature: 120, // Generic temperature
  albedo: THEBE_ALBEDO,
  orbit: createOrbitalElements({
    semiMajorAxisAU: 222000 / 149597870.7, // 222,000 km converted to AU
    eccentricity: 0.0175,
    inclinationDeg: 1.076,
    longitudeOfAscendingNodeDeg: 0,
    argumentOfPeriapsisDeg: 0,
    meanAnomalyDeg: 0,
    period_s: 58275,
    siderealRotationPeriod_s: 58275, // Synchronous rotation
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
