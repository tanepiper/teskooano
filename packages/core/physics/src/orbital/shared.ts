import type { OrbitalParameters } from "@teskooano/data-types";
import { OSQuaternion, OSVector3 } from "@teskooano/core-math";
import { GRAVITATIONAL_CONSTANT } from "../units/constants";

/**
 * Calculate distance-based tolerance for Kepler equation solver
 * @param distanceAU Distance from central body in AU
 * @returns Scaled tolerance value
 */
export function calculateKeplerTolerance(distanceAU: number): number {
  const baseTolerance = 1e-4;
  const scalingFactor = 1e-3;
  const maxTolerance = 1e-2;
  const minTolerance = 1e-5;

  const scaledTolerance = baseTolerance + distanceAU * scalingFactor;
  return Math.max(minTolerance, Math.min(maxTolerance, scaledTolerance));
}

/**
 * Solves Kepler's equation M = E - e * sin(E) for the eccentric anomaly E,
 * given the mean anomaly M and eccentricity e.
 * Uses Newton-Raphson method for iterative solving.
 *
 * @param meanAnomaly Mean anomaly in radians.
 * @param eccentricity Eccentricity of the orbit.
 * @param tolerance The desired accuracy for the result.
 * @param maxIterations The maximum number of iterations to prevent infinite loops.
 * @param distanceAU Optional distance from central body in AU for tolerance scaling.
 * @returns The eccentric anomaly E in radians (or hyperbolic eccentric anomaly H for hyperbolic orbits).
 */
export const solveKeplerEquation = (
  meanAnomaly: number,
  eccentricity: number,
  tolerance: number = 1e-4,
  maxIterations: number = 100,
  distanceAU?: number,
): number => {
  // Validate inputs
  if (Number.isNaN(meanAnomaly) || Number.isNaN(eccentricity)) {
    console.warn("[Kepler] Invalid inputs to solveKeplerEquation:", {
      meanAnomaly,
      eccentricity,
      distanceAU,
    });
    return 0;
  }

  // Use distance-based tolerance if distance is provided
  const effectiveTolerance =
    distanceAU !== undefined ? calculateKeplerTolerance(distanceAU) : tolerance;

  if (eccentricity < 1) {
    // Elliptical orbit: M = E - e * sin(E)
    let eccentricAnomaly = meanAnomaly; // Initial guess
    for (let i = 0; i < maxIterations; i++) {
      const delta =
        (eccentricAnomaly -
          eccentricity * Math.sin(eccentricAnomaly) -
          meanAnomaly) /
        (1 - eccentricity * Math.cos(eccentricAnomaly));
      eccentricAnomaly -= delta;
      if (Math.abs(delta) < effectiveTolerance) {
        return eccentricAnomaly;
      }
    }
    return eccentricAnomaly; // Return the last approximation
  } else if (eccentricity > 1) {
    // Hyperbolic orbit: M = e * sinh(H) - H
    // Initial guess for hyperbolic eccentric anomaly H
    let hyperbolicAnomaly: number;

    if (Math.abs(meanAnomaly) < 1e-10) {
      hyperbolicAnomaly = 0; // At periapsis
    } else {
      // Better initial guess for hyperbolic orbits
      // For large negative mean anomalies (approaching periapsis), use a small negative value
      // For large positive mean anomalies (past periapsis), use a large positive value
      if (meanAnomaly < -100) {
        // Very large negative mean anomaly - object is approaching periapsis
        hyperbolicAnomaly = -Math.log(
          Math.abs(meanAnomaly) / (eccentricity - 1),
        );
      } else if (meanAnomaly > 100) {
        // Very large positive mean anomaly - object is past periapsis
        hyperbolicAnomaly = Math.log(meanAnomaly / (eccentricity - 1));
      } else {
        // Moderate mean anomaly - use the original formula
        hyperbolicAnomaly =
          meanAnomaly >= 0
            ? Math.log(meanAnomaly / (eccentricity - 1) + 1)
            : -Math.log(-meanAnomaly / (eccentricity - 1) + 1);
      }
    }

    if (isNaN(hyperbolicAnomaly) || !isFinite(hyperbolicAnomaly)) {
      console.warn(
        "[Kepler] Invalid initial guess for hyperbolic anomaly, using fallback:",
        {
          meanAnomaly,
          eccentricity,
          hyperbolicAnomaly,
        },
      );
      // Use a reasonable fallback based on the sign of mean anomaly
      hyperbolicAnomaly = meanAnomaly < 0 ? -1 : 1;
    }

    for (let i = 0; i < maxIterations; i++) {
      const f =
        eccentricity * Math.sinh(hyperbolicAnomaly) -
        hyperbolicAnomaly -
        meanAnomaly;
      const fPrime = eccentricity * Math.cosh(hyperbolicAnomaly) - 1;

      if (Math.abs(fPrime) < effectiveTolerance) {
        if (Math.abs(f) < effectiveTolerance) {
          return hyperbolicAnomaly;
        }
        break; // Avoid division by zero
      }

      const delta = f / fPrime;
      hyperbolicAnomaly -= delta;

      // Check for NaN or infinite values
      if (isNaN(hyperbolicAnomaly) || !isFinite(hyperbolicAnomaly)) {
        console.warn(
          "[Kepler] NaN/Infinite value in hyperbolic solver, using fallback:",
          {
            meanAnomaly,
            eccentricity,
            hyperbolicAnomaly,
            delta,
          },
        );
        // Use a reasonable fallback based on the sign of mean anomaly
        return meanAnomaly < 0 ? -1 : 1;
      }

      if (Math.abs(delta) < effectiveTolerance) {
        return hyperbolicAnomaly;
      }
    }
    return hyperbolicAnomaly; // Return the last approximation
  } else {
    // Parabolic orbit (eccentricity = 1) - use Barker's equation
    // For now, treat as very eccentric ellipse
    let eccentricAnomaly = meanAnomaly;
    for (let i = 0; i < maxIterations; i++) {
      const delta =
        (eccentricAnomaly -
          eccentricity * Math.sin(eccentricAnomaly) -
          meanAnomaly) /
        (1 - eccentricity * Math.cos(eccentricAnomaly));
      eccentricAnomaly -= delta;
      if (Math.abs(delta) < effectiveTolerance) {
        return eccentricAnomaly;
      }
    }
    return eccentricAnomaly;
  }
};

