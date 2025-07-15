import { OSVector3 } from "@teskooano/core-math";
import type { PhysicsStateReal } from "@teskooano/data-types";
import type {
  IAlgorithmStrategy,
  SimulationParameters,
} from "./simulation-strategy";

/**
 * Abstract base class for force calculation algorithms
 */
export abstract class AlgorithmStrategy implements IAlgorithmStrategy {
  abstract readonly name: string;
  abstract readonly complexity: string;
  abstract readonly recommendedMinBodies: number;
  abstract readonly recommendedMaxBodies: number;

  abstract calculateForces(
    bodies: Record<string, PhysicsStateReal>,
    params: SimulationParameters,
  ): Record<string, OSVector3>;

  /**
   * Default implementation of optimization check
   */
  isOptimalFor(bodyCount: number): boolean {
    return (
      bodyCount >= this.recommendedMinBodies &&
      bodyCount <= this.recommendedMaxBodies
    );
  }

  /**
   * Helper method to calculate gravitational force between two bodies
   */
  protected calculateGravitationalForce(
    body1: PhysicsStateReal,
    body2: PhysicsStateReal,
    G: number = 6.6743e-11,
  ): OSVector3 {
    const displacement = new OSVector3();
    displacement.copy(body2.position_m).sub(body1.position_m);

    const distanceSquared = displacement.lengthSq();
    const distance = Math.sqrt(distanceSquared);

    if (distance === 0) return new OSVector3().setZero();

    const forceMagnitude =
      (G * body1.mass_kg * body2.mass_kg) / distanceSquared;

    return displacement.normalize().multiplyScalar(forceMagnitude);
  }
}
