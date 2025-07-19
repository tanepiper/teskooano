import { createOrbitalElements, kmToM } from "@teskooano/core-physics";
import {
  CelestialObject,
  CelestialType,
  PlanetType,
  CelestialStatus,
  type PlanetProperties,
} from "@teskooano/data-types";

const VESTA_MASS_KG = 2.59e20;
const VESTA_RADIUS_KM = 262.7;
const VESTA_TEMP_K = 150;
const VESTA_ALBEDO = 0.423;
const VESTA_SMA_AU = 2.36;
const VESTA_ECC = 0.089;
const VESTA_INC_DEG = 7.14;
const VESTA_LAN_DEG = 103.9;
const VESTA_AOP_DEG = 151.2;
const VESTA_MA_DEG = 20.8;
const VESTA_ORBITAL_PERIOD_S = 1.145e8;
const VESTA_SIDEREAL_ROTATION_PERIOD_S = 19200;
const VESTA_AXIAL_TILT_DEG = 29;

/**
 * Vesta asteroid configuration object for modular solar system initialization.
 */
export const vesta: CelestialObject<PlanetProperties> = {
  id: "vesta",
  name: "4 Vesta",
  seed: "vesta",
  type: CelestialType.DWARF_PLANET,
  status: CelestialStatus.ACTIVE,
  parentId: "sun", // Will be replaced during initialization
  realMass_kg: VESTA_MASS_KG,
  realRadius_m: kmToM(VESTA_RADIUS_KM),
  temperature: VESTA_TEMP_K,
  albedo: VESTA_ALBEDO,
  orbit: createOrbitalElements({
    semiMajorAxisAU: VESTA_SMA_AU,
    eccentricity: VESTA_ECC,
    inclinationDeg: VESTA_INC_DEG,
    longitudeOfAscendingNodeDeg: VESTA_LAN_DEG,
    argumentOfPeriapsisDeg: VESTA_AOP_DEG,
    meanAnomalyDeg: VESTA_MA_DEG,
    period_s: VESTA_ORBITAL_PERIOD_S,
    siderealRotationPeriod_s: VESTA_SIDEREAL_ROTATION_PERIOD_S,
    axialTiltDeg: VESTA_AXIAL_TILT_DEG,
  }),
  properties: {
    type: CelestialType.DWARF_PLANET,
    classType: PlanetType.ROCKY,
    isMoon: false,
    composition: [
      "basaltic rock",
      "pyroxene",
      "olivine",
      "differentiated interior",
    ],
    surface: {
      roughness: 0.7,
      persistence: 0.55,
      lacunarity: 2.0,
      simplePeriod: 2.2,
      octaves: 7,
      bumpScale: 2.0,
      color1: "#654321",
      color2: "#8B7355",
      color3: "#A0522D",
      color4: "#CD853F",
      color5: "#DEB887",
      height1: 0.1,
      height2: 0.3,
      height3: 0.5,
      height4: 0.7,
      height5: 0.9,
      shininess: 8,
      specularStrength: 0.15,
      ambientLightIntensity: 0.01,
      undulation: 0.4,
      terrainType: 2,
      terrainAmplitude: 0.8,
      terrainSharpness: 1.2,
      terrainOffset: 0.0,
    },
  },
};
