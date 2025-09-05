import { BehaviorSubject, Observable } from "rxjs";
import type {
  CelestialObject,
  RenderableCelestialObject,
} from "@teskooano/data-types";
import { CelestialStatus } from "@teskooano/data-types";
import { DEFAULT_CELESTIAL_DISPLAY_OPTIONS } from "@teskooano/data-types";
import {
  filterActiveCelestialObjects,
  filterDestroyedCelestialObjects,
  filterPhysicsActiveCelestialObjects,
  filterVisibleCelestialObjects,
  filterActiveCelestialObjects$,
  filterDestroyedCelestialObjects$,
  filterPhysicsActiveCelestialObjects$,
  filterVisibleCelestialObjects$,
} from "../utils";
import { CelestialType } from "@teskooano/data-types";
import { dispatchObjectDestroyedEvent } from "../utils/CelestialUtils";

/**
 * Manages celestial object data storage and hierarchy relationships.
 *
 * This store serves as the central data repository for all celestial objects in the simulation.
 * It provides both reactive (Observable) and imperative (getter/setter) access patterns
 * for managing celestial objects and their parent-child relationships.
 *
 * ## Architecture
 *
 * The store uses RxJS BehaviorSubjects to maintain state and provide reactive streams:
 * - `_objects`: Stores the complete map of celestial objects by ID
 * - `_hierarchy`: Stores parent-child relationships as a map of parent ID to child ID arrays
 *
 * ## Filtered Observables
 *
 * The store provides pre-filtered observables for common use cases:
 * - `activeObjects$`: Only objects that are not destroyed or annihilated
 * - `destroyedObjects$`: Only objects that are destroyed or annihilated
 * - `physicsActiveObjects$`: Objects that are active AND not ignoring physics
 * - `visibleObjects$`: Objects that are active AND visible
 *
 * ## Usage Patterns
 *
 * ### Reactive Access (Recommended)
 * ```typescript
 * // Subscribe to all object changes
 * celestialStore.objects$.subscribe(objects => {
 *   console.log('All objects updated:', Object.keys(objects));
 * });
 *
 * // Subscribe to only active objects
 * celestialStore.activeObjects$.subscribe(activeObjects => {
 *   console.log('Active objects:', Object.keys(activeObjects));
 * });
 *
 * // Subscribe to physics-active objects
 * celestialStore.physicsActiveObjects$.subscribe(physicsObjects => {
 *   console.log('Physics objects:', Object.keys(physicsObjects));
 * });
 * ```
 *
 * ### Imperative Access
 * ```typescript
 * // Get current state
 * const allObjects = celestialStore.getObjects();
 * const activeObjects = celestialStore.getActiveObjects();
 * const physicsObjects = celestialStore.getPhysicsActiveObjects();
 *
 * // Modify state
 * celestialStore.setObject('earth', earthObject);
 * celestialStore.addChild('sun', 'earth');
 * ```
 *
 * ## Singleton Pattern
 *
 * This store follows a singleton pattern to ensure a single source of truth
 * across the entire application. Access the instance via `getInstance()` or
 * use the exported `celestialStore` constant.
 *
 * @example
 * ```typescript
 * import { celestialStore } from '@teskooano/core-state';
 *
 * // Add a new planet
 * const mars = createMarsObject();
 * celestialStore.setObject('mars', mars);
 * celestialStore.addChild('sun', 'mars');
 *
 * // React to changes with filtered data
 * celestialStore.activeObjects$.subscribe(objects => {
 *   console.log(`Active objects: ${Object.keys(objects).length}`);
 * });
 *
 * celestialStore.physicsActiveObjects$.subscribe(objects => {
 *   console.log(`Physics objects: ${Object.keys(objects).length}`);
 * });
 * ```
 */
export class CelestialStore {
  private static instance: CelestialStore;

  /** BehaviorSubject holding the current map of celestial objects by ID */
  private readonly _objects: BehaviorSubject<Record<string, CelestialObject>>;

  /** Observable stream of celestial objects that emits on every change */
  public readonly objects$: Observable<Record<string, CelestialObject>>;

  /** BehaviorSubject holding the current hierarchy relationships */
  private readonly _hierarchy: BehaviorSubject<Record<string, string[]>>;

