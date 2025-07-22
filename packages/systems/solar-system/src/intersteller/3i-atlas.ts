import { createOrbitalElements } from "@teskooano/core-physics";
import {
  CelestialType,
  CelestialStatus,
  CometProperties,
  CometClass,
  type CelestialObject,
} from "@teskooano/data-types";

/**
 * 3I/Atlas configuration object for modular solar system initialization.
 * The third confirmed interstellar object to pass through our solar system.
 * Discovered: June 19, 2025 by ATLAS (Asteroid Terrestrial-impact Last Alert System)
 *
 * Key characteristics:
 * - Hyperbolic trajectory (eccentricity > 1)
 * - Perihelion: 1.356973 AU (closest approach to sun on 2025-10-29)
 * - Semi-major axis: -0.263808 AU (negative for hyperbolic)
 * - Eccentricity: 6.144 (very high hyperbolic eccentricity)
 * - Inclination: 175.11° (retrograde and highly inclined)
 * - Interstellar origin (not from our solar system)
 * - Currently approaching perihelion (not past it yet)
 *
 * Physical properties:
 * - Dimensions: ~4-5 km diameter
 * - Rotation: ~16.79 hour rotation period
 * - Albedo: ~0.1 (dark surface)
 * - Composition: Likely rocky/icy interstellar object
 */
export const atlas: CelestialObject<CometProperties> = {
  id: "3i-atlas",
  name: "3I/Atlas",
  seed: "atlas_interstellar_2025",
  type: CelestialType.COMET,
  status: CelestialStatus.ACTIVE,
  parentId: "sun", // Orbits the sun during its passage
  realMass_kg: 1e12, // Estimated mass ~1 trillion kg (4-5 km diameter)
  realRadius_m: 2500, // Using the larger dimension as radius
  temperature: 150, // Cold interstellar object
  albedo: 0.1, // Dark surface as observed
  // Hyperbolic interstellar trajectory - approaching perihelion
  orbit: createOrbitalElements({
    semiMajorAxisAU: -0.2638075072502901, // Exact negative semi-major axis from JPL
    eccentricity: 6.143801080396786, // Exact eccentricity from JPL
    inclinationDeg: 175.1135021211714, // Exact inclination from JPL
    longitudeOfAscendingNodeDeg: 322.1644603784968, // Exact longitude of ascending node
    argumentOfPeriapsisDeg: 128.0073522006761, // Exact argument of periapsis
    meanAnomalyDeg: -796.3084239871376, // Exact mean anomaly from JPL
    period_s: 0, // No orbital period for hyperbolic trajectories
    siderealRotationPeriod_s: 16.79 * 3600, // ~16.79 hour rotation period
    axialTiltDeg: 0, // Tumbling object, no stable axial tilt
    epoch: "JD 2460868.5", // Epoch from JPL data (Jul 12, 2025)
  }),
  properties: {
    type: CelestialType.COMET,
    classType: CometClass.ACTIVE,
    activity: 0.9,
    composition: ["water ice", "dust"],
    visualComaRadius: 150000 * 0.5,
    visualComaColor: "#FFFFE0",
    visualMaxTailLength: 1.0,
    visualTailColor: "#FFFFE0",
  },
};