/**
 * Applies orbital rotations to position and velocity vectors
 * @param position Position vector in orbital plane
 * @param velocity Velocity vector in orbital plane
 * @param orbitalParameters Orbital parameters containing rotation angles
 * @returns Object with rotated position and velocity
 */
export function applyOrbitalRotations(
  position: OSVector3,
  velocity: OSVector3,
  orbitalParameters: OrbitalParameters,
): { position: OSVector3; velocity: OSVector3 } {
  const { argumentOfPeriapsis, inclination, longitudeOfAscendingNode } =
    orbitalParameters;

  // Apply rotations in correct order: Argument of Periapsis -> Inclination -> Longitude of Ascending Node
  const q_argPeriapsis = new OSQuaternion().setFromAxisAngle(
    new OSVector3(0, 1, 0),
    argumentOfPeriapsis,
  );
  const q_inclination = new OSQuaternion().setFromAxisAngle(
    new OSVector3(1, 0, 0),
    inclination,
  );
  const q_ascNodeLongitude = new OSQuaternion().setFromAxisAngle(
    new OSVector3(0, 1, 0),
    longitudeOfAscendingNode,
  );

  const finalRotation = new OSQuaternion()
    .multiply(q_ascNodeLongitude)
    .multiply(q_inclination)
    .multiply(q_argPeriapsis);

  position.applyQuaternion(finalRotation);
  velocity.applyQuaternion(finalRotation);

  return { position, velocity };
}

/**
 * Calculates position and velocity in orbital plane (perifocal frame)
 * @param orbitalParameters Orbital parameters
 * @param anomaly Eccentric anomaly in radians (E for elliptical, H for hyperbolic)
 * @param parentMass_kg Optional parent body mass for hyperbolic orbit calculations
 * @returns Object with position and velocity in orbital plane
 */
