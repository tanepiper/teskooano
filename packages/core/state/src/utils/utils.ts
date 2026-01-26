import {
  AlgorithmType,
  IntegratorType,
  SimulationMode,
} from "@teskooano/data-types";
import type { SimulationConfiguration } from "../types";

/**
 * Validates if a simulation configuration is valid.
 */
export function isValidConfiguration(config: SimulationConfiguration): boolean {
  if (config.mode === SimulationMode.IDEAL) {
    // Ideal mode doesn't need integrator or algorithm
    return config.integrator === undefined && config.algorithm === undefined;
  }

  if (config.mode === SimulationMode.NBODY) {
    // N-Body mode requires both integrator and algorithm
    return config.integrator !== undefined && config.algorithm !== undefined;
  }

  return false;
}

/**
 * Returns the default simulation configuration.
 * Uses Barnes-Hut algorithm with Velocity Verlet integrator (optimal for N-body simulations).
 */
export function getDefaultConfiguration(): SimulationConfiguration {
  return {
    mode: SimulationMode.NBODY,
    integrator: IntegratorType.VERLET,
    algorithm: AlgorithmType.BARNES_HUT,
  };
}

/**
 * Gets a user-friendly display name for a configuration.
 * Simplified since we only use Barnes-Hut + Velocity Verlet for N-body simulations.
 */
export function getConfigurationDisplayName(
  config: SimulationConfiguration,
): string {
  if (config.mode === SimulationMode.IDEAL) {
    return "Ideal Orrery";
  }

  return "N-Body Simulation";
}

/**
 * Gets a short name for display in constrained UI spaces.
 * Simplified since we only use Barnes-Hut + Velocity Verlet for N-body simulations.
 */
export function getConfigurationShortName(
  config: SimulationConfiguration,
): string {
  if (config.mode === SimulationMode.IDEAL) {
    return "Ideal";
  }

  return "N-Body";
}
