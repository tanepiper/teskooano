import {
  SimulationManager,
  type OrbitUpdatePayload,
} from "./SimulationManager";
import type { DestructionEvent } from "@teskooano/core-physics"; // This is a type from another package

// Export the singleton instance for easy access
export const simulationManager = SimulationManager.getInstance();

// Export the class itself if direct type access or static access is needed elsewhere
export { SimulationManager };

// Re-export relevant types
export type { OrbitUpdatePayload };
export type { DestructionEvent }; // Re-export if it's part of the public API of this module

export * from "./solarSystem"; // Keep this as it relates to systems/
