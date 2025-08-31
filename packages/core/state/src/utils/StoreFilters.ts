import { map, shareReplay } from "rxjs/operators";
import type { Observable } from "rxjs";
import type {
  CelestialObject,
  RenderableCelestialObject,
} from "@teskooano/data-types";
import { CelestialStatus } from "@teskooano/data-types";
import type { OSVector3 } from "@teskooano/core-math";

/**
 * Shared filtering utilities for store operations.
 *
 * This module provides common filtering functions and RxJS operators that can be
 * reused across different stores to reduce code duplication and ensure consistency.
 */

// =============================================================================
// CELESTIAL OBJECT FILTERS
// =============================================================================

/**
 * Generic filter for celestial objects based on status.
 *
 * @param objects The complete map of celestial objects
 * @param includeDestroyed Whether to include destroyed/annihilated objects (true) or exclude them (false)
 * @returns A filtered map containing objects based on the status filter
 */
function filterCelestialObjectsByStatus(
  objects: Record<string, CelestialObject>,
  includeDestroyed: boolean,
): Record<string, CelestialObject> {
  const filtered: Record<string, CelestialObject> = {};
  Object.values(objects).forEach((obj) => {
    const isDestroyed =
      obj.status === CelestialStatus.DESTROYED ||
      obj.status === CelestialStatus.ANNIHILATED;
    if (isDestroyed === includeDestroyed) {
      filtered[obj.id] = obj;
    }
  });
  return filtered;
}

/**
 * Filters celestial objects to only include active ones (not destroyed or annihilated).
 *
 * @param objects The complete map of celestial objects
 * @returns A filtered map containing only active objects
 */
export function filterActiveCelestialObjects(
  objects: Record<string, CelestialObject>,
): Record<string, CelestialObject> {
  return filterCelestialObjectsByStatus(objects, false);
}

/**
 * Filters celestial objects to only include destroyed or annihilated ones.
 *
 * @param objects The complete map of celestial objects
 * @returns A filtered map containing only destroyed objects
 */
export function filterDestroyedCelestialObjects(
  objects: Record<string, CelestialObject>,
): Record<string, CelestialObject> {
  return filterCelestialObjectsByStatus(objects, true);
}

/**
 * Filters celestial objects to only include those that are active AND not ignoring physics.
 *
 * @param objects The complete map of celestial objects
 * @returns A filtered map containing only physics-active objects
 */
export function filterPhysicsActiveCelestialObjects(
  objects: Record<string, CelestialObject>,
): Record<string, CelestialObject> {
  const activeObjects = filterActiveCelestialObjects(objects);
  const filtered: Record<string, CelestialObject> = {};
  Object.values(activeObjects).forEach((obj) => {
    if (!obj.ignorePhysics) {
      filtered[obj.id] = obj;
    }
  });
  return filtered;
}

/**
 * Filters celestial objects to only include those that are active AND visible.
 *
 * @param objects The complete map of celestial objects
 * @returns A filtered map containing only visible objects
 */
export function filterVisibleCelestialObjects(
  objects: Record<string, CelestialObject>,
): Record<string, CelestialObject> {
  const activeObjects = filterActiveCelestialObjects(objects);
  const filtered: Record<string, CelestialObject> = {};
  Object.values(activeObjects).forEach((obj) => {
    if (obj.isVisible !== false) {
      // Default to true if not specified
      filtered[obj.id] = obj;
    }
  });
  return filtered;
}

// =============================================================================
// RENDERABLE OBJECT FILTERS
// =============================================================================

/**
 * Generic filter for renderable objects based on status.
 *
 * @param objects The complete map of renderable objects
 * @param includeDestroyed Whether to include destroyed/annihilated objects (true) or exclude them (false)
 * @returns A filtered map containing objects based on the status filter
 */
function filterRenderableObjectsByStatus(
  objects: Record<string, RenderableCelestialObject>,
  includeDestroyed: boolean,
): Record<string, RenderableCelestialObject> {
  const filtered: Record<string, RenderableCelestialObject> = {};
  Object.values(objects).forEach((obj) => {
    const isDestroyed =
      obj.status === CelestialStatus.DESTROYED ||
      obj.status === CelestialStatus.ANNIHILATED;
    if (isDestroyed === includeDestroyed) {
      filtered[obj.id] = obj;
    }
  });
  return filtered;
}

/**
 * Filters renderable objects to only include those that are visible.
 *
 * @param objects The complete map of renderable objects
 * @returns A filtered map containing only visible objects
 */
export function filterVisibleRenderableObjects(
  objects: Record<string, RenderableCelestialObject>,
): Record<string, RenderableCelestialObject> {
  const filtered: Record<string, RenderableCelestialObject> = {};
  Object.values(objects).forEach((obj) => {
    if (obj.isVisible !== false) {
      filtered[obj.id] = obj;
    }
  });
  return filtered;
}

/**
 * Filters renderable objects to only include active ones (not destroyed).
 *
 * @param objects The complete map of renderable objects
 * @returns A filtered map containing only active objects
 */
export function filterActiveRenderableObjects(
  objects: Record<string, RenderableCelestialObject>,
): Record<string, RenderableCelestialObject> {
  return filterRenderableObjectsByStatus(objects, false);
}

