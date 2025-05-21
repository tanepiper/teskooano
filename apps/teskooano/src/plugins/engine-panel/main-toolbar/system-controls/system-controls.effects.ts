import { from, of, Observable, BehaviorSubject } from "rxjs";
import {
  catchError,
  filter,
  map,
  switchMap,
  tap,
  withLatestFrom,
} from "rxjs/operators";
import { pluginManager } from "@teskooano/ui-plugin";
import type { CelestialObject } from "@teskooano/data-types"; // Assuming CelestialObject is here
import { initializeSolarSystem } from "@teskooano/app-simulation";
import { updateSeed, celestialFactory } from "@teskooano/core-state";

// Representing the type for the value emitted by celestialObjects$
export type CelestialObjectMap = Record<string, CelestialObject>;
// Representing the type for the value emitted by currentSeed
export type Seed = string | null;

export interface SystemActionEffectResult {
  status: "success" | "error";
  symbol: string;
  message?: string;
  triggerElement: HTMLElement;
  seed?: string; // For actions that might return a seed (like generation)
}

/**
 * Effect for generating a new system (randomly or from seed).
 */
export function generateSystemEffect$(
  trigger$: Observable<{ seed: string; element: HTMLElement }>, // from createSeedSubmitStream$ or createRandomSeedStream$
  isGenerating$$: BehaviorSubject<boolean>,
  seedInputElement: HTMLInputElement | null, // To potentially update its value
): Observable<SystemActionEffectResult> {
  return trigger$.pipe(
    filter(() => !isGenerating$$.value),
    tap(() => isGenerating$$.next(true)),
    switchMap(({ seed: inputSeed, element }) =>
      from(
        pluginManager.execute("system:generate_random", { seed: inputSeed }),
      ).pipe(
        map((result: any): SystemActionEffectResult => {
          const success = result?.success === true;
          if (
            success &&
            result?.seed &&
            seedInputElement &&
            result.seed !== inputSeed
          ) {
            seedInputElement.value = result.seed;
          }
          return {
            status: success ? "success" : "error",
            symbol: result?.symbol || (success ? "✨" : "❌"),
            message: result?.message,
            triggerElement: element,
            seed: result?.seed,
          };
        }),
        catchError((err) => {
          console.error("Generation error:", err);
          return of<SystemActionEffectResult>({
            status: "error",
            symbol: "❌",
            message: err.message || "Generation failed",
            triggerElement: element,
          });
        }),
      ),
    ),
  );
}

/**
 * Effect for clearing the current system.
 */
export function clearSystemEffect$(
  trigger$: Observable<HTMLElement>,
  isGenerating$$: BehaviorSubject<boolean>,
): Observable<SystemActionEffectResult> {
  return trigger$.pipe(
    filter(() => !isGenerating$$.value),
    tap(() => isGenerating$$.next(true)),
    switchMap((element) =>
      from(pluginManager.execute("system:clear")).pipe(
        map(
          (result: any): SystemActionEffectResult => ({
            status: result.success ? "success" : "error",
            symbol: result.symbol || (result.success ? "🗑️" : "❌"),
            message: result.message,
            triggerElement: element,
          }),
        ),
        catchError((err) => {
          console.error("Clear error:", err);
          return of<SystemActionEffectResult>({
            status: "error",
            symbol: "❌",
            message: err.message || "Clear failed",
            triggerElement: element,
          });
        }),
      ),
    ),
  );
}

/**
 * Effect for exporting the current system.
 */
export function exportSystemEffect$(
  trigger$: Observable<HTMLElement>,
  isGenerating$$: BehaviorSubject<boolean>,
): Observable<SystemActionEffectResult> {
  return trigger$.pipe(
    filter(() => !isGenerating$$.value),
    tap(() => isGenerating$$.next(true)),
    switchMap((element) => {
      return from(pluginManager.execute("system:export")).pipe(
        map(
          (result: any): SystemActionEffectResult => ({
            status: result.success ? "success" : "error",
            symbol: result.symbol || (result.success ? "💾" : "❌"),
            message: result.message,
            triggerElement: element,
          }),
        ),
        catchError((err) => {
          console.error("Export error:", err);
          return of<SystemActionEffectResult>({
            status: "error",
            symbol: "❌",
            message: err.message || "Export failed",
            triggerElement: element,
          });
        }),
      );
    }),
  );
}

/**
 * Effect for importing a system.
 */
export function importSystemEffect$(
  trigger$: Observable<HTMLElement>,
  isGenerating$$: BehaviorSubject<boolean>,
): Observable<SystemActionEffectResult> {
  return trigger$.pipe(
    filter(() => !isGenerating$$.value),
    tap(() => isGenerating$$.next(true)),
    switchMap((element) =>
      from(pluginManager.execute("system:trigger_import_dialog")).pipe(
        map(
          (result: any): SystemActionEffectResult => ({
            status: result?.success ? "success" : "error",
            symbol: result?.symbol || (result?.success ? "✅" : "❌"),
            message: result?.message,
            triggerElement: element,
          }),
        ),
        catchError((err) => {
          console.error("Import error:", err);
          const message = err instanceof Error ? err.message : String(err);
          if (message === "File selection cancelled.") {
            return of<SystemActionEffectResult>({
              status: "success", // Consider this a success in terms of flow
              symbol: "🤷",
              message: message,
              triggerElement: element,
            });
          }
          return of<SystemActionEffectResult>({
            status: "error",
            symbol: "❌",
            message: message || "Import failed",
            triggerElement: element,
          });
        }),
      ),
    ),
  );
}

