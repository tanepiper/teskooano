import { simulationStateService } from "./simulation";
import { physicsSystemAdapter } from "./PhysicsSystemAdapter";
import { renderableStore } from "./renderableStore";
import { celestialManager } from "./managers/celestialManager";
import { celestialStore } from "./stores/celestialStore";
import { seedStore } from "./stores/seedStore";
import { physicsStore } from "./stores/physicsStore";
import { ClearStateOptions } from "./types";
import type { CelestialObject, DeviceTier } from "@teskooano/data-types";
import type { OSVector3 } from "@teskooano/core-math";

// Export the service instances directly
export {
  simulationStateService,
  renderableStore,
  physicsSystemAdapter,
  celestialManager,
  celestialStore,
  seedStore,
  physicsStore,
};

// Export observables directly
export const currentSeed$ = seedStore.currentSeed$;
export const celestialObjects$ = celestialStore.objects$;
export const celestialHierarchy$ = celestialStore.hierarchy$;
export const accelerationVectors$ = physicsStore.accelerationVectors$;
export const simulationState$ = simulationStateService.simulationState$;

// Create a functional API for celestial operations
export const celestial = {
  // Object operations
  addObject: (object: CelestialObject) => celestialManager.addObject(object),
  updateObject: (id: string, updates: Partial<CelestialObject>) =>
    celestialManager.updateObject(id, updates),
  removeObject: (id: string) => celestialManager.removeObject(id),
  markDestroyed: (id: string) => celestialManager.markDestroyed(id),

  // Orbit operations
  updateOrbit: (id: string, parameters: any) =>
    celestialManager.updateOrbit(id, parameters),

  // System operations
  createSolarSystem: (data: CelestialObject, clearStateFirst?: boolean) =>
    celestialManager.createSolarSystem(data, clearStateFirst),
  addObjects: (objects: CelestialObject[]) =>
    celestialManager.addObjects(objects),
  addCelestial: (object: CelestialObject) =>
    celestialManager.addCelestial(object),
  clearState: (options?: ClearStateOptions) =>
    celestialManager.clearState(options),

  // Data access
  getObjects: () => celestialStore.getObjects(),
  getObject: (id: string) => celestialStore.getObject(id),
  getHierarchy: () => celestialStore.getHierarchy(),
  getChildren: (parentId: string) => celestialStore.getChildren(parentId),
  getParent: (childId: string) => celestialStore.getParent(childId),
};

// Create a functional API for seed operations
export const seed = {
  getCurrent: () => seedStore.getCurrentSeed(),
  update: (newSeed: string) => seedStore.updateSeed(newSeed),
};

// Create a functional API for physics operations
export const physics = {
  getAccelerationVectors: () => physicsStore.getAccelerationVectors(),
  updateAccelerationVectors: (vectors: Map<string, OSVector3>) =>
    physicsStore.updateAccelerationVectors(vectors),
  setAccelerationVector: (id: string, vector: OSVector3) =>
    physicsStore.setAccelerationVector(id, vector),
  removeAccelerationVector: (id: string) =>
    physicsStore.removeAccelerationVector(id),
  clearAccelerationVectors: () => physicsStore.clearAccelerationVectors(),
};

// Create a functional API for simulation state operations
export const simulation = {
  getState: () => simulationStateService.getSimulationState(),
  setState: (state: any) => simulationStateService.setSimulationState(state),

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

// Legacy actions object for backward compatibility
export const actions = {
  // Simulation actions
  setTimeScale: simulation.setTimeScale,
  togglePause: simulation.togglePause,
  resetTime: simulation.resetTime,
  stepTime: simulation.stepTime,
  selectObject: simulation.selectObject,
  setFocusedObject: simulation.setFocusedObject,
  updateCamera: simulation.updateCamera,
  setPerformanceProfile: simulation.setPerformanceProfile,
  setTrailLengthMultiplier: simulation.setTrailLengthMultiplier,

  // Celestial actions
  addCelestialObject: celestial.addObject,
  updateCelestialObject: celestial.updateObject,
  updateOrbitalParameters: celestial.updateOrbit,
  markObjectDestroyed: celestial.markDestroyed,
  removeCelestialObject: celestial.removeObject,

  // Factory actions
  clearState: celestial.clearState,
  createSolarSystem: celestial.createSolarSystem,
  addCelestial: celestial.addCelestial,

  // Game state actions
  updateAccelerationVectors: physics.updateAccelerationVectors,
  updateSeed: seed.update,
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
