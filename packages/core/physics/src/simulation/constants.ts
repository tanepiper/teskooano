import { AlgorithmType, IntegratorType } from "@teskooano/data-types";

// Generate estimates for all N-body configurations
export const algorithms = [
  AlgorithmType.BARNES_HUT,
  AlgorithmType.FMM,
  AlgorithmType.P3M,
  AlgorithmType.TREE_PM,
] as const;
export const integrators = [
  IntegratorType.EULER,
  IntegratorType.SYMPLECTIC,
  IntegratorType.VERLET,
  IntegratorType.RK4,
  IntegratorType.ADAPTIVE,
  IntegratorType.YOSHIDA4,
  IntegratorType.FOREST_RUTH,
  IntegratorType.PEFRL,
  IntegratorType.LEAPFROG,
] as const;
