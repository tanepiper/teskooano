import type { OSVector3 } from "@teskooano/core-math";
import type {
  CelestialObject,
  RenderableCelestialObject,
  PhysicsStateReal,
} from "@teskooano/data-types";
import { Observable } from "rxjs";
import {
  celestialStore,
  physicsStore as physics,
  seedStore as seed,
  renderableStore,
  simulationStore,
  CameraStore,
} from "./../stores";
import { PhysicsStateProvider } from "../services";
import { CameraManager } from "../managers";
import type { SimulationState } from "../types";
import type { CameraState } from "../stores/CameraStore";

// Re-export observables for convenience
export const currentSeed$ = seed.currentSeed$;
export const celestialObjects$ = celestialStore.objects$;
export const celestialHierarchy$ = celestialStore.hierarchy$;
export const accelerationVectors$ = physics.accelerationVectors$;
export const simulationState$ = simulationStore.simulationState$;

/**
 * Standardized accessor for all state in the Teskooano application.
 *
 * This utility provides consistent patterns for accessing state both reactively
 * (with Observable streams) and imperatively (with getter functions). It eliminates
 * the inconsistency between direct imports of observables/getters and provides
 * a single point of access for all state.
 *
 * @example
 * ```typescript
 * // Reactive access
 * StateAccessor.celestialObjects$().subscribe(objects => {
 *   // Handle objects update
 * });
 *
 * // Imperative access
 * const currentObjects = StateAccessor.getCelestialObjects();
 * ```
 */
export class StateAccessor {
  // Celestial Objects
  /**
   * Gets a reactive stream of celestial objects.
   * Preferred over direct import of celestialObjects$ for consistent access patterns.
   */
  static celestialObjects$(): Observable<Record<string, CelestialObject>> {
    return celestialObjects$;
  }

  /**
   * Gets the current celestial objects imperatively.
   */
  static getCelestialObjects(): Record<string, CelestialObject> {
    return celestialStore.getObjects();
  }

  // Simulation State
  /**
   * Gets a reactive stream of simulation state.
   * Preferred over direct import of simulationState$ for consistent access patterns.
   */
  static simulation$(): Observable<SimulationState> {
    return simulationState$;
  }

  /**
   * Gets the current simulation state imperatively.
   */
  static getSimulationState(): SimulationState {
    return simulationStore.getSimulationState();
  }

  // Celestial Hierarchy
  /**
   * Gets a reactive stream of celestial hierarchy.
   */
  static celestialHierarchy$(): Observable<Record<string, string[]>> {
    return celestialHierarchy$;
  }

  /**
   * Gets the current celestial hierarchy imperatively.
   */
  static getCelestialHierarchy(): Record<string, string[]> {
    return celestialStore.getHierarchy();
  }

  // Acceleration Vectors
  /**
   * Gets a reactive stream of acceleration vectors.
   */
  static accelerationVectors$(): Observable<Record<string, OSVector3>> {
    return accelerationVectors$;
  }

  /**
   * Gets the current acceleration vectors imperatively.
   */
  static getAccelerationVectors(): Record<string, OSVector3> {
    return physics.getAccelerationVectors();
  }

  // Physics States
  /**
   * Gets a reactive stream of physics states for active celestial objects.
   * Filters out destroyed, annihilated, and physics-ignored objects.
   */
  static physicsStates$(): Observable<PhysicsStateReal[]> {
    return PhysicsStateProvider.physicsStates$;
  }

  /**
   * Gets a reactive stream of active celestial objects (filtered for physics simulation).
   */
  static physicsActiveObjects$(): Observable<Record<string, CelestialObject>> {
    return PhysicsStateProvider.physicsActiveObjects$;
  }

  /**
   * Gets the current physics states for all active objects (imperative version).
   */
  static getPhysicsStates(): PhysicsStateReal[] {
    return PhysicsStateProvider.getPhysicsStates();
  }

