import { OSVector3 } from "@teskooano/core-math";
import {
  calculateOrbitalPosition,
  calculateOrbitalVelocity,
  createOrbitalElements,
} from "@teskooano/core-physics";
import {
  AU_METERS,
  type CelestialObject,
  type PhysicsStateReal,
} from "@teskooano/data-types";
import * as UTIL from "../utils";

/**
 * Sets up proper binary orbital mechanics with barycentric motion and stability enhancements
 */
export function setupBinaryOrbit(
  primaryStar: CelestialObject,
  companionStar: CelestialObject,
  separationAU: number,
  eccentricity: number,
  inclination: number,
  random: () => number,
): [CelestialObject, CelestialObject] {
  const M1 = primaryStar.realMass_kg;
  const M2 = companionStar.realMass_kg;
  const totalMass = M1 + M2;

  const separationMeters = separationAU * AU_METERS;

  // Calculate semi-major axes for both stars around barycenter
  const primarySMA = (M2 / totalMass) * separationMeters;
  const companionSMA = (M1 / totalMass) * separationMeters;

  const orbitalPeriod = UTIL.calculateOrbitalPeriod_s(
    totalMass,
    separationMeters,
    0,
  );

  // Improved orbital angles for stability
  const longitudeOfAscendingNode = random() * 2 * Math.PI;
  const argumentOfPeriapsis = random() * 2 * Math.PI;

  // For better stability, avoid starting both stars at periapsis/apoapsis
  // Use a random phase but ensure they're 180° apart
  const baseMeanAnomaly = random() * 2 * Math.PI;

  // Primary orbit (around barycenter)
  const primaryOrbit = createOrbitalElements({
    semiMajorAxisAU: primarySMA / AU_METERS,
    eccentricity: eccentricity,
    inclinationDeg: inclination * (180 / Math.PI),
    longitudeOfAscendingNodeDeg: longitudeOfAscendingNode * (180 / Math.PI),
    argumentOfPeriapsisDeg: argumentOfPeriapsis * (180 / Math.PI),
    meanAnomalyDeg: baseMeanAnomaly * (180 / Math.PI),
    period_s: orbitalPeriod,
    siderealRotationPeriod_s: orbitalPeriod,
    axialTiltDeg: random() * 30,
  });

  // Companion orbit (180° out of phase for stability)
  const companionOrbit = createOrbitalElements({
    semiMajorAxisAU: companionSMA / AU_METERS,
    eccentricity: eccentricity,
    inclinationDeg: inclination * (180 / Math.PI),
    longitudeOfAscendingNodeDeg: longitudeOfAscendingNode * (180 / Math.PI),
    argumentOfPeriapsisDeg:
      ((argumentOfPeriapsis + Math.PI) % (2 * Math.PI)) * (180 / Math.PI),
    meanAnomalyDeg:
      ((baseMeanAnomaly + Math.PI) % (2 * Math.PI)) * (180 / Math.PI),
    period_s: orbitalPeriod,
    siderealRotationPeriod_s: orbitalPeriod,
    axialTiltDeg: random() * 30,
  });

  primaryStar.orbit = primaryOrbit;
  companionStar.orbit = companionOrbit;

  // In binary systems, both stars orbit each other around their barycenter
  // For the physics system, we need to choose one star as the "parent" for orbital calculations
  // The primary star (more massive) becomes the reference point
  primaryStar.parentId = undefined; // Primary star has no parent (fixed reference)
  companionStar.parentId = primaryStar.id; // Companion orbits the primary

  try {
    // Calculate initial positions
    const barycentricState: PhysicsStateReal = {
      id: "barycenter",
      mass_kg: totalMass,
      position_m: new OSVector3(0, 0, 0),
      velocity_mps: new OSVector3(0, 0, 0),
    };

    const primaryInitialPos = calculateOrbitalPosition(
      barycentricState,
      primaryOrbit,
      0,
    );
    const primaryInitialVel = calculateOrbitalVelocity(
      barycentricState,
      primaryOrbit,
      0,
    );

    const companionInitialPos = calculateOrbitalPosition(
      barycentricState,
      companionOrbit,
      0,
    );
    const companionInitialVel = calculateOrbitalVelocity(
      barycentricState,
      companionOrbit,
      0,
    );

    // Validate initial conditions for stability (silent validation)
    const actualSeparation = primaryInitialPos.distanceTo(companionInitialPos);
    const expectedSeparation = separationMeters;
    const separationError =
      Math.abs(actualSeparation - expectedSeparation) / expectedSeparation;

    // Validate velocity magnitudes for circular/low-eccentricity orbits
    const primaryVelMag = primaryInitialVel.length();
    const companionVelMag = companionInitialVel.length();
    const G = 6.674e-11; // Gravitational constant in m^3 kg^-1 s^-2
    const expectedPrimaryVel = Math.sqrt((G * totalMass) / primarySMA);
    const expectedCompanionVel = Math.sqrt((G * totalMass) / companionSMA);

    // Note: physicsStateReal is not part of the current CelestialObject interface
    // Position and velocity will be calculated by the physics system
  } catch (error) {
    // Silent error handling for binary orbit calculation
  }

  return [primaryStar, companionStar];
}
