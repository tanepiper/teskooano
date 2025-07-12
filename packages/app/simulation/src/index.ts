import { SimulationManager } from "./SimulationManager";

// Export the singleton instance for easy access
export const simulationManager = SimulationManager.getInstance();

// Export the class itself if direct type access or static access is needed elsewhere
export { SimulationManager };
