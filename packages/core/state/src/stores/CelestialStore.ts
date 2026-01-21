import { BehaviorSubject, Observable } from "rxjs";
import type { CelestialObject } from "@teskooano/data-types";
import { CelestialStatus } from "@teskooano/data-types";
import {
  filterActiveCelestialObjects,
  filterDestroyedCelestialObjects,
  filterPhysicsActiveCelestialObjects,
  filterVisibleCelestialObjects,
  filterActiveCelestialObjects$,
  filterDestroyedCelestialObjects$,
  filterPhysicsActiveCelestialObjects$,
  filterVisibleCelestialObjects$,
  type FilterPredicate,
} from "../utils";
import { CelestialType } from "@teskooano/data-types";
import { dispatchObjectDestroyedEvent } from "../utils/CelestialUtils";
import type {
  KeyedStore,
  InspectableStore,
  StoreMetadata,
} from "../utils/StoreInterfaces";
import {
  ObservableRegistry,
  ObservableCategory,
} from "../utils/ObservableRegistry";

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
export class CelestialStore
  implements KeyedStore<CelestialObject>, InspectableStore
{
  private static instance: CelestialStore;
  private readonly registry = ObservableRegistry.getInstance();
  private readonly metadata: StoreMetadata = {
    id: "celestial-store",
    name: "Celestial Store",
    category: "state",
    description:
      "Central repository for all celestial objects in the simulation",
    observables: [],
    createdAt: new Date(),
  };

  /** BehaviorSubject holding the current map of celestial objects by ID */
  private readonly _objects: BehaviorSubject<Record<string, CelestialObject>>;

  /** Observable stream of celestial objects that emits on every change */
  public readonly state$: Observable<Record<string, CelestialObject>>;

  // Alias for backward compatibility
  public readonly objects$: Observable<Record<string, CelestialObject>>;

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
    this.state$ = this._objects.asObservable();
    this.objects$ = this.state$; // Alias for backward compatibility

    // Set up filtered observables using shared operators
    this.activeObjects$ = this.registry.register(
      "celestial-active-objects",
      filterActiveCelestialObjects$(this.state$),
      {
        category: ObservableCategory.STORE,
        description: "Active celestial objects (not destroyed)",
        dependencies: ["celestial-objects"],
        tags: ["celestial", "filtered", "active"],
      },
    );

    this.destroyedObjects$ = this.registry.register(
      "celestial-destroyed-objects",
      filterDestroyedCelestialObjects$(this.state$),
      {
        category: ObservableCategory.STORE,
        description: "Destroyed celestial objects",
        dependencies: ["celestial-objects"],
        tags: ["celestial", "filtered", "destroyed"],
      },
    );

    this.physicsActiveObjects$ = this.registry.register(
      "celestial-physics-active-objects",
      filterPhysicsActiveCelestialObjects$(this.state$),
      {
        category: ObservableCategory.STORE,
        description:
          "Physics-active celestial objects (active and not ignoring physics)",
        dependencies: ["celestial-objects"],
        tags: ["celestial", "filtered", "physics"],
      },
    );

    this.visibleObjects$ = this.registry.register(
      "celestial-visible-objects",
      filterVisibleCelestialObjects$(this.state$),
      {
        category: ObservableCategory.STORE,
        description: "Visible celestial objects",
        dependencies: ["celestial-objects"],
        tags: ["celestial", "filtered", "visible"],
      },
    );

    // Register the root observable
    this.registry.register("celestial-objects", this.state$, {
      category: ObservableCategory.STORE,
      description: "All celestial objects in the simulation",
      tags: ["celestial", "root"],
    });

    // Update metadata with observable info
    this.metadata.observables = [
      "celestial-objects",
      "celestial-active-objects",
      "celestial-destroyed-objects",
      "celestial-physics-active-objects",
      "celestial-visible-objects",
    ];
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
   * This method will either add a new object or update an existing one.
   * The change will trigger emissions on the `objects$` observable.
   *
   * @param id The unique identifier for the celestial object
   * @param object The celestial object data to store
   *
   * @example
   * ```typescript
   * const newPlanet: CelestialObject = {
   *   id: 'kepler-442b',
   *   type: CelestialType.PLANET,
   *   realMass_kg: 2.36e25,
   *   realRadius_m: 6.5e6,
   *   // ... other properties
   * };
   *
   * celestialStore.setObject('kepler-442b', newPlanet);
   * ```
   */
  public setObject(id: string, object: CelestialObject): void {
    const current = this._objects.getValue();
    this._objects.next({ ...current, [id]: object });
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
  // UTILITY OPERATIONS
  // =============================================================================

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

  // =============================================================================
  // INTERFACE IMPLEMENTATIONS (BaseStore, KeyedStore, InspectableStore)
  // =============================================================================

  /**
   * Gets the current state of the store (BaseStore interface).
   */
  public getState(): Record<string, CelestialObject> {
    return this._objects.getValue();
  }

  /**
   * Gets a specific item by ID (KeyedStore interface).
   */
  public getItem(id: string): CelestialObject | undefined {
    return this.getObject(id);
  }

  /**
   * Sets an item in the store (KeyedStore interface).
   */
  public setItem(id: string, item: CelestialObject): void {
    this.setObject(id, item);
  }

  /**
   * Removes an item from the store (KeyedStore interface).
   */
  public removeItem(id: string): void {
    this.removeObject(id);
  }

  /**
   * Checks if an item exists in the store (KeyedStore interface).
   */
  public hasItem(id: string): boolean {
    return this._objects.getValue()[id] !== undefined;
  }

  /**
   * Gets all item IDs (KeyedStore interface).
   */
  public getItemIds(): string[] {
    return Object.keys(this._objects.getValue());
  }

  /**
   * Gets the total number of items (KeyedStore interface).
   */
  public getItemCount(): number {
    return Object.keys(this._objects.getValue()).length;
  }

  /**
   * Gets filtered items using predicates (KeyedStore interface).
   */
  public getFiltered(
    ...predicates: FilterPredicate<CelestialObject>[]
  ): CelestialObject[] {
    const objects = Object.values(this._objects.getValue());
    return objects.filter((obj) => predicates.every((pred) => pred(obj)));
  }

  /**
   * Gets filtered observable using predicates (KeyedStore interface).
   */
  public getFiltered$(
    ...predicates: FilterPredicate<CelestialObject>[]
  ): Observable<CelestialObject[]> {
    return new Observable((observer) => {
      const subscription = this.state$.subscribe((objects) => {
        const filtered = Object.values(objects).filter((obj) =>
          predicates.every((pred) => pred(obj)),
        );
        observer.next(filtered);
      });
      return () => subscription.unsubscribe();
    });
  }

  /**
   * Gets store metadata (InspectableStore interface).
   */
  public getMetadata(): StoreMetadata {
    return { ...this.metadata };
  }

  /**
   * Gets store statistics (InspectableStore interface).
   */
  public getStats(): {
    itemCount: number;
    observableCount: number;
    registeredAt: Date;
  } {
    return {
      itemCount: this.getItemCount(),
      observableCount: this.metadata.observables.length,
      registeredAt: this.metadata.createdAt,
    };
  }

  /**
   * Destroys the store and cleans up resources (BaseStore interface).
   */
  public destroy(): void {
    // Unregister all observables
    this.metadata.observables.forEach((obsId) => {
      this.registry.unregister(obsId);
    });

    // Complete the subject
    this._objects.complete();
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
