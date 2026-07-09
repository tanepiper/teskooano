import { BehaviorSubject, Observable } from "rxjs";
import type { RenderableCelestialObject } from "@teskooano/data-types";
import {
  filterVisibleRenderableObjects,
  filterActiveRenderableObjects,
  filterPhysicsActiveRenderableObjects,
  filterVisibleRenderableObjects$,
  filterActiveRenderableObjects$,
  filterPhysicsActiveRenderableObjects$,
  type FilterPredicate,
} from "../utils/StoreFilters";
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
 * Manages the state of renderable celestial objects.
 *
 * This store holds data derived from the core celestialObjectsStore and physics updates,
 * providing a centralized place for accessing and manipulating renderable objects.
 * It provides both reactive (Observable) and imperative (getter/setter) access patterns
 * for managing renderable objects.
 *
 * ## Architecture
 *
 * The store uses RxJS BehaviorSubjects to maintain state and provide reactive streams:
 * - `_renderableObjectsStore`: Stores the complete map of renderable objects by ID
 *
 * ## Filtered Observables
 *
 * The store provides pre-filtered observables for common use cases:
 * - `visibleRenderableObjects$`: Only objects that are visible
 * - `activeRenderableObjects$`: Only objects that are active (not destroyed)
 * - `physicsActiveRenderableObjects$`: Objects that are active AND not ignoring physics
 *
 * ## Usage Patterns
 *
 * ### Reactive Access (Recommended)
 * ```typescript
 * // Subscribe to all renderable object changes
 * renderableStore.renderableObjects$.subscribe(objects => {
 *   console.log('Renderable objects updated:', Object.keys(objects));
 * });
 *
 * // Subscribe to only visible objects
 * renderableStore.visibleRenderableObjects$.subscribe(objects => {
 *   console.log('Visible objects:', Object.keys(objects));
 * });
 *
 * // Subscribe to physics-active objects
 * renderableStore.physicsActiveRenderableObjects$.subscribe(objects => {
 *   console.log('Physics-active objects:', Object.keys(objects));
 * });
 * ```
 *
 * ### Imperative Access
 * ```typescript
 * // Get current state
 * const allObjects = renderableStore.getRenderableObjects();
 * const earthObject = renderableStore.getRenderableObject('earth');
 *
 * // Modify state
 * renderableStore.addRenderableObject(newObject);
 * renderableStore.updateRenderableObject('earth', updates);
 * ```
 *
 * ## Singleton Pattern
 *
 * This store follows a singleton pattern to ensure a single source of truth
 * across the entire application. Access the instance via `getInstance()` or
 * use the exported `renderableStore` constant.
 *
 * @example
 * ```typescript
 * import { renderableStore } from '@teskooano/core-state';
 *
 * // Add a new renderable object
 * const earthRenderable = createEarthRenderable();
 * renderableStore.addRenderableObject(earthRenderable);
 *
 * // React to changes
 * renderableStore.renderableObjects$.subscribe(objects => {
 *   console.log(`Renderable objects: ${Object.keys(objects).length}`);
 * });
 *
 * renderableStore.visibleRenderableObjects$.subscribe(objects => {
 *   console.log(`Visible objects: ${Object.keys(objects).length}`);
 * });
 * ```
 */
