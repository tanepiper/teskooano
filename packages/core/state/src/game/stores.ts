import { BehaviorSubject, Observable } from "rxjs";
import type { CelestialObject } from "@teskooano/data-types";
import type { OSVector3 } from "@teskooano/core-math";

const LAST_SEED_STORAGE_KEY = "teskooano_last_seed";
const DEFAULT_SEED = "42";

/**
 * @class GameStateService
 * @description Manages the core game state including celestial objects, hierarchy,
 * current seed, and acceleration vectors using RxJS BehaviorSubjects.
 * Provides methods to update and access this state.
 */
export class GameStateService {
  private static instance: GameStateService;

  private readonly _currentSeed: BehaviorSubject<string>;
  /** Observable for the current seed used for system generation. */
  public readonly currentSeed$: Observable<string>;

  private readonly _celestialObjectsStore: BehaviorSubject<
    Record<string, CelestialObject>
  >;
  /** Observable for the store of celestial objects, keyed by ID. */
  public readonly celestialObjects$: Observable<
    Record<string, CelestialObject>
  >;

  private readonly _celestialHierarchyStore: BehaviorSubject<
    Record<string, string[]>
  >;
  /** Observable for the store of hierarchical relationships between celestial objects. */
  public readonly celestialHierarchy$: Observable<Record<string, string[]>>;

  private readonly _accelerationVectorsStore: BehaviorSubject<
    Record<string, OSVector3>
  >;
  /** Observable for the store of calculated acceleration vectors for celestial objects. */
  public readonly accelerationVectors$: Observable<Record<string, OSVector3>>;

  private constructor() {
    this._currentSeed = new BehaviorSubject<string>(this.getInitialSeed());
    this.currentSeed$ = this._currentSeed.asObservable();

    this._celestialObjectsStore = new BehaviorSubject<
      Record<string, CelestialObject>
    >({});
    this.celestialObjects$ = this._celestialObjectsStore.asObservable();

    this._celestialHierarchyStore = new BehaviorSubject<
      Record<string, string[]>
    >({});
    this.celestialHierarchy$ = this._celestialHierarchyStore.asObservable();

    this._accelerationVectorsStore = new BehaviorSubject<
      Record<string, OSVector3>
    >({});
    this.accelerationVectors$ = this._accelerationVectorsStore.asObservable();
  }

  /**
   * @public
   * @static
   * @description Provides access to the singleton instance of the GameStateService.
   * @returns {GameStateService} The singleton instance.
   */
  public static getInstance(): GameStateService {
    if (!GameStateService.instance) {
      GameStateService.instance = new GameStateService();
    }
    return GameStateService.instance;
  }

  private getInitialSeed(): string {
    try {
      const storedSeed = localStorage.getItem(LAST_SEED_STORAGE_KEY);
      return storedSeed ?? DEFAULT_SEED;
    } catch (error) {
      console.error("Error accessing localStorage for seed:", error);
      return DEFAULT_SEED;
    }
  }

  /**
   * Updates the current seed value in the store and localStorage.
   * @param newSeed The new seed value.
   */
  public updateSeed(newSeed: string): void {
    console.log("Updating seed:", newSeed);
    const trimmedSeed = newSeed.trim();
    const seedToSet = trimmedSeed || DEFAULT_SEED;
    try {
      localStorage.setItem(LAST_SEED_STORAGE_KEY, seedToSet);
      this._currentSeed.next(seedToSet);
      if (!trimmedSeed) {
        console.warn(
          `Seed input was empty, using default seed "${DEFAULT_SEED}".`,
        );
      }
    } catch (error) {
      console.error("Error updating seed in localStorage:", error);
      // Still update the BehaviorSubject even if localStorage fails
      this._currentSeed.next(seedToSet);
    }
  }

  /** Gets the current value of the seed. */
  public getCurrentSeed(): string {
    return this._currentSeed.getValue();
  }

