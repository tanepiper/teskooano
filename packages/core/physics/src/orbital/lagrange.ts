import { OSVector3 } from "@teskooano/core-math";
import type {
  PhysicsStateReal,
  LagrangePoint,
  TwoBodySystem,
  LagrangeCalculationOptions,
  OrbitalParameters,
} from "@teskooano/data-types";
import { GRAVITATIONAL_CONSTANT } from "@teskooano/data-values";
import { LagrangePointType } from "@teskooano/data-types";

/**
 * Default calculation options
 */
const DEFAULT_OPTIONS: Required<LagrangeCalculationOptions> = {
  maxIterations: 1000,
  tolerance: 1e-10, // Relaxed from 1e-11 for maximum stability at higher timesteps
  includeStability: true,
  calculatePotential: true,
};

/**
 * Solves the quintic equation for L1 Lagrange point.
 * x^5 + (μ-3)x^4 + (3-2μ)x^3 - μx^2 + 2μx - μ = 0
 *
 * @param massRatio μ = M2/(M1+M2)
 * @param options Calculation options
 * @returns Normalized distance x = r/R from the secondary body
 */
export function solveL1QuinticEquation(
  massRatio: number,
  options: LagrangeCalculationOptions = {},
): number {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const mu = massRatio;

  // Initial guess - approximately at Hill sphere radius
  let x = Math.pow(mu / 3, 1 / 3);

  for (let i = 0; i < opts.maxIterations; i++) {
    // f(x) = x^5 + (μ-3)x^4 + (3-2μ)x^3 - μx^2 + 2μx - μ
    const f =
      Math.pow(x, 5) +
      (mu - 3) * Math.pow(x, 4) +
      (3 - 2 * mu) * Math.pow(x, 3) -
      mu * Math.pow(x, 2) +
      2 * mu * x -
      mu;

    // f'(x) = 5x^4 + 4(μ-3)x^3 + 3(3-2μ)x^2 - 2μx + 2μ
    const df =
      5 * Math.pow(x, 4) +
      4 * (mu - 3) * Math.pow(x, 3) +
      3 * (3 - 2 * mu) * Math.pow(x, 2) -
      2 * mu * x +
      2 * mu;

    if (Math.abs(df) < opts.tolerance) {
      throw new Error(
        "L1 quintic solver: derivative too small, cannot continue",
      );
    }

    const newX = x - f / df;

    if (Math.abs(newX - x) < opts.tolerance) {
      return newX;
    }

    x = newX;

    // Ensure x stays in reasonable bounds
    if (x < 0 || x > 1) {
      x = Math.max(0.001, Math.min(0.999, x));
    }
  }

  throw new Error(
    `L1 quintic solver failed to converge after ${opts.maxIterations} iterations`,
  );
}

/**
 * Solves the quintic equation for L2 Lagrange point.
 * x^5 + x^4(3-μ) + x^3(3-2μ) - x^2(μ) - x(2μ) - μ = 0
 *
 * @param massRatio μ = M2/(M1+M2)
 * @param options Calculation options
 * @returns Normalized distance x = r/R from the secondary body
 */
export function solveL2QuinticEquation(
  massRatio: number,
  options: LagrangeCalculationOptions = {},
): number {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const mu = massRatio;

  // Initial guess - approximately at Hill sphere radius
  let x = Math.pow(mu / 3, 1 / 3);

  for (let i = 0; i < opts.maxIterations; i++) {
    // f(x) = x^5 + x^4(3-μ) + x^3(3-2μ) - x^2(μ) - x(2μ) - μ
    const f =
      Math.pow(x, 5) +
      x * x * x * x * (3 - mu) +
      x * x * x * (3 - 2 * mu) -
      x * x * mu -
      x * 2 * mu -
      mu;

    // f'(x) = 5x^4 + 4x^3(3-μ) + 3x^2(3-2μ) - 2x(μ) - 2μ
    const df =
      5 * Math.pow(x, 4) +
      4 * x * x * x * (3 - mu) +
      3 * x * x * (3 - 2 * mu) -
      2 * x * mu -
      2 * mu;

    if (Math.abs(df) < opts.tolerance) {
      throw new Error(
        "L2 quintic solver: derivative too small, cannot continue",
      );
    }

    const newX = x - f / df;

    if (Math.abs(newX - x) < opts.tolerance) {
      return newX;
    }

    x = newX;

    // Ensure x stays in reasonable bounds
    if (x < 0 || x > 2) {
      x = Math.max(0.001, Math.min(1.999, x));
    }
  }

  throw new Error(
    `L2 quintic solver failed to converge after ${opts.maxIterations} iterations`,
  );
}

