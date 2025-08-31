// Import from logical directories
import { celestialManager } from "./managers";
import { physicsSystemAdapter } from "./adapters";
import {
  PhysicsStateCalculator,
  PhysicsStateProvider,
  simulationStateService,
} from "./services";
import {
  celestialStore as celestial,
  physicsStore as physics,
  seedStore as seed,
  renderableStore,
} from "./stores";
// Export types and utilities
export {
  type SimulationState,
  type SimulationConfiguration,
  type CameraState,
  type VisualSettingsState,
  type ClearStateOptions,
  type CelestialRegistry,
} from "./types";
export * from "./utils";

// Export the service instances directly
export {
  celestial,
  celestialManager,
  physics,
  PhysicsStateCalculator,
  PhysicsStateProvider,
  physicsSystemAdapter,
  renderableStore,
  seed,
  simulationStateService as simulation,
  simulationStateService,
};

// Export observables directly
export const currentSeed$ = seed.currentSeed$;
export const celestialObjects$ = celestial.objects$;
export const celestialHierarchy$ = celestial.hierarchy$;
export const accelerationVectors$ = physics.accelerationVectors$;
export const simulationState$ = simulationStateService.simulationState$;

// Legacy actions object for backward compatibility
export const actions = {
  // Simulation actions
  setTimeScale: simulationStateService.setTimeScale.bind(
    simulationStateService,
  ),
  togglePause: simulationStateService.togglePause.bind(simulationStateService),
  resetTime: simulationStateService.resetTime.bind(simulationStateService),
  setStartDate: simulationStateService.setStartDate.bind(
    simulationStateService,
  ),
  resetToStartDate: simulationStateService.resetToStartDate.bind(
    simulationStateService,
  ),
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
  setPerformanceProfile: simulationStateService.setPerformanceProfile.bind(
    simulationStateService,
  ),
  setTrailLengthMultiplier:
    simulationStateService.setTrailLengthMultiplier.bind(
      simulationStateService,
    ),

  // Celestial actions
  addCelestialObject: celestialManager.addObject.bind(celestialManager),
  updateCelestialObject: celestialManager.updateObject.bind(celestialManager),
  updateOrbitalParameters: celestialManager.updateOrbit.bind(celestialManager),
  markObjectDestroyed: celestialManager.markDestroyed.bind(celestialManager),
  removeCelestialObject: celestialManager.removeObject.bind(celestialManager),

  // Factory actions
  clearState: celestialManager.clearState.bind(celestialManager),
  createSolarSystem: celestialManager.createSolarSystem.bind(celestialManager),
  addCelestial: celestialManager.addCelestial.bind(celestialManager),

  // Game state actions
  updateAccelerationVectors: physics.updateAccelerationVectors.bind(physics),
  updateSeed: seed.updateSeed.bind(seed),
};
