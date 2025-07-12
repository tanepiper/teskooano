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

  const positionVector = relativePosition_m;
  const velocityVector = relativeVelocity_mps;

  const positionMagnitude = positionVector.length();
  const velocityMagnitude = velocityVector.length();

  if (positionMagnitude < EPSILON || velocityMagnitude < EPSILON) {
    console.warn(
      "[calculateElementsFromStateVectors] Near-zero position or velocity, cannot calculate elements.",
    );
    return null;
  }

  const angularMomentumVector = vectorPool.get();
  angularMomentumVector.copy(positionVector).cross(velocityVector);
  const angularMomentumMagnitude = angularMomentumVector.length();

  if (angularMomentumMagnitude < EPSILON) {
    console.warn(
      "[calculateElementsFromStateVectors] Near-zero angular momentum (potentially radial trajectory), cannot calculate full elements.",
    );
    vectorPool.release(angularMomentumVector);
    return null;
  }

  const nodeVector = vectorPool.get();
  const yAxisVector = vectorPool.get(0, 1, 0);
  nodeVector.copy(yAxisVector).cross(angularMomentumVector);
  const nodeMagnitude = nodeVector.length();

  const eccentricityVector = vectorPool.get();
  const term1 = vectorPool
    .get()
    .copy(velocityVector)
    .cross(angularMomentumVector)
    .multiplyScalar(1 / mu);
  const term2 = vectorPool
    .get()
    .copy(positionVector)
    .multiplyScalar(1 / positionMagnitude);
  eccentricityVector.copy(term1).sub(term2);
  const eccentricity = eccentricityVector.length();

  const energy =
    (velocityMagnitude * velocityMagnitude) / 2 - mu / positionMagnitude;

  let semiMajorAxis_m: number;
  if (Math.abs(eccentricity - 1.0) < EPSILON) {
    semiMajorAxis_m =
      (angularMomentumMagnitude * angularMomentumMagnitude) / mu;
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

    vectorPool.release(angularMomentumVector);
    vectorPool.release(nodeVector);
    vectorPool.release(yAxisVector);
    vectorPool.release(eccentricityVector);
    vectorPool.release(term1);
    vectorPool.release(term2);
    return null;
  }

  const inclination = Math.acos(
    angularMomentumVector.y / angularMomentumMagnitude,
  );

  let longitudeOfAscendingNode: number;
  if (nodeMagnitude < EPSILON) {
    longitudeOfAscendingNode = 0;
  } else {
    longitudeOfAscendingNode = Math.acos(nodeVector.x / nodeMagnitude);
    if (nodeVector.z < 0) {
      longitudeOfAscendingNode = 2 * Math.PI - longitudeOfAscendingNode;
    }
  }

  let argumentOfPeriapsis: number;
  if (eccentricity < EPSILON) {
    argumentOfPeriapsis = 0;
  } else {
    if (nodeMagnitude < EPSILON) {
      argumentOfPeriapsis = Math.acos(eccentricityVector.x / eccentricity);
      if (eccentricityVector.z < 0) {
        argumentOfPeriapsis = 2 * Math.PI - argumentOfPeriapsis;
      }
    } else {
      argumentOfPeriapsis = Math.acos(
        nodeVector.dot(eccentricityVector) / (nodeMagnitude * eccentricity),
      );
      if (eccentricityVector.y < 0) {
        argumentOfPeriapsis = 2 * Math.PI - argumentOfPeriapsis;
      }
    }
  }

  let trueAnomaly: number;
  if (eccentricity < EPSILON) {
    if (nodeMagnitude < EPSILON) {
      trueAnomaly = Math.acos(positionVector.x / positionMagnitude);
      if (positionVector.z < 0) {
        trueAnomaly = 2 * Math.PI - trueAnomaly;
      }
    } else {
      trueAnomaly = Math.acos(
        nodeVector.dot(positionVector) / (nodeMagnitude * positionMagnitude),
      );
      if (positionVector.y < 0) {
        trueAnomaly = 2 * Math.PI - trueAnomaly;
      }
    }
  } else {
    const positionDotVelocity = positionVector.dot(velocityVector);
    trueAnomaly = Math.acos(
      eccentricityVector.dot(positionVector) /
        (eccentricity * positionMagnitude),
    );
    if (positionDotVelocity < 0) {
      trueAnomaly = 2 * Math.PI - trueAnomaly;
    }
  }

  vectorPool.release(angularMomentumVector);
  vectorPool.release(nodeVector);
  vectorPool.release(yAxisVector);
  vectorPool.release(eccentricityVector);
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
