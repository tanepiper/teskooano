import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";
import { actions } from "@teskooano/core-state";
import {
  CelestialType,
  PlanetType,
  SurfaceType,
  type PlanetProperties,
} from "@teskooano/data-types";

// Verified Wikipedia data for Phobos
const PHOBOS_MASS_KG = 1.072e16; // Wikipedia verified: 1.072×10¹⁶ kg
const PHOBOS_RADIUS_M = 11100; // Wikipedia verified: 11.1 km mean radius
const PHOBOS_SMA_M = 9377200; // Wikipedia verified: 9,377.2 km semi-major axis
const PHOBOS_ECC = 0.0151; // Wikipedia verified
const PHOBOS_INC_DEG = 1.093; // Wikipedia verified: 1.093° to Mars's equator
const PHOBOS_LAN_DEG = 169.2; // Current value
const PHOBOS_AOP_DEG = 216.3; // Current value
const PHOBOS_MA_DEG = 189.7; // Current value
const PHOBOS_SIDEREAL_PERIOD_S = 0.31891023 * 24 * 3600; // Wikipedia: 0.31891023 days
const PHOBOS_ALBEDO = 0.071; // Wikipedia verified
const PHOBOS_TEMP_K = 233; // Wikipedia verified: ~233 K

/**
 * Initializes Phobos using accurate Wikipedia data.
 */
export function initializePhobos(parentId: string): void {
  const phobosAxialTilt = new OSVector3(0, 1, 0);
  actions.addCelestial({
    id: "phobos",
    name: "Phobos",
    type: CelestialType.MOON,
    seed: "phobos_fear_mars_moon",
    parentId: parentId,
    realMass_kg: PHOBOS_MASS_KG,
    realRadius_m: PHOBOS_RADIUS_M,
    temperature: PHOBOS_TEMP_K,
    albedo: PHOBOS_ALBEDO,
    siderealRotationPeriod_s: PHOBOS_SIDEREAL_PERIOD_S,
    axialTilt: phobosAxialTilt,
    orbit: {
      realSemiMajorAxis_m: PHOBOS_SMA_M,
      eccentricity: PHOBOS_ECC,
      inclination: PHOBOS_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: PHOBOS_LAN_DEG * DEG_TO_RAD,
      argumentOfPeriapsis: PHOBOS_AOP_DEG * DEG_TO_RAD,
      meanAnomaly: PHOBOS_MA_DEG * DEG_TO_RAD,
      period_s: PHOBOS_SIDEREAL_PERIOD_S,
    },
    properties: {
      type: CelestialType.MOON,
      classType: PlanetType.ROCKY,
      isMoon: true,
      parentPlanet: parentId,
      composition: [
        "carbonaceous chondrite",
        "C-type rock",
        "meteoroid impact debris",
        "fine dust regolith",
      ],
      shapeModel: "asteroid",
      atmosphere: undefined,
      surface: {
        type: SurfaceType.CRATERED,
        classType: PlanetType.ROCKY,
        color: "#606060",
        roughness: 0.9,
        persistence: 0.4,
        lacunarity: 2.0,
        simplePeriod: 3.0,
        octaves: 5,
        bumpScale: 0.2,
        color1: "#404040",
        color2: "#505050",
        color3: "#606060",
        color4: "#707070",
        color5: "#808080",
        height1: 0.0,
        height2: 0.25,
        height3: 0.5,
        height4: 0.75,
        height5: 1.0,
        shininess: 0.01,
        specularStrength: 0.01,
        ambientLightIntensity: 0.02,
        undulation: 0.3,
        terrainType: 1,
        terrainAmplitude: 0.5,
        terrainSharpness: 0.8,
        terrainOffset: 0.0,
      },
    } as PlanetProperties,
  });
}
