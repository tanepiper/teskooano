import { createOrbitalElements, kmToM } from "@teskooano/core-physics";
import {
  CelestialType,
  PlanetType,
  CelestialStatus,
  type PlanetProperties,
  CelestialObject,
} from "@teskooano/data-types";

// Physical constants for 2012 VP113 (Biden)
const VP113_DIAMETER_KM = 450; // Calculated diameter for albedo 0.15
const VP113_RADIUS_KM = VP113_DIAMETER_KM / 2;
const VP113_ALBEDO = 0.15; // Assumed geometric albedo for size calculation
const VP113_ABSOLUTE_MAGNITUDE = 4.05;
const VP113_ESTIMATED_DENSITY_KG_M3 = 1850; // kg/m³ (similar to other TNOs)

// Orbital parameters from JPL Small-Body Database (epoch 2025-05-05)
const VP113_SMA_AU = 262.3;
const VP113_ECC = 0.6931;
const VP113_INC_DEG = 24.0563;
const VP113_LAN_DEG = 90.8;
const VP113_AOP_DEG = 293.9;
const VP113_MA_DEG = 24.05;
const VP113_ORBITAL_PERIOD_S = 4246 * 365.25 * 24 * 3600; // 4,246 years in seconds
const VP113_SIDEREAL_ROTATION_PERIOD_S = 24 * 3600; // Unknown, assume 24 hours

/**
 * 2012 VP113 (Biden) - A sednoid with moderate orbital characteristics
 *
 * Discovered on 5 November 2012 by Scott S. Sheppard and Chadwick A. Trujillo
 * using the Cerro Tololo Inter-American Observatory. This object was one of the
 * first sednoids discovered after Sedna itself.
 *
 * Orbital data from JPL Small-Body Database (epoch 2025-05-05):
 * - Aphelion: 444.1 AU
 * - Perihelion: 80.52 AU
 * - Semi-major axis: 262.3 AU
 * - Eccentricity: 0.6931
 * - Inclination: 24.0563°
 * - Orbital period: 4,246 years
 * - Last perihelion: ≈ September 1979
 *
 * Physical characteristics:
 * - Diameter: ~450 km (calculated for albedo 0.15)
 * - Geometric albedo: ~0.15 (assumed for size calculation)
 * - Absolute magnitude: 4.05
 * - Spectral type: Moderately red (B−R = 1.44±0.05)
 * - Category: Sednoid (extreme trans-Neptunian object)
 *
 * The object was nicknamed "Biden" after Joe Biden, who was Vice President
 * at the time of discovery. The name was chosen because "VP" in the provisional
 * designation 2012 VP113 stands for "Vice President".
 */
export const vp113: CelestialObject<PlanetProperties> = {
  id: "vp113-2012",
  name: "2012 VP113",
  seed: "vp113-biden",
  type: CelestialType.DWARF_PLANET,
  status: CelestialStatus.ACTIVE,
  parentId: "sun", // Will be replaced during initialization
  realMass_kg:
    (4 / 3) *
    Math.PI *
    Math.pow(kmToM(VP113_RADIUS_KM), 3) *
    VP113_ESTIMATED_DENSITY_KG_M3,
  realRadius_m: kmToM(VP113_RADIUS_KM),
  temperature: 30, // Very cold at this distance
  albedo: VP113_ALBEDO,
  orbit: createOrbitalElements({
    semiMajorAxisAU: VP113_SMA_AU,
    eccentricity: VP113_ECC,
    inclinationDeg: VP113_INC_DEG,
    longitudeOfAscendingNodeDeg: VP113_LAN_DEG,
    argumentOfPeriapsisDeg: VP113_AOP_DEG,
    meanAnomalyDeg: VP113_MA_DEG,
    period_s: VP113_ORBITAL_PERIOD_S,
    siderealRotationPeriod_s: VP113_SIDEREAL_ROTATION_PERIOD_S,
    axialTiltDeg: 0, // Unknown, assume 0
  }),
  properties: {
    type: CelestialType.DWARF_PLANET,
    classType: PlanetType.ROCKY,
    isMoon: false,
    composition: [
      "icy material",
      "primitive solar system material",
      "organic compounds",
      "sednoid composition",
      "moderately red surface material",
    ],
    surface: {
      roughness: 0.7,
      persistence: 0.5,
      lacunarity: 2.0,
      simplePeriod: 3.0,
      octaves: 6,
      bumpScale: 2.0,
      color1: "#4A2A1A", // Reddish brown tones
      color2: "#5A3A2A",
      color3: "#6A4A3A",
      color4: "#7A5A4A",
      color5: "#8A6A5A",
      height1: 0.1,
      height2: 0.3,
      height3: 0.5,
      height4: 0.7,
      height5: 0.9,
      shininess: 2,
      specularStrength: 0.02,
      ambientLightIntensity: 0.002,
      undulation: 0.3,
      terrainType: 1,
      terrainAmplitude: 0.7,
      terrainSharpness: 1.2,
      terrainOffset: 0.0,
    },
  },
};
