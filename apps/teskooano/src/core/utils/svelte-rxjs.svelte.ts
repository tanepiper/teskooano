/**
 * RxJS ↔ Svelte 5 Interoperability Utilities
 *
 * Bridges RxJS Observable/BehaviorSubject streams into Svelte 5 runes-based
 * reactive state. Since Svelte 5 uses the runes system (`$state`, `$derived`,
 * `$effect`) rather than the Svelte 4 store contract, raw observables cannot
 * be used with the `$obs$` auto-subscription syntax any more.
 *
 * These utilities provide a clean way to consume RxJS streams inside Svelte
 * components and controllers, automatically managing subscription lifecycle.
 *
 * ## Usage inside a Svelte 5 component (.svelte file)
 *
 * ```svelte
 * <script lang="ts">
 *   import { fromObservable } from "@core/utils/svelte-rxjs.ts";
 *   import { simulationState$ } from "@teskooano/core-state";
 *
 *   const simState = fromObservable(simulationState$, null);
 *   // Use $simState.value in the template - updates reactively
 * </script>
 *
 * <p>Time scale: {simState.value?.timeScale}</p>
 * ```
 *
 * ## Usage inside a plain TypeScript file (e.g., a service class)
 *
 * Use the standard StateSubscriptionMixin pattern from @teskooano/core-state.
 * These utilities are specifically for use inside Svelte component `<script>` blocks.
 */

import { onDestroy } from "svelte";
import type { Observable, Subscription } from "rxjs";

/**
 * A reactive container wrapping an RxJS Observable for use in Svelte 5 runes mode.
 *
 * The `value` property is a `$state` variable that updates whenever the source
 * observable emits. Subscription cleanup is automatically handled via `onDestroy`.
 *
 * @template T The type of values emitted by the observable.
 */
export interface ReactiveObservable<T> {
  /** The current value from the observable, updated reactively. */
  value: T;
}

/**
 * Bridges an RxJS Observable into Svelte 5 reactive state.
 *
 * Must be called during component initialisation (i.e., at the top level of a
 * `<script>` block or during `onMount`/import of a reactive module). Internally
 * registers an `onDestroy` cleanup handler to unsubscribe automatically.
 *
 * @param observable$ The RxJS observable to subscribe to.
 * @param initialValue The initial value to use before the first emission.
 * @returns A {@link ReactiveObservable} whose `value` tracks the observable.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   import { fromObservable } from "@core/utils/svelte-rxjs.ts";
 *   import { celestialObjects$ } from "@teskooano/core-state";
 *
 *   const objects = fromObservable(celestialObjects$, {});
 * </script>
 *
 * {#each Object.values(objects.value) as obj}
 *   <p>{obj.name}</p>
 * {/each}
 * ```
 */
export function fromObservable<T>(
  observable$: Observable<T>,
  initialValue: T,
): ReactiveObservable<T> {
  let container = $state<{ value: T }>({ value: initialValue });

  const subscription: Subscription = observable$.subscribe({
    next: (val) => {
      container.value = val;
    },
    error: (err) => {
      console.error("[fromObservable] Observable error:", err);
    },
  });

  onDestroy(() => {
    subscription.unsubscribe();
  });

  return container;
}

/**
 * Subscribes to multiple RxJS observables and merges their latest values into
 * a single reactive object. Useful for components that need to observe several
 * streams simultaneously.
 *
 * @param observables A record mapping property names to their observables.
 * @param initialValues Initial values for each property.
 * @returns A reactive object whose properties update independently.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   import { fromObservables } from "@core/utils/svelte-rxjs.ts";
 *   import { simulationState$, celestialObjects$ } from "@teskooano/core-state";
 *
 *   const state = fromObservables(
 *     { sim: simulationState$, objects: celestialObjects$ },
 *     { sim: null, objects: {} }
 *   );
 * </script>
 *
 * <p>Paused: {state.value.sim?.paused}</p>
 * ```
 */
export function fromObservables<T extends Record<string, unknown>>(
  observables: { [K in keyof T]: Observable<T[K]> },
  initialValues: T,
): ReactiveObservable<T> {
  let container = $state<{ value: T }>({ value: { ...initialValues } });

  const subscriptions: Subscription[] = [];

  for (const key of Object.keys(observables) as Array<keyof T>) {
    const sub = observables[key].subscribe({
      next: (val) => {
        container.value = { ...container.value, [key]: val };
      },
      error: (err) => {
        console.error(`[fromObservables] Error on "${String(key)}":`, err);
      },
    });
    subscriptions.push(sub);
  }

  onDestroy(() => {
    subscriptions.forEach((s) => s.unsubscribe());
  });

  return container;
}