  /** Observable stream of hierarchy relationships that emits on every change */
  public readonly hierarchy$: Observable<Record<string, string[]>>;

  // =============================================================================
  // FILTERED OBSERVABLES
  // =============================================================================

  /**
   * Observable of only active celestial objects (not destroyed or annihilated).
   * This is the most commonly used filtered stream.
   */
  public readonly activeObjects$: Observable<Record<string, CelestialObject>>;

  /**
   * Observable of only destroyed or annihilated celestial objects.
   * Useful for cleanup operations or displaying destroyed objects separately.
   */
  public readonly destroyedObjects$: Observable<
    Record<string, CelestialObject>
  >;

  /**
   * Observable of objects that are active AND not ignoring physics.
   * This is what the physics engine should use for simulations.
   */
  public readonly physicsActiveObjects$: Observable<
    Record<string, CelestialObject>
  >;

  /**
   * Observable of objects that are active AND visible.
   * Useful for rendering systems that only need visible objects.
   */
  public readonly visibleObjects$: Observable<Record<string, CelestialObject>>;

  /**
   * Private constructor to enforce singleton pattern.
   * Initializes empty objects and hierarchy maps, and sets up filtered observables.
   */
  private constructor() {
    this._objects = new BehaviorSubject<Record<string, CelestialObject>>({});
    this.objects$ = this._objects.asObservable();

    this._hierarchy = new BehaviorSubject<Record<string, string[]>>({});
    this.hierarchy$ = this._hierarchy.asObservable();

    // Set up filtered observables using shared operators
    this.activeObjects$ = filterActiveCelestialObjects$(this.objects$);
    this.destroyedObjects$ = filterDestroyedCelestialObjects$(this.objects$);
    this.physicsActiveObjects$ = filterPhysicsActiveCelestialObjects$(
      this.objects$,
    );
    this.visibleObjects$ = filterVisibleCelestialObjects$(this.objects$);
  }

  /**
   * Gets the singleton instance of the CelestialStore.
   * Creates the instance if it doesn't exist.
   *
   * @returns The singleton CelestialStore instance
   *
   * @example
   * ```typescript
   * const store = CelestialStore.getInstance();
   * store.setObject('planet', planetData);
   * ```
   */
  public static getInstance(): CelestialStore {
    if (!CelestialStore.instance) {
      CelestialStore.instance = new CelestialStore();
    }
    return CelestialStore.instance;
  }

  // =============================================================================
  // FILTERING METHODS
  // =============================================================================

  // Note: Filtering methods have been moved to shared utilities in StoreFilters.ts
  // The filtered observables now use the shared operators for consistency

  // =============================================================================
  // OBJECT OPERATIONS
  // =============================================================================

  /**
   * Gets the current snapshot of all celestial objects.
   *
   * This method returns a copy of the current objects map. For reactive updates,
   * prefer subscribing to `objects$` instead.
   *
   * @returns A record mapping object IDs to their CelestialObject data
   *
   * @example
   * ```typescript
   * const allObjects = celestialStore.getObjects();
   * console.log(`Found ${Object.keys(allObjects).length} objects`);
   *
   * // Iterate over all objects
   * Object.values(allObjects).forEach(obj => {
   *   console.log(`${obj.id}: ${obj.type}`);
   * });
   * ```
   */
  public getObjects(): Record<string, CelestialObject> {
    return this._objects.getValue();
  }

  /**
   * Gets the current snapshot of active celestial objects (not destroyed or annihilated).
   *
   * This is the imperative version of `activeObjects$`.
   *
   * @returns A record mapping object IDs to their active CelestialObject data
   *
   * @example
   * ```typescript
   * const activeObjects = celestialStore.getActiveObjects();
   * console.log(`Found ${Object.keys(activeObjects).length} active objects`);
   * ```
   */
  public getActiveObjects(): Record<string, CelestialObject> {
    return filterActiveCelestialObjects(this.getObjects());
  }

