import { DEG_TO_RAD } from "@teskooano/core-math";
import { AU, SOLAR_MASS, SOLAR_RADIUS } from "@teskooano/core-physics";
import { actions } from "@teskooano/core-state";
import {
  CelestialType,
  PlanetType,
  RockyTerrestrialSurfaceProperties,
  StellarType,
  SurfaceType,
  type AsteroidFieldProperties,
} from "@teskooano/data-types";

// Define JUPITER_MASS locally if not exported
const JUPITER_MASS_KG = 1.898e27;

/**
 * Initializes a multi-star system (e.g., Alpha Centauri analog).
 * NOTE: Physics for multi-star systems (especially stable planets) is complex.
 * This is a simplified representation for visualization.
 * Current physics engine might not handle true barycentric motion accurately.
 */
export function initializeMultiStarSystem(): string {
  // Star A (Primary G-type)
  const starAId = actions.createSolarSystem({
    id: "alpha-centauri-a",
    name: "Toliman (Alpha Centauri A)",
    type: CelestialType.STAR,
    seed: "toliman_seed",
    visualScaleRadius: 12.0,
    realMass_kg: 1.1 * SOLAR_MASS,
    realRadius_m: 1.22 * SOLAR_RADIUS,
    temperature: 5790,
    albedo: 0.3,
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
      spectralClass: "G2V",
      luminosity: 1.5,
      color: "#FFF4E1",
      stellarType: StellarType.MAIN_SEQUENCE_G,
    },
  });

  // Star B (Secondary K-type) orbiting Star A
  const starB_SMA_AU = 23.4;
  const starBId = "alpha-centauri-b";
  actions.addCelestial({
    id: starBId,
    name: "Rigil Kentaurus (Alpha Centauri B)",
    type: CelestialType.STAR,
    seed: "rigil_kentaurus_seed",
    visualScaleRadius: 10.0,
    realMass_kg: 0.9 * SOLAR_MASS,
    realRadius_m: 0.86 * SOLAR_RADIUS,
    parentId: starAId,
    orbit: {
      realSemiMajorAxis_m: starB_SMA_AU * AU,
      eccentricity: 0.518, // Highly eccentric binary orbit
      inclination: 79.2 * DEG_TO_RAD,
      longitudeOfAscendingNode: 204.85 * DEG_TO_RAD,
      argumentOfPeriapsis: 231.65 * DEG_TO_RAD,
      meanAnomaly: Math.random() * 2 * Math.PI,
      period_s: 2.518e9, // Approx 79.9 years
    },
    temperature: 5260,
    albedo: 0.3,
    properties: {
      type: CelestialType.STAR,
      isMainStar: false,
      spectralClass: "K1V",
      luminosity: 0.5,
      color: "#FFCC99",
      stellarType: StellarType.MAIN_SEQUENCE,
    },
  });

  // Proxima Centauri (Red Dwarf) orbiting the A-B pair (very far out)
  const proximaSMA_AU = 13000; // Very distant orbit
  const proximaId = "proxima-centauri"; // Store ID
  actions.addCelestial({
    id: proximaId,
    name: "Proxima Centauri",
    type: CelestialType.STAR,
    seed: "proxima_seed",
    visualScaleRadius: 2.0,
    realMass_kg: 0.12 * SOLAR_MASS,
    realRadius_m: 0.15 * SOLAR_RADIUS,
    parentId: starAId, // Orbiting the barycenter, approximated as Star A
    orbit: {
      realSemiMajorAxis_m: proximaSMA_AU * AU,
      eccentricity: 0.05,
      inclination: 130 * DEG_TO_RAD,
      longitudeOfAscendingNode: Math.random() * 2 * Math.PI,
      argumentOfPeriapsis: Math.random() * 2 * Math.PI,
      meanAnomaly: Math.random() * 2 * Math.PI,
      period_s: 1.7e13, // Approx 550,000 years
    },
    temperature: 3042,
    albedo: 0.3,
    properties: {
      type: CelestialType.STAR,
      isMainStar: false,
      spectralClass: "M5.5Ve",
      luminosity: 0.0017,
      color: "#FF6666", // Reddish
      stellarType: StellarType.MAIN_SEQUENCE, // Red Dwarf is Main Sequence M
    },
  });

  // Hypothetical Planet orbiting Star A (Toliman)
  const tolimanPlanetSMA_AU = 1.2;
  actions.addCelestial({
    id: "toliman-b",
    name: "Toliman b",
    type: CelestialType.PLANET,
    seed: "toliman_b_seed",
    visualScaleRadius: 0.8,
    realMass_kg: 1.5 * 5.97237e24,
    realRadius_m: 1.1 * 6371000,
    parentId: starAId,
    orbit: {
      realSemiMajorAxis_m: tolimanPlanetSMA_AU * AU,
      eccentricity: 0.08,
      inclination: 5 * DEG_TO_RAD,
      longitudeOfAscendingNode: Math.random() * 2 * Math.PI,
      argumentOfPeriapsis: Math.random() * 2 * Math.PI,
      meanAnomaly: Math.random() * 2 * Math.PI,
      period_s: 4.1e7, // Approx 1.3 years
    },
    temperature: 280,
    albedo: 0.32,
    atmosphere: {
      composition: ["N2", "O2"],
      pressure: 0.9,
      color: "#ADD8E6",
    },
    surface: {
      type: SurfaceType.VARIED,
      planetType: PlanetType.TERRESTRIAL,
      color: "#556B2F", // Dark Olive Green land
      secondaryColor: "#6495ED", // Cornflower Blue water
      roughness: 0.4,
    } as RockyTerrestrialSurfaceProperties,
    properties: {
      type: CelestialType.PLANET,
      isMoon: false,
      composition: ["silicates", "iron"],
    },
  });

  // Hypothetical Planet orbiting Star B (Rigil Kentaurus)
  const rigilPlanetSMA_AU = 0.7;
  actions.addCelestial({
    id: "rigil-kentaurus-b",
    name: "Rigil Kentaurus b",
    type: CelestialType.PLANET,
    seed: "rigil_b_seed",
    visualScaleRadius: 0.6,
    realMass_kg: 0.8 * 5.97237e24,
    realRadius_m: 0.9 * 6371000,
    parentId: starBId,
    orbit: {
      realSemiMajorAxis_m: rigilPlanetSMA_AU * AU,
      eccentricity: 0.05,
      inclination: 10 * DEG_TO_RAD,
      longitudeOfAscendingNode: Math.random() * 2 * Math.PI,
      argumentOfPeriapsis: Math.random() * 2 * Math.PI,
      meanAnomaly: Math.random() * 2 * Math.PI,
      period_s: 2.1e7, // Approx 0.67 years
    },
    temperature: 310,
    albedo: 0.28,
    atmosphere: {
      composition: ["CO2", "N2"],
      pressure: 1.5,
      color: "#F5F5DC", // Beige/Yellowish
    },
    surface: {
      type: SurfaceType.CANYONOUS,
      planetType: PlanetType.ROCKY,
      color: "#B8860B", // Dark Goldenrod
      secondaryColor: "#8B4513", // Saddle Brown
      roughness: 0.6,
    } as RockyTerrestrialSurfaceProperties,
    properties: {
      type: CelestialType.PLANET,
      isMoon: false,
      composition: ["silicates", "sulfur?"],
    },
  });

  // Hypothetical Planet orbiting Proxima Centauri (Proxima b analog)
  const proximaPlanetSMA_AU = 0.05;
  actions.addCelestial({
    id: "proxima-centauri-b",
    name: "Proxima Centauri b",
    type: CelestialType.PLANET,
    seed: "proxima_b_seed",
    visualScaleRadius: 0.5,
    realMass_kg: 1.2 * 5.97237e24,
    realRadius_m: 1.1 * 6371000,
    parentId: proximaId,
    orbit: {
      realSemiMajorAxis_m: proximaPlanetSMA_AU * AU,
      eccentricity: 0.02,
      inclination: 2 * DEG_TO_RAD,
      longitudeOfAscendingNode: Math.random() * 2 * Math.PI,
      argumentOfPeriapsis: Math.random() * 2 * Math.PI,
      meanAnomaly: Math.random() * 2 * Math.PI,
      period_s: 9.6e5, // Approx 11 days
    },
    temperature: 234,
    albedo: 0.2,
    atmosphere: {
      composition: ["N2", "CO2?"],
      pressure: 0.8,
      color: "#E6E6FA", // Lavender haze?
    },
    surface: {
      type: SurfaceType.CRATERED,
      planetType: PlanetType.TERRESTRIAL,
      color: "#6A5ACD", // Slate Blue rock
      secondaryColor: "#FFFAFA", // Frost/Ice?
      roughness: 0.5,
    } as RockyTerrestrialSurfaceProperties,
    properties: {
      type: CelestialType.PLANET,
      isMoon: false,
      composition: ["silicates", "iron", "ice?"],
    },
  });

  // ---- Added Asteroid Field Around Star A ----
  const asteroidFieldInnerAU_A = 3.5;
  const asteroidFieldOuterAU_A = 4.5;
  actions.addCelestial({
    id: "asteroid-field-star-a",
    name: "Toliman Belt",
    type: CelestialType.ASTEROID_FIELD,
    seed: "toliman_belt_seed",
    visualScaleRadius: 0.05, // Small visual scale for field center
    realMass_kg: 5e21, // Mass guess
    realRadius_m: asteroidFieldOuterAU_A * AU, // Outer radius for reference
    parentId: starAId,
    orbit: {
      // Orbit around Star A
      realSemiMajorAxis_m:
        ((asteroidFieldInnerAU_A + asteroidFieldOuterAU_A) / 2) * AU,
      eccentricity: 0.1,
      inclination: 8 * DEG_TO_RAD,
      longitudeOfAscendingNode: Math.random() * 2 * Math.PI,
      argumentOfPeriapsis: Math.random() * 2 * Math.PI,
      meanAnomaly: Math.random() * 2 * Math.PI,
      period_s: 8.5e7, // Approx 2.7 years
    },
    temperature: 180, // Approx K
    properties: {
      type: CelestialType.ASTEROID_FIELD,
      innerRadiusAU: asteroidFieldInnerAU_A,
      outerRadiusAU: asteroidFieldOuterAU_A,
      heightAU: 0.3,
      count: 8000,
      color: "#A0522D",
      composition: ["silicates", "carbon"],
      visualDensity: 80,
    } as AsteroidFieldProperties,
  });
  // ---------------------------------------------

  return starAId; // Return the primary star ID
}
