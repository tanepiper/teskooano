// Re-export all modules
// Import the new observable and getter from simulation
import {
  simulationState$,
  simulationActions,
  getSimulationState,
  setSimulationState,
} from "./simulation";
// Import new store observables and relevant helpers
import {
  celestialObjects$, // Export observable
  celestialHierarchy$, // Export observable
  accelerationVectors$, // Export observable
  getChildrenOfObject,
  updateAccelerationVectors, // Export action
  currentSeed, // Export seed subject/atom
  updateSeed, // Export seed action
} from "./stores";
import { getPhysicsBodies, updatePhysicsState } from "./physics";
import { celestialActions } from "./celestialActions";
import { celestialFactory, type ClearStateOptions } from "./factory";
// Import renderable store observable and actions
import { renderableObjects$, renderableActions } from "./renderableStore";

// Create combined actions object for backward compatibility
export const actions = {
  ...simulationActions,
  ...celestialActions,
  ...celestialFactory,
  ...renderableActions, // Add renderable actions
  updateAccelerationVectors, // Add this specific action
  updateSeed, // Add seed action
};

// Export everything intended for public consumption
export {
  // From simulation.ts
  simulationState$, // Export observable
  simulationActions,
  getSimulationState, // Export synchronous getter
  setSimulationState, // Export synchronous setter

  // From stores.ts
  celestialObjects$,
  celestialHierarchy$,
  accelerationVectors$,
  getChildrenOfObject,
  updateAccelerationVectors,
  currentSeed, // Export seed subject/atom
  updateSeed,

  // From physics.ts
  getPhysicsBodies,
  updatePhysicsState,

  // From celestialActions.ts
  celestialActions,

  // From factory.ts
  celestialFactory,

  // From renderableStore.ts
  renderableObjects$,
  renderableActions,
};

// Re-export types
export type { ClearStateOptions };
