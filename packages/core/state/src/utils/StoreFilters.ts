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
// GENERIC FILTER FACTORY
// =============================================================================

/**
 * Type for filter predicate functions.
 */
export type FilterPredicate<T> = (item: T) => boolean;

/**
 * Generic filter factory for creating filtered object maps.
 * This reduces code duplication by providing a single function that can be
 * composed with different predicates.
 *
 * @param objects The complete map of objects to filter
 * @param predicates Array of predicate functions that all must return true
 * @returns A filtered map containing only objects that pass all predicates
 *
 * @example
 * // Filter active, visible objects
 * const filtered = createFilteredMap(objects, [
 *   obj => obj.status !== CelestialStatus.DESTROYED,
 *   obj => obj.isVisible !== false
 * ]);
 */
export function createFilteredMap<T extends { id: string }>(
  objects: Record<string, T>,
  predicates: FilterPredicate<T>[],
): Record<string, T> {
  const filtered: Record<string, T> = {};
  Object.values(objects).forEach((obj) => {
    if (predicates.every((predicate) => predicate(obj))) {
      filtered[obj.id] = obj;
    }
  });
  return filtered;
}

/**
 * Creates a filtered observable stream using composable predicates.
 * This is the RxJS operator version of createFilteredMap.
 *
 * @param source$ The source observable of objects
 * @param predicates Array of predicate functions
 * @returns An observable that emits filtered objects
 *
 * @example
 * // Create an observable of active physics objects
 * const activePhysics$ = createFilteredStream$(
 *   celestialStore.objects$,
 *   [isActive, isNotIgnoringPhysics]
 * );
 */
export function createFilteredStream$<T extends { id: string }>(
  source$: Observable<Record<string, T>>,
  predicates: FilterPredicate<T>[],
): Observable<Record<string, T>> {
  return source$.pipe(
    map((objects) => createFilteredMap(objects, predicates)),
    shareReplay(1),
  );
}

// =============================================================================
// COMMON PREDICATES
// =============================================================================

/**
 * Predicate: Object is not destroyed or annihilated.
 */
export function isActive<T extends { status?: CelestialStatus | undefined }>(
  obj: T,
): boolean {
  return (
    obj.status !== CelestialStatus.DESTROYED &&
    obj.status !== CelestialStatus.ANNIHILATED
  );
}

/**
 * Predicate: Object is destroyed or annihilated.
 */
export function isDestroyed<T extends { status?: CelestialStatus | undefined }>(
  obj: T,
): boolean {
  return (
    obj.status === CelestialStatus.DESTROYED ||
    obj.status === CelestialStatus.ANNIHILATED
  );
}

/**
 * Predicate: Object is not ignoring physics.
 */
export function isNotIgnoringPhysics<T extends { ignorePhysics?: boolean }>(
  obj: T,
): boolean {
  return !obj.ignorePhysics;
}

/**
 * Predicate: Object is visible (isVisible is not explicitly false).
 */
export function isVisible<T extends { isVisible?: boolean }>(obj: T): boolean {
  return obj.isVisible !== false;
}

/**
 * Predicate: Vector has non-zero magnitude.
 */
export function isNonZeroVector(vector: OSVector3): boolean {
  return vector.x !== 0 || vector.y !== 0 || vector.z !== 0;
}

// =============================================================================
// CELESTIAL OBJECT FILTERS
// =============================================================================

/**
 * Filters celestial objects to only include active ones (not destroyed or annihilated).
 * Uses the generic filter factory with the isActive predicate.
 *
 * @param objects The complete map of celestial objects
 * @returns A filtered map containing only active objects
 */
export function filterActiveCelestialObjects(
  objects: Record<string, CelestialObject>,
): Record<string, CelestialObject> {
  return createFilteredMap(objects, [isActive]);
}

/**
 * Filters celestial objects to only include destroyed or annihilated ones.
 * Uses the generic filter factory with the isDestroyed predicate.
 *
 * @param objects The complete map of celestial objects
 * @returns A filtered map containing only destroyed objects
 */
export function filterDestroyedCelestialObjects(
  objects: Record<string, CelestialObject>,
): Record<string, CelestialObject> {
  return createFilteredMap(objects, [isDestroyed]);
}

/**
 * Filters celestial objects to only include those that are active AND not ignoring physics.
 * Uses the generic filter factory with composed predicates.
 *
 * @param objects The complete map of celestial objects
 * @returns A filtered map containing only physics-active objects
 */
export function filterPhysicsActiveCelestialObjects(
  objects: Record<string, CelestialObject>,
): Record<string, CelestialObject> {
  return createFilteredMap(objects, [isActive, isNotIgnoringPhysics]);
}

/**
 * Filters celestial objects to only include those that are active AND visible.
 * Uses the generic filter factory with composed predicates.
 *
 * @param objects The complete map of celestial objects
 * @returns A filtered map containing only visible objects
 */
export function filterVisibleCelestialObjects(
  objects: Record<string, CelestialObject>,
): Record<string, CelestialObject> {
  return createFilteredMap(objects, [isActive, isVisible]);
}

// =============================================================================
// RENDERABLE OBJECT FILTERS
// =============================================================================

/**
 * Filters renderable objects to only include those that are visible.
 * Uses the generic filter factory with the isVisible predicate.
 *
 * @param objects The complete map of renderable objects
 * @returns A filtered map containing only visible objects
 */