  /**
   * Gets the current snapshot of destroyed celestial objects.
   *
   * This is the imperative version of `destroyedObjects$`.
   *
   * @returns A record mapping object IDs to their destroyed CelestialObject data
   *
   * @example
   * ```typescript
   * const destroyedObjects = celestialStore.getDestroyedObjects();
   * console.log(`Found ${Object.keys(destroyedObjects).length} destroyed objects`);
   * ```
   */
  public getDestroyedObjects(): Record<string, CelestialObject> {
    return filterDestroyedCelestialObjects(this.getObjects());
  }

  /**
   * Gets the current snapshot of physics-active celestial objects.
   *
   * This is the imperative version of `physicsActiveObjects$`.
   *
   * @returns A record mapping object IDs to their physics-active CelestialObject data
   *
   * @example
   * ```typescript
   * const physicsObjects = celestialStore.getPhysicsActiveObjects();
   * console.log(`Found ${Object.keys(physicsObjects).length} physics objects`);
   * ```
   */
  public getPhysicsActiveObjects(): Record<string, CelestialObject> {
    return filterPhysicsActiveCelestialObjects(this.getObjects());
  }

  /**
   * Gets the current snapshot of visible celestial objects.
   *
   * This is the imperative version of `visibleObjects$`.
   *
   * @returns A record mapping object IDs to their visible CelestialObject data
   *
   * @example
   * ```typescript
   * const visibleObjects = celestialStore.getVisibleObjects();
   * console.log(`Found ${Object.keys(visibleObjects).length} visible objects`);
   * ```
   */
  public getVisibleObjects(): Record<string, CelestialObject> {
    return filterVisibleCelestialObjects(this.getObjects());
  }

  /**
   * Gets a specific celestial object by its ID.
   *
   * @param id The unique identifier of the celestial object
   * @returns The celestial object if found, undefined otherwise
   *
   * @example
   * ```typescript
   * const earth = celestialStore.getObject('earth');
   * if (earth) {
   *   console.log(`Earth mass: ${earth.realMass_kg} kg`);
   * }
   * ```
   */
  public getObject(id: string): CelestialObject | undefined {
    return this._objects.getValue()[id];
  }

  /**
   * Sets or updates a celestial object in the store.
   *
   * This method will add a new object or update an existing one, triggering
   * emissions on the `objects$` observable.
   *
   * @param id The unique identifier of the celestial object
   * @param object The celestial object data to store
   *
   * @example
   * ```typescript
   * // Add a new planet
   * celestialStore.setObject('kepler-442b', newPlanet);
   * ```
   */
  public setObject(id: string, object: CelestialObject): void {
    const current = this._objects.getValue();
    this._objects.next({ ...current, [id]: object });
  }

  /**
   * Updates specific properties of a celestial object without replacing the entire object.
   *
   * This method is useful for updating display options, status, or other properties
   * without needing to reconstruct the entire celestial object.
   *
   * @param id The unique identifier of the celestial object to update
   * @param updates Partial object containing only the properties to update
   * @returns true if the object was found and updated, false otherwise
   *
   * @example
   * ```typescript
   * // Update display options for Earth
   * celestialStore.updateObject('earth', {
   *   uiOptions: { showLabels: false, showOrbit: true }
   * });
   *
   * // Update status
   * celestialStore.updateObject('asteroid-1', { status: CelestialStatus.DESTROYED });
   * ```
   */
  public updateObject<T extends Partial<CelestialObject>>(
    id: string,
    updates: T,
  ): boolean {
    const current = this._objects.getValue();
    const existingObject = current[id];

    if (!existingObject) {
      return false;
    }

    const updatedObject = { ...existingObject, ...updates };
    this._objects.next({ ...current, [id]: updatedObject });
    return true;
  }

