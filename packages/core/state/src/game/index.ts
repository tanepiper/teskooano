import { simulationStateService } from "./simulation";
import { gameStateService } from "./stores";
import { getPhysicsBodies, updatePhysicsState } from "./physics";
import { celestialActions } from "./celestialActions";
import { celestialFactory, type ClearStateOptions } from "./factory";
import { renderableObjects$, renderableActions } from "./renderableStore";

export { gameStateService, simulationStateService };

export const currentSeed$ = gameStateService.currentSeed$;
export const updateSeed = gameStateService.updateSeed.bind(gameStateService);
export const getCurrentSeed =
  gameStateService.getCurrentSeed.bind(gameStateService);

export const celestialObjects$ = gameStateService.celestialObjects$;
export const getCelestialObjects =
  gameStateService.getCelestialObjects.bind(gameStateService);
export const setCelestialObject =
  gameStateService.setCelestialObject.bind(gameStateService);
export const removeCelestialObject =
  gameStateService.removeCelestialObject.bind(gameStateService);
export const setAllCelestialObjects =
  gameStateService.setAllCelestialObjects.bind(gameStateService);

export const celestialHierarchy$ = gameStateService.celestialHierarchy$;
export const getCelestialHierarchy =
  gameStateService.getCelestialHierarchy.bind(gameStateService);
export const setCelestialHierarchy =
  gameStateService.setCelestialHierarchy.bind(gameStateService);
export const removeCelestialHierarchyEntry =
  gameStateService.removeCelestialHierarchyEntry.bind(gameStateService);
export const setAllCelestialHierarchy =
  gameStateService.setAllCelestialHierarchy.bind(gameStateService);

export const accelerationVectors$ = gameStateService.accelerationVectors$;
export const updateAccelerationVectors =
  gameStateService.updateAccelerationVectors.bind(gameStateService);
export const getAccelerationVectors =
  gameStateService.getAccelerationVectors.bind(gameStateService);

export const getChildrenOfObject =
  gameStateService.getChildrenOfObject.bind(gameStateService);

export const simulationState$ = simulationStateService.simulationState$;
export const getSimulationState = simulationStateService.getCurrentState.bind(
  simulationStateService,
);
export const setSimulationState = simulationStateService.setState.bind(
  simulationStateService,
);

export const actions = {
  setTimeScale: simulationStateService.setTimeScale.bind(
    simulationStateService,
  ),
  togglePause: simulationStateService.togglePause.bind(simulationStateService),
  resetTime: simulationStateService.resetTime.bind(simulationStateService),
  stepTime: simulationStateService.stepTime.bind(simulationStateService),
  selectObject: simulationStateService.selectObject.bind(
    simulationStateService,
  ),
  setFocusedObject: simulationStateService.setFocusedObject.bind(
    simulationStateService,
  ),
  updateCamera: simulationStateService.updateCamera.bind(
    simulationStateService,
  ),
  setPhysicsEngine: simulationStateService.setPhysicsEngine.bind(
    simulationStateService,
  ),
  setPerformanceProfile: simulationStateService.setPerformanceProfile.bind(
    simulationStateService,
  ),
  setTrailLengthMultiplier:
    simulationStateService.setTrailLengthMultiplier.bind(
      simulationStateService,
    ),
  ...celestialActions,
  ...celestialFactory,
  ...renderableActions,
  updateAccelerationVectors:
    gameStateService.updateAccelerationVectors.bind(gameStateService),
  updateSeed: gameStateService.updateSeed.bind(gameStateService),
};

export { getPhysicsBodies, updatePhysicsState, renderableObjects$ };

export type { ClearStateOptions };
export type {
  SimulationState,
  CameraState,
  PhysicsEngineType,
  PerformanceProfileType,
  VisualSettingsState,
} from "./types";