/**
 * Calculates the L3 Lagrange point position.
 * For L3, if M2 << M1, then r ≈ R * (7/12) * μ
 *
 * @param massRatio μ = M2/(M1+M2)
 * @returns Normalized distance from the primary body
 */
export function calculateL3Position(massRatio: number): number {
  // For small mass ratios, use the approximation
  if (massRatio < 0.1) {
    return (7 / 12) * massRatio;
  }

  // For larger mass ratios, we'd need to solve a more complex equation
  // For now, use the approximation (can be improved later)
  return (7 / 12) * massRatio;
}

/**
 * Calculates Hill sphere radius for the secondary body
 * r_Hill = a * (m2 / (3 * (m1 + m2)))^(1/3)
 *
 * @param separation_m Distance between the two bodies (meters)
 * @param m1_kg Mass of primary body (kg)
 * @param m2_kg Mass of secondary body (kg)
 * @returns Hill sphere radius in meters
 */
export function calculateHillSphereRadius(
  separation_m: number,
  m1_kg: number,
  m2_kg: number,
): number {
  const massRatio = m2_kg / (3 * (m1_kg + m2_kg));
  return separation_m * Math.pow(massRatio, 1 / 3);
}

/**
 * Calculates the effective potential at a given point in the restricted three-body problem
 * U_eff = -G*M1/r1 - G*M2/r2 - 0.5*ω²*(x² + y²)
 *
 * @param position Position vector from the center of mass
 * @param system Two-body system parameters
 * @returns Effective potential in J/kg
 */
export function calculateEffectivePotential(
  position: OSVector3,
  system: TwoBodySystem,
): number {
  const G = GRAVITATIONAL_CONSTANT;
  const omega = Math.sqrt(
    (G * (system.primary.mass_kg + system.secondary.mass_kg)) /
      Math.pow(system.separation_m, 3),
  );

  // Calculate distances to each body
  const r1 = position.distanceTo(system.primary.position_m);
  const r2 = position.distanceTo(system.secondary.position_m);

  // Gravitational potential terms
  const gravitationalPotential =
    (-G * system.primary.mass_kg) / r1 - (G * system.secondary.mass_kg) / r2;

  // Centrifugal potential term (in rotating frame)
  const centrifugalPotential =
    -0.5 * omega * omega * (position.x * position.x + position.z * position.z);

  return gravitationalPotential + centrifugalPotential;
}

/**
 * Determines stability of a Lagrange point based on eigenvalue analysis
 * L4 and L5 are stable if m1/m2 > 24.96 (approximately 25)
 * L1, L2, L3 are always unstable (saddle points)
 *
 * @param lagrangeId Lagrange point identifier
 * @param massRatio μ = M2/(M1+M2)
 * @returns Stability classification
 */
export function analyzeLagrangeStability(
  lagrangeId: "L1" | "L2" | "L3" | "L4" | "L5",
  massRatio: number,
): "stable" | "unstable" | "marginally_stable" {
  switch (lagrangeId) {
    case "L1":
    case "L2":
    case "L3":
      return "unstable"; // These are always saddle points

    case "L4":
    case "L5":
      // Stability criterion for triangular points
      const m1_over_m2 = (1 - massRatio) / massRatio;
      if (m1_over_m2 > 24.96) {
        return "stable";
      } else if (m1_over_m2 > 24.0) {
        return "marginally_stable";
      } else {
        return "unstable";
      }

    default:
      return "unstable";
  }
}

/**
 * Calculates all five Lagrange points for a two-body system
 *
 * @param system Two-body system parameters
 * @param options Calculation options
 * @returns Array of all five Lagrange points
 */
