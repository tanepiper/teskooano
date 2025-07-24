import { createOrbitalElements } from "@teskooano/core-physics";
import {
  CelestialType,
  CelestialStatus,
  CometProperties,
  type CelestialObject,
  CometClass,
} from "@teskooano/data-types";

/**
 * 2I/Borisov configuration object for modular solar system initialization.
 * The second confirmed interstellar object to pass through our solar system.
 * Discovered: August 30, 2019 by Gennadiy Borisov
 *
 * Key characteristics:
 * - Hyperbolic trajectory (eccentricity > 1)
 * - Perihelion: 2.006521 AU (closest approach to sun on 2019-Dec-08)
 * - Semi-major axis: -0.851492 AU (negative for hyperbolic)
 * - Eccentricity: 3.356 (high hyperbolic eccentricity)
 * - Inclination: 44.05° (moderately inclined)
 * - Interstellar origin (not from our solar system)
 * - Has already passed perihelion and is leaving the solar system
 *
 * Physical properties:
 * - Dimensions: ~0.5-1 km diameter
 * - Rotation: Unknown rotation period
 * - Albedo: ~0.1 (dark surface)
 * - Composition: Rocky/icy interstellar object with significant dust activity
 */
export const borisov: CelestialObject<CometProperties> = {
  id: "2i-borisov",
  name: "2I/Borisov",
  seed: "borisov_interstellar_2019",
  type: CelestialType.COMET,
  status: CelestialStatus.ACTIVE,
  parentId: "sun", // Orbits the sun during its passage
  realMass_kg: 1e11, // Estimated mass ~100 billion kg (0.5-1 km diameter)
  realRadius_m: 750, // Using the larger dimension as radius
  temperature: 150, // Cold interstellar object
  albedo: 0.1, // Dark surface as observed
  // Hyperbolic interstellar trajectory - has passed perihelion
  orbit: createOrbitalElements({
    semiMajorAxisAU: -0.8514922551937886, // Exact negative semi-major axis from JPL
    eccentricity: 3.356475782676596, // Exact eccentricity from JPL
    inclinationDeg: 44.05264247909138, // Exact inclination from JPL
    longitudeOfAscendingNodeDeg: 308.1477292269942, // Exact longitude of ascending node
    argumentOfPeriapsisDeg: 209.1236864378081, // Exact argument of periapsis
    meanAnomalyDeg: 34.4294703072178, // Exact mean anomaly from JPL
    period_s: 0, // No orbital period for hyperbolic trajectories
    siderealRotationPeriod_s: 24 * 3600, // Unknown rotation, using 24 hours as default
    axialTiltDeg: 0, // Tumbling object, no stable axial tilt
    epoch: "JD 2458853.5", // Epoch from JPL data (2020-Jan-05.0)
  }),
  properties: {
    type: CelestialType.COMET,
    classType: CometClass.INTERSTELLAR,
    activity: 0.8,
    composition: ["water ice", "dust", "organic compounds"],
    discoveredDate: "2019-08-30",
    visualComaRadius: 100000,
    visualComaColor: "#FFFFE0",
    visualMaxTailLength: 8.0,
    visualTailColor: "#FFFFE0",
    visualComaOpacity: 0.4,
  },
};
