import {
  calculateOrbitalPosition,
  calculateOrbitalVelocity,
} from "@teskooano/core-physics";
import {
  AU_METERS,
  type OrbitalParameters,
  type PhysicsStateReal,
} from "@teskooano/data-types";
import * as CONST from "../../constants";
import * as UTIL from "../../utils";

/**
 * Calculates the orbital parameters and initial absolute physics state (position, velocity)
 * for a planet relative to its parent star.
 *
 * @param random The seeded random function.
 * @param starMass_kg Mass of the parent star (kg).
 * @param planetMass_kg Mass of the planet (kg).
 * @param bodyDistanceAU Distance from the star (AU).
 * @param parentStarState Initial physics state of the parent star.
 * @param planetId The unique ID of the planet (for physics state).
 * @returns An object containing the calculated OrbitalParameters and the initial PhysicsStateReal, or null for PhysicsStateReal if calculation fails.
 */
export function calculatePlanetOrbitAndInitialState(
  random: () => number,
  starMass_kg: number,
  planetMass_kg: number,
  bodyDistanceAU: number,
  parentStarState: PhysicsStateReal,
  planetId: string,
): {
  orbit: OrbitalParameters;
  initialPhysicsState: PhysicsStateReal | null;
} {
  const semiMajorAxis_m = bodyDistanceAU * AU_METERS;
  const orbitalPeriod_s = UTIL.calculateOrbitalPeriod_s(
    starMass_kg,
    semiMajorAxis_m,
    planetMass_kg,
  );

  const orbit: OrbitalParameters = {
    realSemiMajorAxis_m: semiMajorAxis_m,
    eccentricity: 0.01 + random() * 0.05,
    inclination: (random() - 0.5) * 0.05,
    longitudeOfAscendingNode: random() * 2 * Math.PI,
    argumentOfPeriapsis: random() * 2 * Math.PI,
    meanAnomaly: random() * 2 * Math.PI,
    period_s: orbitalPeriod_s,
  };

  let initialPhysicsState: PhysicsStateReal | null = null;
  try {
    const initialRelativePos_m = calculateOrbitalPosition(
      parentStarState,
      orbit,
      0,
    );
    const initialWorldVel_mps = calculateOrbitalVelocity(
      parentStarState,
      orbit,
      0,
    );

    // Calculate and log relative velocity
    const initialRelativeVel_mps = initialWorldVel_mps
      .clone()
      .sub(parentStarState.velocity_mps);

    const initialWorldPos_m = initialRelativePos_m
      .clone()
      .add(parentStarState.position_m);

    if (
      !initialWorldPos_m ||
      !initialWorldVel_mps ||
      !Number.isFinite(initialWorldPos_m.x) ||
      !Number.isFinite(initialWorldPos_m.y) ||
      !Number.isFinite(initialWorldPos_m.z) ||
      !Number.isFinite(initialWorldVel_mps.x) ||
      !Number.isFinite(initialWorldVel_mps.y) ||
      !Number.isFinite(initialWorldVel_mps.z)
    ) {
      throw new Error(
        "Calculated initial planet state contains non-finite values.",
      );
    }

    initialPhysicsState = {
      id: planetId,
      mass_kg: planetMass_kg,
      position_m: initialWorldPos_m,
      velocity_mps: initialWorldVel_mps,
    };
  } catch (error) {
    console.error(
      `[PlanetOrbit] Error calculating initial physics state for ${planetId}:`,
      error,
    );
    console.error("Inputs:", {
      parentState: parentStarState,
      orbitParams: orbit,
      planetMass_kg: planetMass_kg,
    });
  }

  return { orbit, initialPhysicsState };
}
