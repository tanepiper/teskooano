import { createOrbitalElements, kmToM } from "@teskooano/core-physics";
import {
  type CelestialObject,
  CelestialType,
  PlanetType,
  RockyType,
  CelestialStatus,
  type PlanetProperties,
  type RingProperties,
  type RingSystemConfiguration,
} from "@teskooano/data-types";

/**
 * Haumea dwarf planet configuration object for modular solar system initialization.
 *
 * Features enhanced ring system with axial inclination controls:
 * - 126.0° axial tilt (2.199 radians) - extreme tilt, nearly upside down
 * - Ring inherits Haumea's extreme axial tilt for unique seasonal effects
 * - Very slow precession for stability
 * - Single ice ring discovered in 2017
 */
export const haumea: CelestialObject<PlanetProperties> = {
  id: "haumea",
  name: "Haumea",
  seed: "haumea",
  type: CelestialType.DWARF_PLANET,
  status: CelestialStatus.ACTIVE,
  parentId: "sun",
  realMass_kg: 4.006e21,
  realRadius_m: kmToM(816),
  temperature: 50,
  albedo: 0.66,
  orbit: createOrbitalElements({
    semiMajorAxisAU: 43.116,
    eccentricity: 0.19642,
    inclinationDeg: 28.2137,
    longitudeOfAscendingNodeDeg: 122.167,
    argumentOfPeriapsisDeg: 239.041,
    meanAnomalyDeg: 218.205,
    period_s: 283.12 * 365.25 * 24 * 3600,
    siderealRotationPeriod_s: 3.915341 * 3600,
    axialTiltDeg: 126.0,
    epoch: "JD 2459200.5",
  }),
  properties: {
    type: CelestialType.DWARF_PLANET,
    classType: PlanetType.BARREN,
    isMoon: false,
    composition: [
      "water ice",
      "crystalline water ice",
      "rocky core",
      "olivine",
      "pyroxene",
      "organic compounds",
    ],
    shapeModel: "triaxial",
    // Enhanced ring system configuration with axial inclination controls
    ringSystem: {
      rings: [
        {
          innerRadius: kmToM(2287),
          outerRadius: kmToM(2322),
          density: 0.5,
          opacity: 0.5,
          color: "#C0C0C0",
          type: RockyType.ICE,
          texture: "textures/ring_haumea.png",
          rotationRate: 0.001,
          composition: ["ice particles"],
          inheritParentTilt: true, // Inherit Haumea's extreme 126.0° axial tilt
        } as RingProperties,
      ],
      // Haumea's extreme axial inclination: 126.0° = 2.199 radians
      systemAxialInclination: 2.199,
      // Ring inherits Haumea's extreme axial tilt
      inheritParentTilt: true,
      // Very slow precession (Haumea's ring is quite stable)
      precessionRate: 0.00001,
      // Render as a unified system
      unifiedRendering: true,
    } as RingSystemConfiguration,

    // Legacy rings property for backward compatibility
    rings: [
      {
        innerRadius: kmToM(2287),
        outerRadius: kmToM(2322),
        density: 0.5,
        opacity: 0.5,
        color: "#C0C0C0",
        type: RockyType.ICE,
        texture: "textures/ring_haumea.png",
        rotationRate: 0.001,
        composition: ["ice particles"],
      } as RingProperties,
    ],
    atmosphere: undefined,
    surface: {
      roughness: 0.15,
      persistence: 0.35,
      lacunarity: 1.9,
      simplePeriod: 1.1,
      octaves: 5,
      bumpScale: 0.7,
      color1: "#E8F0FF",
      color2: "#F0F4FF",
      color3: "#F8F8FF",
      color4: "#FCFCFF",
      color5: "#FFFFFF",
      height1: 0.15,
      height2: 0.3,
      height3: 0.5,
      height4: 0.7,
      height5: 0.9,
      shininess: 80,
      specularStrength: 0.6,
      ambientLightIntensity: 0.015,
      undulation: 0.08,
      terrainType: 1,
      terrainAmplitude: 0.12,
      terrainSharpness: 0.5,
      terrainOffset: 0.05,
    },
  },
};