export function filterVisibleRenderableObjects(
  objects: Record<string, RenderableCelestialObject>,
): Record<string, RenderableCelestialObject> {
  return createFilteredMap(objects, [isVisible]);
}

/**
 * Filters renderable objects to only include active ones (not destroyed).
 * Uses the generic filter factory with the isActive predicate.
 *
 * @param objects The complete map of renderable objects
 * @returns A filtered map containing only active objects
 */
export function filterActiveRenderableObjects(
  objects: Record<string, RenderableCelestialObject>,
): Record<string, RenderableCelestialObject> {
  return createFilteredMap(objects, [isActive]);
}

/**
 * Filters renderable objects to only include those that are active AND not ignoring physics.
 * Uses the generic filter factory with composed predicates.
 *
 * @param objects The complete map of renderable objects
 * @returns A filtered map containing only physics-active objects
 */
export function filterPhysicsActiveRenderableObjects(
  objects: Record<string, RenderableCelestialObject>,
): Record<string, RenderableCelestialObject> {
  return createFilteredMap(objects, [isActive, isNotIgnoringPhysics]);
}

// =============================================================================
// PHYSICS VECTOR FILTERS
// =============================================================================

/**
 * Filters acceleration vectors to only include those with non-zero magnitude.
 * Uses the generic filter factory with the isNonZeroVector predicate.
 *
 * @param vectors The complete map of acceleration vectors
 * @returns A filtered map containing only non-zero vectors
 */
export function filterNonZeroAccelerationVectors(
  vectors: Record<string, OSVector3>,
): Record<string, OSVector3> {
  // Note: Vectors don't have an 'id' property, so we need a custom implementation
  const filtered: Record<string, OSVector3> = {};
  Object.entries(vectors).forEach(([id, vector]) => {
    if (isNonZeroVector(vector)) {
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
 * Uses the generic createFilteredStream$ with the isActive predicate.
 *
 * @param source$ The source observable of celestial objects
 * @returns An observable that emits only active celestial objects
 */
export function filterActiveCelestialObjects$<
  T extends Record<string, CelestialObject>,
>(source$: Observable<T>): Observable<T> {
  return createFilteredStream$(source$, [isActive]) as Observable<T>;
}

/**
 * Creates a filtered observable for destroyed celestial objects.
 * Uses the generic createFilteredStream$ with the isDestroyed predicate.
 *
 * @param source$ The source observable of celestial objects
 * @returns An observable that emits only destroyed celestial objects
 */
export function filterDestroyedCelestialObjects$<
  T extends Record<string, CelestialObject>,
>(source$: Observable<T>): Observable<T> {
  return createFilteredStream$(source$, [isDestroyed]) as Observable<T>;
}

/**
 * Creates a filtered observable for physics-active celestial objects.
 * Uses the generic createFilteredStream$ with composed predicates.
 *
 * @param source$ The source observable of celestial objects
 * @returns An observable that emits only physics-active celestial objects
 */
export function filterPhysicsActiveCelestialObjects$<
  T extends Record<string, CelestialObject>,
>(source$: Observable<T>): Observable<T> {
  return createFilteredStream$(source$, [
    isActive,
    isNotIgnoringPhysics,
  ]) as Observable<T>;
}

/**
 * Creates a filtered observable for visible celestial objects.
 * Uses the generic createFilteredStream$ with composed predicates.
 *
 * @param source$ The source observable of celestial objects
 * @returns An observable that emits only visible celestial objects
 */
export function filterVisibleCelestialObjects$<
  T extends Record<string, CelestialObject>,
>(source$: Observable<T>): Observable<T> {
  return createFilteredStream$(source$, [isActive, isVisible]) as Observable<T>;
}

/**
 * Creates a filtered observable for visible renderable objects.
 * Uses the generic createFilteredStream$ with the isVisible predicate.
 *
 * @param source$ The source observable of renderable objects
 * @returns An observable that emits only visible renderable objects
 */
export function filterVisibleRenderableObjects$<
  T extends Record<string, RenderableCelestialObject>,
>(source$: Observable<T>): Observable<T> {
  return createFilteredStream$(source$, [isVisible]) as Observable<T>;
}

/**
 * Creates a filtered observable for active renderable objects.
 * Uses the generic createFilteredStream$ with the isActive predicate.
 *
 * @param source$ The source observable of renderable objects
 * @returns An observable that emits only active renderable objects
 */
export function filterActiveRenderableObjects$<
  T extends Record<string, RenderableCelestialObject>,
>(source$: Observable<T>): Observable<T> {
  return createFilteredStream$(source$, [isActive]) as Observable<T>;
}

/**
 * Creates a filtered observable for physics-active renderable objects.
 * Uses the generic createFilteredStream$ with composed predicates.
 *
 * @param source$ The source observable of renderable objects
 * @returns An observable that emits only physics-active renderable objects
 */
export function filterPhysicsActiveRenderableObjects$<
  T extends Record<string, RenderableCelestialObject>,
>(source$: Observable<T>): Observable<T> {
  return createFilteredStream$(source$, [
    isActive,
    isNotIgnoringPhysics,
  ]) as Observable<T>;
}

/**
 * Creates a filtered observable for non-zero acceleration vectors.
 * Custom implementation since vectors don't have an 'id' property.
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
