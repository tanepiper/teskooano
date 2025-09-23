import { createOrbitalElements } from "@teskooano/core-physics";
import { type CelestialObject } from "@teskooano/data-types";
import { AU_METERS } from "@teskooano/data-values";
import * as UTIL from "../utils-functions";

/**
 * Sets up proper binary orbital mechanics with both stars orbiting around their common barycenter
 * This is physically accurate for n-body simulations
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

  // Calculate orbital period for the binary system
  const orbitalPeriod = UTIL.calculateOrbitalPeriod_s(
    totalMass, // Use total mass for binary orbital period
    separationMeters,
    0, // Not used for binary period calculation
  );

  // Improved orbital angles for stability
  const longitudeOfAscendingNode = random() * 2 * Math.PI;
  const argumentOfPeriapsis = random() * 2 * Math.PI;
  const baseMeanAnomaly = random() * 2 * Math.PI;

  // Calculate semi-major axes for each star relative to barycenter
  // Primary star (more massive) is closer to barycenter
  const primarySMA = (M2 / totalMass) * separationMeters;
  const companionSMA = (M1 / totalMass) * separationMeters;

  // Both stars orbit around the barycenter (which we'll treat as the "parent")
  // Primary star orbit around barycenter
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

  // Companion star orbit around barycenter (180° out of phase)
  const companionOrbit = createOrbitalElements({
    semiMajorAxisAU: companionSMA / AU_METERS,
    eccentricity: eccentricity,
    inclinationDeg: inclination * (180 / Math.PI),
    longitudeOfAscendingNodeDeg: longitudeOfAscendingNode * (180 / Math.PI),
    argumentOfPeriapsisDeg: argumentOfPeriapsis * (180 / Math.PI),
    meanAnomalyDeg: (baseMeanAnomaly + Math.PI) % (2 * Math.PI), // 180° out of phase
    period_s: orbitalPeriod,
    siderealRotationPeriod_s: orbitalPeriod,
    axialTiltDeg: random() * 30,
  });

  // Set orbits for both stars
  primaryStar.orbit = primaryOrbit;
  companionStar.orbit = companionOrbit;

  // Both stars orbit around the barycenter (no parent for now)
  // The barycenter will be handled by the physics system
  primaryStar.parentId = undefined;
  companionStar.parentId = undefined;

  return [primaryStar, companionStar];
}
