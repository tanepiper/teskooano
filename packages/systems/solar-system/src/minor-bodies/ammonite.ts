import { createOrbitalElements, kmToM } from "@teskooano/core-physics";
import {
  CelestialType,
  PlanetType,
  CelestialStatus,
  type PlanetProperties,
  CelestialObject,
} from "@teskooano/data-types";

// Physical constants for 2023 KQ14 (Ammonite)
const AMMONITE_ESTIMATED_DIAMETER_KM = 300; // Mid-range estimate (220-380 km)
const AMMONITE_ESTIMATED_DENSITY_KG_M3 = 1850; // kg/m³ (similar to Pluto)
const AMMONITE_ALBEDO = 0.1; // Estimated based on typical TNO albedos
const AMMONITE_ABSOLUTE_MAGNITUDE = 6.77;

// Orbital parameters from JPL Small-Body Database (epoch 2025-05-05)
const AMMONITE_SMA_AU = 252.0;
const AMMONITE_ECC = 0.7385;
const AMMONITE_INC_DEG = 10.98;
const AMMONITE_LAN_DEG = 72.1;
const AMMONITE_AOP_DEG = 198.74;
const AMMONITE_MA_DEG = 356.56;
const AMMONITE_ORBITAL_PERIOD_S = 3998 * 365.25 * 24 * 3600; // 3,998 years in seconds
const AMMONITE_SIDEREAL_ROTATION_PERIOD_S = 24 * 3600; // Unknown, assume 24 hours

/**
 * 2023 KQ14 (Ammonite) - A recently discovered sednoid
 *
 * Discovered by the Subaru Telescope on 16 May 2023 as part of the FOSSIL survey.
 * This object has an extremely wide elliptical orbit with a 3,998-year period.
 *
 * Orbital data from JPL Small-Body Database (epoch 2025-05-05):
 * - Aphelion: 438.1 AU
 * - Perihelion: 65.9 AU
 * - Semi-major axis: 252.0 AU
 * - Eccentricity: 0.7385
 * - Inclination: 10.98°
 * - Orbital period: 3,998 years
 * - Next perihelion: ≈ February 2063
 *
 * Physical characteristics:
 * - Diameter: 220-380 km (estimated)
 * - Absolute magnitude: 6.77±0.43
 * - Category: Sednoid (extreme trans-Neptunian object)
 */
export const ammonite: CelestialObject<PlanetProperties> = {
  id: "ammonite-2023-kq14",
  name: "2023 KQ14",
  seed: "ammonite",
  type: CelestialType.DWARF_PLANET,
  status: CelestialStatus.ACTIVE,
  parentId: "sun", // Will be replaced during initialization
  realMass_kg:
    (4 / 3) *
    Math.PI *
    Math.pow(kmToM(AMMONITE_ESTIMATED_DIAMETER_KM / 2), 3) *
    AMMONITE_ESTIMATED_DENSITY_KG_M3,
  realRadius_m: kmToM(AMMONITE_ESTIMATED_DIAMETER_KM / 2),
  temperature: 30, // Very cold at this distance
  albedo: AMMONITE_ALBEDO,
  orbit: createOrbitalElements({
    semiMajorAxisAU: AMMONITE_SMA_AU,
    eccentricity: AMMONITE_ECC,
    inclinationDeg: AMMONITE_INC_DEG,
    longitudeOfAscendingNodeDeg: AMMONITE_LAN_DEG,
    argumentOfPeriapsisDeg: AMMONITE_AOP_DEG,
    meanAnomalyDeg: AMMONITE_MA_DEG,
    period_s: AMMONITE_ORBITAL_PERIOD_S,
    siderealRotationPeriod_s: AMMONITE_SIDEREAL_ROTATION_PERIOD_S,
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
      roughness: 0.7,
      persistence: 0.5,
      lacunarity: 2.0,
      simplePeriod: 3.0,
      octaves: 6,
      bumpScale: 2.0,
      color1: "#2F2F2F",
      color2: "#404040",
      color3: "#505050",
      color4: "#606060",
      color5: "#707070",
      height1: 0.1,
      height2: 0.3,
      height3: 0.5,
      height4: 0.7,
      height5: 0.9,
      shininess: 4,
      specularStrength: 0.05,
      ambientLightIntensity: 0.005,
      undulation: 0.3,
      terrainType: 1,
      terrainAmplitude: 0.8,
      terrainSharpness: 1.2,
      terrainOffset: 0.0,
    },
  },
};
