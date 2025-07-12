import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";
import { KM } from "@teskooano/core-physics";
import { actions } from "@teskooano/core-state";
import {
  CelestialType,
  PlanetType,
  SurfaceType,
  CelestialStatus,
  PhysicsStateReal,
  type PlanetProperties,
} from "@teskooano/data-types";

// Verified Wikipedia data for Io
const IO_MASS_KG = 8.9319e22; // Wikipedia verified
const IO_RADIUS_M = 1821600; // Mean radius from Wikipedia: 1821.6±0.5 km
const IO_SMA_M = 421800 * KM; // Wikipedia verified: 421,800 km
const IO_ECC = 0.0041; // Wikipedia verified
const IO_INC_DEG = 0.05; // Wikipedia verified: 0.050° to Jupiter's equator
const IO_LAN_DEG = 43.977; // Current value
const IO_AOP_DEG = 84.129; // Current value
const IO_MA_DEG = 342.021; // Current value
const IO_SIDEREAL_PERIOD_S = 1.769137786 * 24 * 3600; // Wikipedia: 1.769137786 days (synchronous)
const IO_ALBEDO = 0.63; // Wikipedia verified
const IO_TEMP_K = 110; // Wikipedia verified: mean 110 K

/**
 * Initializes Io, Jupiter's volcanically active moon.
 */
export function initializeIo(parentId: string): void {
  const defaultMoonAxialTilt = new OSVector3(0, 1, 0);

  actions.addCelestial({
    id: "io",
    name: "Io",
    seed: "io_seed_1769",
    type: CelestialType.MOON,
    status: CelestialStatus.ACTIVE,
    parentId: parentId,
    realMass_kg: IO_MASS_KG,
    realRadius_m: IO_RADIUS_M,
    temperature: IO_TEMP_K,
    albedo: IO_ALBEDO,
    siderealRotationPeriod_s: IO_SIDEREAL_PERIOD_S,
    axialTilt: defaultMoonAxialTilt,
    orbit: {
      realSemiMajorAxis_m: IO_SMA_M,
      eccentricity: IO_ECC,
      inclination: IO_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: IO_LAN_DEG * DEG_TO_RAD,
      argumentOfPeriapsis: IO_AOP_DEG * DEG_TO_RAD,
      meanAnomaly: IO_MA_DEG * DEG_TO_RAD,
      period_s: IO_SIDEREAL_PERIOD_S,
    },
    physicsStateReal: {
      id: "io",
      mass_kg: IO_MASS_KG,
      position_m: new OSVector3(0, 0, 0), // Will be calculated by the factory
      velocity_mps: new OSVector3(0, 0, 0), // Will be calculated by the factory
    },
    properties: {
      type: CelestialType.MOON,
      classType: PlanetType.ROCKY,
      isMoon: true,
      parentPlanet: parentId,
      composition: [
        "sulfur compounds",
        "silicates",
        "iron core",
        "molten interior",
      ],
      atmosphere: {
        glowColor: "#FFFF00",
        intensity: 0.1,
        power: 0.8,
        thickness: 0.05,
      },
      surface: {
        type: SurfaceType.VOLCANIC,
        color: "#FFFFA0",
        roughness: 0.6,
        classType: PlanetType.ROCKY,
        persistence: 0.58,
        lacunarity: 1.9,
        simplePeriod: 1.7,
        octaves: 8,
        bumpScale: 2.5,
        color1: "#FFFFA0",
        color2: "#FF6347",
        color3: "#FF2000",
        color4: "#8B4513",
        color5: "#201000",
        height1: 0.15,
        height2: 0.35,
        height3: 0.55,
        height4: 0.75,
        height5: 0.9,
        shininess: 18,
        specularStrength: 0.3,
        ambientLightIntensity: 0.01, // Minimal ambient for dynamic lighting
        undulation: 0.4,
        terrainType: 2,
        terrainAmplitude: 1.2,
        terrainSharpness: 1.8,
        terrainOffset: 0.2,
      },
    } as PlanetProperties,
  });
}