  /**
   * Updates the display options for a specific celestial object.
   *
   * This method provides a convenient way to update just the UI display options
   * for a celestial object, such as showing/hiding labels, orbits, trails, etc.
   *
   * @param id The unique identifier of the celestial object
   * @param displayOptions The display options to apply
   * @returns true if the object was found and updated, false otherwise
   *
   * @example
   * ```typescript
   * // Hide labels and orbits for a specific planet
   * celestialStore.updateDisplayOptions('mars', {
   *   showLabels: false,
   *   showOrbit: false
   * });
   *
   * // Show trails for a comet
   * celestialStore.updateDisplayOptions('comet-1', {
   *   showTrail: true
   * });
   * ```
   */
  public updateDisplayOptions(
    id: string,
    displayOptions: Partial<NonNullable<CelestialObject["uiOptions"]>>,
  ): boolean {
    const current = this._objects.getValue();
    const existingObject = current[id];

    if (!existingObject) {
      return false;
    }

    // Start with defaults, merge with existing options, then apply updates
    const currentOptions = existingObject.uiOptions || {};
    const mergedOptions = {
      ...DEFAULT_CELESTIAL_DISPLAY_OPTIONS,
      ...currentOptions,
      ...displayOptions,
    };

    const updatedObject = { ...existingObject, uiOptions: mergedOptions };
    this._objects.next({ ...current, [id]: updatedObject });
    return true;
  }

  /**
   * Gets the display options for a specific celestial object.
   *
   * @param id The unique identifier of the celestial object
   * @returns The display options for the object, or undefined if not found
   *
   * @example
   * ```typescript
   * const options = celestialStore.getDisplayOptions('earth');
   * if (options?.showLabels) {
   *   console.log('Earth labels are visible');
   * }
   * ```
   */
  public getDisplayOptions(
    id: string,
  ): RenderableCelestialObject["uiOptions"] | undefined {
    const current = this._objects.getValue();
    return current[id]?.uiOptions;
  }

  /**
   * Gets the effective display options for a specific celestial object with defaults applied.
   *
   * This method returns the complete display options for an object, merging any
   * custom settings with the default values. This is useful for rendering systems
   * that need to know the final display state of an object.
   *
   * @param id The unique identifier of the celestial object
   * @returns The effective display options with defaults applied, or undefined if object not found
   *
   * @example
   * ```typescript
   * const effectiveOptions = celestialStore.getEffectiveDisplayOptions('earth');
   * if (effectiveOptions.showLabels) {
   *   console.log('Earth labels should be visible');
   * }
   * ```
   */
  public getEffectiveDisplayOptions(
    id: string,
  ): Required<NonNullable<RenderableCelestialObject["uiOptions"]>> | undefined {
    const current = this._objects.getValue();
    const existingObject = current[id];

    if (!existingObject) {
      return undefined;
    }

    // Merge defaults with any custom options
    const customOptions = existingObject.uiOptions || {};
    return { ...DEFAULT_CELESTIAL_DISPLAY_OPTIONS, ...customOptions };
  }

  /**
   * Resets the display options for a specific celestial object to default values.
   *
   * This method removes any custom display options and restores the default
   * behavior for the specified object.
   *
   * @param id The unique identifier of the celestial object
   * @returns true if the object was found and reset, false otherwise
   *
   * @example
   * ```typescript
   * // Reset Earth's display options to defaults
   * celestialStore.resetDisplayOptions('earth');
   * ```
   */
  public resetDisplayOptions(id: string): boolean {
    const current = this._objects.getValue();
    const existingObject = current[id];

    if (!existingObject) {
      return false;
    }

    // Remove custom display options, letting defaults take effect
    const { uiOptions, ...objectWithoutOptions } = existingObject;
    const updatedObject = { ...objectWithoutOptions, uiOptions: undefined };

    this._objects.next({ ...current, [id]: updatedObject });
    return true;
  }

  /**
   * Gets all celestial objects with their effective display options applied.
   *
   * This method returns a map of all objects where each object has its
   * display options merged with defaults. This is useful for rendering
   * systems that need to know the final display state of all objects.
   *
   * @returns A map of object IDs to objects with effective display options
   *
   * @example
   * ```typescript
   * const objectsWithOptions = celestialStore.getObjectsWithEffectiveDisplayOptions();
   * Object.entries(objectsWithOptions).forEach(([id, object]) => {
   *   if (object.uiOptions?.showLabels) {
   *     console.log(`${id} labels should be visible`);
   *   }
   * });
   * ```
   */
  public getObjectsWithEffectiveDisplayOptions(): Record<
    string,
    CelestialObject & {
      uiOptions: Required<NonNullable<RenderableCelestialObject["uiOptions"]>>;
    }
  > {
    const current = this._objects.getValue();
    const result: Record<
      string,
      CelestialObject & {
        uiOptions: Required<
          NonNullable<RenderableCelestialObject["uiOptions"]>
        >;
      }
    > = {};

    Object.entries(current).forEach(([id, object]) => {
      const customOptions = object.uiOptions || {};
      const effectiveOptions = {
        ...DEFAULT_CELESTIAL_DISPLAY_OPTIONS,
        ...customOptions,
      };

      result[id] = {
        ...object,
        uiOptions: effectiveOptions,
      };
    });

    return result;
  }

