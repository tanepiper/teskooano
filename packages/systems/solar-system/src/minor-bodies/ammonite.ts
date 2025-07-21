import { createOrbitalElements, kmToM } from "@teskooano/core-physics";
import {
  CelestialType,
  CelestialStatus,
  PlanetType,
  type PlanetProperties,
  type CelestialObject,
} from "@teskooano/data-types";

// Orbital parameters from JPL Small-Body Database (epoch 2025-05-05)

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
  parentId: "sun",
  realMass_kg: (4 / 3) * Math.PI * Math.pow(kmToM(150), 3) * 1850,
  realRadius_m: kmToM(150),
  temperature: 30,
  albedo: 0.1,
  orbit: createOrbitalElements({
    semiMajorAxisAU: 252.0,
    eccentricity: 0.7385,
    inclinationDeg: 10.98,
    longitudeOfAscendingNodeDeg: 72.1,
    argumentOfPeriapsisDeg: 198.74,
    meanAnomalyDeg: 356.56,
    period_s: 3998 * 365.25 * 24 * 3600,
    siderealRotationPeriod_s: 24 * 3600,
    axialTiltDeg: 0,
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
