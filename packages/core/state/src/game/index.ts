import { simulationStateService } from "./simulation";
import { gameStateService } from "./stores";
import { physicsSystemAdapter } from "./PhysicsSystemAdapter";
import { celestialActions } from "./celestialActions";
import { celestialFactory } from "./factory";
import { renderableStore } from "./renderableStore";
import { ClearStateOptions } from "./types";
import type { CelestialObject, DeviceTier } from "@teskooano/data-types";
import type { OSVector3 } from "@teskooano/core-math";

// Export the service instances directly
export {
  gameStateService,
  simulationStateService,
  renderableStore,
  physicsSystemAdapter,
  celestialActions,
  celestialFactory,
};

// Export observables directly
export const currentSeed$ = gameStateService.currentSeed$;
export const celestialObjects$ = gameStateService.celestialObjects$;
export const celestialHierarchy$ = gameStateService.celestialHierarchy$;
export const accelerationVectors$ = gameStateService.accelerationVectors$;
export const simulationState$ = simulationStateService.simulationState$;

// Create a functional API for game state operations
export const gameState = {
  // Seed operations
  updateSeed: (newSeed: string) => gameStateService.updateSeed(newSeed),
  getCurrentSeed: () => gameStateService.getCurrentSeed(),

  // Celestial object operations
  getCelestialObjects: () => gameStateService.getCelestialObjects(),
  setCelestialObject: (id: string, object: CelestialObject) =>
    gameStateService.setCelestialObject(id, object),
  removeCelestialObject: (id: string) =>
    gameStateService.removeCelestialObject(id),
  setAllCelestialObjects: (objects: Record<string, CelestialObject>) =>
    gameStateService.setAllCelestialObjects(objects),

  // Hierarchy operations
  getCelestialHierarchy: () => gameStateService.getCelestialHierarchy(),
  setCelestialHierarchy: (hierarchy: Record<string, string[]>) =>
    gameStateService.setCelestialHierarchy(hierarchy),
  removeCelestialHierarchyEntry: (objectId: string) =>
    gameStateService.removeCelestialHierarchyEntry(objectId),
  setAllCelestialHierarchy: (hierarchy: Record<string, string[]>) =>
    gameStateService.setAllCelestialHierarchy(hierarchy),

  // Acceleration vectors
  updateAccelerationVectors: (vectors: Map<string, OSVector3>) =>
    gameStateService.updateAccelerationVectors(vectors),
  getAccelerationVectors: () => gameStateService.getAccelerationVectors(),

  // Utility operations
  getChildrenOfObject: (objectId: string) =>
    gameStateService.getChildrenOfObject(objectId),
};

// Create a functional API for simulation state operations
export const simulationState = {
  getSimulationState: () => simulationStateService.getSimulationState(),
  setSimulationState: (state: any) =>
    simulationStateService.setSimulationState(state),

  // Time control
  setTimeScale: (scale: number) => simulationStateService.setTimeScale(scale),
  togglePause: () => simulationStateService.togglePause(),
  resetTime: () => simulationStateService.resetTime(),
  stepTime: (dt?: number) => simulationStateService.stepTime(dt),

  // Object selection and focus
  selectObject: (objectId: string | null) =>
    simulationStateService.selectObject(objectId),
  setFocusedObject: (objectId: string | null) =>
    simulationStateService.setFocusedObject(objectId),

  // Camera control
  updateCamera: (position: OSVector3, target: OSVector3) =>
    simulationStateService.updateCamera(position, target),

  // Performance and visual settings
  setPerformanceProfile: (profile: DeviceTier) =>
    simulationStateService.setPerformanceProfile(profile),
  setTrailLengthMultiplier: (multiplier: number) =>
    simulationStateService.setTrailLengthMultiplier(multiplier),
};

// Create a functional API for celestial actions
export const celestialOperations = {
  addCelestialObject: (object: CelestialObject) =>
    celestialActions.addCelestialObject(object),
  updateCelestialObject: (id: string, updates: Partial<CelestialObject>) =>
    celestialActions.updateCelestialObject(id, updates),
  updateOrbitalParameters: (id: string, params: any) =>
    celestialActions.updateOrbitalParameters(id, params),
  markObjectDestroyed: (id: string) => celestialActions.markObjectDestroyed(id),
  removeCelestialObject: (id: string) =>
    celestialActions.removeCelestialObject(id),
};

// Create a functional API for factory operations
export const factoryOperations = {
  clearState: (options?: ClearStateOptions) =>
    celestialFactory.clearState(options),
  createSolarSystem: (data: CelestialObject, clearStateFirst?: boolean) =>
    celestialFactory.createSolarSystem(data, clearStateFirst),
  addCelestial: (celestial: CelestialObject) =>
    celestialFactory.addCelestial(celestial),
};

// Legacy actions object for backward compatibility
export const actions = {
  // Simulation actions
  setTimeScale: simulationState.setTimeScale,
  togglePause: simulationState.togglePause,
  resetTime: simulationState.resetTime,
  stepTime: simulationState.stepTime,
  selectObject: simulationState.selectObject,
  setFocusedObject: simulationState.setFocusedObject,
  updateCamera: simulationState.updateCamera,
  setPerformanceProfile: simulationState.setPerformanceProfile,
  setTrailLengthMultiplier: simulationState.setTrailLengthMultiplier,

  // Celestial actions
  addCelestialObject: celestialOperations.addCelestialObject,
  updateCelestialObject: celestialOperations.updateCelestialObject,
  updateOrbitalParameters: celestialOperations.updateOrbitalParameters,
  markObjectDestroyed: celestialOperations.markObjectDestroyed,
  removeCelestialObject: celestialOperations.removeCelestialObject,

  // Factory actions
  clearState: factoryOperations.clearState,
  createSolarSystem: factoryOperations.createSolarSystem,
  addCelestial: factoryOperations.addCelestial,

  // Game state actions
  updateAccelerationVectors: gameState.updateAccelerationVectors,
  updateSeed: gameState.updateSeed,
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
