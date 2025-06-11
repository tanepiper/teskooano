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
import type { CelestialObject } from "@teskooano/data-types"; // Assuming CelestialObject is here

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
 * A class that encapsulates all the side effects for the SystemControls component.
 * This includes generating, clearing, exporting, importing, and managing system state
 * through RxJS-based effect pipelines.
 */
export class SystemControlsEffects {
  private isGenerating$$: BehaviorSubject<boolean>;
  private seedInputElement: HTMLInputElement | null;
  private context: PluginExecutionContext;

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
   * Creates a standardized effect pipeline for simple plugin commands.
   * It handles loading state, plugin execution, and default result/error mapping.
   * @param pluginName - The name of the plugin function to execute.
   * @param successSymbol - The symbol to show on success.
   * @param options - Optional customizations for mapping and error handling.
   * @returns An RxJS operator function.
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
   * Effect for generating a new system (randomly or from seed).
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

  /** Effect for clearing the current system. */
  public clearSystemEffect$ = this.createStandardEffect("system:clear", "🗑️");

  /** Effect for exporting the current system. */
  public exportSystemEffect$ = this.createStandardEffect("system:export", "💾");

  /** Effect for importing a system. */
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
   * Effect for copying the current system seed.
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

  /** Effect for creating a blank system. */
  public createBlankSystemEffect$ = this.createStandardEffect(
    "system:create_blank",
    "📄",
  );
}
