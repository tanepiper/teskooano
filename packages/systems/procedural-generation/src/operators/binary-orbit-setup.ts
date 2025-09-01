import { createOrbitalElements } from "@teskooano/core-physics";
import { type CelestialObject } from "@teskooano/data-types";
import { AU_METERS } from "@teskooano/data-values";
import * as UTIL from "../utils-functions";

/**
 * Sets up proper binary orbital mechanics with the main star at the origin
 * and companion stars orbiting around it
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

  // Main star stays at origin (0,0,0) - no orbit needed
  // Companion star orbits around the main star at the specified separation
  const companionSMA = separationMeters;

  const orbitalPeriod = UTIL.calculateOrbitalPeriod_s(
    M1, // Use primary star mass for orbital calculations
    separationMeters,
    M2, // Companion star mass
  );

  // Improved orbital angles for stability
  const longitudeOfAscendingNode = random() * 2 * Math.PI;
  const argumentOfPeriapsis = random() * 2 * Math.PI;
  const baseMeanAnomaly = random() * 2 * Math.PI;

  // Main star has no orbit (stays at origin)
  primaryStar.orbit = {
    realSemiMajorAxis_m: 0,
    eccentricity: 0,
    inclination: 0,
    longitudeOfAscendingNode: 0,
    argumentOfPeriapsis: 0,
    meanAnomaly: 0,
    period_s: 0,
    siderealRotationPeriod_s: 0,
    realAphelion_m: 0,
    realPerihelion_m: 0,
    averageOrbitalSpeed_mps: 0,
    epoch: "J2000",
  };

  // Companion orbit around the main star
  const companionOrbit = createOrbitalElements({
    semiMajorAxisAU: companionSMA / AU_METERS,
    eccentricity: eccentricity,
    inclinationDeg: inclination * (180 / Math.PI),
    longitudeOfAscendingNodeDeg: longitudeOfAscendingNode * (180 / Math.PI),
    argumentOfPeriapsisDeg: argumentOfPeriapsis * (180 / Math.PI),
    meanAnomalyDeg: baseMeanAnomaly * (180 / Math.PI),
    period_s: orbitalPeriod,
    siderealRotationPeriod_s: orbitalPeriod,
    axialTiltDeg: random() * 30,
  });

  companionStar.orbit = companionOrbit;

  // Main star has no parent (fixed at origin)
  primaryStar.parentId = undefined;
  // Companion orbits the main star
  companionStar.parentId = primaryStar.id;

  return [primaryStar, companionStar];
}
