import { Observable, animationFrameScheduler } from "rxjs";
import { throttleTime, withLatestFrom, map } from "rxjs/operators";
import { celestialStore } from "../stores/CelestialStore";
import { renderableStore } from "../stores/RenderableStore";
import type {
  CelestialObject,
  RenderableCelestialObject,
} from "@teskooano/data-types";

/**
 * Domain-specific stream composition helpers to reduce boilerplate in reactive flows.
 *
 * These utilities provide common patterns for combining and transforming observables
 * in the context of Teskooano's state management system.
 */

// =============================================================================
// STATE COMPOSITION HELPERS
// =============================================================================

/**
 * Combined state from celestial and renderable stores.
 */
export interface CombinedCelestialState<T = unknown> {
  /** The original value from the source observable */
  value: T;
  /** Current renderable objects */
  renderables: Record<string, RenderableCelestialObject>;
  /** Current celestial objects */
  celestials: Record<string, CelestialObject>;
}

/**
 * Composes an observable with the latest celestial and renderable state.
 * This is a common pattern for components that need access to both state stores.
 *
 * @param source$ The source observable to enhance with state
 * @returns An observable emitting combined state
 *
 * @example
 * ```typescript
 * // Combine user input with current state
 * const userAction$ = fromEvent(button, 'click').pipe(
 *   withCelestialState(),
 *   map(({ value, celestials, renderables }) => {
 *     // Process action with full state context
 *     return processAction(value, celestials, renderables);
 *   })
 * );
 * ```
 */
export function withCelestialState<T>() {
  return (source$: Observable<T>): Observable<CombinedCelestialState<T>> => {
    return source$.pipe(
      withLatestFrom(
        renderableStore.renderableObjects$,
        celestialStore.objects$,
      ),
      map(([value, renderables, celestials]) => ({
        value,
        renderables,
        celestials,
      })),
    );
  };
}

/**
 * Composes an observable with only renderable state.
 * Lighter-weight alternative when celestial state is not needed.
 *
 * @param source$ The source observable to enhance
 * @returns An observable emitting value with renderables
 *
 * @example
 * ```typescript
 * const cameraChange$ = cameraPosition$.pipe(
 *   withRenderableState(),
 *   map(({ value, renderables }) => {
 *     // Update visuals based on camera and renderables
 *     return updateVisuals(value, renderables);
 *   })
 * );
 * ```
 */
export function withRenderableState<T>() {
  return (
    source$: Observable<T>,
  ): Observable<{
    value: T;
    renderables: Record<string, RenderableCelestialObject>;
  }> => {
    return source$.pipe(
      withLatestFrom(renderableStore.renderableObjects$),
      map(([value, renderables]) => ({
        value,
        renderables,
      })),
    );
  };
}

// =============================================================================
// PERFORMANCE HELPERS
// =============================================================================

/**
 * Throttles an observable to approximately 60fps using animation frame scheduler.
 * Useful for expensive operations that should be synchronized with rendering.
 *
 * @param source$ The source observable to throttle
 * @returns A throttled observable emitting at most once per frame
 *
 * @example
 * ```typescript
 * // Throttle expensive DOM updates to frame rate
 * const mouseMove$ = fromEvent(document, 'mousemove').pipe(
 *   atFrameRate(),
 *   map(event => updateUIExpensively(event))
 * );
 * ```
 */
export function atFrameRate<T>() {
  return (source$: Observable<T>): Observable<T> => {
    return source$.pipe(throttleTime(16.67, animationFrameScheduler));
  };
}

/**
 * Throttles an observable to a specific frame rate (fps).
 * More flexible than atFrameRate for custom throttling needs.
 *
 * @param fps Desired frames per second (e.g., 30, 60)
 * @returns An RxJS operator that throttles to the specified fps
 *
 * @example
 * ```typescript
 * // Throttle to 30fps for less critical updates
 * const backgroundUpdate$ = timer(0, 100).pipe(
 *   atCustomFrameRate(30),
 *   map(() => updateBackground())
 * );
 * ```
 */
export function atCustomFrameRate<T>(fps: number) {
  const interval = 1000 / fps;
  return (source$: Observable<T>): Observable<T> => {
    return source$.pipe(throttleTime(interval, animationFrameScheduler));
  };
}

// =============================================================================
// TYPE GUARDS & UTILITIES
// =============================================================================

/**
 * Filters out null and undefined values from an observable stream.
 * Provides type narrowing for downstream operators.
 *
 * @param source$ The source observable
 * @returns An observable that only emits defined values
 *
 * @example
 * ```typescript
 * const selectedObject$ = objectId$.pipe(
 *   map(id => celestialStore.getObject(id)),
 *   filterDefined(),  // Now TypeScript knows value is not null/undefined
 *   map(object => object.name)
 * );
 * ```
 */
export function filterDefined<T>() {
  return (source$: Observable<T | null | undefined>): Observable<T> => {
    return new Observable<T>((subscriber) => {
      return source$.subscribe({
        next: (value) => {
          if (value !== null && value !== undefined) {
            subscriber.next(value);
          }
        },
        error: (err) => subscriber.error(err),
        complete: () => subscriber.complete(),
      });
    });
  };
}
