import { createOrbitalElements, kmToM } from "@teskooano/core-physics";
import {
  type CelestialObject,
  CelestialType,
  PlanetType,
  CelestialStatus,
  type PlanetProperties,
} from "@teskooano/data-types";

/**
 * Sedna dwarf planet configuration object for modular solar system initialization.
 */
export const sedna: CelestialObject<PlanetProperties> = {
  id: "sedna",
  name: "90377 Sedna",
  seed: "sedna",
  type: CelestialType.DWARF_PLANET,
  status: CelestialStatus.ACTIVE,
  parentId: "sun", // Or system barycenter, depending on context
  realMass_kg: 1.0e21,
  realRadius_m: kmToM(468),
  temperature: 12,
  albedo: 0.41,
  orbit: createOrbitalElements({
    semiMajorAxisAU: 506,
    eccentricity: 0.8496,
    inclinationDeg: 11.9307,
    longitudeOfAscendingNodeDeg: 144.248,
    argumentOfPeriapsisDeg: 311.352,
    meanAnomalyDeg: 358.117,
    period_s: 11390 * 365.25 * 24 * 60 * 60,
    siderealRotationPeriod_s: 10.273 * 60 * 60,
    axialTiltDeg: 0,
    epoch: "JD 2458900.5", // Epoch 31 May 2020
  }),
  properties: {
    type: CelestialType.DWARF_PLANET,
    classType: PlanetType.ROCKY,
    isMoon: false,
    composition: ["silicates", "tholins", "water ice", "methane ice"],
    surface: {
      roughness: 0.8,
      persistence: 0.6,
      lacunarity: 2.2,
      simplePeriod: 0.8,
      octaves: 8,
      bumpScale: 3.0,
      color1: "#5C0000",
      color2: "#7D0000",
      color3: "#A00000",
      color4: "#C30000",
      color5: "#E60000",
      height1: 0.1,
      height2: 0.3,
      height3: 0.5,
      height4: 0.7,
      height5: 0.9,
      shininess: 2,
      specularStrength: 0.05,
      ambientLightIntensity: 0.005,
      undulation: 0.2,
      terrainType: 2,
      terrainAmplitude: 0.9,
      terrainSharpness: 1.5,
      terrainOffset: 0.0,
    },
  },
};
