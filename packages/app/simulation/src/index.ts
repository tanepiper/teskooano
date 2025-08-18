import { SimulationOrchestrator } from "./SimulationOrchestrator";

// Export the singleton instance for easy access
export const simulationOrchestrator = SimulationOrchestrator.getInstance();

// Export the class itself if direct type access or static access is needed elsewhere
export { SimulationOrchestrator };