  /**
   * Removes a celestial object from the store.
   *
   * This method will remove the object and trigger emissions on the `objects$` observable.
   * Note: This does not automatically update the hierarchy - you may need to call
   * `removeHierarchyEntry()` separately.
   *
   * @param id The unique identifier of the celestial object to remove
   *
   * @example
   * ```typescript
   * // Remove an object
   * celestialStore.removeObject('destroyed-asteroid');
   *
   * // Also clean up hierarchy if needed
   * celestialStore.removeHierarchyEntry('destroyed-asteroid');
   * ```
   */
  public removeObject(id: string): void {
    const current = this._objects.getValue();
    if (current[id]) {
      const newObjects = { ...current };
      delete newObjects[id];
      this._objects.next(newObjects);
    }
  }

  /**
   * Replaces all celestial objects with a new set.
   *
   * This method completely replaces the current objects map. Use with caution
   * as it will trigger emissions on the `objects$` observable for all subscribers.
   *
   * @param objects The new complete map of celestial objects
   *
   * @example
   * ```typescript
   * // Load a new solar system
   * const solarSystemObjects = await loadSolarSystemData();
   * celestialStore.setAllObjects(solarSystemObjects);
   *
   * // Clear all objects
   * celestialStore.setAllObjects({});
   * ```
   */
  public setAllObjects(objects: Record<string, CelestialObject>): void {
    this._objects.next(objects);
  }

  // =============================================================================
  // HIERARCHY OPERATIONS
  // =============================================================================

  /**
   * Gets the current hierarchy relationships.
   *
   * Returns a map where keys are parent object IDs and values are arrays
   * of child object IDs.
   *
   * @returns A record mapping parent IDs to arrays of child IDs
   *
   * @example
   * ```typescript
   * const hierarchy = celestialStore.getHierarchy();
   *
   * // Check what orbits the sun
   * const sunChildren = hierarchy['sun'] || [];
   * console.log(`Sun has ${sunChildren.length} orbiting bodies`);
   *
   * // Check what orbits Earth
   * const earthChildren = hierarchy['earth'] || [];
   * console.log(`Earth has ${earthChildren.length} moons`);
   * ```
   */
  public getHierarchy(): Record<string, string[]> {
    return this._hierarchy.getValue();
  }

  /**
   * Sets the complete hierarchy relationships.
   *
   * This method completely replaces the current hierarchy map. Use with caution
   * as it will trigger emissions on the `hierarchy$` observable for all subscribers.
   *
   * @param hierarchy The new complete hierarchy map
   *
   * @example
   * ```typescript
   * const newHierarchy = {
   *   'sun': ['mercury', 'venus', 'earth', 'mars'],
   *   'earth': ['moon'],
   *   'mars': ['phobos', 'deimos']
   * };
   *
   * celestialStore.setHierarchy(newHierarchy);
   * ```
   */
  public setHierarchy(hierarchy: Record<string, string[]>): void {
    this._hierarchy.next(hierarchy);
  }

  /**
   * Adds a child object to a parent's hierarchy.
   *
   * This method establishes a parent-child relationship between two celestial objects.
   * The change will trigger emissions on the `hierarchy$` observable.
   *
   * @param parentId The ID of the parent object
   * @param childId The ID of the child object
   *
   * @example
   * ```typescript
   * // Make Earth orbit the Sun
   * celestialStore.addChild('sun', 'earth');
   *
   * // Make the Moon orbit Earth
   * celestialStore.addChild('earth', 'moon');
   *
   * // Add a new satellite to Earth
   * celestialStore.addChild('earth', 'iss');
   * ```
   */
  public addChild(parentId: string, childId: string): void {
    const current = this._hierarchy.getValue();
    const children = current[parentId] || [];
    if (!children.includes(childId)) {
      this._hierarchy.next({
        ...current,
        [parentId]: [...children, childId],
      });
    }
  }