export function calculateOrbitalPlaneState(
  orbitalParameters: OrbitalParameters,
  anomaly: number,
  parentMass_kg?: number,
): { position: OSVector3; velocity: OSVector3 } {
  const {
    realSemiMajorAxis_m: semiMajorAxis,
    eccentricity,
    period_s,
  } = orbitalParameters;

  let x: number;
  let y: number;
  let vx: number;
  let vy: number;

  if (eccentricity < 1) {
    // Elliptical orbit
    x = semiMajorAxis * (Math.cos(anomaly) - eccentricity);
    y =
      semiMajorAxis *
      Math.sqrt(1 - eccentricity * eccentricity) *
      Math.sin(anomaly);
  } else if (eccentricity > 1) {
    // Hyperbolic orbit
    // Note: The negative sign on x is required for correct trajectory direction
    // in our Y-up coordinate system with orbits in the XZ plane.
    // This ensures hyperbolic objects curve in the correct direction
    // (e.g., 3I/Atlas approaching from right, curving left towards Mars)
    const absSemiMajorAxis = Math.abs(semiMajorAxis); // Use absolute value for hyperbolic
    x = -absSemiMajorAxis * (Math.cosh(anomaly) - eccentricity);
    y =
      absSemiMajorAxis *
      Math.sqrt(eccentricity * eccentricity - 1) *
      Math.sinh(anomaly);
  } else {
    // Parabolic orbit (eccentricity = 1) - use Barker's equation
    // For parabolic orbits, we need a different approach
    // Use the semi-major axis as the periapsis distance
    const periapsisDistance = semiMajorAxis;
    const trueAnomaly = 2 * Math.atan(anomaly / 2); // Barker's equation
    const r = periapsisDistance * (1 + Math.cos(trueAnomaly));
    x = r * Math.cos(trueAnomaly);
    y = r * Math.sin(trueAnomaly);
  }

  // Validate position values to prevent NaN
  if (Number.isNaN(x) || Number.isNaN(y)) {
    console.warn(
      "[OrbitalPlaneState] NaN position detected, using fallback values:",
      {
        x,
        y,
        anomaly,
        eccentricity,
        semiMajorAxis,
      },
    );
    x = semiMajorAxis || 0;
    y = 0;
  }

  // The initial orbit is on the XZ plane for a Y-up coordinate system
  // For hyperbolic orbits, we need to be careful about the coordinate system
  // to ensure the trajectory curves in the correct direction
  const position = new OSVector3(x, 0, -y);

  // Calculate velocity in orbital plane
  let mu: number;
  if (eccentricity > 1 && parentMass_kg) {
    // For hyperbolic orbits, use parent mass to calculate μ
    mu = GRAVITATIONAL_CONSTANT * parentMass_kg;
  } else if (period_s > 0) {
    // For elliptical/parabolic orbits, derive from period
    mu = Math.pow((2 * Math.PI) / period_s, 2) * Math.pow(semiMajorAxis, 3);
  } else {
    // Fallback for parabolic orbits without period
    mu = 0;
  }

  let velocity = new OSVector3(0, 0, 0);

  if (mu > 0) {
    if (eccentricity < 1) {
      // Elliptical velocity
      const term =
        Math.sqrt(mu / semiMajorAxis) / (1 - eccentricity * Math.cos(anomaly));
      vx = term * -Math.sin(anomaly);
      vy =
        term * Math.sqrt(1 - eccentricity * eccentricity) * Math.cos(anomaly);
    } else if (eccentricity > 1) {
      // Hyperbolic velocity
      // Note: No sign change needed here as velocity direction is determined
      // by the position calculation and coordinate system setup
      const absSemiMajorAxis = Math.abs(semiMajorAxis);
      const term =
        Math.sqrt(mu / absSemiMajorAxis) /
        (eccentricity * Math.cosh(anomaly) - 1);
      vx = term * Math.sinh(anomaly);
      vy =
        term * Math.sqrt(eccentricity * eccentricity - 1) * Math.cosh(anomaly);
    } else {
      // Parabolic velocity
      const term =
        Math.sqrt(mu / semiMajorAxis) / (1 - eccentricity * Math.cos(anomaly));
      vx = term * -Math.sin(anomaly);
      vy =
        term * Math.sqrt(1 - eccentricity * eccentricity) * Math.cos(anomaly);
    }

    // Validate velocity values to prevent NaN
    if (Number.isNaN(vx) || Number.isNaN(vy)) {
      console.warn(
        "[OrbitalPlaneState] NaN velocity detected, using fallback values:",
        {
          vx,
          vy,
          anomaly,
          eccentricity,
          mu,
        },
      );
      vx = 0;
      vy = 0;
    }

    // Velocity must also be on the XZ plane initially
    // Negate Z component to match position coordinate system
    velocity.set(vx, 0, -vy);
  }

  return { position, velocity };
}

