import { type OrbitalParameters } from '@teskooano/data-types';
import { OSVector3, EPSILON } from '@teskooano/core-math';
import { GRAVITATIONAL_CONSTANT as G } from '../units/constants';
import { vectorPool } from '../utils/vectorPool';

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
  parentMass_kg: number
): Omit<OrbitalParameters, 'period_s' | 'meanAnomaly'> | null {
  if (parentMass_kg <= 0) {
    console.error('[calculateElementsFromStateVectors] Parent mass must be positive.');
    return null;
  }

  const mu = G * parentMass_kg; // Standard gravitational parameter (m^3/s^2)

  const rVec = relativePosition_m; // Alias for clarity
  const vVec = relativeVelocity_mps; // Alias for clarity

  const r = rVec.length(); // Distance magnitude (m)
  const v = vVec.length(); // Speed magnitude (m/s)

  if (r < EPSILON || v < EPSILON) {
    console.warn('[calculateElementsFromStateVectors] Near-zero position or velocity, cannot calculate elements.');
    return null; // Avoid division by zero or unstable calculations
  }

  // 1. Specific Angular Momentum Vector (h)
  const hVec = vectorPool.get();
  hVec.copy(rVec).cross(vVec);
  const h = hVec.length();

  if (h < EPSILON) {
    console.warn('[calculateElementsFromStateVectors] Near-zero angular momentum (potentially radial trajectory), cannot calculate full elements.');
    vectorPool.release(hVec);
    return null; // Rectilinear orbit
  }

  // 2. Node Vector (n)
  // Points towards the ascending node
  const nVec = vectorPool.get();
  const kHat = vectorPool.get(0, 1, 0); // Reference vector (Y-axis for XZ reference plane)
  nVec.copy(kHat).cross(hVec);
  const n = nVec.length();

  // 3. Eccentricity Vector (e)
  // Points towards periapsis
  const eVec = vectorPool.get();
  const term1 = vectorPool.get().copy(vVec).cross(hVec).multiplyScalar(1 / mu);
  const term2 = vectorPool.get().copy(rVec).multiplyScalar(1 / r);
  eVec.copy(term1).sub(term2);
  const eccentricity = eVec.length();

  // 4. Specific Mechanical Energy (ε)
  const energy = (v * v) / 2 - mu / r;

  // 5. Semi-major Axis (a)
  let semiMajorAxis_m: number;
  if (Math.abs(eccentricity - 1.0) < EPSILON) { // Parabolic orbit
    // semiMajorAxis_m = Infinity; // Technically infinite
    semiMajorAxis_m = h * h / mu; // Parameter p for parabola
     console.warn('[calculateElementsFromStateVectors] Parabolic orbit detected (e ≈ 1).');
     // Can decide to return null or specific parabolic parameters if needed
  } else if (eccentricity > 1.0) { // Hyperbolic orbit
    semiMajorAxis_m = -mu / (2 * energy); // Negative for hyperbola
    console.warn(`[calculateElementsFromStateVectors] Hyperbolic orbit detected (e=${eccentricity}).`);
     // Can decide to return null or specific hyperbolic parameters if needed
  } else { // Elliptical orbit (including circular)
    semiMajorAxis_m = -mu / (2 * energy);
  }
  
  if (semiMajorAxis_m < EPSILON && eccentricity < 1.0) { // Prevent issues with near-zero SMA for bound orbits
     console.warn('[calculateElementsFromStateVectors] Calculated semi-major axis is near zero for a bound orbit. Check inputs.');
     // Release vectors individually
     vectorPool.release(hVec);
     vectorPool.release(nVec);
     vectorPool.release(kHat);
     vectorPool.release(eVec);
     vectorPool.release(term1);
     vectorPool.release(term2);
     return null;
  }

  // 6. Inclination (i)
  // Angle between orbital plane (normal h) and reference plane (normal kHat Y-axis)
  const inclination = Math.acos(hVec.y / h); // hVec.y is component normal to XZ plane

  // 7. Longitude of Ascending Node (Ω)
  let longitudeOfAscendingNode: number;
  if (n < EPSILON) { // Equatorial orbit (n is zero vector)
    longitudeOfAscendingNode = 0; // Convention: Set to 0 for equatorial
    // For equatorial, Argument/Longitude of Periapsis is measured from X-axis
  } else {
    // Angle between reference direction (X-axis) and node vector (n)
    longitudeOfAscendingNode = Math.acos(nVec.x / n); 
    if (nVec.z < 0) { // If node vector points towards negative Z in XZ plane
      longitudeOfAscendingNode = 2 * Math.PI - longitudeOfAscendingNode;
    }
  }

  // 8. Argument of Periapsis (ω)
  let argumentOfPeriapsis: number;
  if (eccentricity < EPSILON) { // Circular orbit
      argumentOfPeriapsis = 0; // Undefined, set to 0 by convention
  } else { // Elliptical, Parabolic, Hyperbolic
      if (n < EPSILON) { // Equatorial orbit
          // Angle between reference direction (X-axis) and eccentricity vector (e)
          argumentOfPeriapsis = Math.acos(eVec.x / eccentricity);
          if (eVec.z < 0) { // Check component in the reference plane (Z here)
              argumentOfPeriapsis = 2 * Math.PI - argumentOfPeriapsis;
          }
      } else { // Inclined orbit
          // Angle between node vector (n) and eccentricity vector (e)
          argumentOfPeriapsis = Math.acos(nVec.dot(eVec) / (n * eccentricity));
          if (eVec.y < 0) { // Check component normal to the reference plane (Y here)
              argumentOfPeriapsis = 2 * Math.PI - argumentOfPeriapsis;
          }
      }
  }

  // 9. True Anomaly (ν)
  // Angle between eccentricity vector (e) and position vector (r)
  let trueAnomaly: number;
  if (eccentricity < EPSILON) { // Circular orbit
      if (n < EPSILON) { // Circular Equatorial
          // Angle between reference direction (X-axis) and position vector
          trueAnomaly = Math.acos(rVec.x / r);
          if (rVec.z < 0) { // Check component in reference plane (Z here)
              trueAnomaly = 2 * Math.PI - trueAnomaly;
          }
      } else { // Circular Inclined
          // Argument of Latitude: angle between ascending node (n) and position vector
          trueAnomaly = Math.acos(nVec.dot(rVec) / (n * r));
          if (rVec.y < 0) { // Check component normal to reference plane (Y here)
              trueAnomaly = 2 * Math.PI - trueAnomaly;
          }
      }
  } else { // Non-circular orbits
      const rDotV = rVec.dot(vVec);
      trueAnomaly = Math.acos(eVec.dot(rVec) / (eccentricity * r));
      if (rDotV < 0) { // If object is moving towards the central body
          trueAnomaly = 2 * Math.PI - trueAnomaly;
      }
  }


  // Release temporary vectors individually
  vectorPool.release(hVec);
  vectorPool.release(nVec);
  vectorPool.release(kHat);
  vectorPool.release(eVec);
  vectorPool.release(term1);
  vectorPool.release(term2);

  // Return elements (ensure angles are in radians)
  return {
    realSemiMajorAxis_m: semiMajorAxis_m,
    eccentricity: eccentricity,
    inclination: inclination, // Radians
    longitudeOfAscendingNode: longitudeOfAscendingNode, // Radians
    argumentOfPeriapsis: argumentOfPeriapsis, // Radians
    // trueAnomaly: trueAnomaly // Omit trueAnomaly as it's not in the type
    // NOTE: meanAnomaly and period_s are omitted as they require further calculation/context
  };
}
