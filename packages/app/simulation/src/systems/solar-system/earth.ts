import { DEG_TO_RAD } from "@teskooano/core-math";
import { AU } from "@teskooano/core-physics";
import { actions } from "@teskooano/core-state";
import {
  CelestialType,
  OceanSurfaceProperties,
  PlanetType,
  SurfaceType,
  type PlanetProperties,
  type RockyTerrestrialSurfaceProperties,
} from "@teskooano/data-types";

// --- Earth Constants (NASA Planetary Fact Sheet / JPL HORIZONS J2000) ---
const EARTH_MASS_KG = 5.97237e24;
const EARTH_RADIUS_M = 6371000; // Volumetric mean radius
const EARTH_TEMP_K = 288; // Mean surface temperature
const EARTH_ALBEDO = 0.306; // Geometric Albedo
const EARTH_SMA_AU = 1.0; // Defined as 1 AU
const EARTH_ECC = 0.01671;
const EARTH_INC_DEG = 0.00005; // Very small inclination relative to ecliptic plane
const EARTH_LAN_DEG = -11.26064; // Longitude of Ascending Node (J2000)
const EARTH_AOP_DEG = 102.94719; // Argument of Perihelion (Longitude of Perihelion - LAN)
const EARTH_MA_DEG = 100.46435; // Mean Anomaly at J2000 Epoch
const EARTH_SIDEREAL_PERIOD_S = 3.15581e7; // Sidereal Orbit Period (~365.256 days)
const EARTH_AXIAL_TILT_DEG = 23.43928; // Obliquity to Orbit

// --- Moon (Luna) Constants (NASA Planetary Fact Sheet / JPL HORIZONS J2000) ---
const LUNA_MASS_KG = 7.342e22;
const LUNA_RADIUS_M = 1737400; // Mean radius
const LUNA_SMA_M = 384399000; // Semi-major axis around Earth
const LUNA_ECC = 0.0549;
const LUNA_INC_DEG = 5.145; // Inclination to Ecliptic (average)
const LUNA_LAN_DEG = 125.08; // Mean Longitude of Ascending Node (approx, varies)
const LUNA_AOP_DEG = 318.15; // Mean Argument of Perigee (approx, varies)
const LUNA_MA_DEG = 115.36; // Mean Mean Anomaly (approx, varies)
const LUNA_SIDEREAL_PERIOD_S = 2.36059e6; // Sidereal Orbit Period (~27.32 days)
const LUNA_AXIAL_TILT_DEG = 6.687; // Relative to its orbital plane around Earth
const LUNA_ALBEDO = 0.136; // Geometric Albedo

/**
 * Initializes Earth and its Moon (Luna) using accurate data.
 */
export function initializeEarth(parentId: string): void {
  const earthId = "earth"; // Define Earth's ID

  // --- Initialize Earth ---
  actions.addCelestial({
    id: earthId,
    name: "Earth",
    seed: "earth",
    type: CelestialType.PLANET,
    parentId: parentId,
    realMass_kg: EARTH_MASS_KG,
    realRadius_m: EARTH_RADIUS_M,
    visualScaleRadius: 1.0, // Earth is the reference scale
    temperature: EARTH_TEMP_K,
    albedo: EARTH_ALBEDO,
    orbit: {
      realSemiMajorAxis_m: EARTH_SMA_AU * AU,
      eccentricity: EARTH_ECC,
      inclination: EARTH_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: EARTH_LAN_DEG * DEG_TO_RAD,
      argumentOfPeriapsis: EARTH_AOP_DEG * DEG_TO_RAD,
      meanAnomaly: EARTH_MA_DEG * DEG_TO_RAD,
      period_s: EARTH_SIDEREAL_PERIOD_S,
    },
    atmosphere: {
      composition: ["N2", "O2", "Ar", "H2O", "CO2"],
      pressure: 1.013, // Standard atmosphere pressure in atm
      color: "#87CEEB", // Sky blue
    },
    surface: {
      type: SurfaceType.OCEAN, // Represent Earth primarily as an ocean planet
      planetType: PlanetType.OCEAN,
      color: "#1E90FF", // Base blue for oceans
      oceanColor: "#1E90FF", // Dodger blue
      deepOceanColor: "#00008B", // Dark blue
      landColor: "#228B22", // Forest green
      landRatio: 0.29, // Approx 29% land coverage
      waveHeight: 0.1, // Visual parameter
      roughness: 0.4, // Overall roughness
    } as OceanSurfaceProperties,
    properties: {
      type: CelestialType.PLANET,
      isMoon: false,
      composition: ["silicates", "iron core", "water"],
      axialTiltDeg: EARTH_AXIAL_TILT_DEG,
      seed: "earth_seed_36525",
    } as PlanetProperties,
  });

  // --- Initialize Moon (Luna) ---
  actions.addCelestial({
    id: "luna",
    name: "Moon",
    type: CelestialType.MOON,
    seed: "luna",
    parentId: earthId, // Earth is the parent
    realMass_kg: LUNA_MASS_KG,
    realRadius_m: LUNA_RADIUS_M,
    visualScaleRadius: 0.27, // Relative visual scale to Earth (approx)
    temperature: 250, // Average temp (large variations)
    albedo: LUNA_ALBEDO,
    orbit: {
      realSemiMajorAxis_m: LUNA_SMA_M,
      eccentricity: LUNA_ECC,
      inclination: LUNA_INC_DEG * DEG_TO_RAD, // Use inclination relative to ecliptic for consistency? Check simulation needs.
      longitudeOfAscendingNode: LUNA_LAN_DEG * DEG_TO_RAD,
      argumentOfPeriapsis: LUNA_AOP_DEG * DEG_TO_RAD,
      meanAnomaly: LUNA_MA_DEG * DEG_TO_RAD,
      period_s: LUNA_SIDEREAL_PERIOD_S,
    },
    atmosphere: {
      composition: ["Ar", "He", "Na", "K"], // Extremely tenuous exosphere
      pressure: 3e-15,
      color: "#CCCCCC00", // Transparent
    },
    surface: {
      type: SurfaceType.CRATERED,
      planetType: PlanetType.ROCKY,
      color: "#BEBEBE", // Light grey
      roughness: 0.7,
      // Detailed procedural colors
      color1: "#BEBEBE",
      color2: "#A9A9A9",
      color3: "#D3D3D3",
      color4: "#808080",
      color5: "#E5E5E5",
      transition2: 0.3,
      transition3: 0.5,
      transition4: 0.7,
      transition5: 0.9,
      blend12: 0.1,
      blend23: 0.1,
      blend34: 0.1,
      blend45: 0.1,
    } as RockyTerrestrialSurfaceProperties,
    properties: {
      type: CelestialType.MOON,
      isMoon: true,
      parentPlanet: earthId,
      composition: ["silicates", "anorthosite", "basalt"],
      axialTiltDeg: LUNA_AXIAL_TILT_DEG,
      seed: "luna_seed_2732",
    } as PlanetProperties,
  });
}
