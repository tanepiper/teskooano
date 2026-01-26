import { AlgorithmType } from "@teskooano/data-types";
import { AU_METERS } from "@teskooano/data-values";
import {
  ForceCalculationAlgorithm,
  AlgorithmDependencies,
} from "./force-calculation-algorithm";
import { BarnesHutAlgorithm } from "./barnes-hut-algorithm";

/**
 * Factory for creating force calculation algorithms
 *
 * Centralized creation and management of algorithm instances.
 * All algorithms use the same WASM spatial partitioning for consistency.
 */
export class AlgorithmFactory {
  /**
   * Create an algorithm instance for the specified algorithm type
   *
   * @param algorithmType - The type of algorithm to create
   * @param dependencies - Dependencies needed by the algorithm
   * @returns Algorithm instance implementing ForceCalculationAlgorithm
   */
  static createAlgorithm(
    algorithmType: AlgorithmType,
    dependencies: AlgorithmDependencies,
  ): ForceCalculationAlgorithm {
    // Only Barnes-Hut is supported - it's optimal for planetary N-body simulations
    const spatialPartitioning = dependencies.spatialPartitioning;
    return new BarnesHutAlgorithm(spatialPartitioning);
  }

  /**
   * Get the list of implemented algorithms
   *
   * @returns Array of algorithm types that are fully implemented
   */
  static getImplementedAlgorithms(): AlgorithmType[] {
    return [AlgorithmType.BARNES_HUT];
  }

  /**
   * Check if an algorithm is implemented
   *
   * @param algorithmType - The algorithm type to check
   * @returns True if the algorithm is fully implemented
   */
  static isAlgorithmImplemented(algorithmType: AlgorithmType): boolean {
    return this.getImplementedAlgorithms().includes(algorithmType);
  }
}
