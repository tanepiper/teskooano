import {
  simulationState$,
  simulationActions,
  getSimulationState,
  setSimulationState,
} from "./simulation";

import {
  celestialObjects$,
  celestialHierarchy$,
  accelerationVectors$,
  getChildrenOfObject,
  updateAccelerationVectors,
  currentSeed,
  updateSeed,
} from "./stores";
import { getPhysicsBodies, updatePhysicsState } from "./physics";
import { celestialActions } from "./celestialActions";
import { celestialFactory, type ClearStateOptions } from "./factory";

import { renderableObjects$, renderableActions } from "./renderableStore";

export const actions = {
  ...simulationActions,
  ...celestialActions,
  ...celestialFactory,
  ...renderableActions,
  updateAccelerationVectors,
  updateSeed,
};

export {
  simulationState$,
  simulationActions,
  getSimulationState,
  setSimulationState,
  celestialObjects$,
  celestialHierarchy$,
  accelerationVectors$,
  getChildrenOfObject,
  updateAccelerationVectors,
  currentSeed,
  updateSeed,
  getPhysicsBodies,
  updatePhysicsState,
  celestialActions,
  celestialFactory,
  renderableObjects$,
  renderableActions,
};

export type { ClearStateOptions };
