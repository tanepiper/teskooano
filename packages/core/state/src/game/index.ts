// Re-export all modules
import { simulationState, simulationActions } from './simulation';
import { celestialObjectsStore, celestialHierarchyStore, getChildrenOfObject } from './stores';
import { getPhysicsBodies, updatePhysicsState } from './physics';
import { celestialActions } from './celestialActions';
import { celestialFactory, type ClearStateOptions } from './factory';

// Create combined actions object for backward compatibility
export const actions = {
  ...simulationActions,
  ...celestialActions,
  ...celestialFactory
};

// Export everything
export {
  // From simulation.ts
  simulationState,
  simulationActions,
  
  // From stores.ts
  celestialObjectsStore,
  celestialHierarchyStore,
  getChildrenOfObject,
  
  // From physics.ts
  getPhysicsBodies,
  updatePhysicsState,
  
  // From celestialActions.ts
  celestialActions,
  
  // From factory.ts
  celestialFactory
};

// Re-export types
export type { ClearStateOptions }; 