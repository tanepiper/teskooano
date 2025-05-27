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

// Legacy compatibility exports (deprecated) - commented out to discourage usage
// If you need these, import directly from "./simulation" and update your code to use physicsEngineService
// export {
//   updateSimulation,
//   createSimulationStream,
// } from "./simulation";

// Sub-components for advanced usage
export { AccelerationCalculator } from "./acceleration-calculator";
export {
  IntegrationManager,
  type IntegrationParameters,
} from "./integration-manager";
export { SimulationOrchestrator } from "./simulation-orchestrator";

// Prediction utilities
export * from "./prediction";
