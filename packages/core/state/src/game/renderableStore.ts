import { BehaviorSubject, Observable } from "rxjs";
import type { RenderableCelestialObject } from "@teskooano/renderer-threejs";

/**
 * @class RenderableStore
 * @singleton
 * @description Manages the state of renderable celestial objects.
 * This store holds data derived from the core celestialObjectsStore and physics updates,
 * providing a centralized place for accessing and manipulating renderable objects.
 * Access the store's data via the `renderableObjects$` observable or `getRenderableObjects()` method.
 * Use the provided action methods to modify the store.
 */
class RenderableStore {
  private static instance: RenderableStore;

  /**
   * @private
   * @description BehaviorSubject holding the renderable state of celestial objects.
   * @internal Use renderableObjects$ for external observable access.
   */
  private readonly _renderableObjectsStore = new BehaviorSubject<
    Record<string, RenderableCelestialObject>
  >({});

  /**
   * @public
   * @description Observable for the renderable state of celestial objects.
   * Subscribe to this observable to receive updates when renderable objects change.
   */
  public readonly renderableObjects$: Observable<
    Record<string, RenderableCelestialObject>
  >;

  private constructor() {
    this.renderableObjects$ = this._renderableObjectsStore.asObservable();
  }

  /**
   * @public
   * @static
   * @description Provides access to the singleton instance of the RenderableStore.
   * @returns {RenderableStore} The singleton instance.
   */
  public static getInstance(): RenderableStore {
    if (!RenderableStore.instance) {
      RenderableStore.instance = new RenderableStore();
    }
    return RenderableStore.instance;
  }

  /**
   * @public
   * @description Adds or replaces a renderable object in the store.
   * Typically called by a factory for initial state or an adapter during updates.
   * @param {RenderableCelestialObject} object - The renderable object to add or replace.
   */
  public addRenderableObject(object: RenderableCelestialObject): void {
    const currentObjects = this._renderableObjectsStore.getValue();
    this._renderableObjectsStore.next({
      ...currentObjects,
      [object.celestialObjectId]: object,
    });
  }

  /**
   * @public
   * @description Updates specific properties of a renderable object.
   * @param {string} celestialObjectId - The ID of the celestial object to update.
   * @param {Partial<RenderableCelestialObject>} updates - An object containing the properties to update.
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
   * @public
   * @description Removes a renderable object from the store.
   * Should be called when the corresponding core celestial object is removed.
   * @param {string} celestialObjectId - The ID of the celestial object to remove.
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
   * @public
   * @description Sets the entire renderable objects map.
   * Useful for initialization or bulk updates from an adapter.
   * @param {Record<string, RenderableCelestialObject>} objects - The new map of renderable objects.
   */
  public setAllRenderableObjects(
    objects: Record<string, RenderableCelestialObject>,
  ): void {
    this._renderableObjectsStore.next(objects);
  }

  /**
   * @public
   * @description Gets the current snapshot of all renderable objects.
   * @returns {Record<string, RenderableCelestialObject>} The current map of renderable objects.
   */
  public getRenderableObjects(): Record<string, RenderableCelestialObject> {
    return this._renderableObjectsStore.getValue();
  }
}

/**
 * Singleton instance of the RenderableStore.
 * Use this instance to access and manage renderable celestial objects.
 *
 * @example
 * import { renderableStore } from '@teskooano/core/state';
 *
 * // Subscribe to updates
 * renderableStore.renderableObjects$.subscribe(objects => {
 *   console.log("Renderable objects updated:", objects);
 * });
 *
 * // Add an object
 * renderableStore.addRenderableObject({ celestialObjectId: 'earth', ... });
 *
 * // Get all objects
 * const allObjects = renderableStore.getRenderableObjects();
 */
export const renderableStore = RenderableStore.getInstance();
