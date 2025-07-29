import {
  CelestialType,
  StellarType,
  CelestialStatus,
  type StarProperties,
  type CelestialObject,
} from "@teskooano/data-types";
import { createOrbitalElements, kmToM } from "@teskooano/core-physics";

/**
 * Sun configuration object for modular solar system initialization.
 * Data primarily sourced from NASA Planetary Fact Sheet & JPL Horizons.
 */
export const sun: CelestialObject<StarProperties> = {
  id: "sun",
  name: "Sun",
  seed: "sun_seed_string_111",
  type: CelestialType.STAR,
  status: CelestialStatus.ACTIVE,
  parentId: undefined, // Sun has no parent
  realMass_kg: 1.9885e30,
  realRadius_m: kmToM(696340),
  temperature: 5778,
  albedo: 0.3,
  orbit: createOrbitalElements({
    semiMajorAxisAU: 0, // Sun is at the center of the system
    eccentricity: 0,
    inclinationDeg: 0,
    longitudeOfAscendingNodeDeg: 0,
    argumentOfPeriapsisDeg: 0,
    meanAnomalyDeg: 0,
    period_s: 0, // Zero period indicates stationary central body
    siderealRotationPeriod_s: 25.05 * 24 * 3600, // Solar rotation period (~25 days)
    axialTiltDeg: 0,
  }),
  properties: {
    type: CelestialType.STAR,
    isMainStar: true,
    spectralClass: "G2V",
    luminosity: 1.0,
    color: "#FFF5E1", // Slightly warmer solar white
    hotColor: "#FFFF99", // Bright yellow-white for hot plasma zones
    surfaceColor: "#FFF5E1", // Normal solar surface color
    coolColor: "#CC7700", // Orange-brown for sunspots and cool areas
    stellarType: StellarType.MAIN_SEQUENCE,
    // Add required stellar properties for physics-based calculations
    age_years: 4.6e9, // 4.6 billion years (current solar age)
    metallicity: 0.0, // Solar metallicity by definition ([Fe/H] = 0.0)

    // Enhanced material parameters for realistic solar appearance
    materialParams: {
      // Plasma noise parameters for simple effects
      noiseScale: 1.0,
      noiseIntensity: 0.2,
      plasmaTurbulence: 0.1,

      // Uniform lighting
      lightingIntensity: 1.2,
    },

    // Visual effects configuration
    visualEffects: {
      // Enable major solar phenomena but keep them subtle
      enableGranulation: true,
      enableSunspots: true,
      enableProminences: true,
      enableSolarFlares: true,
      enableCoronalMassEjections: true,

      // Solar rotation characteristics
      rotationPeriod: 25.05, // ~25 days at equator
      differentialRotation: true, // Sun rotates faster at equator
      poleEquatorRatio: 0.85, // Poles rotate ~15% slower

      // Solar variability
      stellarPulsation: false, // Sun is not a variable star
      variableStarType: "none" as const,
      pulsationPeriod: 0,
      pulsationAmplitude: 0,

      // Magnetic field effects
      magneticFieldLines: true,
      coronalHoles: true,
      activeRegions: true,
    },
  },
};
