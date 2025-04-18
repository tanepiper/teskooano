import { map, type MapStore } from 'nanostores';
import type { RenderableCelestialObject } from '@teskooano/renderer-threejs';

/**
 * Store for holding the renderable state of celestial objects.
 * This data is derived from the core celestialObjectsStore and physics updates.
 */
export const renderableObjectsStore = map<Record<string, RenderableCelestialObject>>({});

/**
 * Actions for managing the renderable state of celestial objects.
 */
export const renderableActions = {
  /**
   * Adds or replaces a renderable object in the store.
   * Typically called by the factory for initial state or the adapter during updates.
   */
  addRenderableObject: (object: RenderableCelestialObject) => {
    renderableObjectsStore.setKey(object.celestialObjectId, object);
    // Optional: Dispatch event for render system?
  },

  /**
   * Updates specific properties of a renderable object.
   */
  updateRenderableObject: (
    celestialObjectId: string,
    updates: Partial<RenderableCelestialObject>
  ) => {
    const currentObject = renderableObjectsStore.get()[celestialObjectId];
    if (currentObject) {
      renderableObjectsStore.setKey(celestialObjectId, { 
        ...currentObject, 
        ...updates 
      });
    } else {
      console.warn(`[renderableActions] updateRenderableObject: Object ${celestialObjectId} not found.`);
    }
  },

  /**
   * Removes a renderable object from the store.
   * Should be called when the corresponding core celestial object is removed.
   */
  removeRenderableObject: (celestialObjectId: string) => {
    // Use deleteMapKey if available, otherwise create new map
    const currentObjects = renderableObjectsStore.get();
    if (currentObjects[celestialObjectId]) {
      const newObjects = { ...currentObjects };
      delete newObjects[celestialObjectId];
      renderableObjectsStore.set(newObjects); // Set the new map without the key
    } else {
      console.warn(`[renderableActions] removeRenderableObject: Object ${celestialObjectId} not found.`);
    }
  },

  /**
   * Sets the entire renderable objects map.
   * Useful for initialization or bulk updates from the adapter.
   */
  setAllRenderableObjects: (objects: Record<string, RenderableCelestialObject>) => {
    renderableObjectsStore.set(objects);
  }
}; 