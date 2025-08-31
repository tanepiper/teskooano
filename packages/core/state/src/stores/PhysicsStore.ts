import { BehaviorSubject, Observable } from "rxjs";
import type { OSVector3 } from "@teskooano/core-math";
import {
  filterNonZeroAccelerationVectors,
  filterNonZeroAccelerationVectors$,
} from "../utils";

/**
 * Manages physics-related state like acceleration vectors.
 *
 * This store provides both reactive (Observable) and imperative (getter/setter) access patterns
 * for managing acceleration vectors for celestial objects in the simulation.
 *
 * ## Architecture
 *
 * The store uses RxJS BehaviorSubjects to maintain state and provide reactive streams:
 * - `_accelerationVectors`: Stores the complete map of acceleration vectors by object ID
 *
 * ## Filtered Observables
 *
 * The store provides pre-filtered observables for common use cases:
 * - `nonZeroAccelerationVectors$`: Only vectors with non-zero magnitude
 * - `activeAccelerationVectors$`: Only vectors for active objects (when combined with celestial store)
 *
 * ## Usage Patterns
 *
 * ### Reactive Access (Recommended)
 * ```typescript
 * // Subscribe to all acceleration vector changes
 * physicsStore.accelerationVectors$.subscribe(vectors => {
 *   console.log('Acceleration vectors updated:', Object.keys(vectors));
 * });
 *
 * // Subscribe to only non-zero acceleration vectors
 * physicsStore.nonZeroAccelerationVectors$.subscribe(vectors => {
 *   console.log('Non-zero acceleration vectors:', Object.keys(vectors));
 * });
 * ```
 *
 * ### Imperative Access
 * ```typescript
 * // Get current state
 * const allVectors = physicsStore.getAccelerationVectors();
 * const earthVector = physicsStore.getAccelerationVector('earth');
 *
 * // Modify state
 * physicsStore.setAccelerationVector('earth', newVector);
 * physicsStore.removeAccelerationVector('destroyed-asteroid');
 * ```
 *
 * ## Singleton Pattern
 *
 * This store follows a singleton pattern to ensure a single source of truth
 * across the entire application. Access the instance via `getInstance()` or
 * use the exported `physicsStore` constant.
 *
 * @example
 * ```typescript
 * import { physicsStore } from '@teskooano/core-state';
 *
 * // Set acceleration for Earth
 * const earthAcceleration = new OSVector3(0, -9.81, 0);
 * physicsStore.setAccelerationVector('earth', earthAcceleration);
 *
 * // React to changes
 * physicsStore.accelerationVectors$.subscribe(vectors => {
 *   console.log(`Active acceleration vectors: ${Object.keys(vectors).length}`);
 * });
 *
 * physicsStore.nonZeroAccelerationVectors$.subscribe(vectors => {
 *   console.log(`Non-zero acceleration vectors: ${Object.keys(vectors).length}`);
 * });
 * ```
 */
export class PhysicsStore {
  private static instance: PhysicsStore;

  /** BehaviorSubject holding the current map of acceleration vectors by object ID */
  private readonly _accelerationVectors: BehaviorSubject<
    Record<string, OSVector3>
  >;

  /** Observable stream of acceleration vectors that emits on every change */
  public readonly accelerationVectors$: Observable<Record<string, OSVector3>>;

  // =============================================================================
  // FILTERED OBSERVABLES
  // =============================================================================

  /**
   * Observable of only non-zero acceleration vectors.
   * Useful for physics calculations that only need objects with actual acceleration.
   */
  public readonly nonZeroAccelerationVectors$: Observable<
    Record<string, OSVector3>
  >;

  /**
   * Private constructor to enforce singleton pattern.
   * Initializes empty acceleration vectors map and sets up filtered observables.
   */
  private constructor() {
    this._accelerationVectors = new BehaviorSubject<Record<string, OSVector3>>(
      {},
    );
    this.accelerationVectors$ = this._accelerationVectors.asObservable();

    // Set up filtered observables using shared operators
    this.nonZeroAccelerationVectors$ = filterNonZeroAccelerationVectors$(
      this.accelerationVectors$,
    );
  }

  /**
   * Gets the singleton instance of the PhysicsStore.
   * Creates the instance if it doesn't exist.
   *
   * @returns The singleton PhysicsStore instance
   *
   * @example
   * ```typescript
   * const store = PhysicsStore.getInstance();
   * store.setAccelerationVector('planet', accelerationData);
   * ```
   */
  public static getInstance(): PhysicsStore {
    if (!PhysicsStore.instance) {
      PhysicsStore.instance = new PhysicsStore();
    }
    return PhysicsStore.instance;
  }

  // =============================================================================
  // FILTERING METHODS
  // =============================================================================

  // Note: Filtering methods have been moved to shared utilities in StoreFilters.ts
  // The filtered observables now use the shared operators for consistency

  // =============================================================================
  // VECTOR OPERATIONS
  // =============================================================================

  /**
   * Gets the current snapshot of all acceleration vectors.
   *
   * This method returns a copy of the current vectors map. For reactive updates,
   * prefer subscribing to `accelerationVectors$` instead.
   *
   * @returns A record mapping object IDs to their acceleration vectors
   *
   * @example
   * ```typescript
   * const allVectors = physicsStore.getAccelerationVectors();
   * console.log(`Found ${Object.keys(allVectors).length} acceleration vectors`);
   * ```
   */
  public getAccelerationVectors(): Record<string, OSVector3> {
    return this._accelerationVectors.getValue();
  }

