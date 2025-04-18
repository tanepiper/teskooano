import { map } from 'nanostores';
import type { CelestialObject } from '@teskooano/data-types';
import type { OSVector3 } from '@teskooano/core-math';

/**
 * Store that maps celestial object IDs to their full data including physics state
 */
export const celestialObjectsStore = map<Record<string, CelestialObject>>();

/**
 * Store for tracking hierarchical relationships between celestial objects
 */
export const celestialHierarchyStore = map<Record<string, string[]>>({});

/**
 * Store that maps celestial object IDs to their calculated acceleration vector (m/s^2) for the current physics step.
 */
export const accelerationVectorsStore = map<Record<string, OSVector3>>({});

/**
 * Helper action to update the acceleration vectors store.
 * Accepts a Map<string, OSVector3> and updates the store.
 * @param newAccelerations - A Map containing the latest acceleration vectors keyed by object ID.
 */
export function updateAccelerationVectors(newAccelerations: Map<string, OSVector3>): void {
  // Convert the Map to a plain Record<string, OSVector3> for the store
  const accelerationsRecord: Record<string, OSVector3> = {};
  newAccelerations.forEach((vec, id) => {
    accelerationsRecord[id] = vec; // Store the actual OSVector3 object
  });
  accelerationVectorsStore.set(accelerationsRecord);
}

/**
 * Get children of a celestial object
 */
export const getChildrenOfObject = (objectId: string): CelestialObject[] => {
  const hierarchy = celestialHierarchyStore.get();
  const objects = celestialObjectsStore.get();
  const childIds = hierarchy[objectId] || [];
  return childIds.map(id => objects[id]).filter(Boolean);
}; 