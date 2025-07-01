import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";
import { AU, KM } from "@teskooano/core-physics";
import { actions } from "@teskooano/core-state";
import {
  CelestialType,
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
      planetType: PlanetType.BARREN,
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
        glowColor: "#E0FFFF",
        intensity: 0.1,
        power: 1.2,
        thickness: 0.05,
      },
      surface: {
        type: SurfaceType.ICE_FLATS,
        color: "#F5E8D1",
        roughness: 0.4,
        planetType: PlanetType.BARREN,
        persistence: 0.53,
        lacunarity: 2.15,
        simplePeriod: 0.86,
        octaves: 8,
        bumpScale: 10,
        color1: "#F5E8D1",
        color2: "#DEB887",
        color3: "#A0522D",
        color4: "#F0F8FF",
        color5: "#FFFAFA",
        height1: 0.088,
        height2: 0.41,
        height3: 0.4,
        height4: 0.43,
        height5: 0.43,
        shininess: 23,
        specularStrength: 0.47,
        ambientLightIntensity: 0.42,
        undulation: 0.1,
        terrainType: 3,
        terrainAmplitude: 0.2,
        terrainSharpness: 1.3,
        terrainOffset: 0.25,
      },
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
      planetType: PlanetType.BARREN,
      isMoon: true,
      parentPlanet: plutoId,
      composition: ["water ice", "ammonia ice (hydrates)", "rocky interior"],
      atmosphere: {
        glowColor: "#000000",
        intensity: 0,
        power: 0,
        thickness: 0,
      },
      surface: {
        type: SurfaceType.CRATERED,
        color: "#B0B8C0",
        roughness: 0.6,
        planetType: PlanetType.BARREN,
        persistence: 0.52,
        lacunarity: 2.2,
        simplePeriod: 2.5,
        octaves: 9,
        bumpScale: 2.8,
        color1: "#8B4513",
        color2: "#A0A8B0",
        color3: "#B0B8C0",
        color4: "#D0D8E0",
        color5: "#F0F8FF",
        height1: 0.1,
        height2: 0.3,
        height3: 0.5,
        height4: 0.7,
        height5: 0.9,
        shininess: 18,
        specularStrength: 0.4,
        ambientLightIntensity: 0.35,
        undulation: 0.25,
        terrainType: 2,
        terrainAmplitude: 0.8,
        terrainSharpness: 1.5,
        terrainOffset: 0.0,
      },
    } as PlanetProperties,
  });
}
