import { type OrbitalParameters } from "@teskooano/data-types";
import { OSVector3, EPSILON } from "@teskooano/core-math";
import { GRAVITATIONAL_CONSTANT as G } from "../units/constants";
import { vectorPool } from "../utils/vectorPool";

/**
 * Calculates orbital elements from state vectors (position and velocity).
 * Assumes input vectors are relative to the central body and in SI units (meters, m/s).
 * Assumes a Y-up coordinate system where the reference plane is the XZ plane.
 *
 * @param relativePosition_m The position vector of the orbiting body relative to the central body (m).
 * @param relativeVelocity_mps The velocity vector of the orbiting body relative to the central body (m/s).
 * @param parentMass_kg The mass of the central body (kg).
 * @returns An object containing the calculated OrbitalParameters (angles in radians, distances in meters), omitting period_s and meanAnomaly,
 *          or null if the calculation fails (e.g., degenerate orbit).
 */
export function calculateElementsFromStateVectors(
  relativePosition_m: OSVector3,
  relativeVelocity_mps: OSVector3,
  parentMass_kg: number,
): Omit<OrbitalParameters, "period_s" | "meanAnomaly"> | null {
  if (parentMass_kg <= 0) {
    console.error(
      "[calculateElementsFromStateVectors] Parent mass must be positive.",
    );
    return null;
  }

  const mu = G * parentMass_kg;

  const rVec = relativePosition_m;
  const vVec = relativeVelocity_mps;

  const r = rVec.length();
  const v = vVec.length();

  if (r < EPSILON || v < EPSILON) {
    console.warn(
      "[calculateElementsFromStateVectors] Near-zero position or velocity, cannot calculate elements.",
    );
    return null;
  }

  const hVec = vectorPool.get();
  hVec.copy(rVec).cross(vVec);
  const h = hVec.length();

  if (h < EPSILON) {
    console.warn(
      "[calculateElementsFromStateVectors] Near-zero angular momentum (potentially radial trajectory), cannot calculate full elements.",
    );
    vectorPool.release(hVec);
    return null;
  }

  const nVec = vectorPool.get();
  const kHat = vectorPool.get(0, 1, 0);
  nVec.copy(kHat).cross(hVec);
  const n = nVec.length();

  const eVec = vectorPool.get();
  const term1 = vectorPool
    .get()
    .copy(vVec)
    .cross(hVec)
    .multiplyScalar(1 / mu);
  const term2 = vectorPool
    .get()
    .copy(rVec)
    .multiplyScalar(1 / r);
  eVec.copy(term1).sub(term2);
  const eccentricity = eVec.length();

  const energy = (v * v) / 2 - mu / r;

  let semiMajorAxis_m: number;
  if (Math.abs(eccentricity - 1.0) < EPSILON) {
    semiMajorAxis_m = (h * h) / mu;
    console.warn(
      "[calculateElementsFromStateVectors] Parabolic orbit detected (e ≈ 1).",
    );
  } else if (eccentricity > 1.0) {
    semiMajorAxis_m = -mu / (2 * energy);
    console.warn(
      `[calculateElementsFromStateVectors] Hyperbolic orbit detected (e=${eccentricity}).`,
    );
  } else {
    semiMajorAxis_m = -mu / (2 * energy);
  }

  if (semiMajorAxis_m < EPSILON && eccentricity < 1.0) {
    console.warn(
      "[calculateElementsFromStateVectors] Calculated semi-major axis is near zero for a bound orbit. Check inputs.",
    );

    vectorPool.release(hVec);
    vectorPool.release(nVec);
    vectorPool.release(kHat);
    vectorPool.release(eVec);
    vectorPool.release(term1);
    vectorPool.release(term2);
    return null;
  }

  const inclination = Math.acos(hVec.y / h);

  let longitudeOfAscendingNode: number;
  if (n < EPSILON) {
    longitudeOfAscendingNode = 0;
  } else {
    longitudeOfAscendingNode = Math.acos(nVec.x / n);
    if (nVec.z < 0) {
      longitudeOfAscendingNode = 2 * Math.PI - longitudeOfAscendingNode;
    }
  }

  let argumentOfPeriapsis: number;
  if (eccentricity < EPSILON) {
    argumentOfPeriapsis = 0;
  } else {
    if (n < EPSILON) {
      argumentOfPeriapsis = Math.acos(eVec.x / eccentricity);
      if (eVec.z < 0) {
        argumentOfPeriapsis = 2 * Math.PI - argumentOfPeriapsis;
      }
    } else {
      argumentOfPeriapsis = Math.acos(nVec.dot(eVec) / (n * eccentricity));
      if (eVec.y < 0) {
        argumentOfPeriapsis = 2 * Math.PI - argumentOfPeriapsis;
      }
    }
  }

  let trueAnomaly: number;
  if (eccentricity < EPSILON) {
    if (n < EPSILON) {
      trueAnomaly = Math.acos(rVec.x / r);
      if (rVec.z < 0) {
        trueAnomaly = 2 * Math.PI - trueAnomaly;
      }
    } else {
      trueAnomaly = Math.acos(nVec.dot(rVec) / (n * r));
      if (rVec.y < 0) {
        trueAnomaly = 2 * Math.PI - trueAnomaly;
      }
    }
  } else {
    const rDotV = rVec.dot(vVec);
    trueAnomaly = Math.acos(eVec.dot(rVec) / (eccentricity * r));
    if (rDotV < 0) {
      trueAnomaly = 2 * Math.PI - trueAnomaly;
    }
  }

  vectorPool.release(hVec);
  vectorPool.release(nVec);
  vectorPool.release(kHat);
  vectorPool.release(eVec);
  vectorPool.release(term1);
  vectorPool.release(term2);

  return {
    realSemiMajorAxis_m: semiMajorAxis_m,
    eccentricity: eccentricity,
    inclination: inclination,
    longitudeOfAscendingNode: longitudeOfAscendingNode,
    argumentOfPeriapsis: argumentOfPeriapsis,
  };
}
