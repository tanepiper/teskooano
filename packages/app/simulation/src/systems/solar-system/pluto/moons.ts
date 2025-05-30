import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";
import { KM } from "@teskooano/core-physics";
import { actions } from "@teskooano/core-state";
import {
  CelestialType,
  PlanetType,
  SurfaceType,
  type PlanetProperties,
  type ProceduralSurfaceProperties,
  CompositionType,
} from "@teskooano/data-types";

const CHARON_MASS_KG = 1.586e21;
const CHARON_RADIUS_M = 606000;
const CHARON_SMA_M = 19591.4 * KM;
const CHARON_ECC = 0.00005;
const CHARON_INC_DEG = 0.001;
const CHARON_SIDEREAL_PERIOD_S = 551855.0;
const CHARON_ALBEDO = 0.38;
const CHARON_AXIAL_TILT_DEG = 119.59; // Assuming same as Pluto for tidal lock

export function initializePlutoMoons(parentId: string): void {
  // Charon procedural surface data (water ice surface, darker than Pluto)
  const charonProceduralSurface: ProceduralSurfaceProperties = {
    persistence: 0.45,
    lacunarity: 2.1,
    simplePeriod: 5.0,
    octaves: 5,
    bumpScale: 0.8,
    color1: "#505060", // Dark gray
    color2: "#707080", // Medium gray
    color3: "#A0A0B0", // Light gray
    color4: "#C0C0D0", // Bright areas
    color5: "#E0E0F0", // Very bright spots
    height1: 0.0,
    height2: 0.3,
    height3: 0.5,
    height4: 0.7,
    height5: 0.85,
    shininess: 0.2,
    specularStrength: 0.1,
    roughness: 0.6,
    ambientLightIntensity: 0.15,
    undulation: 0.05,
    terrainType: 2,
    terrainAmplitude: 0.3,
    terrainSharpness: 0.6,
    terrainOffset: 0.0,
  };

  const charonAxialTiltRad = CHARON_AXIAL_TILT_DEG * DEG_TO_RAD;
  actions.addCelestial({
    id: "charon",
    name: "Charon",
    seed: "charon",
    type: CelestialType.MOON,
    parentId: parentId,
    realMass_kg: CHARON_MASS_KG,
    realRadius_m: CHARON_RADIUS_M,
    temperature: 53,
    albedo: CHARON_ALBEDO,
    siderealRotationPeriod_s: CHARON_SIDEREAL_PERIOD_S,
    axialTilt: new OSVector3(
      0,
      Math.cos(charonAxialTiltRad),
      Math.sin(charonAxialTiltRad),
    ).normalize(),
    orbit: {
      realSemiMajorAxis_m: CHARON_SMA_M,
      eccentricity: CHARON_ECC,
      inclination: CHARON_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: Math.random() * 2 * Math.PI,
      argumentOfPeriapsis: Math.random() * 2 * Math.PI,
      meanAnomaly: Math.random() * 2 * Math.PI,
      period_s: CHARON_SIDEREAL_PERIOD_S,
    },
    properties: {
      type: CelestialType.MOON,
      planetType: PlanetType.ICE,
      isMoon: true,
      parentPlanet: parentId,
      composition: ["water ice", "ammonia ice (hydrates)", "rocky interior"],
      atmosphere: undefined, // Charon has no atmosphere
      surface: {
        ...charonProceduralSurface,
        type: SurfaceType.VARIED,
        surfaceType: SurfaceType.VARIED,
        composition: [CompositionType.WATER_ICE, CompositionType.AMMONIA_ICE],
        planetType: PlanetType.ICE,
        color: "#B0B8C0",
      },
    } as PlanetProperties,
  });
}
