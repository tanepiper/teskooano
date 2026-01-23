import { createOrbitalElements, kmToM } from "@teskooano/core-physics";
import {
  type CelestialObject,
  CelestialStatus,
  CelestialType,
  PlanetProperties,
  PlanetType,
} from "@teskooano/data-types";
import { J2000_EPOCH } from "@teskooano/data-values";

/**
 * Mercury configuration object for modular solar system initialization.
 */
export const mercury: CelestialObject<PlanetProperties> = {
  id: "mercury",
  name: "Mercury",
  seed: "mercury",
  type: CelestialType.PLANET,
  status: CelestialStatus.ACTIVE,
  parentId: "sun",
  realMass_kg: 3.3011e23,
  realRadius_m: kmToM(2439.7),
  temperature: 437,
  albedo: 0.088,
  orbit: createOrbitalElements({
    semiMajorAxisAU: 0.387098,
    eccentricity: 0.20563,
    inclinationDeg: 7.005,
    longitudeOfAscendingNodeDeg: 48.331,
    argumentOfPeriapsisDeg: 29.124,
    meanAnomalyDeg: 174.796,
    period_s: 7.60052e6,
    siderealRotationPeriod_s: 5.067e6,
    axialTiltDeg: 0.034,
    epoch: J2000_EPOCH,
  }),
  properties: {
    type: CelestialType.PLANET,
    classType: PlanetType.ROCKY,
    isMoon: false,
    composition: ["silicates", "iron core", "thin exosphere", "no atmosphere"],
    surface: {
      roughness: 0.95,
      persistence: 0.6,
      lacunarity: 2.0,
      simplePeriod: 2.5,
      octaves: 8,
      bumpScale: 3.5,
      color1: "#9F9C99",
      color2: "#B6B5B4",
      color3: "#F7F3F3",
      color4: "#979695",
      color5: "#D3D3D3",
      height1: 0.1,
      height2: 0.3,
      height3: 0.5,
      height4: 0.7,
      height5: 0.9,
      shininess: 5,
      specularStrength: 0.05,
      ambientLightIntensity: 0.01,
      undulation: 0.4,
      terrainType: 2,
      terrainAmplitude: 0.9,
      terrainSharpness: 1.3,
      terrainOffset: 0.0,
    },
  },
};
