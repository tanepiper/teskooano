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

// Verified Wikipedia/NASA data for Titan - largest moon of Saturn with thick atmosphere
const TITAN_MASS_KG = 1.34518e23; // Wikipedia verified: (1.34518±0.00003)×10²³ kg
const TITAN_RADIUS_M = 2574730; // Wikipedia verified: 2574.73±0.09 km (mean radius)
const TITAN_SMA_M = 1221870 * KM; // Wikipedia verified: 1,221,870 km semi-major axis
const TITAN_ECC = 0.0288; // Wikipedia verified
const TITAN_INC_DEG = 0.34854; // Wikipedia verified: 0.34854° to Saturn's equator
const TITAN_LAN_DEG = 189.64; // Current value
const TITAN_AOP_DEG = 180.532; // Current value
const TITAN_MA_DEG = 358.922; // Current value
const TITAN_SIDEREAL_PERIOD_S = 15.945 * 24 * 3600; // Wikipedia: 15.945 days (synchronous)
const TITAN_ALBEDO = 0.22; // Wikipedia verified: 0.22 geometric albedo
const TITAN_TEMP_K = 93.7; // Wikipedia verified: 93.7 K (−179.5 °C)

/**
 * Initializes Titan, Saturn's largest moon with thick atmosphere and liquid lakes.
 */
export function initializeTitan(parentId: string): void {
  const defaultMoonAxialTilt = new OSVector3(0, 1, 0);

  actions.addCelestial({
    id: "titan",
    name: "Titan",
    seed: "titan_seed_15945",
    type: CelestialType.MOON,
    status: CelestialStatus.ACTIVE,
    parentId: parentId,
    realMass_kg: TITAN_MASS_KG,
    realRadius_m: TITAN_RADIUS_M,
    temperature: TITAN_TEMP_K,
    albedo: TITAN_ALBEDO,
    siderealRotationPeriod_s: TITAN_SIDEREAL_PERIOD_S,
    axialTilt: defaultMoonAxialTilt,
    orbit: {
      realSemiMajorAxis_m: TITAN_SMA_M,
      eccentricity: TITAN_ECC,
      inclination: TITAN_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: TITAN_LAN_DEG * DEG_TO_RAD,
      argumentOfPeriapsis: TITAN_AOP_DEG * DEG_TO_RAD,
      meanAnomaly: TITAN_MA_DEG * DEG_TO_RAD,
      period_s: TITAN_SIDEREAL_PERIOD_S,
    },
    physicsStateReal: {
      id: "titan",
      mass_kg: TITAN_MASS_KG,
      position_m: new OSVector3(0, 0, 0), // Will be calculated by the factory
      velocity_mps: new OSVector3(0, 0, 0), // Will be calculated by the factory
    },
    properties: {
      type: CelestialType.MOON,
      classType: PlanetType.TERRESTRIAL,
      isMoon: true,
      parentPlanet: parentId,
      composition: [
        "water ice",
        "rocky material",
        "organic compounds",
        "nitrogen atmosphere",
        "methane lakes",
        "subsurface ocean",
      ],
      atmosphere: {
        glowColor: "#FFA500",
        intensity: 0.85,
        power: 2.0,
        thickness: 0.3,
      },
      surface: {
        type: SurfaceType.VARIED,
        color: "#CD853F",
        roughness: 0.6,
        classType: PlanetType.TERRESTRIAL,
        persistence: 0.7,
        lacunarity: 2.0,
        simplePeriod: 4.0,
        octaves: 8,
        bumpScale: 2.5,
        color1: "#8B4513",
        color2: "#A0522D",
        color3: "#CD853F",
        color4: "#DEB887",
        color5: "#F5DEB3",
        height1: 0.1,
        height2: 0.3,
        height3: 0.5,
        height4: 0.7,
        height5: 0.9,
        shininess: 15,
        specularStrength: 0.3,
        ambientLightIntensity: 0.01, // Minimal ambient for dynamic lighting
        undulation: 0.25,
        terrainType: 3,
        terrainAmplitude: 0.8,
        terrainSharpness: 1.5,
        terrainOffset: 0.1,
      },
    } as PlanetProperties,
  });
}
