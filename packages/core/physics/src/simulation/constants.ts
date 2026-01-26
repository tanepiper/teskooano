import { AlgorithmType, IntegratorType } from "@teskooano/data-types";

// Simplified: Only Barnes-Hut algorithm for N-body simulations
export const algorithms = [AlgorithmType.BARNES_HUT] as const;

// Simplified: Only Velocity Verlet integrator (symplectic, optimal for N-body)
export const integrators = [IntegratorType.VERLET] as const;