export function calculateAllLagrangePoints(
  system: TwoBodySystem,
  options: LagrangeCalculationOptions = {},
): LagrangePoint[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const lagrangePoints: LagrangePoint[] = [];

  // Calculate center of mass position
  const totalMass = system.primary.mass_kg + system.secondary.mass_kg;
  const centerOfMass = new OSVector3()
    .copy(system.primary.position_m)
    .multiplyScalar(system.primary.mass_kg)
    .add(
      new OSVector3()
        .copy(system.secondary.position_m)
        .multiplyScalar(system.secondary.mass_kg),
    )
    .divideScalar(totalMass);

  // Calculate angular velocity of the system
  const omega = Math.sqrt(
    (GRAVITATIONAL_CONSTANT * totalMass) / Math.pow(system.separation_m, 3),
  );

  // Direction vector from primary to secondary
  const primaryToSecondary = new OSVector3()
    .copy(system.secondary.position_m)
    .sub(system.primary.position_m)
    .normalize();

  // Calculate Hill sphere radius
  const hillRadius = calculateHillSphereRadius(
    system.separation_m,
    system.primary.mass_kg,
    system.secondary.mass_kg,
  );

  // L1 Point (between the two bodies)
  try {
    const x1 = solveL1QuinticEquation(system.massRatio, opts);
    const l1Distance = x1 * system.separation_m;
    const l1Position = new OSVector3()
      .copy(system.secondary.position_m)
      .sub(primaryToSecondary.clone().multiplyScalar(l1Distance));

    const l1RelativeToBarycenter = l1Position.clone().sub(centerOfMass);
    const l1Velocity = new OSVector3(
      -omega * l1RelativeToBarycenter.z,
      0,
      omega * l1RelativeToBarycenter.x,
    );

    lagrangePoints.push({
      id: "L1",
      position_m: l1Position,
      velocity_mps: l1Velocity,
      distanceFromSecondary_m: l1Distance,
      distanceFromPrimary_m: system.separation_m - l1Distance,
      stability: analyzeLagrangeStability("L1", system.massRatio),
      effectivePotential_Jkg: opts.calculatePotential
        ? calculateEffectivePotential(l1Position, system)
        : 0,
      hillSphereRadius_m: hillRadius,
    });
  } catch (error) {
    console.warn("Failed to calculate L1 point:", error);
  }

  // L2 Point (beyond the secondary body)
  try {
    const x2 = solveL2QuinticEquation(system.massRatio, opts);
    const l2Distance = x2 * system.separation_m;
    const l2Position = new OSVector3()
      .copy(system.secondary.position_m)
      .add(primaryToSecondary.clone().multiplyScalar(l2Distance));

    const l2RelativeToBarycenter = l2Position.clone().sub(centerOfMass);
    const l2Velocity = new OSVector3(
      -omega * l2RelativeToBarycenter.z,
      0,
      omega * l2RelativeToBarycenter.x,
    );

    lagrangePoints.push({
      id: "L2",
      position_m: l2Position,
      velocity_mps: l2Velocity,
      distanceFromSecondary_m: l2Distance,
      distanceFromPrimary_m: system.separation_m + l2Distance,
      stability: analyzeLagrangeStability("L2", system.massRatio),
      effectivePotential_Jkg: opts.calculatePotential
        ? calculateEffectivePotential(l2Position, system)
        : 0,
      hillSphereRadius_m: hillRadius,
    });
  } catch (error) {
    console.warn("Failed to calculate L2 point:", error);
  }

  // L3 Point (opposite side of primary from secondary)
  try {
    const x3 = calculateL3Position(system.massRatio);
    const l3Distance = system.separation_m + x3 * system.separation_m;
    const l3Position = new OSVector3()
      .copy(system.primary.position_m)
      .sub(primaryToSecondary.clone().multiplyScalar(x3 * system.separation_m));

    const l3RelativeToBarycenter = l3Position.clone().sub(centerOfMass);
    const l3Velocity = new OSVector3(
      -omega * l3RelativeToBarycenter.z,
      0,
      omega * l3RelativeToBarycenter.x,
    );

    lagrangePoints.push({
      id: "L3",
      position_m: l3Position,
      velocity_mps: l3Velocity,
      distanceFromSecondary_m: l3Distance,
      distanceFromPrimary_m: x3 * system.separation_m,
      stability: analyzeLagrangeStability("L3", system.massRatio),
      effectivePotential_Jkg: opts.calculatePotential
        ? calculateEffectivePotential(l3Position, system)
        : 0,
      hillSphereRadius_m: hillRadius,
    });
  } catch (error) {
    console.warn("Failed to calculate L3 point:", error);
  }

  // L4 and L5 Points (60° ahead and behind the secondary body)
  try {
    // L4 and L5 form equilateral triangles with the two masses
    const angle60Deg = Math.PI / 3; // 60 degrees

    // Vector from center of mass to secondary
    const centerToSecondary = new OSVector3()
      .copy(system.secondary.position_m)
      .sub(centerOfMass);

    // Create perpendicular vector for triangle formation
    // This perpendicular vector is rotated 90 degrees around the Y-axis from centerToSecondary in the XZ plane
    const perpendicular = new OSVector3(
      -centerToSecondary.z,
      0,
      centerToSecondary.x,
    ).normalize();

    // L4 Point (60° ahead)
    const l4Position = new OSVector3()
      .copy(centerOfMass)
      .add(centerToSecondary.clone().multiplyScalar(Math.cos(angle60Deg)))
      .add(
        perpendicular
          .clone()
          .multiplyScalar(centerToSecondary.length() * Math.sin(angle60Deg)),
      );

    const l4RelativeToBarycenter = l4Position.clone().sub(centerOfMass);
    const l4Velocity = new OSVector3(
      -omega * l4RelativeToBarycenter.z,
      0,
      omega * l4RelativeToBarycenter.x,
    );

    // L5 Point (60° behind)
    const l5Position = new OSVector3()
      .copy(centerOfMass)
      .add(centerToSecondary.clone().multiplyScalar(Math.cos(angle60Deg)))
      .sub(
        perpendicular
          .clone()
          .multiplyScalar(centerToSecondary.length() * Math.sin(angle60Deg)),
      );

    const l5RelativeToBarycenter = l5Position.clone().sub(centerOfMass);
    const l5Velocity = new OSVector3(
      -omega * l5RelativeToBarycenter.z,
      0,
      omega * l5RelativeToBarycenter.x,
    );

    const l4DistanceFromSecondary = l4Position.distanceTo(
      system.secondary.position_m,
    );
    const l4DistanceFromPrimary = l4Position.distanceTo(
      system.primary.position_m,
    );
    const l5DistanceFromSecondary = l5Position.distanceTo(
      system.secondary.position_m,
    );
    const l5DistanceFromPrimary = l5Position.distanceTo(
      system.primary.position_m,
    );

    lagrangePoints.push({
      id: "L4",
      position_m: l4Position,
      velocity_mps: l4Velocity,
      distanceFromSecondary_m: l4DistanceFromSecondary,
      distanceFromPrimary_m: l4DistanceFromPrimary,
      stability: analyzeLagrangeStability("L4", system.massRatio),
      effectivePotential_Jkg: opts.calculatePotential
        ? calculateEffectivePotential(l4Position, system)
        : 0,
      hillSphereRadius_m: hillRadius,
    });

    lagrangePoints.push({
      id: "L5",
      position_m: l5Position,
      velocity_mps: l5Velocity,
      distanceFromSecondary_m: l5DistanceFromSecondary,
      distanceFromPrimary_m: l5DistanceFromPrimary,
      stability: analyzeLagrangeStability("L5", system.massRatio),
      effectivePotential_Jkg: opts.calculatePotential
        ? calculateEffectivePotential(l5Position, system)
        : 0,
      hillSphereRadius_m: hillRadius,
    });
  } catch (error) {
    console.warn("Failed to calculate L4/L5 points:", error);
  }

  return lagrangePoints;
}

