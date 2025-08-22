import {
  createOrbitalElements,
  J2000_EPOCH,
  kmToM,
} from "@teskooano/core-physics";
import {
  CelestialStatus,
  CelestialType,
  PlanetType,
  type CelestialObject,
  type PlanetProperties,
} from "@teskooano/data-types";

/**
 * Luna (Moon) configuration object for modular solar system initialization.
 * Uses J2000 epoch orbital elements and physical properties.
 */
export const moon: CelestialObject<PlanetProperties> = {
  id: "moon",
  name: "Moon",
  type: CelestialType.MOON,
  status: CelestialStatus.ACTIVE,
  seed: "moon",
  parentId: "earth",
  realMass_kg: 7.346e22,
  realRadius_m: kmToM(1737.4),
  temperature: 250,
  albedo: 0.136,
  orbit: createOrbitalElements({
    semiMajorAxisAU: 0.002569,
    eccentricity: 0.0549,
    inclinationDeg: 5.145,
    longitudeOfAscendingNodeDeg: 125.08,
    argumentOfPeriapsisDeg: 318.15,
    meanAnomalyDeg: 115.36,
    period_s: 2.36059e6,
    siderealRotationPeriod_s: 2.36059e6,
    axialTiltDeg: 6.687,
    epoch: J2000_EPOCH,
  }),
  properties: {
    type: CelestialType.MOON,
    isMoon: true,
    classType: PlanetType.ROCKY,
    composition: ["silicates", "anorthosite crust", "possible small core"],
    surface: {
      roughness: 0.75,
      persistence: 0.5,
      lacunarity: 2.1,
      simplePeriod: 6.0,
      octaves: 7,
      bumpScale: 0.15,
      color1: "#808080",
      color2: "#A9A9A9",
      color3: "#BEBEBE",
      color4: "#D3D3D3",
      color5: "#E0E0E0",
      height1: 0.0,
      height2: 0.3,
      height3: 0.55,
      height4: 0.75,
      height5: 1.0,
      shininess: 2,
      specularStrength: 0.01,
      ambientLightIntensity: 0.01,
      undulation: 0.1,
      terrainType: 3,
      terrainAmplitude: 0.35,
      terrainSharpness: 0.7,
      terrainOffset: 0.0,
    },
  },
};