  /**
   * Removes a child object from a parent's hierarchy.
   *
   * This method removes a parent-child relationship between two celestial objects.
   * The change will trigger emissions on the `hierarchy$` observable.
   *
   * @param parentId The ID of the parent object
   * @param childId The ID of the child object to remove
   *
   * @example
   * ```typescript
   * // Remove Earth from Sun's orbit (e.g., if it becomes rogue)
   * celestialStore.removeChild('sun', 'earth');
   *
   * // Remove a destroyed satellite
   * celestialStore.removeChild('earth', 'destroyed-satellite');
   * ```
   */
  public removeChild(parentId: string, childId: string): void {
    const current = this._hierarchy.getValue();
    const children = current[parentId];
    if (children) {
      this._hierarchy.next({
        ...current,
        [parentId]: children.filter((id) => id !== childId),
      });
    }
  }

  /**
   * Removes all hierarchy entries for a specific object.
   *
   * This method removes the object from all parent-child relationships,
   * both as a parent and as a child. Useful when an object is destroyed
   * or removed from the simulation.
   *
   * @param objectId The ID of the object to remove from all hierarchies
   *
   * @example
   * ```typescript
   * // Remove a destroyed planet from all hierarchies
   * celestialStore.removeHierarchyEntry('destroyed-planet');
   *
   * // This is equivalent to:
   * // - Removing it as a child from its parent
   * // - Removing all its children from its hierarchy entry
   * ```
   */
  public removeHierarchyEntry(objectId: string): void {
    const current = this._hierarchy.getValue();
    const newHierarchy = { ...current };

    // Remove the object's own entry
    delete newHierarchy[objectId];

    // Remove from all parent lists
    Object.keys(newHierarchy).forEach((parentId) => {
      newHierarchy[parentId] = newHierarchy[parentId].filter(
        (childId) => childId !== objectId,
      );
    });

    this._hierarchy.next(newHierarchy);
  }

  // =============================================================================
  // UTILITY OPERATIONS
  // =============================================================================

  /**
   * Gets all children of a specific parent object.
   *
   * This method combines hierarchy and object data to return the actual
   * celestial objects that are children of the specified parent.
   *
   * @param parentId The ID of the parent object
   * @returns An array of celestial objects that are children of the parent
   *
   * @example
   * ```typescript
   * // Get all planets orbiting the sun
   * const planets = celestialStore.getChildren('sun');
   * console.log(`Sun has ${planets.length} planets:`);
   * planets.forEach(planet => console.log(`- ${planet.id}`));
   *
   * // Get all moons of Earth
   * const moons = celestialStore.getChildren('earth');
   * console.log(`Earth has ${moons.length} moons`);
   * ```
   */
  public getChildren(parentId: string): CelestialObject[] {
    const hierarchy = this._hierarchy.getValue();
    const objects = this._objects.getValue();
    const childIds = hierarchy[parentId] || [];
    return childIds.map((id) => objects[id]).filter(Boolean);
  }

  /**
   * Gets the parent of a specific child object.
   *
   * This method looks up the parent of a given celestial object
   * by checking the object's parentId property.
   *
   * @param childId The ID of the child object
   * @returns The parent celestial object if found, undefined otherwise
   *
   * @example
   * ```typescript
   * // Find what the Moon orbits
   * const moonParent = celestialStore.getParent('moon');
   * if (moonParent) {
   *   console.log(`Moon orbits ${moonParent.id}`);
   * }
   *
   * // Check if an object is a root object (no parent)
   * const sunParent = celestialStore.getParent('sun');
   * if (!sunParent) {
   *   console.log('Sun is a root object (no parent)');
   * }
   * ```
   */
  public getParent(childId: string): CelestialObject | undefined {
    const objects = this._objects.getValue();
    const object = objects[childId];
    return object?.parentId ? objects[object.parentId] : undefined;
  }

  // =============================================================================
  // DESTRUCTION EVENT PROCESSING
  // =============================================================================

