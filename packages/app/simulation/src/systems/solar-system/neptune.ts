import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";
import { AU, KM } from "@teskooano/core-physics";
import { actions } from "@teskooano/core-state";
import {
  CelestialType,
  GasGiantClass,
  PlanetType,
  RockyType,
  SurfaceType,
  type IceSurfaceProperties,
  type GasGiantProperties,
  type PlanetAtmosphereProperties,
  type PlanetProperties,
  type RingProperties,
} from "@teskooano/data-types";

const NEPTUNE_AXIAL_TILT_DEG = 28.32;
const NEPTUNE_SIDEREAL_ROTATION_PERIOD_S = 16.11 * 3600;
const NEPTUNE_ORBITAL_PERIOD_S = 5.199e9;
const NEPTUNE_REAL_RADIUS_M = 24622000;

const TRITON_SMA_M = 354759 * KM;
const TRITON_SIDEREAL_ROTATION_PERIOD_S = -5.877 * 24 * 3600;

const NEREID_SMA_M = 5513800 * KM;
const NEREID_ORBITAL_PERIOD_S = 3.114e7;
const NEREID_SIDEREAL_ROTATION_PERIOD_S = 11.52 * 3600;

/**
 * Initializes Neptune and its major moons using accurate data.
 */
export function initializeNeptune(parentId: string): void {
  const neptuneId = "neptune";
  const neptuneAxialTiltRad = NEPTUNE_AXIAL_TILT_DEG * DEG_TO_RAD;
  const defaultMoonAxialTilt = new OSVector3(0, 1, 0).normalize();

  actions.addCelestial({
    id: neptuneId,
    name: "Neptune",
    seed: "neptune_seed_164",
    type: CelestialType.GAS_GIANT,
    parentId: parentId,
    realMass_kg: 1.024e26,
    realRadius_m: NEPTUNE_REAL_RADIUS_M,
    orbit: {
      realSemiMajorAxis_m: 30.07 * AU,
      eccentricity: 0.008678,
      inclination: 1.769 * DEG_TO_RAD,
      longitudeOfAscendingNode: 131.783 * DEG_TO_RAD,
      argumentOfPeriapsis: 273.187 * DEG_TO_RAD,
      meanAnomaly: 256.328 * DEG_TO_RAD,
      period_s: NEPTUNE_ORBITAL_PERIOD_S,
    },
    temperature: 72,
    albedo: 0.41,
    siderealRotationPeriod_s: NEPTUNE_SIDEREAL_ROTATION_PERIOD_S,
    axialTilt: new OSVector3(
      0,
      Math.cos(neptuneAxialTiltRad),
      Math.sin(neptuneAxialTiltRad),
    ).normalize(),
    properties: {
      type: CelestialType.GAS_GIANT,
      gasGiantClass: GasGiantClass.CLASS_III,
      atmosphereColor: "#3F51B5",
      cloudColor: "#E8EAF6",
      cloudSpeed: 0.03,
      stormColor: "#2F3E8E",
      stormSpeed: 0.01,
      emissiveColor: "#3F51B51A",
      emissiveIntensity: 0.02,
      rings: [
        {
          innerRadius: 41900 * KM,
          outerRadius: 43900 * KM,
          density: 0.01,
          opacity: 0.02,
          color: "#505060",
          type: RockyType.DUST,
          texture: "textures/ring_neptune_galle.png",
          rotationRate: 0.003,
          composition: ["fine dust"],
        } as RingProperties,
        {
          innerRadius: 53200 * KM,
          outerRadius: 53300 * KM,
          density: 0.05,
          opacity: 0.08,
          color: "#606070",
          type: RockyType.DUST,
          texture: "textures/ring_neptune_leverrier.png",
          rotationRate: 0.0025,
          composition: ["dust"],
        } as RingProperties,
        {
          innerRadius: 62932 * KM,
          outerRadius: 62933 * KM,
          density: 0.1,
          opacity: 0.15,
          color: "#707080",
          type: RockyType.DUST,
          texture: "textures/ring_neptune_adams.png",
          rotationRate: 0.002,
          composition: ["dust", "small ice particles?"],
        } as RingProperties,
      ],
    } as GasGiantProperties,
  });

  actions.addCelestial({
    id: "triton",
    name: "Triton",
    seed: "triton_seed_5877",
    type: CelestialType.MOON,
    parentId: neptuneId,
    realMass_kg: 2.139e22,
    realRadius_m: 1353400,
    orbit: {
      realSemiMajorAxis_m: TRITON_SMA_M,
      eccentricity: 0.000016,
      inclination: 156.885 * DEG_TO_RAD,
      longitudeOfAscendingNode: Math.random() * 2 * Math.PI,
      argumentOfPeriapsis: Math.random() * 2 * Math.PI,
      meanAnomaly: Math.random() * 2 * Math.PI,
      period_s: Math.abs(TRITON_SIDEREAL_ROTATION_PERIOD_S),
    },
    temperature: 38,
    albedo: 0.76,
    siderealRotationPeriod_s: TRITON_SIDEREAL_ROTATION_PERIOD_S,
    axialTilt: defaultMoonAxialTilt,
    atmosphere: {
      glowColor: "#F0FFF01A",
      intensity: 0.05,
      power: 0.6,
      thickness: 0.02,
    } as PlanetAtmosphereProperties,
    surface: {
      type: SurfaceType.VARIED,
      planetType: PlanetType.ICE,
      color: "#E0F0F0",
      secondaryColor: "#B0C0D0",
      roughness: 0.5,
      glossiness: 0.4,
      crackIntensity: 0.3,
      iceThickness: 10.0,
    } as IceSurfaceProperties,
    properties: {
      type: CelestialType.MOON,
      planetType: PlanetType.ICE,
      isMoon: true,
      parentPlanet: neptuneId,
      composition: ["nitrogen ice", "water ice", "methane ice", "rocky core"],
    } as PlanetProperties,
  });

  actions.addCelestial({
    id: "nereid",
    name: "Nereid",
    seed: "nereid_seed_360",
    type: CelestialType.MOON,
    parentId: neptuneId,
    realMass_kg: 3.1e19,
    realRadius_m: 170000,
    siderealRotationPeriod_s: NEREID_SIDEREAL_ROTATION_PERIOD_S,
    axialTilt: defaultMoonAxialTilt,
    orbit: {
      realSemiMajorAxis_m: NEREID_SMA_M,
      eccentricity: 0.7507,
      inclination: 7.232 * DEG_TO_RAD,
      longitudeOfAscendingNode: Math.random() * 2 * Math.PI,
      argumentOfPeriapsis: Math.random() * 2 * Math.PI,
      meanAnomaly: Math.random() * 360 * DEG_TO_RAD,
      period_s: NEREID_ORBITAL_PERIOD_S,
    },
    temperature: 50,
    albedo: 0.14,
    atmosphere: {
      glowColor: "#44444400",
      intensity: 0,
      power: 0,
      thickness: 0,
    } as PlanetAtmosphereProperties,
    surface: {
      type: SurfaceType.CRATERED,
      planetType: PlanetType.ICE,
      color: "#A0A0A8",
      roughness: 0.7,
      glossiness: 0.2,
      crackIntensity: 0.1,
      iceThickness: 5.0,
    } as IceSurfaceProperties,
    properties: {
      type: CelestialType.MOON,
      planetType: PlanetType.ICE,
      isMoon: true,
      parentPlanet: neptuneId,
      composition: ["water ice", "rock?"],
      shapeModel: "asteroid",
    } as PlanetProperties,
  });
}