/**
 * Hi'iaka moon configuration object for modular solar system initialization.
 */
export const hiiaka: CelestialObject<PlanetProperties> = {
  id: "hiiaka",
  name: "Hi'iaka",
  seed: "hiiaka",
  type: CelestialType.MOON,
  status: CelestialStatus.ACTIVE,
  parentId: "haumea",
  realMass_kg: 1.79e19,
  realRadius_m: kmToM(155),
  temperature: 32,
  albedo: 0.08,
  orbit: createOrbitalElements({
    semiMajorAxisAU: 0.00033,
    eccentricity: 0.0513,
    inclinationDeg: 126.356,
    longitudeOfAscendingNodeDeg: 205.0,
    argumentOfPeriapsisDeg: 130.0,
    meanAnomalyDeg: 280.0,
    period_s: 49.12 * 24 * 3600,
    siderealRotationPeriod_s: 49.12 * 24 * 3600,
    axialTiltDeg: 0,
  }),
  properties: {
    type: CelestialType.MOON,
    classType: PlanetType.BARREN,
    isMoon: true,
    composition: [
      "water ice",
      "crystalline water ice",
      "rocky material",
      "phyllosilicates",
    ],
    shapeModel: "asteroid",
    atmosphere: undefined,
    surface: {
      roughness: 0.9,
      persistence: 0.55,
      lacunarity: 2.2,
      simplePeriod: 3.8,
      octaves: 8,
      bumpScale: 3.2,
      color1: "#303030",
      color2: "#353535",
      color3: "#404040",
      color4: "#454545",
      color5: "#505050",
      height1: 0.0,
      height2: 0.25,
      height3: 0.5,
      height4: 0.75,
      height5: 1.0,
      shininess: 2,
      specularStrength: 0.08,
      ambientLightIntensity: 0.01,
      undulation: 0.45,
      terrainType: 1,
      terrainAmplitude: 0.9,
      terrainSharpness: 1.6,
      terrainOffset: 0.0,
    },
  },
};

/**
 * Namaka moon configuration object for modular solar system initialization.
 */
export const namaka: CelestialObject<PlanetProperties> = {
  id: "namaka",
  name: "Namaka",
  seed: "namaka",
  type: CelestialType.MOON,
  status: CelestialStatus.ACTIVE,
  parentId: "haumea",
  realMass_kg: 1.79e18,
  realRadius_m: kmToM(85),
  temperature: 32,
  albedo: 0.06,
  orbit: createOrbitalElements({
    semiMajorAxisAU: 0.00017,
    eccentricity: 0.249,
    inclinationDeg: 113.0,
    longitudeOfAscendingNodeDeg: 187.0,
    argumentOfPeriapsisDeg: 310.0,
    meanAnomalyDeg: 140.0,
    period_s: 18.28 * 24 * 3600,
    siderealRotationPeriod_s: 18.28 * 24 * 3600,
    axialTiltDeg: 0,
  }),
  properties: {
    type: CelestialType.MOON,
    classType: PlanetType.BARREN,
    isMoon: true,
    composition: ["water ice", "rocky material", "organic compounds"],
    shapeModel: "asteroid",
    atmosphere: {
      glowColor: "#000000",
      intensity: 0,
      power: 0,
      thickness: 0,
    },
    surface: {
      roughness: 0.95,
      persistence: 0.58,
      lacunarity: 2.4,
      simplePeriod: 4.2,
      octaves: 9,
      bumpScale: 3.8,
      color1: "#282828",
      color2: "#2D2D2D",
      color3: "#383838",
      color4: "#3D3D3D",
      color5: "#484848",
      height1: 0.0,
      height2: 0.2,
      height3: 0.4,
      height4: 0.6,
      height5: 0.8,
      shininess: 1,
      specularStrength: 0.06,
      ambientLightIntensity: 0.01,
      undulation: 0.5,
      terrainType: 1,
      terrainAmplitude: 1.1,
      terrainSharpness: 1.8,
      terrainOffset: 0.0,
    },
  },
};