  /**
   * Updates the acceleration vectors store.
   * Accepts a Map<string, OSVector3> and updates the store.
   * @param newAccelerations - A Map containing the latest acceleration vectors keyed by object ID.
   */
  public updateAccelerationVectors(
    newAccelerations: Map<string, OSVector3>,
  ): void {
    const accelerationsRecord: Record<string, OSVector3> = {};
    newAccelerations.forEach((vec, id) => {
      accelerationsRecord[id] = vec;
    });
    this._accelerationVectorsStore.next(accelerationsRecord);
  }

  /** Gets the current record of acceleration vectors. */
  public getAccelerationVectors(): Record<string, OSVector3> {
    return this._accelerationVectorsStore.getValue();
  }

  /**
   * Gets children of a celestial object.
   * @param objectId The ID of the parent celestial object.
   * @returns An array of child CelestialObject instances.
   */
  public getChildrenOfObject(objectId: string): CelestialObject[] {
    const hierarchy = this._celestialHierarchyStore.getValue();
    const objects = this._celestialObjectsStore.getValue();
    const childIds = hierarchy[objectId] || [];
    return childIds.map((id) => objects[id]).filter(Boolean);
  }

  /** Gets the current record of all celestial objects. */
  public getCelestialObjects(): Record<string, CelestialObject> {
    return this._celestialObjectsStore.getValue();
  }

  /** Gets the current record of the celestial hierarchy. */
  public getCelestialHierarchy(): Record<string, string[]> {
    return this._celestialHierarchyStore.getValue();
  }

  /**
   * Adds or updates a celestial object in the store.
   * @param id The ID of the celestial object.
   * @param object The celestial object data.
   */
  public setCelestialObject(id: string, object: CelestialObject): void {
    const current = this._celestialObjectsStore.getValue();
    this._celestialObjectsStore.next({ ...current, [id]: object });
  }

  /**
   * Removes a celestial object from the store.
   * Note: This only removes from the objects store. For complete removal
   * including hierarchy and other related state, use actions in `celestialActions.ts`.
   * @param id The ID of the celestial object to remove.
   */
  public removeCelestialObject(id: string): void {
    const current = this._celestialObjectsStore.getValue();
    if (current[id]) {
      const newObjects = { ...current };
      delete newObjects[id];
      this._celestialObjectsStore.next(newObjects);
    }
  }

  /**
   * Sets the entire celestial hierarchy.
   * @param hierarchy The complete hierarchy record.
   */
  public setCelestialHierarchy(hierarchy: Record<string, string[]>): void {
    this._celestialHierarchyStore.next(hierarchy);
  }

  /**
   * Removes an object and its references from the celestial hierarchy.
   * @param objectId The ID of the object to remove from the hierarchy.
   */
  public removeCelestialHierarchyEntry(objectId: string): void {
    const currentHierarchy = this._celestialHierarchyStore.getValue();
    const objectToRemove = this.getCelestialObjects()[objectId]; // Use class method
    const parentId = objectToRemove?.parentId;
    const newHierarchy = { ...currentHierarchy };

    if (newHierarchy[objectId]) {
      // Remove the object's own entry (if it was a parent)
      delete newHierarchy[objectId];
    }

    if (parentId && newHierarchy[parentId]) {
      // Remove the object from its parent's list of children
      newHierarchy[parentId] = newHierarchy[parentId].filter(
        (childId) => childId !== objectId,
      );
    }
    this._celestialHierarchyStore.next(newHierarchy);
  }

  /**
   * Sets all celestial objects in the store, replacing the current collection.
   * @param objects A record of celestial objects.
   */
  public setAllCelestialObjects(
    objects: Record<string, CelestialObject>,
  ): void {
    this._celestialObjectsStore.next(objects);
  }

  /**
   * Sets the entire celestial hierarchy, replacing the current one.
   * @param hierarchy A record representing the celestial hierarchy.
   */
  public setAllCelestialHierarchy(hierarchy: Record<string, string[]>): void {
    this._celestialHierarchyStore.next(hierarchy);
  }
}

/**
 * Singleton instance of the GameStateService.
 */
export const gameStateService = GameStateService.getInstance();