/**
 * Creates orbital elements for an object intended to be at a Lagrange point.
 * This function calculates the necessary orbital parameters based on the properties
 * of the two main bodies forming the Lagrange system.
 *
 * @param lagrangePointType The specific Lagrange point (L1-L5).
 * @param primaryMass_kg Mass of the primary body (e.g., Sun for Sun-Earth L2) in kg.
 * @param secondaryMass_kg Mass of the secondary body (e.g., Earth for Sun-Earth L2) in kg.
 * @param parentToTargetSeparation_m Separation distance between the primary and secondary bodies in meters.
 * @returns A Partial<OrbitalParameters> object with calculated semi-major axis, period, and velocity.
 */
export function createOrbitalElementsFromLagrangePoint(
  lagrangePointType: LagrangePointType,
  primaryMass_kg: number,
  secondaryMass_kg: number,
  parentToTargetSeparation_m: number,
): Partial<OrbitalParameters> {
  // Create dummy PhysicsStateReal objects for Lagrange point calculation.
  // Only mass and relative positions are relevant for the point calculation itself.
  const primaryDummyState: PhysicsStateReal = {
    id: "dummyPrimary",
    mass_kg: primaryMass_kg,
    position_m: new OSVector3(0, 0, 0),
    velocity_mps: new OSVector3(0, 0, 0),
  };
  const secondaryDummyState: PhysicsStateReal = {
    id: "dummySecondary",
    mass_kg: secondaryMass_kg,
    position_m: new OSVector3(parentToTargetSeparation_m, 0, 0),
    velocity_mps: new OSVector3(0, 0, 0),
  };

  const twoBodySystem = createTwoBodySystem(
    primaryDummyState,
    secondaryDummyState,
  );
  const lagrangePoints = calculateAllLagrangePoints(twoBodySystem);
  const lPoint = lagrangePoints.find((lp) => lp.id === lagrangePointType);

  if (!lPoint) {
    throw new Error(
      `Lagrange point '${lagrangePointType}' not found for the given system.`,
    );
  }

  // For Lagrange points, semi-major axis is the distance from the primary of the two-body system
  const realSemiMajorAxis_m = lPoint.distanceFromPrimary_m;

  // Period for an object at a Lagrange point is effectively the orbital period of the secondary body
  // around the primary, derived from Kepler's Third Law based on their total mass and separation.
  const period_s =
    2 *
    Math.PI *
    Math.sqrt(
      Math.pow(twoBodySystem.separation_m, 3) /
        (GRAVITATIONAL_CONSTANT * twoBodySystem.totalMass_kg),
    );

  // Velocity magnitude of the Lagrange point in the rotating frame
  const averageOrbitalSpeed_mps = lPoint.velocity_mps?.length() ?? 0;

  return {
    realSemiMajorAxis_m: realSemiMajorAxis_m,
    eccentricity: 0, // Lagrange points are not true elliptical orbits, set to nominal
    inclination: 0, // Set to nominal
    longitudeOfAscendingNode: 0, // Set to nominal
    argumentOfPeriapsis: 0, // Set to nominal
    meanAnomaly: 0, // Set to nominal
    period_s: period_s,
    realAphelion_m: realSemiMajorAxis_m, // Aphelion/Perihelion are same as semi-major for nominal circular-like path
    realPerihelion_m: realSemiMajorAxis_m,
    averageOrbitalSpeed_mps: averageOrbitalSpeed_mps,
    lagrangePointType: lagrangePointType, // Store the type for reference
  };
}

