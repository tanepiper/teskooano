import { DEG_TO_RAD } from "@teskooano/core-math";
import { AU, KM } from "@teskooano/core-physics";
import { actions } from "@teskooano/core-state";
import {
  CelestialType,
  IceSurfaceProperties,
  PlanetType,
  SurfaceType,
} from "@teskooano/data-types";

// --- Pluto Constants (NASA Planetary Fact Sheet / JPL HORIZONS J2000) ---
const PLUTO_MASS_KG = 1.303e22;
const PLUTO_RADIUS_M = 1188300; // Mean radius
const PLUTO_TEMP_K = 44; // Surface Temperature (Mean)
const PLUTO_ALBEDO = 0.58; // Geometric Albedo (average)
const PLUTO_SMA_AU = 39.482;
const PLUTO_ECC = 0.2488;
const PLUTO_INC_DEG = 17.16;
const PLUTO_LAN_DEG = 110.3;
const PLUTO_AOP_DEG = 224.07;
const PLUTO_MA_DEG = 238.93; // Mean Anomaly at J2000 Epoch
const PLUTO_SIDEREAL_PERIOD_S = 7.824e9; // Sidereal Orbit Period (~248 years)
const PLUTO_AXIAL_TILT_DEG = 119.59; // Obliquity to Orbit (Retrograde rotation implied)

// --- Charon Constants (NASA) ---
const CHARON_MASS_KG = 1.586e21;
const CHARON_RADIUS_M = 606000; // Mean radius
const CHARON_SMA_M = 19591.4 * KM; // Semi-major axis around Pluto-Charon barycenter (distance from Pluto is slightly less)
const CHARON_ECC = 0.00005; // Nearly circular relative orbit
const CHARON_INC_DEG = 0.001; // Inclination relative to Pluto's equator (very low)
const CHARON_SIDEREAL_PERIOD_S = 551855; // ~6.387 days (Tidally locked with Pluto's rotation)
const CHARON_ALBEDO = 0.38;

/**
 * Initializes Pluto and its largest moon Charon using accurate data.
 */
export function initializePluto(parentId: string): void {
  const plutoId = "pluto"; // Define Pluto's ID

  // --- Initialize Pluto (Dwarf Planet) ---
  actions.addCelestial({
    id: plutoId,
    name: "Pluto",
    seed: "pluto",
    type: CelestialType.DWARF_PLANET, // Correct classification
    parentId: parentId,
    realMass_kg: PLUTO_MASS_KG,
    realRadius_m: PLUTO_RADIUS_M,
    visualScaleRadius: 0.18, // Changed from radius
    temperature: PLUTO_TEMP_K,
    albedo: PLUTO_ALBEDO,
    orbit: {
      realSemiMajorAxis_m: PLUTO_SMA_AU * AU,
      eccentricity: PLUTO_ECC,
      inclination: PLUTO_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: PLUTO_LAN_DEG * DEG_TO_RAD,
      argumentOfPeriapsis: (PLUTO_AOP_DEG - PLUTO_LAN_DEG) * DEG_TO_RAD, // Calculate AOP from Lon of Peri
      meanAnomaly: PLUTO_MA_DEG * DEG_TO_RAD,
      period_s: PLUTO_SIDEREAL_PERIOD_S,
    },
    atmosphere: {
      // Tenuous, variable nitrogen/methane/CO atmosphere
      composition: ["N2", "CH4", "CO"],
      pressure: 1e-5, // Approx pressure in microbars (very low)
      color: "#E0FFFF80", // Very faint light cyan haze
    },
    surface: {
      type: SurfaceType.ICE_FLATS, // Represents varied terrain (Sputnik Planitia, etc.)
      planetType: PlanetType.ICE,
      color: "#FFF8DC", // Cornsilk / pale yellow base (Nitrogen ice)
      secondaryColor: "#DAA520", // Goldenrod/brownish (Tholins)
      roughness: 0.4,
      glossiness: 0.6,
    } as IceSurfaceProperties,
    properties: {
      type: CelestialType.DWARF_PLANET,
      isMoon: false,
      composition: [
        "nitrogen ice",
        "water ice",
        "methane ice",
        "rock",
        "tholins",
      ],
    },
  });

  // --- Initialize Charon ---
  actions.addCelestial({
    id: "charon",
    name: "Charon",
    seed: "charon",
    type: CelestialType.MOON,
    parentId: plutoId, // Pluto is the parent
    realMass_kg: CHARON_MASS_KG,
    realRadius_m: CHARON_RADIUS_M,
    visualScaleRadius: 0.09, // Changed from radius
    temperature: 53, // Approx surface K
    albedo: CHARON_ALBEDO,
    orbit: {
      realSemiMajorAxis_m: CHARON_SMA_M,
      eccentricity: CHARON_ECC,
      inclination: CHARON_INC_DEG * DEG_TO_RAD, // Relative to Pluto's equator
      // LAN, AOP, MA are often randomized or set to 0 for tidally locked moons
      longitudeOfAscendingNode: Math.random() * 2 * Math.PI,
      argumentOfPeriapsis: Math.random() * 2 * Math.PI,
      meanAnomaly: Math.random() * 2 * Math.PI,
      period_s: CHARON_SIDEREAL_PERIOD_S,
    },
    atmosphere: { composition: [], pressure: 0, color: "#00000000" }, // Effectively no atmosphere
    surface: {
      type: SurfaceType.CRATERED, // Less varied than Pluto, more cratered
      planetType: PlanetType.ICE,
      color: "#B0B0B0", // Greyish water ice
      secondaryColor: "#8B4513", // Reddish-brown polar cap (Mordor Macula)
      roughness: 0.6,
    } as IceSurfaceProperties,
    properties: {
      type: CelestialType.MOON,
      isMoon: true,
      parentPlanet: plutoId,
      composition: ["water ice", "ammonia ice", "rock"],
    },
  });

  // TODO: Add other moons (Styx, Nix, Kerberos, Hydra) if needed
}