  /**
   * Gets a specific acceleration vector by object ID.
   *
   * @param id The unique identifier of the celestial object
   * @returns The acceleration vector if found, undefined otherwise
   *
   * @example
   * ```typescript
   * const earthAcceleration = physicsStore.getAccelerationVector('earth');
   * if (earthAcceleration) {
   *   console.log(`Earth acceleration: ${earthAcceleration.x}, ${earthAcceleration.y}, ${earthAcceleration.z}`);
   * }
   * ```
   */
  public getAccelerationVector(id: string): OSVector3 | undefined {
    return this._accelerationVectors.getValue()[id];
  }

  /**
   * Gets the current snapshot of non-zero acceleration vectors.
   *
   * This is the imperative version of `nonZeroAccelerationVectors$`.
   *
   * @returns A record mapping object IDs to their non-zero acceleration vectors
   *
   * @example
   * ```typescript
   * const nonZeroVectors = physicsStore.getNonZeroAccelerationVectors();
   * console.log(`Found ${Object.keys(nonZeroVectors).length} non-zero acceleration vectors`);
   * ```
   */
  public getNonZeroAccelerationVectors(): Record<string, OSVector3> {
    return filterNonZeroAccelerationVectors(this.getAccelerationVectors());
  }

  /**
   * Updates all acceleration vectors from a Map.
   *
   * This method replaces all current acceleration vectors with the provided map.
   * Useful for bulk updates from physics calculations.
   *
   * @param vectors Map of object IDs to acceleration vectors
   *
   * @example
   * ```typescript
   * const newVectors = new Map<string, OSVector3>();
   * newVectors.set('earth', new OSVector3(0, -9.81, 0));
   * newVectors.set('moon', new OSVector3(0, -1.62, 0));
   * physicsStore.updateAccelerationVectors(newVectors);
   * ```
   */
  public updateAccelerationVectors(vectors: Map<string, OSVector3>): void {
    const vectorsRecord: Record<string, OSVector3> = {};
    vectors.forEach((vec, id) => {
      vectorsRecord[id] = vec;
    });
    this._accelerationVectors.next(vectorsRecord);
  }

  /**
   * Sets or updates a single acceleration vector.
   *
   * This method will either add a new vector or update an existing one.
   * The change will trigger emissions on the `accelerationVectors$` observable.
   *
   * @param id The unique identifier for the celestial object
   * @param vector The acceleration vector to store
   *
   * @example
   * ```typescript
   * const earthAcceleration = new OSVector3(0, -9.81, 0);
   * physicsStore.setAccelerationVector('earth', earthAcceleration);
   * ```
   */
  public setAccelerationVector(id: string, vector: OSVector3): void {
    const current = this._accelerationVectors.getValue();
    this._accelerationVectors.next({ ...current, [id]: vector });
  }

  /**
   * Removes an acceleration vector from the store.
   *
   * This method will remove the vector and trigger emissions on the `accelerationVectors$` observable.
   * Useful when an object is destroyed or no longer has acceleration.
   *
   * @param id The unique identifier of the celestial object to remove
   *
   * @example
   * ```typescript
   * // Remove acceleration for a destroyed object
   * physicsStore.removeAccelerationVector('destroyed-asteroid');
   * ```
   */
  public removeAccelerationVector(id: string): void {
    const current = this._accelerationVectors.getValue();
    if (current[id]) {
      const newVectors = { ...current };
      delete newVectors[id];
      this._accelerationVectors.next(newVectors);
    }
  }

  /**
   * Clears all acceleration vectors from the store.
   *
   * This method removes all vectors and triggers emissions on the `accelerationVectors$` observable.
   * Useful for resetting the physics state.
   *
   * @example
   * ```typescript
   * // Clear all acceleration vectors
   * physicsStore.clearAccelerationVectors();
   * ```
   */
  public clearAccelerationVectors(): void {
    this._accelerationVectors.next({});
  }
}

/**
 * Singleton instance of the PhysicsStore.
 *
 * This is the primary way to access the physics store throughout the application.
 * It provides both reactive and imperative access to acceleration vector data,
 * including pre-filtered observables for common use cases.
 *
 * @example
 * ```typescript
 * import { physicsStore } from '@teskooano/core-state';
 *
 * // Reactive subscription to all acceleration vectors
 * physicsStore.accelerationVectors$.subscribe(vectors => {
 *   console.log('All acceleration vectors changed:', Object.keys(vectors));
 * });
 *
 * // Reactive subscription to only non-zero acceleration vectors
 * physicsStore.nonZeroAccelerationVectors$.subscribe(vectors => {
 *   console.log('Non-zero acceleration vectors changed:', Object.keys(vectors));
 * });
 *
 * // Imperative access
 * const earthVector = physicsStore.getAccelerationVector('earth');
 * const nonZeroVectors = physicsStore.getNonZeroAccelerationVectors();
 * ```
 */
export const physicsStore = PhysicsStore.getInstance();
