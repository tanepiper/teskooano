import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";
import { AU, KM } from "@teskooano/core-physics";
import { celestialManager } from "@teskooano/core-state";
import {
  CelestialType,
  PlanetType,
  SurfaceType,
  CelestialStatus,
  type PlanetProperties,
} from "@teskooano/data-types";

const MAKEMAKE_MASS_KG = 3.1e21;
const MAKEMAKE_RADIUS_M = 715 * KM;
const MAKEMAKE_TEMP_K = 30;
const MAKEMAKE_ALBEDO = 0.82;
const MAKEMAKE_SMA_AU = 45.43;
const MAKEMAKE_ECC = 0.159;
const MAKEMAKE_INC_DEG = 28.96;
const MAKEMAKE_LAN_DEG = 79.38;
const MAKEMAKE_AOP_DEG = 294.83;
const MAKEMAKE_MA_DEG = 162.11;
const MAKEMAKE_ORBITAL_PERIOD_S = 306.21 * 365.25 * 24 * 3600; // 306.21 years
const MAKEMAKE_SIDEREAL_ROTATION_PERIOD_S = 22.83 * 3600; // 22.83 hours
const MAKEMAKE_AXIAL_TILT_DEG = 0.0;

// MK2 (S/2015 (136472) 1) - Makemake's moon
const MK2_MASS_KG = 1.0e17; // Estimated based on ~175 km diameter
const MK2_RADIUS_M = 87.5 * KM; // ~175 km diameter
const MK2_SMA_M = 21000 * KM; // ~21,000 km from Makemake
const MK2_ECC = 0.0; // Assumed circular
const MK2_INC_DEG = 0.0; // Assumed coplanar
const MK2_LAN_DEG = 0.0;
const MK2_AOP_DEG = 0.0;
const MK2_MA_DEG = 0.0;
const MK2_SIDEREAL_PERIOD_S = 12.4 * 24 * 3600; // ~12.4 days
const MK2_ALBEDO = 0.04; // Very dark surface

/**
 * Initializes Makemake and its moon MK2 using accurate data.
 * Makemake is the fourth largest known dwarf planet in the Solar System.
 */
export function initializeMakemake(parentId: string): void {
  const makemakeId = "makemake";
  const makemakeAxialTiltRad = MAKEMAKE_AXIAL_TILT_DEG * DEG_TO_RAD;

  celestialManager.addCelestial({
    id: makemakeId,
    name: "Makemake",
    seed: "makemake",
    type: CelestialType.DWARF_PLANET,
    status: CelestialStatus.ACTIVE,
    parentId: parentId,
    realMass_kg: MAKEMAKE_MASS_KG,
    realRadius_m: MAKEMAKE_RADIUS_M,
    temperature: MAKEMAKE_TEMP_K,
    albedo: MAKEMAKE_ALBEDO,

    orbit: {
      realSemiMajorAxis_m: MAKEMAKE_SMA_AU * AU,
      eccentricity: MAKEMAKE_ECC,
      inclination: MAKEMAKE_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: MAKEMAKE_LAN_DEG * DEG_TO_RAD,
      argumentOfPeriapsis: MAKEMAKE_AOP_DEG * DEG_TO_RAD,
      meanAnomaly: MAKEMAKE_MA_DEG * DEG_TO_RAD,
      period_s: MAKEMAKE_ORBITAL_PERIOD_S,
      siderealRotationPeriod_s: MAKEMAKE_SIDEREAL_ROTATION_PERIOD_S,
      axialTilt: new OSVector3(
        0,
        Math.cos(makemakeAxialTiltRad),
        Math.sin(makemakeAxialTiltRad),
      ).normalize(),
    },
    properties: {
      type: CelestialType.DWARF_PLANET,
      classType: PlanetType.BARREN,
      isMoon: false,
      composition: [
        "methane ice",
        "nitrogen ice",
        "water ice",
        "rocky core",
        "ethane",
        "tholins",
      ],
      atmosphere: undefined,
      surface: {
        type: SurfaceType.ICE_FLATS,
        color: "#FFE8E8",
        roughness: 0.2,
        classType: PlanetType.BARREN,
        persistence: 0.45,
        lacunarity: 2.1,
        simplePeriod: 1.8,
        octaves: 6,
        bumpScale: 1.0,
        color1: "#F8D8D8",
        color2: "#FFE0E0",
        color3: "#FFE8E8",
        color4: "#FFF0F0",
        color5: "#FFFFFF",
        height1: 0.15,
        height2: 0.35,
        height3: 0.55,
        height4: 0.75,
        height5: 0.9,
        shininess: 55,
        specularStrength: 0.82,
        ambientLightIntensity: 0.01,
        undulation: 0.05,
        terrainType: 1,
        terrainAmplitude: 0.25,
        terrainSharpness: 0.7,
        terrainOffset: 0.05,
      },
    } as PlanetProperties,
  });

  // Add MK2 moon
  const mk2AxialTilt = new OSVector3(0, 1, 0);
  celestialManager.addCelestial({
    id: "mk2",
    name: "MK2",
    seed: "mk2",
    type: CelestialType.MOON,
    status: CelestialStatus.ACTIVE,
    parentId: makemakeId,
    realMass_kg: MK2_MASS_KG,
    realRadius_m: MK2_RADIUS_M,
    temperature: 30,
    albedo: MK2_ALBEDO,

    orbit: {
      realSemiMajorAxis_m: MK2_SMA_M,
      eccentricity: MK2_ECC,
      inclination: MK2_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: MK2_LAN_DEG * DEG_TO_RAD,
      argumentOfPeriapsis: MK2_AOP_DEG * DEG_TO_RAD,
      meanAnomaly: MK2_MA_DEG * DEG_TO_RAD,
      period_s: MK2_SIDEREAL_PERIOD_S,
      siderealRotationPeriod_s: MK2_SIDEREAL_PERIOD_S,
      axialTilt: mk2AxialTilt,
    },

    properties: {
      type: CelestialType.MOON,
      classType: PlanetType.BARREN,
      isMoon: true,
      composition: ["water ice", "rocky material", "organic compounds"],
      shapeModel: "asteroid",
      atmosphere: undefined,
      surface: {
        type: SurfaceType.CRATERED,
        color: "#303030",
        roughness: 0.95,
        classType: PlanetType.BARREN,
        persistence: 0.6,
        lacunarity: 2.3,
        simplePeriod: 4.0,
        octaves: 9,
        bumpScale: 3.5,
        color1: "#202020",
        color2: "#252525",
        color3: "#303030",
        color4: "#353535",
        color5: "#404040",
        height1: 0.0,
        height2: 0.2,
        height3: 0.4,
        height4: 0.6,
        height5: 0.8,
        shininess: 1,
        specularStrength: 0.04,
        ambientLightIntensity: 0.01, // Minimal ambient for dynamic lighting
        undulation: 0.5,
        terrainType: 1,
        terrainAmplitude: 1.0,
        terrainSharpness: 1.8,
        terrainOffset: 0.0,
      },
    } as PlanetProperties,
  });
}