/**
 * Calculates the exact relative position and velocity of a body at a given time
 * based on its Keplerian orbital parameters.
 *
 * @param orbitalParameters The Keplerian elements of the orbit.
 * @param time_s The time in seconds for which to calculate the state.
 * @param parentMass_kg Optional parent body mass for hyperbolic orbit calculations.
 * @returns The calculated relative state of the body (position in meters, velocity in m/s).
 */
export const calculateKeplerianStateAtTime = (
  orbitalParameters: OrbitalParameters,
  time_s: number,
  parentMass_kg?: number,
): { position: OSVector3; velocity: OSVector3 } => {
  // Validate inputs
  if (Number.isNaN(time_s)) {
    console.warn("[Kepler] Invalid time input:", time_s);
    return {
      position: new OSVector3(0, 0, 0),
      velocity: new OSVector3(0, 0, 0),
    };
  }

  const {
    eccentricity,
    period_s,
    meanAnomaly: initialMeanAnomaly,
    realSemiMajorAxis_m,
  } = orbitalParameters;

  let meanAnomaly: number;
  let anomaly: number;

  if (eccentricity < 1) {
    // Elliptical orbit
    const meanMotion = (2 * Math.PI) / period_s;
    meanAnomaly = (initialMeanAnomaly + meanMotion * time_s) % (2 * Math.PI);
    anomaly = solveKeplerEquation(meanAnomaly, eccentricity);
  } else if (eccentricity > 1) {
    // Hyperbolic orbit - mean motion is different
    // For hyperbolic orbits, we need the gravitational parameter μ
    let mu: number;
    if (parentMass_kg) {
      // Use the provided parent mass to calculate μ
      mu = GRAVITATIONAL_CONSTANT * parentMass_kg;
    } else {
      // Fallback: use Sun's mass for solar system objects
      const SUN_MASS = 1.9885e30; // kg
      mu = GRAVITATIONAL_CONSTANT * SUN_MASS;
    }

    const meanMotionHyperbolic = Math.sqrt(
      mu / Math.pow(Math.abs(realSemiMajorAxis_m), 3),
    );
    meanAnomaly = initialMeanAnomaly + meanMotionHyperbolic * time_s;

    // For hyperbolic orbits, don't normalize the mean anomaly
    // But check for reasonable bounds to prevent infinity
    if (!isFinite(meanAnomaly)) {
      console.warn(
        "[Kepler] Hyperbolic mean anomaly became infinite, clamping:",
        {
          initialMeanAnomaly,
          meanMotionHyperbolic,
          time_s,
          meanAnomaly,
        },
      );
      meanAnomaly = meanAnomaly > 0 ? 1000 : -1000; // Clamp to reasonable values
    }

    anomaly = solveKeplerEquation(meanAnomaly, eccentricity);
  } else {
    // Parabolic orbit
    const meanMotion = (2 * Math.PI) / period_s;
    meanAnomaly = (initialMeanAnomaly + meanMotion * time_s) % (2 * Math.PI);
    anomaly = solveKeplerEquation(meanAnomaly, eccentricity);
  }

  // --- 2. Calculate Position and Velocity in the Orbital Plane ---
  const { position, velocity } = calculateOrbitalPlaneState(
    orbitalParameters,
    anomaly,
    parentMass_kg,
  );

  // --- 3. Rotate Position and Velocity to the Inertial Frame ---
  return applyOrbitalRotations(position, velocity, orbitalParameters);
};
