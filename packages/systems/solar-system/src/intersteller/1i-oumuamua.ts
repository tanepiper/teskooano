import { createOrbitalElements } from "@teskooano/core-physics";
import {
  CelestialType,
  CelestialStatus,
  CometProperties,
  CometClass,
  type CelestialObject,
} from "@teskooano/data-types";

/**
 * 1I/ʻOumuamua configuration object for modular solar system initialization.
 * The first confirmed interstellar object to pass through our solar system.
 * Discovered: October 19, 2017 by Robert Weryk using Pan-STARRS 1
 *
 * Key characteristics:
 * - Hyperbolic trajectory (eccentricity > 1)
 * - Perihelion: 0.255916 AU (closest approach to sun)
 * - Semi-major axis: -1.2723 AU (negative for hyperbolic)
 * - Eccentricity: 1.20113
 * - Inclination: 122.74° (highly inclined)
 * - Interstellar origin (not from our solar system)
 *
 * Physical properties:
 * - Dimensions: ~115m × 111m × 19m (cigar-shaped)
 * - Rotation: Tumbling (non-principal axis rotation)
 * - Albedo: ~0.1 (dark surface)
 * - Composition: Likely rocky/icy interstellar object
 */
export const oumuamua: CelestialObject<CometProperties> = {
  id: "1i-oumuamua",
  name: "1I/ʻOumuamua",
  seed: "oumuamua_interstellar_2017",
  type: CelestialType.COMET,
  status: CelestialStatus.ACTIVE,
  parentId: "sun", // Orbits the sun during its passage
  realMass_kg: 1e9, // Estimated mass ~1 billion kg
  realRadius_m: 115, // Using the larger dimension as radius
  temperature: 200, // Cold interstellar object
  albedo: 0.1, // Dark surface as observed
  // Hyperbolic interstellar trajectory
  orbit: createOrbitalElements({
    semiMajorAxisAU: -1.27234500742808, // Actual semi-major axis at epoch (Nov 23, 2017) - negative for hyperbolic
    eccentricity: 1.20113, // Hyperbolic eccentricity
    inclinationDeg: 122.74, // Highly inclined orbit
    longitudeOfAscendingNodeDeg: 24.597,
    argumentOfPeriapsisDeg: 241.811,
    meanAnomalyDeg: 51.1576, // Position at epoch (Nov 23, 2017) - ~75 days post-perihelion
    period_s: 0, // No orbital period for hyperbolic trajectories
    siderealRotationPeriod_s: 8.1 * 3600, // ~8.1 hour rotation period
    axialTiltDeg: 0, // Tumbling object, no stable axial tilt
    epoch: "JD 2458080.5",
  }),
  ignorePhysics: false,
  ignoreCollisions: true,
  properties: {
    type: CelestialType.COMET,
    classType: CometClass.EXTINCT, // No outgassing observed
    composition: ["interstellar_object", "rocky", "icy"],
    activity: 0.0, // No outgassing activity
    visualComaRadius: 0,
    visualComaColor: "#2a2a2a",
    visualComaOpacity: 0,
    visualMaxTailLength: 0,
    visualTailColor: "#2a2a2a",
    visualTailOpacity: 0,
    visuals: {
      darkColorMultiplier: 0.1, // Dark surface as observed
      lightColorMultiplier: 0.3,
      fbmScale: 0.5,
      fineFbmScale: 2.0,
      fineFbmMix: 0.7,
      ambientStrength: 0.2,
    },
  },
};
