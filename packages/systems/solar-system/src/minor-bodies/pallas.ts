import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";
import { AU, KM } from "@teskooano/core-physics";
import { factoryOperations } from "@teskooano/core-state";
import {
  CelestialType,
  PlanetType,
  SurfaceType,
  CelestialStatus,
  type PlanetProperties,
} from "@teskooano/data-types";

const PALLAS_MASS_KG = 2.05e20;
const PALLAS_RADIUS_M = 256.5 * KM; // Mean radius ~513 km diameter
const PALLAS_TEMP_K = 164;
const PALLAS_ALBEDO = 0.159;
const PALLAS_SMA_AU = 2.77;
const PALLAS_ECC = 0.231;
const PALLAS_INC_DEG = 34.93; // Notably high inclination
const PALLAS_LAN_DEG = 173.09;
const PALLAS_AOP_DEG = 309.93;
const PALLAS_MA_DEG = 78.19;
const PALLAS_ORBITAL_PERIOD_S = 4.61 * 365.25 * 24 * 3600; // 4.61 years
const PALLAS_SIDEREAL_ROTATION_PERIOD_S = 7.81 * 3600; // 7.81 hours
const PALLAS_AXIAL_TILT_DEG = 84.0; // High obliquity

/**
 * Initializes Pallas using accurate data.
 * Pallas is the third-largest asteroid in the Solar System and has a high orbital inclination.
 * It's a B-type asteroid with a primitive composition.
 */
export function initializePallas(parentId: string): void {
  const pallasAxialTiltRad = PALLAS_AXIAL_TILT_DEG * DEG_TO_RAD;

  factoryOperations.addCelestial({
    id: "pallas",
    name: "Pallas",
    seed: "pallas",
    type: CelestialType.DWARF_PLANET,
    status: CelestialStatus.ACTIVE,
    parentId: parentId,
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
        Math.cos(pallasAxialTiltRad),
        Math.sin(pallasAxialTiltRad),
      ).normalize(),
    },
    physicsStateReal: {
      id: "pallas",
      mass_kg: PALLAS_MASS_KG,
      position_m: new OSVector3(0, 0, 0), // Will be calculated by the factory
      velocity_mps: new OSVector3(0, 0, 0), // Will be calculated by the factory
    },
    properties: {
      type: CelestialType.DWARF_PLANET,
      classType: PlanetType.BARREN,
      isMoon: false,
      composition: [
        "pyroxene",
        "olivine",
        "magnetite",
        "phyllosilicates",
        "carbonaceous material",
        "hydrated minerals",
      ],
      shapeModel: "asteroid",
      atmosphere: undefined,
      surface: {
        type: SurfaceType.CRATERED,
        color: "#505050",
        roughness: 0.85,
        classType: PlanetType.BARREN,
        persistence: 0.6,
        lacunarity: 2.3,
        simplePeriod: 3.0,
        octaves: 10,
        bumpScale: 4.0,
        color1: "#404040",
        color2: "#484848",
        color3: "#505050",
        color4: "#585858",
        color5: "#606060",
        height1: 0.0,
        height2: 0.2,
        height3: 0.4,
        height4: 0.6,
        height5: 0.8,
        shininess: 3,
        specularStrength: 0.15,
        ambientLightIntensity: 0.01, // Minimal ambient for dynamic lighting
        undulation: 0.6,
        terrainType: 1,
        terrainAmplitude: 1.2,
        terrainSharpness: 2.0,
        terrainOffset: 0.0,
      },
    } as PlanetProperties,
  });
}
