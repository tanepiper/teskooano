import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";
import { AU } from "@teskooano/core-physics";
import { actions } from "@teskooano/core-state";
import {
  CelestialType,
  PlanetType,
  SurfaceType,
  type PlanetProperties,
} from "@teskooano/data-types";

const ERIS_MASS_KG = 1.66e22;
const ERIS_RADIUS_M = 1163000;
const ERIS_TEMP_K = 30;
const ERIS_ALBEDO = 0.96;
const ERIS_SMA_AU = 67.668;
const ERIS_ECC = 0.44177;
const ERIS_INC_DEG = 44.187;
const ERIS_LAN_DEG = 35.875;
const ERIS_AOP_DEG = 151.431;
const ERIS_MA_DEG = 197.634;
const ERIS_ORBITAL_PERIOD_S = 2.045e10;
const ERIS_SIDEREAL_ROTATION_PERIOD_S = 25.9 * 3600;
const ERIS_AXIAL_TILT_DEG = 0.0;

const DYSNOMIA_MASS_KG = 3.5e18;
const DYSNOMIA_RADIUS_M = 175000;
const DYSNOMIA_SMA_M = 37350000;
const DYSNOMIA_ECC = 0.0062;
const DYSNOMIA_INC_DEG = 142.0;
const DYSNOMIA_LAN_DEG = 139.0;
const DYSNOMIA_AOP_DEG = 194.0;
const DYSNOMIA_MA_DEG = 265.0;
const DYSNOMIA_SIDEREAL_PERIOD_S = 15.786 * 24 * 3600;
const DYSNOMIA_ALBEDO = 0.15;

/**
 * Initializes Eris and its moon Dysnomia using accurate data.
 * Eris is the most massive known dwarf planet in the Solar System.
 */
export function initializeEris(parentId: string): void {
  const erisId = "eris";
  const erisAxialTiltRad = ERIS_AXIAL_TILT_DEG * DEG_TO_RAD;

  actions.addCelestial({
    id: erisId,
    name: "Eris",
    seed: "eris",
    type: CelestialType.DWARF_PLANET,
    parentId: parentId,
    realMass_kg: ERIS_MASS_KG,
    realRadius_m: ERIS_RADIUS_M,
    temperature: ERIS_TEMP_K,
    albedo: ERIS_ALBEDO,
    siderealRotationPeriod_s: ERIS_SIDEREAL_ROTATION_PERIOD_S,
    axialTilt: new OSVector3(
      0,
      Math.cos(erisAxialTiltRad),
      Math.sin(erisAxialTiltRad),
    ).normalize(),
    orbit: {
      realSemiMajorAxis_m: ERIS_SMA_AU * AU,
      eccentricity: ERIS_ECC,
      inclination: ERIS_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: ERIS_LAN_DEG * DEG_TO_RAD,
      argumentOfPeriapsis: ERIS_AOP_DEG * DEG_TO_RAD,
      meanAnomaly: ERIS_MA_DEG * DEG_TO_RAD,
      period_s: ERIS_ORBITAL_PERIOD_S,
    },
    properties: {
      type: CelestialType.DWARF_PLANET,
      planetType: PlanetType.BARREN,
      isMoon: false,
      composition: [
        "nitrogen ice",
        "methane ice",
        "water ice",
        "rocky core",
        "carbon monoxide",
      ],
      atmosphere: {
        glowColor: "#E0E0FF",
        intensity: 0.02,
        power: 0.4,
        thickness: 0.01,
      },
      surface: {
        type: SurfaceType.ICE_FLATS,
        color: "#F5F5FF",
        roughness: 0.15,
        planetType: PlanetType.BARREN,
        persistence: 0.48,
        lacunarity: 2.0,
        simplePeriod: 1.5,
        octaves: 7,
        bumpScale: 1.2,
        color1: "#E8E8FF",
        color2: "#F0F0FF",
        color3: "#F5F5FF",
        color4: "#FAFAFF",
        color5: "#FFFFFF",
        height1: 0.1,
        height2: 0.3,
        height3: 0.5,
        height4: 0.75,
        height5: 0.9,
        shininess: 45,
        specularStrength: 0.85,
        ambientLightIntensity: 0.5,
        undulation: 0.08,
        terrainType: 1,
        terrainAmplitude: 0.3,
        terrainSharpness: 0.8,
        terrainOffset: 0.1,
      },
    } as PlanetProperties,
  });

  // Add Dysnomia moon
  const dysnomiaAxialTilt = new OSVector3(0, 1, 0);
  actions.addCelestial({
    id: "dysnomia",
    name: "Dysnomia",
    seed: "dysnomia",
    type: CelestialType.MOON,
    parentId: erisId,
    realMass_kg: DYSNOMIA_MASS_KG,
    realRadius_m: DYSNOMIA_RADIUS_M,
    temperature: 30,
    albedo: DYSNOMIA_ALBEDO,
    siderealRotationPeriod_s: DYSNOMIA_SIDEREAL_PERIOD_S,
    axialTilt: dysnomiaAxialTilt,
    orbit: {
      realSemiMajorAxis_m: DYSNOMIA_SMA_M,
      eccentricity: DYSNOMIA_ECC,
      inclination: DYSNOMIA_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: DYSNOMIA_LAN_DEG * DEG_TO_RAD,
      argumentOfPeriapsis: DYSNOMIA_AOP_DEG * DEG_TO_RAD,
      meanAnomaly: DYSNOMIA_MA_DEG * DEG_TO_RAD,
      period_s: DYSNOMIA_SIDEREAL_PERIOD_S,
    },
    properties: {
      type: CelestialType.MOON,
      planetType: PlanetType.BARREN,
      isMoon: true,
      parentPlanet: erisId,
      composition: ["water ice", "rocky material"],
      shapeModel: "asteroid",
      atmosphere: {
        glowColor: "#000000",
        intensity: 0,
        power: 0,
        thickness: 0,
      },
      surface: {
        type: SurfaceType.CRATERED,
        color: "#606060",
        roughness: 0.9,
        planetType: PlanetType.BARREN,
        persistence: 0.5,
        lacunarity: 2.2,
        simplePeriod: 3.5,
        octaves: 8,
        bumpScale: 3.0,
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
        shininess: 2,
        specularStrength: 0.05,
        ambientLightIntensity: 0.15,
        undulation: 0.4,
        terrainType: 1,
        terrainAmplitude: 0.8,
        terrainSharpness: 1.5,
        terrainOffset: 0.0,
      },
    } as PlanetProperties,
  });
}
