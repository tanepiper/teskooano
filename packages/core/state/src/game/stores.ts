import { BehaviorSubject } from "rxjs";
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
export const currentSeed = new BehaviorSubject<string>(getInitialSeed());

/**
 * Action to update the current seed value in the store and localStorage.
 * @param newSeed The new seed value.
 */
export const updateSeed = (newSeed: string): void => {
  const trimmedSeed = newSeed.trim();
  const seedToSet = trimmedSeed || DEFAULT_SEED;
  try {
    localStorage.setItem(LAST_SEED_STORAGE_KEY, seedToSet);
    currentSeed.next(seedToSet);
    if (!trimmedSeed) {
      console.warn(
        `Seed input was empty, using default seed "${DEFAULT_SEED}".`,
      );
    }
  } catch (error) {
    console.error("Error updating seed in localStorage:", error);
    currentSeed.next(seedToSet);
  }
};
// --- End Seed State ---

/**
 * Store that maps celestial object IDs to their full data including physics state
 * @internal Use celestialObjects$ for external observable access.
 */
const _celestialObjectsStore = new BehaviorSubject<
  Record<string, CelestialObject>
>({});
export const celestialObjects$ = _celestialObjectsStore.asObservable();

/**
 * Store for tracking hierarchical relationships between celestial objects
 * @internal Use celestialHierarchy$ for external observable access.
 */
const _celestialHierarchyStore = new BehaviorSubject<Record<string, string[]>>(
  {},
);
export const celestialHierarchy$ = _celestialHierarchyStore.asObservable();

/**
 * Store that maps celestial object IDs to their calculated acceleration vector (m/s^2) for the current physics step.
 * @internal Use accelerationVectors$ for external observable access.
 */
const _accelerationVectorsStore = new BehaviorSubject<
  Record<string, OSVector3>
>({});
export const accelerationVectors$ = _accelerationVectorsStore.asObservable();

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
  _accelerationVectorsStore.next(accelerationsRecord); // Use .next()
}

/**
 * Get children of a celestial object
 */
export const getChildrenOfObject = (objectId: string): CelestialObject[] => {
  // Use .getValue() for synchronous access
  const hierarchy = _celestialHierarchyStore.getValue();
  const objects = _celestialObjectsStore.getValue();
  const childIds = hierarchy[objectId] || [];
  return childIds.map((id) => objects[id]).filter(Boolean);
};

// Export actions/getters if needed, and synchronous accessors (use with caution)
export const getCelestialObjects = () => _celestialObjectsStore.getValue();
export const getCelestialHierarchy = () => _celestialHierarchyStore.getValue();
export const setCelestialObject = (id: string, object: CelestialObject) => {
  const current = _celestialObjectsStore.getValue();
  _celestialObjectsStore.next({ ...current, [id]: object });
};
export const removeCelestialObject = (id: string) => {
  const current = _celestialObjectsStore.getValue();
  if (current[id]) {
    const newObjects = { ...current };
    delete newObjects[id];
    _celestialObjectsStore.next(newObjects);
  }
};
export const setCelestialHierarchy = (hierarchy: Record<string, string[]>) => {
  _celestialHierarchyStore.next(hierarchy);
};
export const removeCelestialHierarchyEntry = (objectId: string) => {
  const currentHierarchy = _celestialHierarchyStore.getValue();
  const objectToRemove = getCelestialObjects()[objectId];
  const parentId = objectToRemove?.parentId;
  const newHierarchy = { ...currentHierarchy };

  if (newHierarchy[objectId]) {
    delete newHierarchy[objectId];
  }

  if (parentId && newHierarchy[parentId]) {
    newHierarchy[parentId] = newHierarchy[parentId].filter(
      (childId) => childId !== objectId,
    );
  }

  _celestialHierarchyStore.next(newHierarchy);
};

// --- Bulk Setters ---
export const setAllCelestialObjects = (
  objects: Record<string, CelestialObject>,
) => {
  _celestialObjectsStore.next(objects);
};
export const setAllCelestialHierarchy = (
  hierarchy: Record<string, string[]>,
) => {
  _celestialHierarchyStore.next(hierarchy);
};