class RenderableStore
  implements KeyedStore<RenderableCelestialObject>, InspectableStore
{
  private static instance: RenderableStore;
  private readonly registry = ObservableRegistry.getInstance();
  private readonly metadata: StoreMetadata = {
    id: "renderable-store",
    name: "Renderable Store",
    category: "state",
    description: "State management for renderable celestial objects",
    observables: [],
    createdAt: new Date(),
  };

  /** BehaviorSubject holding the current map of renderable objects by ID */
  private readonly _renderableObjectsStore = new BehaviorSubject<
    Record<string, RenderableCelestialObject>
  >({});

  /** Observable stream of renderable objects that emits on every change */
  public readonly state$: Observable<Record<string, RenderableCelestialObject>>;

  // Alias for backward compatibility
  public readonly renderableObjects$: Observable<
    Record<string, RenderableCelestialObject>
  >;

  // =============================================================================
  // FILTERED OBSERVABLES
  // =============================================================================

  /**
   * Observable of only visible renderable objects.
   * Useful for rendering systems that only need visible objects.
   */
  public readonly visibleRenderableObjects$: Observable<
    Record<string, RenderableCelestialObject>
  >;

  /**
   * Observable of only active renderable objects (not destroyed).
   * This is the most commonly used filtered stream.
   */
  public readonly activeRenderableObjects$: Observable<
    Record<string, RenderableCelestialObject>
  >;

  /**
   * Observable of objects that are active AND not ignoring physics.
   * Useful for physics systems that need renderable data.
   */
  public readonly physicsActiveRenderableObjects$: Observable<
    Record<string, RenderableCelestialObject>
  >;

  /**
   * Private constructor to enforce singleton pattern.
   * Initializes empty renderable objects map and sets up filtered observables.
   */
  private constructor() {
    this.state$ = this._renderableObjectsStore.asObservable();
    this.renderableObjects$ = this.state$; // Alias for backward compatibility

    // Set up filtered observables using shared operators
    this.visibleRenderableObjects$ = this.registry.register(
      "renderable-visible-objects",
      filterVisibleRenderableObjects$(this.state$),
      {
        category: ObservableCategory.STORE,
        description: "Visible renderable objects",
        dependencies: ["renderable-objects"],
        tags: ["renderable", "filtered", "visible"],
      },
    );

    this.activeRenderableObjects$ = this.registry.register(
      "renderable-active-objects",
      filterActiveRenderableObjects$(this.state$),
      {
        category: ObservableCategory.STORE,
        description: "Active renderable objects (not destroyed)",
        dependencies: ["renderable-objects"],
        tags: ["renderable", "filtered", "active"],
      },
    );

    this.physicsActiveRenderableObjects$ = this.registry.register(
      "renderable-physics-active-objects",
      filterPhysicsActiveRenderableObjects$(this.state$),
      {
        category: ObservableCategory.STORE,
        description: "Physics-active renderable objects",
        dependencies: ["renderable-objects"],
        tags: ["renderable", "filtered", "physics"],
      },
    );

    // Register the root observable
    this.registry.register("renderable-objects", this.state$, {
      category: ObservableCategory.STORE,
      description: "All renderable celestial objects",
      tags: ["renderable", "root"],
    });

    // Update metadata
    this.metadata.observables = [
      "renderable-objects",
      "renderable-visible-objects",
      "renderable-active-objects",
      "renderable-physics-active-objects",
    ];
  }

  /**
   * Gets the singleton instance of the RenderableStore.
   * Creates the instance if it doesn't exist.
   *
   * @returns The singleton RenderableStore instance
   *
   * @example
   * ```typescript
   * const store = RenderableStore.getInstance();
   * store.addRenderableObject(renderableData);
   * ```
   */
  public static getInstance(): RenderableStore {
    if (!RenderableStore.instance) {
      RenderableStore.instance = new RenderableStore();
    }
    return RenderableStore.instance;
  }

  // Note: Filtering methods have been moved to shared utilities in StoreFilters.ts
  // The filtered observables now use the shared operators for consistency

  // =============================================================================
  // OBJECT OPERATIONS
  // =============================================================================

  /**
   * Gets the current snapshot of all renderable objects.
   *
   * This method returns a copy of the current objects map. For reactive updates,
   * prefer subscribing to `renderableObjects$` instead.
   *
   * @returns A record mapping object IDs to their renderable object data
   *
   * @example
   * ```typescript
   * const allObjects = renderableStore.getRenderableObjects();
   * console.log(`Found ${Object.keys(allObjects).length} renderable objects`);
   * ```
   */
  public getRenderableObjects(): Record<string, RenderableCelestialObject> {
    return this._renderableObjectsStore.getValue();
  }

  /**
   * Gets a specific renderable object by its ID.
   *
   * @param id The unique identifier of the renderable object
   * @returns The renderable object if found, undefined otherwise
   *
   * @example
   * ```typescript
   * const earthRenderable = renderableStore.getRenderableObject('earth');
   * if (earthRenderable) {
   *   console.log(`Earth renderable: ${earthRenderable.type}`);
   * }
   * ```
   */
  public getRenderableObject(
    id: string,
  ): RenderableCelestialObject | undefined {
    return this._renderableObjectsStore.getValue()[id];
  }

  /**
   * Gets the current snapshot of visible renderable objects.
   *
   * This is the imperative version of `visibleRenderableObjects$`.
   *
   * @returns A record mapping object IDs to their visible renderable object data
   *
   * @example
   * ```typescript
   * const visibleObjects = renderableStore.getVisibleRenderableObjects();
   * console.log(`Found ${Object.keys(visibleObjects).length} visible objects`);
   * ```
   */
  public getVisibleRenderableObjects(): Record<
    string,
    RenderableCelestialObject
  > {
    return filterVisibleRenderableObjects(this.getRenderableObjects());
  }

  /**
   * Gets the current snapshot of active renderable objects.
   *
   * This is the imperative version of `activeRenderableObjects$`.
   *
   * @returns A record mapping object IDs to their active renderable object data
   *
   * @example
   * ```typescript
   * const activeObjects = renderableStore.getActiveRenderableObjects();
   * console.log(`Found ${Object.keys(activeObjects).length} active objects`);
   * ```
   */
  public getActiveRenderableObjects(): Record<
    string,
    RenderableCelestialObject
  > {
    return filterActiveRenderableObjects(this.getRenderableObjects());
  }

  /**
   * Gets the current snapshot of physics-active renderable objects.
   *
   * This is the imperative version of `physicsActiveRenderableObjects$`.
   *
   * @returns A record mapping object IDs to their physics-active renderable object data
   *
   * @example
   * ```typescript
   * const physicsObjects = renderableStore.getPhysicsActiveRenderableObjects();
   * console.log(`Found ${Object.keys(physicsObjects).length} physics-active objects`);
   * ```
   */
  public getPhysicsActiveRenderableObjects(): Record<
    string,
    RenderableCelestialObject
  > {
    return filterPhysicsActiveRenderableObjects(this.getRenderableObjects());
  }

  /**
   * Adds or replaces a renderable object in the store.
   *
   * This method will either add a new object or update an existing one.
   * The change will trigger emissions on the `renderableObjects$` observable.
   * Typically called by a factory for initial state or an adapter during updates.
   *
   * @param object The renderable object to add or replace
   *
   * @example
   * ```typescript
   * const newRenderable: RenderableCelestialObject = {
   *   id: 'kepler-442b',
   *   type: 'PLANET',
   *   isVisible: true,
   *   // ... other properties
   * };
   *
   * renderableStore.addRenderableObject(newRenderable);
   * ```
   */
  public addRenderableObject(object: RenderableCelestialObject): void {
    const currentObjects = this._renderableObjectsStore.getValue();
    this._renderableObjectsStore.next({
      ...currentObjects,
      [object.id]: object,
    });
  }

  /**
   * Updates specific properties of a renderable object.
   *
   * This method updates only the specified properties while preserving others.
   * The change will trigger emissions on the `renderableObjects$` observable.
   *
   * @param celestialObjectId The ID of the celestial object to update
   * @param updates An object containing the properties to update
   *
   * @example
   * ```typescript
   * // Update visibility
   * renderableStore.updateRenderableObject('earth', { isVisible: false });
   *
   * // Update multiple properties
   * renderableStore.updateRenderableObject('earth', {
   *   isVisible: true,
   *   ignorePhysics: false
   * });
   * ```
   */
  public updateRenderableObject(
    celestialObjectId: string,
    updates: Partial<RenderableCelestialObject>,
  ): void {
    const currentObjects = this._renderableObjectsStore.getValue();
    const currentObject = currentObjects[celestialObjectId];
    if (currentObject) {
      this._renderableObjectsStore.next({
        ...currentObjects,
        [celestialObjectId]: {
          ...currentObject,
          ...updates,
        },
      });
    } else {
      console.warn(
        `[RenderableStore] updateRenderableObject: Object ${celestialObjectId} not found.`,
      );
    }
  }

  /**
   * Removes a renderable object from the store.
   *
   * This method will remove the object and trigger emissions on the `renderableObjects$` observable.
   * Should be called when the corresponding core celestial object is removed.
   *
   * @param celestialObjectId The ID of the celestial object to remove
   *
   * @example
   * ```typescript
   * // Remove a destroyed object
   * renderableStore.removeRenderableObject('destroyed-asteroid');
   * ```
   */
  public removeRenderableObject(celestialObjectId: string): void {
    const currentObjects = this._renderableObjectsStore.getValue();
    if (currentObjects[celestialObjectId]) {
      const newObjects = { ...currentObjects };
      delete newObjects[celestialObjectId];
      this._renderableObjectsStore.next(newObjects);
    } else {
      console.warn(
        `[RenderableStore] removeRenderableObject: Object ${celestialObjectId} not found.`,
      );
    }
  }

  /**
   * Sets the entire renderable objects map.
   *
   * This method completely replaces the current objects map. Use with caution
   * as it will trigger emissions on the `renderableObjects$` observable for all subscribers.
   * Useful for initialization or bulk updates from an adapter.
   *
   * @param objects The new complete map of renderable objects
   *
   * @example
   * ```typescript
   * // Load a new set of renderable objects
   * const newRenderableObjects = await loadRenderableData();
   * renderableStore.setAllRenderableObjects(newRenderableObjects);
   *
   * // Clear all renderable objects
   * renderableStore.setAllRenderableObjects({});
   * ```
   */
  public setAllRenderableObjects(
    objects: Record<string, RenderableCelestialObject>,
  ): void {
    this._renderableObjectsStore.next(objects);
  }

  // =============================================================================
  // INTERFACE IMPLEMENTATIONS (BaseStore, KeyedStore, InspectableStore)
  // =============================================================================

  /**
   * Gets the current state of the store (BaseStore interface).
   */
  public getState(): Record<string, RenderableCelestialObject> {
    return this._renderableObjectsStore.getValue();
  }

  /**
   * Gets a specific item by ID (KeyedStore interface).
   */
  public getItem(id: string): RenderableCelestialObject | undefined {
    return this.getRenderableObject(id);
  }

  /**
   * Sets an item in the store (KeyedStore interface).
   */
  public setItem(id: string, item: RenderableCelestialObject): void {
    this.addRenderableObject(item);
  }

  /**
   * Removes an item from the store (KeyedStore interface).
   */
  public removeItem(id: string): void {
    this.removeRenderableObject(id);
  }

  /**
   * Checks if an item exists in the store (KeyedStore interface).
   */
  public hasItem(id: string): boolean {
    return this._renderableObjectsStore.getValue()[id] !== undefined;
  }

  /**
   * Gets all item IDs (KeyedStore interface).
   */
  public getItemIds(): string[] {
    return Object.keys(this._renderableObjectsStore.getValue());
  }

  /**
   * Gets the total number of items (KeyedStore interface).
   */
  public getItemCount(): number {
    return Object.keys(this._renderableObjectsStore.getValue()).length;
  }

  /**
   * Gets filtered items using predicates (KeyedStore interface).
   */
  public getFiltered(
    ...predicates: FilterPredicate<RenderableCelestialObject>[]
  ): RenderableCelestialObject[] {
    const objects = Object.values(this._renderableObjectsStore.getValue());
    return objects.filter((obj) => predicates.every((pred) => pred(obj)));
  }

  /**
   * Gets filtered observable using predicates (KeyedStore interface).
   */
  public getFiltered$(
    ...predicates: FilterPredicate<RenderableCelestialObject>[]
  ): Observable<RenderableCelestialObject[]> {
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
    this._renderableObjectsStore.complete();
  }
}

/**
 * Singleton instance of the RenderableStore.
 *
 * This is the primary way to access the renderable store throughout the application.
 * It provides both reactive and imperative access to renderable object data,
 * including pre-filtered observables for common use cases.
 *
 * @example
 * ```typescript
 * import { renderableStore } from '@teskooano/core-state';
 *
 * // Reactive subscription to all renderable objects
 * renderableStore.renderableObjects$.subscribe(objects => {
 *   console.log('All renderable objects changed:', Object.keys(objects));
 * });
 *
 * // Reactive subscription to only visible objects
 * renderableStore.visibleRenderableObjects$.subscribe(objects => {
 *   console.log('Visible objects changed:', Object.keys(objects));
 * });
 *
 * // Reactive subscription to physics-active objects
 * renderableStore.physicsActiveRenderableObjects$.subscribe(objects => {
 *   console.log('Physics-active objects changed:', Object.keys(objects));
 * });
 *
 * // Imperative access
 * const earthObject = renderableStore.getRenderableObject('earth');
 * const visibleObjects = renderableStore.getVisibleRenderableObjects();
 * ```
 */
export const renderableStore = RenderableStore.getInstance();
