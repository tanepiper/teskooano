import { createOrbitalElements, kmToM } from "@teskooano/core-physics";
import {
  type CelestialObject,
  CelestialStatus,
  CelestialType,
  type PlanetProperties,
  PlanetType,
} from "@teskooano/data-types";

/**
 * 2020 VN40 (LiDO) - First securely classified 10:1 resonator with Neptune
 * 
 * Discovery: Large inclination Distant Objects (LiDO) survey
 * Paper: "LiDO: Discovery of a 10:1 Resonator with a Novel Libration State"
 * DOI: 10.3847/PSJ/addd22
 * 
 * Key characteristics:
 * - First confirmed object in Neptune's 10:1 mean motion resonance
 * - Novel libration mode around 0° (in addition to standard 90°, 180°, 270° modes)
 * - High inclination (33.4°) characteristic of distant resonators
 * - Part of "scattering sticking" population
 * - Short-term stable but not stable on Gyr timescales
 * 
 * Orbital parameters (from paper):
 * - Semi-major axis: 139.95 ± 0.05 AU
 * - Eccentricity: 0.72661 ± 0.00009
 * - Inclination: 33.4070° ± 0.0001°
 * - Longitude of ascending node: 197.3069° ± 0.0002°
 * - Argument of perihelion: 262.892° ± 0.004°
 * - Mean anomaly: 355.225° ± 0.002°
 * - Perihelion distance: 38.26 AU
 * - Orbital period: ~1395 years
 * 
 * Physical characteristics:
 * - Absolute magnitude: H_gri = 8.32
 * - Apparent magnitude: m_gri = 24.7
 * - Estimated radius: ~50-100 km (based on typical TNO albedo)
 * - Category: Trans-Neptunian Object (TNO) in 10:1 resonance
 */
export const lido2020VN40: CelestialObject<PlanetProperties> = {
  id: "lido-2020-vn40",
  name: "2020 VN40 (LiDO)",
  seed: "lido-2020-vn40",
  type: CelestialType.DWARF_PLANET,
  status: CelestialStatus.ACTIVE,
  parentId: "sun",
  realMass_kg: (4 / 3) * Math.PI * Math.pow(kmToM(75), 3) * 1500, // Estimated mass
  realRadius_m: kmToM(75), // Estimated radius
  temperature: 25, // Very cold at ~140 AU
  albedo: 0.15, // Typical for TNOs
  orbit: createOrbitalElements({
    semiMajorAxisAU: 139.95,
    eccentricity: 0.72661,
    inclinationDeg: 33.4070,
    longitudeOfAscendingNodeDeg: 197.3069,
    argumentOfPeriapsisDeg: 262.892,
    meanAnomalyDeg: 355.225,
    period_s: 1395 * 365.25 * 24 * 3600, // ~1395 years
    siderealRotationPeriod_s: 24 * 3600, // Unknown, assumed 24 hours
    axialTiltDeg: 0, // Unknown
    epoch: "JD 2458900.5", // Epoch 31 May 2020 (from paper)
  }),
  properties: {
    type: CelestialType.DWARF_PLANET,
    classType: PlanetType.ROCKY,
    isMoon: false,
    composition: [
      "icy material",
      "primitive solar system material",
      "organic compounds",
      "tholins",
      "water ice",
      "methane ice",
    ],
    // Resonance properties
    resonance: {
      planetId: "neptune",
      ratio: { p: 10, q: 1 },
      librationMode: "zero_center", // Novel mode from LiDO discovery
      stabilityScore: 0.6, // Moderate stability
      isStable: true, // Short-term stable
      librationAmplitude: 120, // Degrees
    },
    surface: {
      roughness: 0.7,
      persistence: 0.5,
      lacunarity: 2.0,
      simplePeriod: 1.2,
      octaves: 6,
      bumpScale: 2.5,
      color1: "#2A2A2A", // Very dark, typical for distant TNOs
      color2: "#3A3A3A",
      color3: "#4A4A4A",
      color4: "#5A5A5A",
      color5: "#6A6A6A",
      height1: 0.1,
      height2: 0.3,
      height3: 0.5,
      height4: 0.7,
      height5: 0.9,
      shininess: 2,
      specularStrength: 0.01,
      ambientLightIntensity: 0.002,
      undulation: 0.3,
      terrainType: 1,
      terrainAmplitude: 0.8,
      terrainSharpness: 1.2,
      terrainOffset: 0.0,
    },
  },
};