/**
 * Effect for copying the current system seed.
 */
export function copySeedEffect$(
  trigger$: Observable<HTMLElement>,
  currentSeed$: Observable<Seed>,
): Observable<SystemActionEffectResult> {
  return trigger$.pipe(
    withLatestFrom(currentSeed$),
    switchMap(([element, seedValue]) => {
      if (seedValue === null) {
        return of<SystemActionEffectResult>({
          status: "error",
          symbol: "🤷",
          message: "No seed to copy",
          triggerElement: element,
        });
      }
      const nonNullSeed: string = seedValue;
      return from(pluginManager.execute("system:copy_seed", nonNullSeed)).pipe(
        map(
          (result: any): SystemActionEffectResult => ({
            status: result?.success ? "success" : "error",
            symbol: result?.symbol || (result?.success ? "📋" : "❌"),
            message: result?.message,
            triggerElement: element,
          }),
        ),
        catchError((err) => {
          console.error("Copy seed error:", err);
          return of<SystemActionEffectResult>({
            status: "error",
            symbol: "❌",
            message: err.message || "Copy failed",
            triggerElement: element,
          });
        }),
      );
    }),
  );
}

/**
 * Effect for creating a blank system.
 */
export function createBlankSystemEffect$(
  trigger$: Observable<HTMLElement>,
  isGenerating$$: BehaviorSubject<boolean>,
): Observable<SystemActionEffectResult> {
  return trigger$.pipe(
    filter(() => !isGenerating$$.value),
    tap(() => isGenerating$$.next(true)),
    switchMap((element) =>
      from(pluginManager.execute("system:create_blank")).pipe(
        map(
          (result: any): SystemActionEffectResult => ({
            status: result?.success ? "success" : "error",
            symbol: result?.symbol || (result?.success ? "📄" : "❌"),
            message: result?.message,
            triggerElement: element,
          }),
        ),
        catchError((err) => {
          console.error("Create blank system error:", err);
          return of<SystemActionEffectResult>({
            status: "error",
            symbol: "❌",
            message: err.message || "Create blank failed",
            triggerElement: element,
          });
        }),
      ),
    ),
  );
}

/**
 * Effect for loading the Home System (Solar System).
 */
export function loadHomeSystemEffect$(
  trigger$: Observable<HTMLElement>,
  isGenerating$$: BehaviorSubject<boolean>,
): Observable<SystemActionEffectResult> {
  return trigger$.pipe(
    filter(() => !isGenerating$$.value),
    tap(() => isGenerating$$.next(true)),
    switchMap((element) => {
      try {
        // Clear existing objects using celestialFactory.
        celestialFactory.clearState({
          resetCamera: false, // Keep camera as is
          resetTime: true, // Reset simulation time
          resetSelection: true, // Clear any selected/focused objects
        });

        // Initialize the Solar System.
        // This function still needs to be refactored to properly update core state
        // (celestialObjects$ and currentSeed$) via `addCelestialObject` and `updateSeed` from core-state,
        // potentially through celestialFactory or celestialActions.
        initializeSolarSystem();

        // Manually set a seed. Ideally, initializeSolarSystem would handle this.
        updateSeed("SOLARSYSTEM");

        // After refactoring initializeSolarSystem, it should populate celestialObjects$
        // and the count would be reflected automatically by SystemControls.ts via its subscription.

        return of<SystemActionEffectResult>({
          status: "success",
          symbol: "🏡",
          message: "Solar System loaded",
          triggerElement: element,
          seed: "SOLARSYSTEM",
        });
      } catch (err: any) {
        console.error("Load Home System error:", err);
        // Ensure isGenerating is set to false in the catch block as well
        isGenerating$$.next(false);
        return of<SystemActionEffectResult>({
          status: "error",
          symbol: "❌",
          message: err.message || "Failed to load Solar System",
          triggerElement: element,
        });
      } finally {
        // This finally block might run before the observable from `of(...)` emits
        // if initializeSolarSystem is synchronous.
        // Setting to false here ensures it's reset if the above try/catch completes synchronously.
        // If initializeSolarSystem becomes async, this needs careful review.
        if (isGenerating$$.value) {
          // Only set if still true
          isGenerating$$.next(false);
        }
      }
    }),
    catchError((err, caught) => {
      const element =
        (err as any).triggerElement || document.createElement("div");
      console.error("Stream error in loadHomeSystemEffect:", err);
      isGenerating$$.next(false);
      return of<SystemActionEffectResult>({
        status: "error",
        symbol: "❌",
        message: (err as Error).message || "Stream error",
        triggerElement: element,
      });
    }),
  );
}
