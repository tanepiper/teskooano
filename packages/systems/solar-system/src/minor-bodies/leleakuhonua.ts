import { createOrbitalElements, kmToM } from "@teskooano/core-physics";
import {
  CelestialType,
  PlanetType,
  CelestialStatus,
  type PlanetProperties,
  CelestialObject,
} from "@teskooano/data-types";

// Physical constants for 541132 Leleākūhonua (The Goblin)
const LELEAKUHONUA_RADIUS_KM = 110; // Mean radius from occultation measurements
const LELEAKUHONUA_ALBEDO = 0.21; // Geometric albedo from occultation measurements
const LELEAKUHONUA_ABSOLUTE_MAGNITUDE = 5.57;
const LELEAKUHONUA_ESTIMATED_DENSITY_KG_M3 = 1850; // kg/m³ (similar to other TNOs)

// Orbital parameters from JPL Small-Body Database (epoch 2023-02-25)
const LELEAKUHONUA_SMA_AU = 1090;
const LELEAKUHONUA_ECC = 0.94039;
const LELEAKUHONUA_INC_DEG = 11.671;
const LELEAKUHONUA_LAN_DEG = 300.995;
const LELEAKUHONUA_AOP_DEG = 117.974;
const LELEAKUHONUA_MA_DEG = 359.445;
const LELEAKUHONUA_ORBITAL_PERIOD_S = 35950 * 365.25 * 24 * 3600; // 35,950 years in seconds
const LELEAKUHONUA_SIDEREAL_ROTATION_PERIOD_S = 24 * 3600; // Unknown, assume 24 hours

/**
 * 541132 Leleākūhonua (The Goblin) - A sednoid with extremely wide orbit
 *
 * Discovered on 13 October 2015 by D. J. Tholen, C. Trujillo, and S. S. Sheppard
 * using the Subaru Telescope at Mauna Kea Observatory. This object has one of the
 * most extreme orbits known in the Solar System.
 *
 * Orbital data from JPL Small-Body Database (epoch 2023-02-25):
 * - Aphelion: 2,114 AU (one of the most distant known objects!)
 * - Perihelion: 64.95 AU
 * - Semi-major axis: 1,090 AU
 * - Eccentricity: 0.94039 (extremely elliptical)
 * - Inclination: 11.671°
 * - Orbital period: 35,950 years
 * - Next perihelion: ≈ 11 June 2078
 *
 * Physical characteristics:
 * - Radius: 110 km (from stellar occultation measurements)
 * - Geometric albedo: 0.21 (relatively bright for a TNO)
 * - Absolute magnitude: 5.57±0.13
 * - Category: Sednoid (extreme trans-Neptunian object)
 *
 * The name "Leleākūhonua" means "a leaping brown spider" in Hawaiian,
 * and it's also known as "The Goblin" due to its discovery near Halloween.
 */
export const leleakuhonua: CelestialObject<PlanetProperties> = {
  id: "leleakuhonua-541132",
  name: "541132 Leleākūhonua",
  seed: "leleakuhonua",
  type: CelestialType.DWARF_PLANET,
  status: CelestialStatus.ACTIVE,
  parentId: "sun", // Will be replaced during initialization
  realMass_kg:
    (4 / 3) *
    Math.PI *
    Math.pow(kmToM(LELEAKUHONUA_RADIUS_KM), 3) *
    LELEAKUHONUA_ESTIMATED_DENSITY_KG_M3,
  realRadius_m: kmToM(LELEAKUHONUA_RADIUS_KM),
  temperature: 25, // Very cold at this distance
  albedo: LELEAKUHONUA_ALBEDO,
  orbit: createOrbitalElements({
    semiMajorAxisAU: LELEAKUHONUA_SMA_AU,
    eccentricity: LELEAKUHONUA_ECC,
    inclinationDeg: LELEAKUHONUA_INC_DEG,
    longitudeOfAscendingNodeDeg: LELEAKUHONUA_LAN_DEG,
    argumentOfPeriapsisDeg: LELEAKUHONUA_AOP_DEG,
    meanAnomalyDeg: LELEAKUHONUA_MA_DEG,
    period_s: LELEAKUHONUA_ORBITAL_PERIOD_S,
    siderealRotationPeriod_s: LELEAKUHONUA_SIDEREAL_ROTATION_PERIOD_S,
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
    ],
    surface: {
      roughness: 0.6,
      persistence: 0.4,
      lacunarity: 1.8,
      simplePeriod: 2.5,
      octaves: 5,
      bumpScale: 1.8,
      color1: "#3A3A3A",
      color2: "#4A4A4A",
      color3: "#5A5A5A",
      color4: "#6A6A6A",
      color5: "#7A7A7A",
      height1: 0.1,
      height2: 0.3,
      height3: 0.5,
      height4: 0.7,
      height5: 0.9,
      shininess: 3,
      specularStrength: 0.03,
      ambientLightIntensity: 0.003,
      undulation: 0.2,
      terrainType: 1,
      terrainAmplitude: 0.6,
      terrainSharpness: 1.0,
      terrainOffset: 0.0,
    },
  },
};