/**
 * Creates a TwoBodySystem from two PhysicsStateReal objects
 *
 * @param body1 First celestial body
 * @param body2 Second celestial body
 * @returns TwoBodySystem configuration
 */
export function createTwoBodySystem(
  body1: PhysicsStateReal,
  body2: PhysicsStateReal,
): TwoBodySystem {
  // Determine which is primary (more massive)
  const primary = body1.mass_kg >= body2.mass_kg ? body1 : body2;
  const secondary = body1.mass_kg >= body2.mass_kg ? body2 : body1;

  const separation_m = primary.position_m.distanceTo(secondary.position_m);
  const totalMass = primary.mass_kg + secondary.mass_kg;
  const massRatio = secondary.mass_kg / totalMass;

  return {
    primary,
    secondary,
    separation_m,
    massRatio,
    totalMass_kg: totalMass,
  };
}

/**
 * Finds all Lagrange points in a system of celestial bodies
 * Considers all possible two-body combinations
 *
 * @param bodies Array of celestial bodies
 * @param options Calculation options
 * @returns Map of body pair IDs to their Lagrange points
 */
export function findAllLagrangePointsInSystem(
  bodies: PhysicsStateReal[],
  options: LagrangeCalculationOptions = {},
): Map<string, LagrangePoint[]> {
  const lagrangePointsMap = new Map<string, LagrangePoint[]>();

  // Consider all pairs of bodies
  for (let i = 0; i < bodies.length; i++) {
    for (let j = i + 1; j < bodies.length; j++) {
      const body1 = bodies[i];
      const body2 = bodies[j];

      // Skip if either body has negligible mass
      if (body1.mass_kg <= 0 || body2.mass_kg <= 0) {
        continue;
      }

      try {
        const twoBodySystem = createTwoBodySystem(body1, body2);
        const lagrangePoints = calculateAllLagrangePoints(
          twoBodySystem,
          options,
        );

        // Create a unique key for this body pair
        const pairKey = `${twoBodySystem.primary.id}-${twoBodySystem.secondary.id}`;
        lagrangePointsMap.set(pairKey, lagrangePoints);
      } catch (error) {
        console.warn(
          `Failed to calculate Lagrange points for ${body1.id}-${body2.id}:`,
          error,
        );
      }
    }
  }

  return lagrangePointsMap;
}
