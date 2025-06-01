import { PhysicsStateReal } from "../../types";
import { OSVector3, EPSILON } from "@teskooano/core-math";

/**
 * Represents a thrust force
 */
export interface ThrustForce {
  /** The magnitude of the thrust in Newtons */
  magnitude: number;
  /** The direction of the thrust (normalized vector) */
  direction: OSVector3;
  /** Whether the thrust is currently active */
  active: boolean;
}

/**
 * Represents atmospheric drag
 */
export interface DragForce {
  /** The drag coefficient (dimensionless) */
  coefficient: number;
  /** The reference area in square meters */
  referenceArea: number;
  /** The atmospheric density in kg/m³ */
  density: number;
}

/**
 * Calculates the thrust force vector
 */
export const calculateThrustForce = (thrust: ThrustForce): OSVector3 => {
  if (!thrust.active) {
    return new OSVector3(0, 0, 0);
  }
  return thrust.direction.clone().multiplyScalar(thrust.magnitude);
};

/**
 * Calculates the drag force vector
 * F = -0.5 * ρ * v² * Cd * A * v_hat
 * where:
 * ρ is the atmospheric density
 * v is the velocity magnitude
 * v_hat is the velocity direction
 * Cd is the drag coefficient
 * A is the reference area
 */
export const calculateDragForce = (
  body: PhysicsStateReal,
  drag: DragForce,
): OSVector3 => {
  const velocity = body.velocity_mps;
  const speed = velocity.length();

  if (speed < EPSILON) {
    return new OSVector3(0, 0, 0);
  }

  const forceMagnitude =
    0.5 * drag.density * speed * speed * drag.coefficient * drag.referenceArea;

  const direction = velocity.clone().normalize();
  direction.multiplyScalar(-forceMagnitude);
  return direction;
};

/**
 * Combines multiple forces acting on a body
 */
export const combineForces = (forces: OSVector3[]): OSVector3 => {
  const result = new OSVector3(0, 0, 0);
  if (forces.length === 0) {
    return result;
  }

  for (const force of forces) {
    result.add(force);
  }
  return result;
};
