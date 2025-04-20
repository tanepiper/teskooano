import { map, atom } from "nanostores";
import type { CelestialObject } from "@teskooano/data-types";
import type { OSVector3 } from "@teskooano/core-math";

// --- Seed State ---
// localStorage key for the seed
const LAST_SEED_STORAGE_KEY = "teskooano_last_seed";
const DEFAULT_SEED = "42";

// Function to safely get the initial seed from localStorage
const getInitialSeed = (): string => {
  try {
    const storedSeed = localStorage.getItem(LAST_SEED_STORAGE_KEY);
    return storedSeed ?? DEFAULT_SEED;
  } catch (error) {
    console.error("Error accessing localStorage for seed:", error);
    return DEFAULT_SEED;
  }
};

/**
 * Atom storing the current seed used for system generation.
 * Initializes from localStorage or falls back to the default seed.
 */
export const currentSeed = atom<string>(getInitialSeed());

/**
 * Action to update the current seed value in the store and localStorage.
 * @param newSeed The new seed value.
 */
export const updateSeed = (newSeed: string): void => {
  const trimmedSeed = newSeed.trim();
  const seedToSet = trimmedSeed || DEFAULT_SEED;
  try {
    localStorage.setItem(LAST_SEED_STORAGE_KEY, seedToSet);
    currentSeed.set(seedToSet);
    if (!trimmedSeed) {
      console.warn(
        `Seed input was empty, using default seed "${DEFAULT_SEED}".`,
      );
    }
  } catch (error) {
    console.error("Error updating seed in localStorage:", error);
    currentSeed.set(seedToSet);
  }
};
// --- End Seed State ---

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
export function updateAccelerationVectors(
  newAccelerations: Map<string, OSVector3>,
): void {
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
  return childIds.map((id) => objects[id]).filter(Boolean);
};