  /**
   * Gets the current active objects for physics (imperative version).
   */
  static getPhysicsActiveObjects(): Record<string, CelestialObject> {
    return PhysicsStateProvider.getPhysicsActiveObjects();
  }

  // Filtered Celestial Objects
  /**
   * Gets a reactive stream of active celestial objects (not destroyed or annihilated).
   */
  static activeObjects$(): Observable<Record<string, CelestialObject>> {
    return celestialStore.activeObjects$;
  }

  /**
   * Gets a reactive stream of destroyed celestial objects.
   */
  static destroyedObjects$(): Observable<Record<string, CelestialObject>> {
    return celestialStore.destroyedObjects$;
  }

  /**
   * Gets a reactive stream of visible celestial objects (active and visible).
   */
  static visibleObjects$(): Observable<Record<string, CelestialObject>> {
    return celestialStore.visibleObjects$;
  }

  /**
   * Gets the current active objects (imperative version).
   */
  static getActiveObjects(): Record<string, CelestialObject> {
    return celestialStore.getActiveObjects();
  }

  /**
   * Gets the current destroyed objects (imperative version).
   */
  static getDestroyedObjects(): Record<string, CelestialObject> {
    return celestialStore.getDestroyedObjects();
  }

  /**
   * Gets the current visible objects (imperative version).
   */
  static getVisibleObjects(): Record<string, CelestialObject> {
    return celestialStore.getVisibleObjects();
  }

  // Current Seed
  /**
   * Gets a reactive stream of the current seed.
   */
  static getCurrentSeedStream(): Observable<string> {
    return currentSeed$;
  }

  /**
   * Gets the current seed imperatively.
   */
  static getCurrentSeed(): string {
    return seed.getCurrentSeed();
  }

  // Convenience methods for common patterns
  /**
   * Gets a specific celestial object by ID.
   * @param objectId The ID of the object to retrieve
   * @returns The celestial object or undefined if not found
   */
  static getCelestialObject(objectId: string): CelestialObject | undefined {
    return this.getCelestialObjects()[objectId];
  }

  /**
   * Gets multiple celestial objects by their IDs.
   * @param objectIds Array of object IDs to retrieve
   * @returns Array of celestial objects (only existing objects are included)
   */
  static getCelestialObjectsByIds(objectIds: string[]): CelestialObject[] {
    const allObjects = this.getCelestialObjects();
    return objectIds
      .map((id) => allObjects[id])
      .filter((obj): obj is CelestialObject => obj !== undefined);
  }

  /**
   * Gets multiple celestial objects by their IDs as a map.
   * @param objectIds Array of object IDs to retrieve
   * @returns Record mapping IDs to celestial objects (only existing objects are included)
   */
  static getCelestialObjectsMapByIds(
    objectIds: string[],
  ): Record<string, CelestialObject> {
    const allObjects = this.getCelestialObjects();
    const result: Record<string, CelestialObject> = {};

    objectIds.forEach((id) => {
      const obj = allObjects[id];
      if (obj) {
        result[id] = obj;
      }
    });

    return result;
  }

  /**
   * Checks if a celestial object exists by ID.
   * @param objectId The ID to check
   * @returns True if the object exists
   */
  static hasCelestialObject(objectId: string): boolean {
    return objectId in this.getCelestialObjects();
  }

  /**
   * Gets all celestial object IDs.
   * @returns Array of all celestial object IDs
   */
  static getCelestialObjectIds(): string[] {
    return Object.keys(this.getCelestialObjects());
  }

  /**
   * Gets the count of celestial objects.
   * @returns Number of celestial objects in the system
   */
  static getCelestialObjectCount(): number {
    return Object.keys(this.getCelestialObjects()).length;
  }

  /**
   * Checks if the system has any celestial objects.
   * @returns True if there are celestial objects in the system
   */
  static hasAnyCelestialObjects(): boolean {
    return this.getCelestialObjectCount() > 0;
  }

