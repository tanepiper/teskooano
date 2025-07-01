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
      planetType: GasGiantClass.CLASS_III,
      gasGiantClass: GasGiantClass.CLASS_III,
      atmosphere: {
        atmosphereColor: "#3F5D9A",
        cloudColor: "#FFFFFF",
        cloudSpeed: 200,
        stormSpeed: 150,
        emissiveColor: "#3F5D9A1A",
        emissiveIntensity: 0.08,
      },
      rings: [
        {
          innerRadius: NEPTUNE_REAL_RADIUS_M * 1.7,
          outerRadius: NEPTUNE_REAL_RADIUS_M * 1.701,
          density: 0.05,
          opacity: 0.1,
          color: "#A0A0B0",
          type: RockyType.DUST,
          texture: "textures/ring_dust_tenuous.png",
          rotationRate: 0.002,
          composition: ["dust"],
        },
        {
          innerRadius: NEPTUNE_REAL_RADIUS_M * 2.15,
          outerRadius: NEPTUNE_REAL_RADIUS_M * 2.151,
          density: 0.1,
          opacity: 0.2,
          color: "#A0A0B0",
          type: RockyType.DUST,
          texture: "textures/ring_dust_tenuous.png",
          rotationRate: 0.0018,
          composition: ["dust", "small rocks"],
        },
        {
          innerRadius: NEPTUNE_REAL_RADIUS_M * 2.29,
          outerRadius: NEPTUNE_REAL_RADIUS_M * 2.56,
          density: 0.2,
          opacity: 0.3,
          color: "#9090A0",
          type: RockyType.DUST,
          texture: "textures/ring_dust_broad.png",
          rotationRate: 0.0015,
          composition: ["dark dust"],
        },
        {
          innerRadius: NEPTUNE_REAL_RADIUS_M * 2.56,
          outerRadius: NEPTUNE_REAL_RADIUS_M * 2.561,
          density: 0.08,
          opacity: 0.15,
          color: "#B0B0C0",
          type: RockyType.DUST,
          texture: "textures/ring_dust_tenuous.png",
          rotationRate: 0.0014,
          composition: ["dark dust"],
        },
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
    properties: {
      type: CelestialType.MOON,
      planetType: PlanetType.BARREN,
      isMoon: true,
      parentPlanet: neptuneId,
      composition: ["nitrogen ice", "water ice", "methane ice", "rocky core"],
      atmosphere: {
        glowColor: "#F0FFF0",
        intensity: 0.05,
        power: 0.6,
        thickness: 0.02,
      },
      surface: {
        type: SurfaceType.VARIED,
        color: "#E0F0F0",
        roughness: 0.5,
        planetType: PlanetType.BARREN,
        persistence: 0.53,
        lacunarity: 2.14,
        simplePeriod: 0.87,
        octaves: 8,
        bumpScale: 10,
        color1: "#B0C0D0",
        color2: "#D0E0F0",
        color3: "#E0F0F0",
        color4: "#F0F8FF",
        color5: "#FFFFFF",
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
    properties: {
      type: CelestialType.MOON,
      planetType: PlanetType.BARREN,
      isMoon: true,
      parentPlanet: neptuneId,
      composition: ["water ice", "rock?"],
      shapeModel: "asteroid",
      atmosphere: {
        glowColor: "#444400",
        intensity: 0,
        power: 0,
        thickness: 0,
      },
      surface: {
        // Base surface properties
        type: SurfaceType.CRATERED,
        color: "#A0A0A8", // Dark gray
        roughness: 0.7,
        planetType: PlanetType.BARREN,
        // Nereid asteroid-like procedural properties
        persistence: 0.55,
        lacunarity: 2.3,
        simplePeriod: 3.2,
        octaves: 10,
        bumpScale: 3.0,
        color1: "#606068", // Dark base
        color2: "#808088", // Medium gray
        color3: "#A0A0A8", // Nereid's surface
        color4: "#C0C0C8", // Lighter areas
        color5: "#D0D0D8", // Brightest spots
        height1: 0.08,
        height2: 0.25,
        height3: 0.45,
        height4: 0.7,
        height5: 0.9,
        shininess: 8,
        specularStrength: 0.2,
        ambientLightIntensity: 0.3,
        undulation: 0.35,
        terrainType: 2,
        terrainAmplitude: 1.0,
        terrainSharpness: 1.8,
        terrainOffset: -0.1,
      },
    } as PlanetProperties,
  });
}
