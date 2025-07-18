import { simulationStateService } from "./simulation";
import { physicsSystemAdapter } from "./PhysicsSystemAdapter";
import { renderableStore } from "./renderableStore";
import { celestialManager } from "./managers/celestialManager";
import { celestialStore as celestial } from "./stores/celestialStore";
import { seedStore as seed } from "./stores/seedStore";
import { physicsStore as physics } from "./stores/physicsStore";
import { PhysicsStateCalculator } from "./services/PhysicsStateCalculator";
import { PhysicsStateProvider } from "./services/PhysicsStateProvider";
import { ClearStateOptions } from "./types";
import type {
  CelestialObject,
  CelestialSpecificPropertiesUnion,
  DeviceTier,
} from "@teskooano/data-types";
import type { OSVector3 } from "@teskooano/core-math";

// Export the service instances directly
export {
  simulationStateService,
  renderableStore,
  physicsSystemAdapter,
  celestialManager,
  celestial,
  seed,
  physics,
  simulationStateService as simulation,
  PhysicsStateCalculator,
  PhysicsStateProvider,
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

export type { ClearStateOptions };
export type {
  SimulationState,
  CameraState,
  VisualSettingsState,
  SimulationMode,
  IntegratorType,
  AlgorithmType,
  SimulationConfiguration,
} from "./types";

export {
  isValidConfiguration,
  getDefaultConfiguration,
  getConfigurationDisplayName,
  getConfigurationShortName,
} from "./types";
