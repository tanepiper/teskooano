import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";
import { AU, KM } from "@teskooano/core-physics";
import {
  CelestialType,
  PlanetType,
  SurfaceType,
  CelestialStatus,
  type PlanetProperties,
} from "@teskooano/data-types";

const PALLAS_MASS_KG = 2.11e20;
const PALLAS_RADIUS_M = 256 * KM;
const PALLAS_TEMP_K = 160;
const PALLAS_ALBEDO = 0.155;
const PALLAS_SMA_AU = 2.77;
const PALLAS_ECC = 0.231;
const PALLAS_INC_DEG = 34.84;
const PALLAS_LAN_DEG = 173.1;
const PALLAS_AOP_DEG = 310.3;
const PALLAS_MA_DEG = 113.7;
const PALLAS_ORBITAL_PERIOD_S = 1.681e8;
const PALLAS_SIDEREAL_ROTATION_PERIOD_S = 28080;
const PALLAS_AXIAL_TILT_DEG = 84;

/**
 * Pallas asteroid configuration object for modular solar system initialization.
 */
export const pallas = {
  id: "pallas",
  name: "2 Pallas",
  seed: "pallas",
  type: CelestialType.DWARF_PLANET,
  status: CelestialStatus.ACTIVE,
  parentId: "sun", // Will be replaced during initialization
  realMass_kg: PALLAS_MASS_KG,
  realRadius_m: PALLAS_RADIUS_M,
  temperature: PALLAS_TEMP_K,
  albedo: PALLAS_ALBEDO,
  orbit: {
    realSemiMajorAxis_m: PALLAS_SMA_AU * AU,
    eccentricity: PALLAS_ECC,
    inclination: PALLAS_INC_DEG * DEG_TO_RAD,
    longitudeOfAscendingNode: PALLAS_LAN_DEG * DEG_TO_RAD,
    argumentOfPeriapsis: PALLAS_AOP_DEG * DEG_TO_RAD,
    meanAnomaly: PALLAS_MA_DEG * DEG_TO_RAD,
    period_s: PALLAS_ORBITAL_PERIOD_S,
    siderealRotationPeriod_s: PALLAS_SIDEREAL_ROTATION_PERIOD_S,
    axialTilt: new OSVector3(
      0,
      Math.cos(PALLAS_AXIAL_TILT_DEG * DEG_TO_RAD),
      Math.sin(PALLAS_AXIAL_TILT_DEG * DEG_TO_RAD),
    ).normalize(),
  },
  properties: {
    type: CelestialType.DWARF_PLANET,
    classType: PlanetType.ROCKY,
    isMoon: false,
    composition: [
      "carbonaceous chondrite",
      "B-type asteroid material",
      "primitive material",
      "organic compounds",
    ],
    surface: {
      type: SurfaceType.CRATERED,
      color: "#696969",
      roughness: 0.8,
      classType: PlanetType.ROCKY,
      persistence: 0.6,
      lacunarity: 2.2,
      simplePeriod: 2.8,
      octaves: 8,
      bumpScale: 2.5,
      color1: "#404040",
      color2: "#505050",
      color3: "#696969",
      color4: "#808080",
      color5: "#A0A0A0",
      height1: 0.1,
      height2: 0.3,
      height3: 0.5,
      height4: 0.7,
      height5: 0.9,
      shininess: 6,
      specularStrength: 0.1,
      ambientLightIntensity: 0.01,
      undulation: 0.5,
      terrainType: 1,
      terrainAmplitude: 1.0,
      terrainSharpness: 1.5,
      terrainOffset: 0.0,
    },
  } as PlanetProperties,
};

/**
 * Legacy function for backward compatibility.
 * @deprecated Use the pallas configuration object instead.
 */
export function initializePallas(parentId: string): void {
  const pallasConfig = { ...pallas, parentId };
  // Note: This would need celestialManager import if we want to keep the function working
  // For now, just export the config object
}