  // =============================================================================
  // RENDERABLE OBJECTS ACCESS
  // =============================================================================

  /**
   * Gets the current snapshot of all renderable objects (reactive).
   * @returns Observable of the current renderable objects map
   */
  static renderableObjects$(): Observable<
    Record<string, RenderableCelestialObject>
  > {
    return renderableStore.renderableObjects$;
  }

  /**
   * Gets the current snapshot of all renderable objects (imperative).
   * @returns The current renderable objects map
   */
  static getRenderableObjects(): Record<string, RenderableCelestialObject> {
    return renderableStore.getRenderableObjects();
  }

  /**
   * Gets a specific renderable object by ID.
   * @param objectId The ID of the renderable object to retrieve
   * @returns The renderable object or undefined if not found
   */
  static getRenderableObject(
    objectId: string,
  ): RenderableCelestialObject | undefined {
    return this.getRenderableObjects()[objectId];
  }

  /**
   * Gets multiple renderable objects by their IDs.
   * @param objectIds Array of object IDs to retrieve
   * @returns Array of renderable objects (only existing objects are included)
   */
  static getRenderableObjectsByIds(
    objectIds: string[],
  ): RenderableCelestialObject[] {
    const allObjects = this.getRenderableObjects();
    return objectIds
      .map((id) => allObjects[id])
      .filter((obj): obj is RenderableCelestialObject => obj !== undefined);
  }

  /**
   * Gets multiple renderable objects by their IDs as a map.
   * @param objectIds Array of object IDs to retrieve
   * @returns Record mapping IDs to renderable objects (only existing objects are included)
   */
  static getRenderableObjectsMapByIds(
    objectIds: string[],
  ): Record<string, RenderableCelestialObject> {
    const allObjects = this.getRenderableObjects();
    const result: Record<string, RenderableCelestialObject> = {};

    objectIds.forEach((id) => {
      const obj = allObjects[id];
      if (obj) {
        result[id] = obj;
      }
    });

    return result;
  }

  /**
   * Checks if a renderable object exists by ID.
   * @param objectId The ID to check
   * @returns True if the renderable object exists
   */
  static hasRenderableObject(objectId: string): boolean {
    return objectId in this.getRenderableObjects();
  }

  /**
   * Gets all renderable object IDs.
   * @returns Array of all renderable object IDs
   */
  static getRenderableObjectIds(): string[] {
    return Object.keys(this.getRenderableObjects());
  }

  /**
   * Gets the count of renderable objects.
   * @returns Number of renderable objects in the system
   */
  static getRenderableObjectCount(): number {
    return Object.keys(this.getRenderableObjects()).length;
  }

  // =============================================================================
  // PANEL-SPECIFIC CAMERA STATE ACCESS
  // =============================================================================

  /**
   * Gets a camera manager instance for a specific panel.
   * @param panelId Unique identifier for the panel.
   * @param initialState Optional initial camera state for new instances.
   * @returns The camera manager instance for the panel.
   */
  static getCameraManager(
    panelId: string,
    initialState?: Partial<CameraState>,
  ): CameraManager {
    return CameraManager.getInstance(panelId, initialState);
  }

  /**
   * Gets a camera store instance for a specific panel.
   * @param panelId Unique identifier for the panel.
   * @param initialState Optional initial camera state for new instances.
   * @returns The camera store instance for the panel.
   */
  static getCameraStore(panelId: string, initialState?: Partial<CameraState>) {
    return CameraStore.getInstance(panelId, initialState);
  }

  /**
   * Gets all registered camera store instances.
   * @returns Map of panel ID to camera store instance.
   */
  static getAllCameraStores(): Map<string, CameraStore> {
    return CameraStore.getAllInstances();
  }

  /**
   * Removes a camera store instance for a specific panel.
   * @param panelId Unique identifier for the panel.
   */
  static removeCameraStore(panelId: string): void {
    CameraStore.removeInstance(panelId);
  }
}
