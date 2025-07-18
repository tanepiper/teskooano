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

const MARS_MASS_KG = 6.4171e23;
const MARS_RADIUS_M = 3389.5 * KM; // Mean radius
const MARS_TEMP_K = 209; // Blackbody temperature
const MARS_ALBEDO = 0.17; // Geometric albedo
const MARS_SMA_AU = 1.52368055; // Semi-major axis
const MARS_ECC = 0.0934; // Eccentricity
const MARS_INC_DEG = 1.85; // Inclination to ecliptic
const MARS_LAN_DEG = 49.57854; // Longitude of ascending node
const MARS_AOP_DEG = 286.5; // Argument of perihelion
const MARS_MA_DEG = 19.412; // Mean anomaly
const MARS_ORBITAL_PERIOD_S = 59355072; // 686.980 days
const MARS_SIDEREAL_ROTATION_PERIOD_S = 88642.7; // 24h 37m 22.7s
const MARS_AXIAL_TILT_DEG = 25.19;

/**
 * Initializes Mars using accurate data.
 * @returns The ID of the Mars object.
 */
export function initializeMarsPlanet(parentId: string): string {
  const marsId = "mars";
  const marsAxialTiltRad = MARS_AXIAL_TILT_DEG * DEG_TO_RAD;

  factoryOperations.addCelestial({
    id: marsId,
    name: "Mars",
    seed: "mars",
    type: CelestialType.PLANET,
    status: CelestialStatus.ACTIVE,
    parentId: parentId,
    realMass_kg: MARS_MASS_KG,
    realRadius_m: MARS_RADIUS_M,
    temperature: MARS_TEMP_K,
    albedo: MARS_ALBEDO,

    orbit: {
      realSemiMajorAxis_m: MARS_SMA_AU * AU,
      eccentricity: MARS_ECC,
      inclination: MARS_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: MARS_LAN_DEG * DEG_TO_RAD,
      argumentOfPeriapsis: MARS_AOP_DEG * DEG_TO_RAD,
      meanAnomaly: MARS_MA_DEG * DEG_TO_RAD,
      period_s: MARS_ORBITAL_PERIOD_S,
      siderealRotationPeriod_s: MARS_SIDEREAL_ROTATION_PERIOD_S,
      axialTilt: new OSVector3(
        0,
        Math.cos(marsAxialTiltRad),
        Math.sin(marsAxialTiltRad),
      ).normalize(),
    },
    physicsStateReal: {
      id: marsId,
      mass_kg: MARS_MASS_KG,
      position_m: new OSVector3(0, 0, 0), // Will be calculated by the factory
      velocity_mps: new OSVector3(0, 0, 0), // Will be calculated by the factory
    },
    properties: {
      type: CelestialType.PLANET,
      classType: PlanetType.ROCKY,
      isMoon: false,
      composition: ["iron oxide", "silicates", "thin CO2 atmosphere"],
      atmosphere: {
        glowColor: "#CD853F",
        intensity: 0.2,
        power: 1.1,
        thickness: 0.1,
      },
      surface: {
        type: SurfaceType.DUNES,
        color: "#CD853F",
        roughness: 0.8,
        classType: PlanetType.ROCKY,
        persistence: 0.5,
        lacunarity: 2.1,
        simplePeriod: 2.5,
        octaves: 10,
        bumpScale: 0.025,
        color1: "#C2B280",
        color2: "#CD853F",
        color3: "#8B4513",
        color4: "#D2691E",
        color5: "#FFF8DC",
        height1: 0.05,
        height2: 0.12,
        height3: 0.28,
        height4: 0.65,
        height5: 0.95,
        shininess: 12,
        specularStrength: 0.1,
        ambientLightIntensity: 0.01, // Minimal ambient for dark space
        undulation: 0.2,
        terrainType: 3,
        terrainAmplitude: 0.45,
        terrainSharpness: 0.65,
        terrainOffset: 0.2,
      },
    } as PlanetProperties,
  });

  return marsId;
}
