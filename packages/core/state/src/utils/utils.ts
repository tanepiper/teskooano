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
 */
export function getDefaultConfiguration(): SimulationConfiguration {
  return {
    mode: SimulationMode.NBODY,
    integrator: IntegratorType.PEFRL,
    algorithm: AlgorithmType.BARNES_HUT,
  };
}

/**
 * Gets a user-friendly display name for a configuration.
 */
export function getConfigurationDisplayName(
  config: SimulationConfiguration,
): string {
  if (config.mode === SimulationMode.IDEAL) {
    return "Ideal Orrery";
  }

  const integrator = config.integrator
    ? config.integrator.charAt(0).toUpperCase() + config.integrator.slice(1)
    : "Unknown";
  const algorithm = config.algorithm
    ? config.algorithm
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join("-")
    : "Unknown";

  return `N-Body (${algorithm} + ${integrator})`;
}

/**
 * Gets a short name for display in constrained UI spaces.
 */
export function getConfigurationShortName(
  config: SimulationConfiguration,
): string {
  if (config.mode === SimulationMode.IDEAL) {
    return "Ideal";
  }

  let algorithmShort: string;
  switch (config.algorithm) {
    case AlgorithmType.BARNES_HUT:
      algorithmShort = "BH";
      break;
    default:
      algorithmShort = "BH"; // Barnes-Hut is the default
      break;
  }

  const integratorShort = config.integrator
    ? config.integrator.charAt(0).toUpperCase() + config.integrator.slice(1, 3)
    : "Unk";

  return `${algorithmShort}-${integratorShort}`;
}
