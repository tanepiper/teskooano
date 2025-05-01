import { BehaviorSubject } from "rxjs";
import type { RenderableCelestialObject } from "@teskooano/renderer-threejs";

/**
 * Store for holding the renderable state of celestial objects.
 * This data is derived from the core celestialObjectsStore and physics updates.
 * @internal Use renderableObjects$ for external observable access.
 */
const _renderableObjectsStore = new BehaviorSubject<
  Record<string, RenderableCelestialObject>
>({});
export const renderableObjects$ = _renderableObjectsStore.asObservable();

/**
 * Actions for managing the renderable state of celestial objects.
 */
export const renderableActions = {
  /**
   * Adds or replaces a renderable object in the store.
   * Typically called by the factory for initial state or the adapter during updates.
   */
  addRenderableObject: (object: RenderableCelestialObject) => {
    const currentObjects = _renderableObjectsStore.getValue();
    _renderableObjectsStore.next({
      ...currentObjects,
      [object.celestialObjectId]: object,
    });
  },

  /**
   * Updates specific properties of a renderable object.
   */
  updateRenderableObject: (
    celestialObjectId: string,
    updates: Partial<RenderableCelestialObject>,
  ) => {
    const currentObjects = _renderableObjectsStore.getValue();
    const currentObject = currentObjects[celestialObjectId];
    if (currentObject) {
      _renderableObjectsStore.next({
        ...currentObjects,
        [celestialObjectId]: {
          ...currentObject,
          ...updates,
        },
      });
    } else {
      console.warn(
        `[renderableActions] updateRenderableObject: Object ${celestialObjectId} not found.`,
      );
    }
  },

  /**
   * Removes a renderable object from the store.
   * Should be called when the corresponding core celestial object is removed.
   */
  removeRenderableObject: (celestialObjectId: string) => {
    const currentObjects = _renderableObjectsStore.getValue();
    if (currentObjects[celestialObjectId]) {
      const newObjects = { ...currentObjects };
      delete newObjects[celestialObjectId];
      _renderableObjectsStore.next(newObjects); // Set the new map without the key
    } else {
      console.warn(
        `[renderableActions] removeRenderableObject: Object ${celestialObjectId} not found.`,
      );
    }
  },

  /**
   * Sets the entire renderable objects map.
   * Useful for initialization or bulk updates from the adapter.
   */
  setAllRenderableObjects: (
    objects: Record<string, RenderableCelestialObject>,
  ) => {
    _renderableObjectsStore.next(objects);
  },
};

// Synchronous getter for convenience (use with caution)
export const getRenderableObjects = () => _renderableObjectsStore.getValue();
