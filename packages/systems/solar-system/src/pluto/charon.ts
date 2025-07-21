import { createOrbitalElements, kmToM } from "@teskooano/core-physics";
import { AU, KM } from "@teskooano/core-physics/src/units/constants";
import {
  CelestialType,
  PlanetType,
  SurfaceType,
  CelestialStatus,
  type PlanetProperties,
  type CelestialObject,
} from "@teskooano/data-types";

/**
 * Charon configuration object for modular solar system initialization.
 */
export const charon: CelestialObject<PlanetProperties> = {
  id: "charon",
  name: "Charon",
  seed: "charon",
  type: CelestialType.MOON,
  status: CelestialStatus.ACTIVE,
  parentId: "pluto",
  realMass_kg: 1.5897e21,
  realRadius_m: kmToM(606),
  temperature: 53,
  albedo: 0.38,
  orbit: createOrbitalElements({
    semiMajorAxisAU: 0.00013098772, // 19595.764 km converted to AU
    eccentricity: 0.00001,
    inclinationDeg: 0.08,
    longitudeOfAscendingNodeDeg: 223.046,
    argumentOfPeriapsisDeg: 0,
    meanAnomalyDeg: 0,
    period_s: 6.3872 * 24 * 3600,
    siderealRotationPeriod_s: 6.3872 * 24 * 3600,
    axialTiltDeg: 119.591,
    epoch: "JD 2452600.5",
  }),
  properties: {
    type: CelestialType.MOON,
    classType: PlanetType.BARREN,
    isMoon: true,
    composition: ["water ice", "ammonia ice (hydrates)", "rocky interior"],
    surface: {
      roughness: 0.6,
      persistence: 0.52,
      lacunarity: 2.2,
      simplePeriod: 2.5,
      octaves: 9,
      bumpScale: 2.8,
      color1: "#8B4513",
      color2: "#A0A8B0",
      color3: "#B0B8C0",
      color4: "#D0D8E0",
      color5: "#F0F8FF",
      height1: 0.1,
      height2: 0.3,
      height3: 0.5,
      height4: 0.7,
      height5: 0.9,
      shininess: 18,
      specularStrength: 0.4,
      ambientLightIntensity: 0.0,
      undulation: 0.25,
      terrainType: 2,
      terrainAmplitude: 0.8,
      terrainSharpness: 1.5,
      terrainOffset: 0.0,
    },
  },
};