  /**
   * Processes destruction events and updates object statuses.
   * Ring systems automatically destroy themselves if their parent is destroyed.
   * Uses shared event dispatching utilities for consistency.
   *
   * @param destroyedIds Array of object IDs to mark as destroyed
   * @returns The updated objects map with destruction events applied
   *
   * @example
   * ```typescript
   * // Process destruction events from physics simulation
   * const updatedObjects = celestialStore.processDestructionEvents(['asteroid-1', 'asteroid-2']);
   * celestialStore.setAllObjects(updatedObjects);
   * ```
   */
  public processDestructionEvents(
    destroyedIds: string[],
  ): Record<string, CelestialObject> {
    const currentObjects = this.getObjects();
    const newObjectsMap: Record<string, CelestialObject> = {
      ...currentObjects,
    };

    // Process direct destruction events first
    destroyedIds.forEach((idToDestroy) => {
      const existingObject = newObjectsMap[idToDestroy];
      if (
        existingObject &&
        existingObject.status !== CelestialStatus.DESTROYED &&
        existingObject.status !== CelestialStatus.ANNIHILATED
      ) {
        // Simple destruction - all destroyed objects get DESTROYED status
        newObjectsMap[idToDestroy] = {
          ...existingObject,
          status: CelestialStatus.DESTROYED,
        };

        // Dispatch destruction event using shared utility
        dispatchObjectDestroyedEvent(idToDestroy);
      }
    });

    // Now handle reactive ring system destruction
    Object.values(newObjectsMap).forEach((object) => {
      if (
        object.type === CelestialType.RING_SYSTEM &&
        object.parentId &&
        object.status !== CelestialStatus.DESTROYED &&
        object.status !== CelestialStatus.ANNIHILATED
      ) {
        const parent = newObjectsMap[object.parentId];
        if (
          parent &&
          (parent.status === CelestialStatus.DESTROYED ||
            parent.status === CelestialStatus.ANNIHILATED)
        ) {
          // Ring system automatically destroys itself when parent is destroyed
          newObjectsMap[object.id] = {
            ...object,
            status: parent.status, // Inherit parent's destruction status
          };

          // Dispatch destruction event using shared utility
          dispatchObjectDestroyedEvent(object.id);

          console.debug(
            `[CelestialStore] Ring system ${object.id} auto-destroyed due to parent ${object.parentId} destruction`,
          );
        }
      }
    });

    return newObjectsMap;
  }

  /**
   * Marks specific objects as destroyed and processes cascade effects.
   * This is a convenience method that combines destruction processing with store updates.
   *
   * @param destroyedIds Array of object IDs to mark as destroyed
   *
   * @example
   * ```typescript
   * // Mark objects as destroyed and update the store
   * celestialStore.markObjectsDestroyed(['asteroid-1', 'asteroid-2']);
   * ```
   */
  public markObjectsDestroyed(destroyedIds: string[]): void {
    const updatedObjects = this.processDestructionEvents(destroyedIds);
    this.setAllObjects(updatedObjects);
  }
}

/**
 * Singleton instance of the CelestialStore.
 *
 * This is the primary way to access the celestial store throughout the application.
 * It provides both reactive and imperative access to celestial object data and hierarchy,
 * including pre-filtered observables for common use cases.
 *
 * @example
 * ```typescript
 * import { celestialStore } from '@teskooano/core-state';
 *
 * // Reactive subscription to all objects
 * celestialStore.objects$.subscribe(objects => {
 *   console.log('All objects changed:', Object.keys(objects));
 * });
 *
 * // Reactive subscription to only active objects
 * celestialStore.activeObjects$.subscribe(objects => {
 *   console.log('Active objects changed:', Object.keys(objects));
 * });
 *
 * // Reactive subscription to physics-active objects
 * celestialStore.physicsActiveObjects$.subscribe(objects => {
 *   console.log('Physics objects changed:', Object.keys(objects));
 * });
 *
 * // Imperative access
 * const earth = celestialStore.getObject('earth');
 * const activeObjects = celestialStore.getActiveObjects();
 * const physicsObjects = celestialStore.getPhysicsActiveObjects();
 * ```
 */
export const celestialStore = CelestialStore.getInstance();
