import { BehaviorSubject, Observable } from "rxjs";
import { map, shareReplay } from "rxjs/operators";
import type { CelestialObject } from "@teskooano/data-types";
import { CelestialStatus } from "@teskooano/data-types";

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

    // Set up filtered observables
    this.activeObjects$ = this.objects$.pipe(
      map((objects) => this.filterActiveObjects(objects)),
      shareReplay(1),
    );

    this.destroyedObjects$ = this.objects$.pipe(
      map((objects) => this.filterDestroyedObjects(objects)),
      shareReplay(1),
    );

    this.physicsActiveObjects$ = this.objects$.pipe(
      map((objects) => this.filterPhysicsActiveObjects(objects)),
      shareReplay(1),
    );

    this.visibleObjects$ = this.objects$.pipe(
      map((objects) => this.filterVisibleObjects(objects)),
      shareReplay(1),
    );
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

  /**
   * Filters objects to only include active ones (not destroyed or annihilated).
   *
   * @param objects The complete map of celestial objects
   * @returns A filtered map containing only active objects
   */
  private filterActiveObjects(
    objects: Record<string, CelestialObject>,
  ): Record<string, CelestialObject> {
    const filtered: Record<string, CelestialObject> = {};
    Object.values(objects).forEach((obj) => {
      if (
        obj.status !== CelestialStatus.DESTROYED &&
        obj.status !== CelestialStatus.ANNIHILATED
      ) {
        filtered[obj.id] = obj;
      }
    });
    return filtered;
  }

  /**
   * Filters objects to only include destroyed or annihilated ones.
   *
   * @param objects The complete map of celestial objects
   * @returns A filtered map containing only destroyed objects
   */
  private filterDestroyedObjects(
    objects: Record<string, CelestialObject>,
  ): Record<string, CelestialObject> {
    const filtered: Record<string, CelestialObject> = {};
    Object.values(objects).forEach((obj) => {
      if (
        obj.status === CelestialStatus.DESTROYED ||
        obj.status === CelestialStatus.ANNIHILATED
      ) {
        filtered[obj.id] = obj;
      }
    });
    return filtered;
  }

  /**
   * Filters objects to only include those that are active AND not ignoring physics.
   *
   * @param objects The complete map of celestial objects
   * @returns A filtered map containing only physics-active objects
   */
  private filterPhysicsActiveObjects(
    objects: Record<string, CelestialObject>,
  ): Record<string, CelestialObject> {
    const filtered: Record<string, CelestialObject> = {};
    Object.values(objects).forEach((obj) => {
      if (
        obj.status !== CelestialStatus.DESTROYED &&
        obj.status !== CelestialStatus.ANNIHILATED &&
        !obj.ignorePhysics
      ) {
        filtered[obj.id] = obj;
      }
    });
    return filtered;
  }

  /**
   * Filters objects to only include those that are active AND visible.
   *
   * @param objects The complete map of celestial objects
   * @returns A filtered map containing only visible objects
   */
  private filterVisibleObjects(
    objects: Record<string, CelestialObject>,
  ): Record<string, CelestialObject> {
    const filtered: Record<string, CelestialObject> = {};
    Object.values(objects).forEach((obj) => {
      if (
        obj.status !== CelestialStatus.DESTROYED &&
        obj.status !== CelestialStatus.ANNIHILATED &&
        obj.isVisible !== false // Default to true if not specified
      ) {
        filtered[obj.id] = obj;
      }
    });
    return filtered;
  }

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
    return this.filterActiveObjects(this.getObjects());
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
    return this.filterDestroyedObjects(this.getObjects());
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
    return this.filterPhysicsActiveObjects(this.getObjects());
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
    return this.filterVisibleObjects(this.getObjects());
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
