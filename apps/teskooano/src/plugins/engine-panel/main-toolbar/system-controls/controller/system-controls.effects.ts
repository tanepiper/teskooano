import { from, of, Observable, BehaviorSubject } from "rxjs";
import {
  catchError,
  filter,
  map,
  switchMap,
  tap,
  withLatestFrom,
} from "rxjs/operators";
import type { PluginExecutionContext } from "@teskooano/ui-plugin";
import type { CelestialObject } from "@teskooano/data-types";

/** Represents the type for the value emitted by celestialObjects$ */
export type CelestialObjectMap = Record<string, CelestialObject>;
/** Represents the type for the value emitted by currentSeed$ */
export type Seed = string | null;

/**
 * Defines the standardized result object for all system action effects.
 * This ensures a consistent data structure for handling feedback in the UI.
 */
export interface SystemActionEffectResult {
  /** The status of the operation. */
  status: "success" | "error";
  /** The symbol (e.g., emoji) to display as feedback. */
  symbol: string;
  /** An optional message providing more details about the result. */
  message?: string;
  /** The HTML element that triggered the action. */
  triggerElement: HTMLElement;
  /** For actions that might return a seed (like generation). */
  seed?: string;
}

/**
 * A class that encapsulates all the side effect pipelines for the SystemControls component.
 * Each method is an RxJS operator that takes an Observable of trigger events
 * and returns an Observable of `SystemActionEffectResult`. These pipelines
 * handle interactions with the plugin system, manage loading states, and
 * format the results for the UI.
 */
export class SystemControlsEffects {
  /** @internal Subject that tracks the loading state. */
  private isGenerating$$: BehaviorSubject<boolean>;
  /** @internal Reference to the seed input element in the view. */
  private seedInputElement: HTMLInputElement | null;
  /** @internal The execution context for interacting with the plugin system. */
  private context: PluginExecutionContext;

  /**
   * Constructs the effects manager.
   * @param {BehaviorSubject<boolean>} isGenerating$$ - A subject to update with the loading state.
   * @param {HTMLInputElement | null} seedInputElement - The seed input element from the view.
   * @param {PluginExecutionContext} context - The plugin execution context.
   */
  constructor(
    isGenerating$$: BehaviorSubject<boolean>,
    seedInputElement: HTMLInputElement | null,
    context: PluginExecutionContext,
  ) {
    this.isGenerating$$ = isGenerating$$;
    this.seedInputElement = seedInputElement;
    this.context = context;
  }

  /**
   * A higher-order function that creates a standardized effect pipeline for simple plugin commands.
   * It encapsulates the common logic of:
   * 1. Filtering events if an operation is already in progress.
   * 2. Setting the loading state to true.
   * 3. Executing a plugin function.
   * 4. Mapping the success/error result to a `SystemActionEffectResult`.
   *
   * @param {string} pluginName - The ID of the plugin function to execute.
   * @param {string} successSymbol - The symbol to show on success.
   * @param {object} [options] - Optional customizations for the pipeline.
   * @param {function} [options.customCatch] - A custom error handler.
   * @returns An RxJS operator function for use with `.pipe()`.
   * @private
   */
  private createStandardEffect(
    pluginName: string,
    successSymbol: string,
    options: {
      customCatch?: (
        err: any,
        element: HTMLElement,
      ) => Observable<SystemActionEffectResult>;
    } = {},
  ) {
    return (
      trigger$: Observable<HTMLElement>,
    ): Observable<SystemActionEffectResult> =>
      trigger$.pipe(
        filter(() => !this.isGenerating$$.value),
        tap(() => this.isGenerating$$.next(true)),
        switchMap((element) =>
          from(this.context.pluginManager.execute(pluginName)).pipe(
            map(
              (result: any): SystemActionEffectResult => ({
                status: result?.success ? "success" : "error",
                symbol:
                  result?.symbol || (result?.success ? successSymbol : "❌"),
                message: result?.message,
                triggerElement: element,
              }),
            ),
            catchError((err) => {
              if (options.customCatch) {
                return options.customCatch(err, element);
              }
              console.error(`${pluginName} error:`, err);
              return of<SystemActionEffectResult>({
                status: "error",
                symbol: "❌",
                message: err.message || `${pluginName} failed`,
                triggerElement: element,
              });
            }),
          ),
        ),
      );
  }

  /**
   * Effect pipeline for generating a new system, either from a specific seed
   * or a random one.
   * @param {Observable<{ seed: string; element: HTMLElement }>} trigger$ - The stream of trigger events.
   * @returns {Observable<SystemActionEffectResult>} A stream of action results.
   */
  public generateSystemEffect$(
    trigger$: Observable<{ seed: string; element: HTMLElement }>,
  ): Observable<SystemActionEffectResult> {
    return trigger$.pipe(
      filter(() => !this.isGenerating$$.value),
      tap(() => this.isGenerating$$.next(true)),
      switchMap(({ seed: inputSeed, element }) =>
        from(
          this.context.pluginManager.execute("system:generate_random", {
            seed: inputSeed,
          }),
        ).pipe(
          map((result: any): SystemActionEffectResult => {
            const success = result?.success === true;
            if (
              success &&
              result?.seed &&
              this.seedInputElement &&
              result.seed !== inputSeed
            ) {
              this.seedInputElement.value = result.seed;
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

  /** Effect pipeline for clearing the current system. */
  public clearSystemEffect$ = this.createStandardEffect("system:clear", "🗑️");

  /** Effect pipeline for exporting the current system to a file. */
  public exportSystemEffect$ = this.createStandardEffect("system:export", "💾");

  /** Effect pipeline for triggering the file import dialog. */
  public importSystemEffect$ = this.createStandardEffect(
    "system:trigger_import_dialog",
    "✅",
    {
      customCatch: (err, element) => {
        const message = err instanceof Error ? err.message : String(err);
        if (message === "File selection cancelled.") {
          return of<SystemActionEffectResult>({
            status: "success", // Consider this a success in terms of flow
            symbol: "🤷",
            message: message,
            triggerElement: element,
          });
        }
        console.error("Import error:", err);
        return of<SystemActionEffectResult>({
          status: "error",
          symbol: "❌",
          message: message || "Import failed",
          triggerElement: element,
        });
      },
    },
  );

  /**
   * Effect pipeline for copying the current system seed to the clipboard.
   * @param {Observable<HTMLElement>} trigger$ - The stream of trigger events (e.g., button clicks).
   * @param {Observable<Seed>} currentSeed$ - An observable of the current system seed.
   * @returns {Observable<SystemActionEffectResult>} A stream of action results.
   */
  public copySeedEffect$(
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
        return from(
          this.context.pluginManager.execute("system:copy_seed", nonNullSeed),
        ).pipe(
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

  /** Effect pipeline for creating a new, blank system. */
  public createBlankSystemEffect$ = this.createStandardEffect(
    "system:create_blank",
    "📄",
  );
}
