import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";
import { AU, KM } from "@teskooano/core-physics";
import { actions } from "@teskooano/core-state";
import {
  AtmosphereType,
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
 * Initializes Neptune and its largest moon Triton using accurate data.
 */
export function initializeNeptune(parentId: string): void {
  const neptuneId = "neptune";
  const neptuneAxialTiltRad = NEPTUNE_AXIAL_TILT_DEG * DEG_TO_RAD;

  actions.addCelestial({
    id: neptuneId,
    name: "Neptune",
    seed: "neptune",
    type: CelestialType.GAS_GIANT,
    parentId: parentId,
    realMass_kg: 1.024e26,
    realRadius_m: NEPTUNE_REAL_RADIUS_M,
    temperature: 72,
    albedo: 0.41,
    siderealRotationPeriod_s: NEPTUNE_SIDEREAL_ROTATION_PERIOD_S,
    axialTilt: new OSVector3(
      0,
      Math.cos(neptuneAxialTiltRad),
      Math.sin(neptuneAxialTiltRad),
    ).normalize(),
    orbit: {
      realSemiMajorAxis_m: 30.07 * AU,
      eccentricity: 0.008678,
      inclination: 1.769 * DEG_TO_RAD,
      longitudeOfAscendingNode: 131.783 * DEG_TO_RAD,
      argumentOfPeriapsis: 273.187 * DEG_TO_RAD,
      meanAnomaly: 256.328 * DEG_TO_RAD,
      period_s: NEPTUNE_ORBITAL_PERIOD_S,
    },
    properties: {
      type: CelestialType.GAS_GIANT,
      gasGiantClass: GasGiantClass.CLASS_III,
      atmosphereColor: "#4169E1",
      cloudColor: "#FFFFFF",
      cloudSpeed: 200,
      atmosphere: {
        composition: ["H2", "He", "CH4"],
        pressure: 1000000,
        type: AtmosphereType.VERY_DENSE,
        glowColor: "#4682B4",
        intensity: 0.8,
        power: 1.5,
        thickness: 0.3,
      },
      stormColor: "#0000CD",
      stormSpeed: 150,
      emissiveColor: "#4169E1",
      emissiveIntensity: 0.1,
      rings: [
        {
          innerRadius: 40900 * KM,
          outerRadius: 62930 * KM,
          density: 0.1,
          opacity: 0.1,
          color: "#AAAAAA",
          type: RockyType.DUST,
          texture: "textures/ring_dust.png",
          rotationRate: 0.001,
          composition: ["dust", "ice particles"],
        } as RingProperties,
      ],
    } as GasGiantProperties,
  });

  const tritonAxialTiltRad = NEPTUNE_AXIAL_TILT_DEG * DEG_TO_RAD;
  actions.addCelestial({
    id: "triton",
    name: "Triton",
    seed: "triton",
    type: CelestialType.MOON,
    parentId: neptuneId,
    realMass_kg: 2.139e22,
    realRadius_m: 1353400,
    temperature: 38,
    albedo: 0.76,
    siderealRotationPeriod_s: TRITON_SIDEREAL_ROTATION_PERIOD_S,
    axialTilt: new OSVector3(
      0,
      Math.cos(tritonAxialTiltRad),
      Math.sin(tritonAxialTiltRad),
    ).normalize(),
    orbit: {
      realSemiMajorAxis_m: TRITON_SMA_M,
      eccentricity: 0.000016,
      inclination: 156.885 * DEG_TO_RAD,
      longitudeOfAscendingNode: Math.random() * 2 * Math.PI,
      argumentOfPeriapsis: Math.random() * 2 * Math.PI,
      meanAnomaly: Math.random() * 2 * Math.PI,
      period_s: Math.abs(TRITON_SIDEREAL_ROTATION_PERIOD_S),
    },
    properties: {
      type: CelestialType.MOON,
      planetType: PlanetType.ICE,
      isMoon: true,
      parentPlanet: neptuneId,
      composition: ["nitrogen ice", "water ice", "carbon dioxide ice"],
      atmosphere: {
        glowColor: "#88AACC",
        intensity: 0.04,
        power: 0.5,
        thickness: 0.02,
      },
      surface: {
        type: SurfaceType.ICE_CRACKED,
        planetType: PlanetType.ICE,
        color: "#E0F0FF",
        roughness: 0.4,
        crackIntensity: 0.6,
        glossiness: 0.7,
        iceThickness: 300.0,
      },
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
    axialTilt: new OSVector3(0, 1, 0).normalize(),
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
    properties: {
      type: CelestialType.MOON,
      planetType: PlanetType.ICE,
      isMoon: true,
      parentPlanet: neptuneId,
      composition: ["water ice", "rock?"],
      shapeModel: "asteroid",
      atmosphere: {
        glowColor: "#444444",
        intensity: 0,
        power: 0,
        thickness: 0,
      },
      surface: {
        type: SurfaceType.VARIED,
        planetType: PlanetType.ICE,
        color: "#A0A0A8",
        roughness: 0.7,
        glossiness: 0.2,
        crackIntensity: 0.1,
        iceThickness: 5.0,
        persistence: 0.45,
        lacunarity: 2.1,
        simplePeriod: 5.0,
        octaves: 5,
        bumpScale: 0.8,
        color1: "#606070",
        color2: "#808090",
        color3: "#A0A0B0",
        color4: "#C0C0D0",
        color5: "#E0E0F0",
        height1: 0.0,
        height2: 0.3,
        height3: 0.5,
        height4: 0.7,
        height5: 0.85,
        shininess: 0.15,
        specularStrength: 0.1,
        ambientLightIntensity: 0.12,
        undulation: 0.05,
        terrainType: 2,
        terrainAmplitude: 0.3,
        terrainSharpness: 0.6,
        terrainOffset: 0.0,
      } as IceSurfaceProperties,
    } as PlanetProperties,
  });
}
