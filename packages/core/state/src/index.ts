// Import from logical directories
import { celestialManager, simulationManager, CameraManager } from "./managers";
import { physicsSystemAdapter } from "./adapters";
import { PhysicsStateCalculator, PhysicsStateProvider } from "./services";
import {
  celestialStore as celestial,
  physicsStore as physics,
  seedStore as seed,
  renderableStore,
  simulationStore,
  CameraStore,
} from "./stores";
// Export types and utilities
export {
  type SimulationState,
  type SimulationConfiguration,
  type VisualSettingsState,
  type ClearStateOptions,
  type CelestialRegistry,
} from "./types";
export { type CameraState } from "./stores/CameraStore";
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
  simulationManager,
  simulationStore,
  CameraManager,
  CameraStore,
};

// Export observables directly
export const currentSeed$ = seed.currentSeed$;
export const celestialObjects$ = celestial.objects$;
export const celestialHierarchy$ = celestial.hierarchy$;
export const accelerationVectors$ = physics.accelerationVectors$;
export const simulationState$ = simulationStore.simulationState$;

// Legacy actions object for backward compatibility
export const actions = {
  // Simulation actions
  setTimeScale: simulationManager.setTimeScale.bind(simulationManager),
  togglePause: simulationManager.togglePause.bind(simulationManager),
  resetTime: simulationManager.resetTime.bind(simulationManager),
  setStartDate: simulationManager.setStartDate.bind(simulationManager),
  resetToStartDate: simulationManager.resetToStartDate.bind(simulationManager),
  stepTime: simulationManager.stepTime.bind(simulationManager),

  setPerformanceProfile:
    simulationManager.setPerformanceProfile.bind(simulationManager),
  setTrailLengthMultiplier:
    simulationManager.setTrailLengthMultiplier.bind(simulationManager),

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
