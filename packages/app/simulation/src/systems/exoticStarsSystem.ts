import { actions } from "@teskooano/core-state";
import {
  CelestialType,
  GasGiantClass,
  StellarType,
  SCALE,
  PlanetType,
  SurfaceType,
  RockyType,
  StarProperties,
  PlanetProperties,
  AsteroidFieldProperties,
  GasGiantProperties,
  DesertSurfaceProperties,
  type LavaSurfaceProperties,
  type IceSurfaceProperties,
  type RockyTerrestrialSurfaceProperties,
} from "@teskooano/data-types";
import { SOLAR_MASS, SOLAR_RADIUS, AU, KM } from "@teskooano/core-physics";
import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";

const JUPITER_MASS = 1.898e27;

/**
 * Initialize a system showcasing exotic stellar objects
 * Includes: Neutron Star, White Dwarf, Wolf-Rayet Star,
 * Schwarzschild Black Hole, and Kerr Black Hole
 */
export function initializeExoticStarsSystem() {
  const largeOrbitDistanceAU = 100.0;
  const largeOrbitDistance = largeOrbitDistanceAU * SCALE.RENDER_SCALE_AU;

  const neutronStarId = actions.createSolarSystem({
    id: "pulsar-1",
    name: "Crab Pulsar",
    type: CelestialType.STAR,
    seed: "pulsar_seed",
    visualScaleRadius: 0.1,
    realMass_kg: 1.4 * SOLAR_MASS,
    realRadius_m: 10 * KM,
    temperature: 600000,
    albedo: 0.1,
    orbit: {
      realSemiMajorAxis_m: 0,
      eccentricity: 0,
      inclination: 0,
      longitudeOfAscendingNode: 0,
      argumentOfPeriapsis: 0,
      meanAnomaly: 0,
      period_s: 0,
    },
    properties: {
      type: CelestialType.STAR,
      isMainStar: true,
      spectralClass: "X",
      luminosity: 30000,
      color: "#DCECFF",
      stellarType: StellarType.NEUTRON_STAR,
    } as StarProperties,
  });

  const pulsarPlanetSMA_AU = 0.3;
  actions.addCelestial({
    id: "pulsar-1-planet",
    name: "Pulsar Planet",
    type: CelestialType.PLANET,
    seed: "pulsar_planet_seed",
    visualScaleRadius: 0.5,
    realMass_kg: 5.97237e24,
    realRadius_m: 6371000,
    parentId: neutronStarId,
    orbit: {
      realSemiMajorAxis_m: 0.3 * AU,
      eccentricity: 0.03,
      inclination: 10 * DEG_TO_RAD,
      longitudeOfAscendingNode: Math.random() * 2 * Math.PI,
      argumentOfPeriapsis: Math.random() * 2 * Math.PI,
      meanAnomaly: Math.random() * 2 * Math.PI,
      period_s: 5.8e5,
    },
    temperature: 900,
    albedo: 0.2,
    atmosphere: {
      composition: ["heavy elements"],
      pressure: 0.0001,
      color: "#FF69B4",
    },
    surface: {
      type: SurfaceType.VOLCANIC,
      planetType: PlanetType.LAVA,
      color: "#4B0082",
      lavaColor: "#FF1493",
      roughness: 0.9,
    } as LavaSurfaceProperties,
    properties: {
      type: CelestialType.PLANET,
      isMoon: false,
      composition: ["iron", "neutronium crust?"],
    } as PlanetProperties,
  });

  const whiteDwarfSMA_AU = largeOrbitDistanceAU;
  const whiteDwarfId = "sirius-b";
  actions.addCelestial({
    id: whiteDwarfId,
    name: "Sirius B",
    type: CelestialType.STAR,
    seed: "sirius_b_seed",
    visualScaleRadius: 0.15,
    realMass_kg: 0.6 * SOLAR_MASS,
    realRadius_m: 0.008 * SOLAR_RADIUS,
    parentId: neutronStarId,
    orbit: {
      realSemiMajorAxis_m: whiteDwarfSMA_AU * AU,
      eccentricity: 0.02,
      inclination: 5 * DEG_TO_RAD,
      longitudeOfAscendingNode: Math.random() * 2 * Math.PI,
      argumentOfPeriapsis: Math.random() * 2 * Math.PI,
      meanAnomaly: Math.random() * 2 * Math.PI,
      period_s: 6.3e9,
    },
    temperature: 25000,
    properties: {
      type: CelestialType.STAR,
      isMainStar: false,
      spectralClass: "DA",
      luminosity: 0.025,
      color: "#F0F8FF",
      stellarType: StellarType.WHITE_DWARF,
    } as StarProperties,
  });

  const debrisDiskSMA_AU = 0.2;
  const debrisDiskInnerAU = 0.15;
  const debrisDiskOuterAU = 0.25;
  const debrisDiskHeightAU = 0.01;
  actions.addCelestial({
    id: "white-dwarf-debris",
    name: "Stellar Debris Disk",
    type: CelestialType.ASTEROID_FIELD,
    seed: "debris_disk_seed",
    visualScaleRadius: 0.01,
    realMass_kg: 1.0e22,
    realRadius_m: (debrisDiskOuterAU - debrisDiskInnerAU) * AU,
    parentId: whiteDwarfId,
    orbit: {
      realSemiMajorAxis_m: debrisDiskSMA_AU * AU,
      eccentricity: 0.12,
      inclination: 0.18,
      longitudeOfAscendingNode: Math.random() * 2 * Math.PI,
      argumentOfPeriapsis: Math.random() * 2 * Math.PI,
      meanAnomaly: Math.random() * 2 * Math.PI,
      period_s: 1.5e4,
    },
    properties: {
      type: CelestialType.ASTEROID_FIELD,
      innerRadiusAU: debrisDiskInnerAU,
      outerRadiusAU: debrisDiskOuterAU,
      heightAU: debrisDiskHeightAU,
      count: 500,
      color: "#D3D3D3",
      composition: ["silicates", "metals"],
      visualDensity: 500,
    } as AsteroidFieldProperties,
  });

  const wolfRayetSMA_AU = largeOrbitDistanceAU * 0.9;
  const wolfRayetId = "wr-124";
  actions.addCelestial({
    id: wolfRayetId,
    name: "WR 124",
    type: CelestialType.STAR,
    seed: "wr124_seed",
    visualScaleRadius: 8.0,
    realMass_kg: 20 * SOLAR_MASS,
    realRadius_m: 5 * SOLAR_RADIUS,
    parentId: neutronStarId,
    orbit: {
      realSemiMajorAxis_m: wolfRayetSMA_AU * AU,
      eccentricity: 0.03,
      inclination: 8 * DEG_TO_RAD,
      longitudeOfAscendingNode: Math.random() * 2 * Math.PI,
      argumentOfPeriapsis: Math.random() * 2 * Math.PI,
      meanAnomaly: Math.random() * 2 * Math.PI,
      period_s: 5.6e9,
    },
    temperature: 50000,
    properties: {
      type: CelestialType.STAR,
      isMainStar: false,
      spectralClass: "WN",
      luminosity: 200000,
      color: "#E6E6FA",
      stellarType: StellarType.WOLF_RAYET,
    } as StarProperties,
  });

  const wrPlanetSMA_AU = 1.5;
  actions.addCelestial({
    id: "wr-124-planet",
    name: "WR 124b",
    type: CelestialType.GAS_GIANT,
    seed: "wr124b_seed",
    visualScaleRadius: 3.0,
    realMass_kg: 2 * JUPITER_MASS,
    realRadius_m: 1.2 * 69911000,
    parentId: wolfRayetId,
    orbit: {
      realSemiMajorAxis_m: wrPlanetSMA_AU * AU,
      eccentricity: 0.1,
      inclination: 2 * DEG_TO_RAD,
      longitudeOfAscendingNode: Math.random() * 2 * Math.PI,
      argumentOfPeriapsis: Math.random() * 2 * Math.PI,
      meanAnomaly: Math.random() * 2 * Math.PI,
      period_s: 8e6,
    },
    temperature: 700,
    albedo: 0.25,
    properties: {
      type: CelestialType.GAS_GIANT,
      gasGiantClass: GasGiantClass.CLASS_II,
      atmosphereColor: "#FFE4C4",
      cloudColor: "#FFFFFF",
      cloudSpeed: 220,
    } as GasGiantProperties,
  });

  const schwarzschildSMA_AU = largeOrbitDistanceAU;
  const schwarzschildId = "sgr-a";
  actions.addCelestial({
    id: schwarzschildId,
    name: "Sagittarius A*",
    type: CelestialType.STAR,
    seed: "sgr_a_seed",
    visualScaleRadius: 0.2,
    realMass_kg: 4.0e6 * SOLAR_MASS,
    realRadius_m: 1.2e10,
    parentId: neutronStarId,
    orbit: {
      realSemiMajorAxis_m: schwarzschildSMA_AU * AU,
      eccentricity: 0.04,
      inclination: 12 * DEG_TO_RAD,
      longitudeOfAscendingNode: Math.random() * 2 * Math.PI,
      argumentOfPeriapsis: Math.random() * 2 * Math.PI,
      meanAnomaly: Math.random() * 2 * Math.PI,
      period_s: 6.3e9,
    },
    temperature: 0,
    properties: {
      type: CelestialType.STAR,
      isMainStar: false,
      spectralClass: "BH",
      luminosity: 0,
      color: "#000000",
      stellarType: StellarType.BLACK_HOLE,
    } as StarProperties,
  });

  const s2StarSMA_AU = 0.001;
  actions.addCelestial({
    id: "s2-star",
    name: "S2 Star",
    type: CelestialType.STAR,
    seed: "s2_star_seed",
    visualScaleRadius: 5.0,
    realMass_kg: 10 * SOLAR_MASS,
    realRadius_m: 7 * SOLAR_RADIUS,
    parentId: schwarzschildId,
    orbit: {
      realSemiMajorAxis_m: s2StarSMA_AU * AU,
      eccentricity: 0.88,
      inclination: 135 * DEG_TO_RAD,
      longitudeOfAscendingNode: Math.random() * 2 * Math.PI,
      argumentOfPeriapsis: Math.random() * 2 * Math.PI,
      meanAnomaly: Math.random() * 2 * Math.PI,
      period_s: 5e8,
    },
    temperature: 20000,
    properties: {
      type: CelestialType.STAR,
      isMainStar: false,
      spectralClass: "B",
      luminosity: 15000,
      color: "#AABFFF",
      stellarType: StellarType.MAIN_SEQUENCE,
    },
  });

  const kerrOrbitSMA_AU = largeOrbitDistanceAU * 1.1;
  const kerrId = "cygnus-x1";
  actions.addCelestial({
    id: kerrId,
    name: "Cygnus X-1",
    type: CelestialType.STAR,
    seed: "cygnus_x1_seed",
    visualScaleRadius: 0.15,
    realMass_kg: 15 * SOLAR_MASS,
    realRadius_m: 44 * KM,
    parentId: neutronStarId,
    orbit: {
      realSemiMajorAxis_m: kerrOrbitSMA_AU * AU,
      eccentricity: 0.05,
      inclination: 10 * DEG_TO_RAD,
      longitudeOfAscendingNode: Math.random() * 2 * Math.PI,
      argumentOfPeriapsis: Math.random() * 2 * Math.PI,
      meanAnomaly: Math.random() * 2 * Math.PI,
      period_s: 6.9e9,
    },
    temperature: 0,
    properties: {
      type: CelestialType.STAR,
      isMainStar: false,
      spectralClass: "BH",
      luminosity: 0,
      color: "#000000",
      stellarType: StellarType.KERR_BLACK_HOLE,
    },
  });

  const hdeStarSMA_AU = 0.2;
  actions.addCelestial({
    id: "hde-226868",
    name: "HDE 226868",
    type: CelestialType.STAR,
    seed: "hde_seed",
    visualScaleRadius: 15.0,
    realMass_kg: 19 * SOLAR_MASS,
    realRadius_m: 20 * SOLAR_RADIUS,
    parentId: kerrId,
    orbit: {
      realSemiMajorAxis_m: hdeStarSMA_AU * AU,
      eccentricity: 0.02,
      inclination: 2 * DEG_TO_RAD,
      longitudeOfAscendingNode: Math.random() * 2 * Math.PI,
      argumentOfPeriapsis: Math.random() * 2 * Math.PI,
      meanAnomaly: Math.random() * 2 * Math.PI,
      period_s: 4.8e5,
    },
    temperature: 30000,
    properties: {
      type: CelestialType.STAR,
      isMainStar: false,
      spectralClass: "O9.7Iab",
      luminosity: 200000,
      color: "#9DB4FF",
      stellarType: StellarType.MAIN_SEQUENCE,
    },
  });

  return neutronStarId;
}
