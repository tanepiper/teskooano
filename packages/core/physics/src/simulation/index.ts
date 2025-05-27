// Main singleton service - primary entry point
export {
  physicsEngineService,
  PhysicsEngineService,
  type PhysicsPerformanceMetrics,
} from "./physics-engine-service";

// Core simulation interfaces and types
export type {
  SimulationStepResult,
  SimulationParameters,
} from "./simulation-orchestrator";

// Sub-components for advanced usage
export { AccelerationCalculator } from "./acceleration-calculator";
export {
  IntegrationManager,
  type IntegrationParameters,
} from "./integration-manager";
export { SimulationOrchestrator } from "./simulation-orchestrator";

// Trajectory prediction service
export {
  trajectoryPredictionService,
  TrajectoryPredictionService,
  type TrajectoryPredictionOptions,
} from "./prediction";
