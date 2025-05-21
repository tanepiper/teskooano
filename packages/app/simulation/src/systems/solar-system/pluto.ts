import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";
import { AU, KM } from "@teskooano/core-physics";
import { actions } from "@teskooano/core-state";
import {
  CelestialType,
  type IceSurfaceProperties,
  PlanetType,
  SurfaceType,
  type PlanetAtmosphereProperties,
  type PlanetProperties,
} from "@teskooano/data-types";

const PLUTO_MASS_KG = 1.303e22;
const PLUTO_RADIUS_M = 1188300;
const PLUTO_TEMP_K = 44;
const PLUTO_ALBEDO = 0.58;
const PLUTO_SMA_AU = 39.482;
const PLUTO_ECC = 0.2488;
const PLUTO_INC_DEG = 17.16;
const PLUTO_LAN_DEG = 110.3;
const PLUTO_AOP_DEG = 224.07;
const PLUTO_MA_DEG = 238.93;
const PLUTO_ORBITAL_PERIOD_S = 7.824e9;
const PLUTO_SIDEREAL_ROTATION_PERIOD_S = -551855.0;
const PLUTO_AXIAL_TILT_DEG = 119.59;

const CHARON_MASS_KG = 1.586e21;
const CHARON_RADIUS_M = 606000;
const CHARON_SMA_M = 19591.4 * KM;
const CHARON_ECC = 0.00005;
const CHARON_INC_DEG = 0.001;
const CHARON_SIDEREAL_PERIOD_S = 551855.0;
const CHARON_ALBEDO = 0.38;
const CHARON_AXIAL_TILT_DEG = PLUTO_AXIAL_TILT_DEG;

/**
 * Initializes Pluto and its largest moon Charon using accurate data.
 */
export function initializePluto(parentId: string): void {
  const plutoId = "pluto";
  const plutoAxialTiltRad = PLUTO_AXIAL_TILT_DEG * DEG_TO_RAD;

  actions.addCelestial({
    id: plutoId,
    name: "Pluto",
    seed: "pluto",
    type: CelestialType.DWARF_PLANET,
    parentId: parentId,
    realMass_kg: PLUTO_MASS_KG,
    realRadius_m: PLUTO_RADIUS_M,
    temperature: PLUTO_TEMP_K,
    albedo: PLUTO_ALBEDO,
    siderealRotationPeriod_s: PLUTO_SIDEREAL_ROTATION_PERIOD_S,
    axialTilt: new OSVector3(
      0,
      Math.cos(plutoAxialTiltRad),
      Math.sin(plutoAxialTiltRad),
    ).normalize(),
    orbit: {
      realSemiMajorAxis_m: PLUTO_SMA_AU * AU,
      eccentricity: PLUTO_ECC,
      inclination: PLUTO_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: PLUTO_LAN_DEG * DEG_TO_RAD,
      argumentOfPeriapsis: (PLUTO_AOP_DEG - PLUTO_LAN_DEG) * DEG_TO_RAD,
      meanAnomaly: PLUTO_MA_DEG * DEG_TO_RAD,
      period_s: PLUTO_ORBITAL_PERIOD_S,
    },
    properties: {
      type: CelestialType.DWARF_PLANET,
      planetType: PlanetType.ICE,
      isMoon: false,
      composition: [
        "nitrogen ice",
        "water ice crust",
        "methane ice",
        "carbon monoxide ice",
        "rocky core",
        "tholins",
      ],
      atmosphere: {
        glowColor: "#E0FFFF33",
        intensity: 0.1,
        power: 0.8,
        thickness: 0.05,
      },
      surface: {
        type: SurfaceType.VARIED,
        planetType: PlanetType.ICE,
        color: "#F5E8D1",
        secondaryColor: "#A0522D",
        roughness: 0.4,
        glossiness: 0.5,
        crackIntensity: 0.2,
        iceThickness: 5.0,
        persistence: 0.45,
        lacunarity: 2.1,
        simplePeriod: 5.0,
        octaves: 5,
        bumpScale: 0.8,
        color1: "#606070",
        color2: "#808090",
        color3: "#B0B0C0",
        color4: "#D0D0E0",
        color5: "#F0F0F8",
        height1: 0.0,
        height2: 0.3,
        height3: 0.5,
        height4: 0.7,
        height5: 0.85,
        shininess: 0.2,
        specularStrength: 0.1,
        ambientLightIntensity: 0.15,
        undulation: 0.05,
        terrainType: 2,
        terrainAmplitude: 0.3,
        terrainSharpness: 0.6,
        terrainOffset: 0.0,
      } as IceSurfaceProperties,
    } as PlanetProperties,
  });

  const charonAxialTiltRad = CHARON_AXIAL_TILT_DEG * DEG_TO_RAD;
  actions.addCelestial({
    id: "charon",
    name: "Charon",
    seed: "charon",
    type: CelestialType.MOON,
    parentId: plutoId,
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
      parentPlanet: plutoId,
      composition: ["water ice", "ammonia ice (hydrates)", "rocky interior"],
      atmosphere: {
        glowColor: "#00000000",
        intensity: 0,
        power: 0,
        thickness: 0,
      },
      surface: {
        type: SurfaceType.VARIED,
        planetType: PlanetType.ICE,
        color: "#B0B8C0",
        secondaryColor: "#8B4513",
        roughness: 0.6,
        glossiness: 0.4,
        crackIntensity: 0.3,
        iceThickness: 10.0,
        persistence: 0.45,
        lacunarity: 2.1,
        simplePeriod: 5.0,
        octaves: 5,
        bumpScale: 0.8,
        color1: "#505060",
        color2: "#707080",
        color3: "#A0A0B0",
        color4: "#C0C0D0",
        color5: "#E0E0F0",
        height1: 0.0,
        height2: 0.3,
        height3: 0.5,
        height4: 0.7,
        height5: 0.85,
        shininess: 0.2,
        specularStrength: 0.1,
        ambientLightIntensity: 0.15,
        undulation: 0.05,
        terrainType: 2,
        terrainAmplitude: 0.3,
        terrainSharpness: 0.6,
        terrainOffset: 0.0,
      } as IceSurfaceProperties,
    } as PlanetProperties,
  });
}
