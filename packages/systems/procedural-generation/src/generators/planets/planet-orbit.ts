import {
  calculateOrbitalPosition,
  calculateOrbitalVelocity,
} from "@teskooano/core-physics";
import type {
  OrbitalParameters,
  PhysicsStateReal,
} from "@teskooano/data-types";
import * as CONST from "../../constants";
import * as UTIL from "../../utils";

/**
 * Calculates the orbital parameters and initial physics state for a planet.
 *
 * This function determines a stable, pseudo-random orbit for a planet around
 * its parent star. It sets parameters like eccentricity and inclination, calculates
 * the orbital period, and then computes the initial position and velocity vectors
 * required by the physics engine.
 *
 * @param random The seeded pseudo-random number generator function.
 * @param starMass_kg Mass of the parent star in kilograms.
 * @param planetMass_kg Mass of the planet in kilograms.
 * @param bodyDistanceAU The target semi-major axis for the orbit in AU.
 * @param parentStarState The physics state of the parent star, which provides the
 *   frame of reference for the new orbit.
 * @param planetId The unique ID of the planet (for the new physics state).
 * @returns An object containing the `OrbitalParameters` and the initial
 *   `PhysicsStateReal` for the planet. Returns `null` for `initialPhysicsState` if
 *   the calculation fails.
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
  const semiMajorAxis_m = bodyDistanceAU * CONST.AU_TO_METERS;
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
