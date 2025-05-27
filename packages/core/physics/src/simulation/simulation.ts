import { Observable } from "rxjs";
import { PhysicsStateReal } from "../types";
import {
  physicsEngineService,
  PhysicsEngineService,
  SimulationStepResult,
  SimulationParameters,
  PhysicsPerformanceMetrics,
} from "./physics-engine-service";

/**
 * @deprecated Use physicsEngineService singleton instead
 * Legacy function for backwards compatibility with existing code
 */
export const updateSimulation = (
  bodies: PhysicsStateReal[],
  dt: number,
  params: SimulationParameters,
): SimulationStepResult => {
  console.warn(
    "[DEPRECATED] updateSimulation() function is deprecated. Use physicsEngineService.executeStep() instead.",
  );
  return physicsEngineService.executeStep(bodies, dt, params);
};

/**
 * @deprecated Use physicsEngineService.createSimulationStream() instead
 * Legacy function for backwards compatibility with existing code
 */
export const createSimulationStream = (
  initialState: PhysicsStateReal[],
  parameters$: Observable<SimulationParameters>,
  tick$: Observable<number>,
): Observable<SimulationStepResult> => {
  console.warn(
    "[DEPRECATED] createSimulationStream() function is deprecated. Use physicsEngineService.createSimulationStream() instead.",
  );
  return physicsEngineService.createSimulationStream(
    initialState,
    parameters$,
    tick$,
  );
};

// Re-export the main service and types for easy access
export {
  physicsEngineService,
  PhysicsEngineService,
  type SimulationStepResult,
  type SimulationParameters,
  type PhysicsPerformanceMetrics,
};

// Re-export sub-components for advanced usage
export { AccelerationCalculator } from "./acceleration-calculator";
export {
  IntegrationManager,
  type IntegrationParameters,
} from "./integration-manager";
export { SimulationOrchestrator } from "./simulation-orchestrator";