/**
 * Filters renderable objects to only include those that are active AND not ignoring physics.
 *
 * @param objects The complete map of renderable objects
 * @returns A filtered map containing only physics-active objects
 */
export function filterPhysicsActiveRenderableObjects(
  objects: Record<string, RenderableCelestialObject>,
): Record<string, RenderableCelestialObject> {
  const activeObjects = filterActiveRenderableObjects(objects);
  const filtered: Record<string, RenderableCelestialObject> = {};
  Object.values(activeObjects).forEach((obj) => {
    if (!obj.ignorePhysics) {
      filtered[obj.id] = obj;
    }
  });
  return filtered;
}

// =============================================================================
// PHYSICS VECTOR FILTERS
// =============================================================================

/**
 * Filters acceleration vectors to only include those with non-zero magnitude.
 *
 * @param vectors The complete map of acceleration vectors
 * @returns A filtered map containing only non-zero vectors
 */
export function filterNonZeroAccelerationVectors(
  vectors: Record<string, OSVector3>,
): Record<string, OSVector3> {
  const filtered: Record<string, OSVector3> = {};
  Object.entries(vectors).forEach(([id, vector]) => {
    if (vector.x !== 0 || vector.y !== 0 || vector.z !== 0) {
      filtered[id] = vector;
    }
  });
  return filtered;
}

// =============================================================================
// RXJS OPERATORS
// =============================================================================

/**
 * Creates a filtered observable for active celestial objects.
 *
 * @param source$ The source observable of celestial objects
 * @returns An observable that emits only active celestial objects
 */
export function filterActiveCelestialObjects$<
  T extends Record<string, CelestialObject>,
>(source$: Observable<T>): Observable<T> {
  return source$.pipe(
    map((objects) => filterActiveCelestialObjects(objects) as T),
    shareReplay(1),
  );
}

/**
 * Creates a filtered observable for destroyed celestial objects.
 *
 * @param source$ The source observable of celestial objects
 * @returns An observable that emits only destroyed celestial objects
 */
export function filterDestroyedCelestialObjects$<
  T extends Record<string, CelestialObject>,
>(source$: Observable<T>): Observable<T> {
  return source$.pipe(
    map((objects) => filterDestroyedCelestialObjects(objects) as T),
    shareReplay(1),
  );
}

/**
 * Creates a filtered observable for physics-active celestial objects.
 *
 * @param source$ The source observable of celestial objects
 * @returns An observable that emits only physics-active celestial objects
 */
export function filterPhysicsActiveCelestialObjects$<
  T extends Record<string, CelestialObject>,
>(source$: Observable<T>): Observable<T> {
  return source$.pipe(
    map((objects) => filterPhysicsActiveCelestialObjects(objects) as T),
    shareReplay(1),
  );
}

/**
 * Creates a filtered observable for visible celestial objects.
 *
 * @param source$ The source observable of celestial objects
 * @returns An observable that emits only visible celestial objects
 */
export function filterVisibleCelestialObjects$<
  T extends Record<string, CelestialObject>,
>(source$: Observable<T>): Observable<T> {
  return source$.pipe(
    map((objects) => filterVisibleCelestialObjects(objects) as T),
    shareReplay(1),
  );
}

/**
 * Creates a filtered observable for visible renderable objects.
 *
 * @param source$ The source observable of renderable objects
 * @returns An observable that emits only visible renderable objects
 */
export function filterVisibleRenderableObjects$<
  T extends Record<string, RenderableCelestialObject>,
>(source$: Observable<T>): Observable<T> {
  return source$.pipe(
    map((objects) => filterVisibleRenderableObjects(objects) as T),
    shareReplay(1),
  );
}

/**
 * Creates a filtered observable for active renderable objects.
 *
 * @param source$ The source observable of renderable objects
 * @returns An observable that emits only active renderable objects
 */
export function filterActiveRenderableObjects$<
  T extends Record<string, RenderableCelestialObject>,
>(source$: Observable<T>): Observable<T> {
  return source$.pipe(
    map((objects) => filterActiveRenderableObjects(objects) as T),
    shareReplay(1),
  );
}

/**
 * Creates a filtered observable for physics-active renderable objects.
 *
 * @param source$ The source observable of renderable objects
 * @returns An observable that emits only physics-active renderable objects
 */
export function filterPhysicsActiveRenderableObjects$<
  T extends Record<string, RenderableCelestialObject>,
>(source$: Observable<T>): Observable<T> {
  return source$.pipe(
    map((objects) => filterPhysicsActiveRenderableObjects(objects) as T),
    shareReplay(1),
  );
}

/**
 * Creates a filtered observable for non-zero acceleration vectors.
 *
 * @param source$ The source observable of acceleration vectors
 * @returns An observable that emits only non-zero acceleration vectors
 */
export function filterNonZeroAccelerationVectors$<
  T extends Record<string, OSVector3>,
>(source$: Observable<T>): Observable<T> {
  return source$.pipe(
    map((vectors) => filterNonZeroAccelerationVectors(vectors) as T),
    shareReplay(1),
  );
}
