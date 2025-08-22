import { createOrbitalElements, kmToM } from "@teskooano/core-physics";
import {
  CelestialStatus,
  CelestialType,
  PlanetType,
  type CelestialObject,
  type PlanetProperties,
} from "@teskooano/data-types";

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
  parentId: "sun",
  realMass_kg: (4 / 3) * Math.PI * Math.pow(kmToM(110), 3) * 1850,
  realRadius_m: kmToM(110),
  temperature: 25,
  albedo: 0.21,
  orbit: createOrbitalElements({
    semiMajorAxisAU: 1090,
    eccentricity: 0.94039,
    inclinationDeg: 11.671,
    longitudeOfAscendingNodeDeg: 300.995,
    argumentOfPeriapsisDeg: 117.974,
    meanAnomalyDeg: 359.445,
    period_s: 35950 * 365.25 * 24 * 3600,
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
