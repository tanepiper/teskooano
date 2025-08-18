import {
  actions,
  celestialManager,
  seed,
  StateAccessor,
} from "@teskooano/core-state";
import { CelestialType, type CelestialObject } from "@teskooano/data-types";
import { generateSystem as generateSystemObservable } from "@teskooano/procedural-generation";
import { type DockviewApi } from "dockview-core";
import { catchError, finalize, lastValueFrom, tap, throwError } from "rxjs";
import { engineSignalsService } from "../../../../core/controllers/engine/EngineSignals.service";

/**
 * A service dedicated to the complex process of procedurally generating a
 * new star system. It orchestrates the flow from getting a seed to processing
 * the stream of generated celestial objects and updating the application state.
 */
export class SystemGenerator {
  private dockviewApi: DockviewApi | null;

  /**
   * Constructs the SystemGenerator service.
   * @param {DockviewApi | null} dockviewApi - The Dockview API instance, used
   * for dispatching global UI events (though currently marked for refactoring).
   */
  constructor(dockviewApi: DockviewApi | null) {
    this.dockviewApi = dockviewApi;
  }

  /**
   * Dispatches a global signal to reset simulation time.
   * @private
   */
  private static dispatchSimulationTimeReset() {
    engineSignalsService.simulationResetTime$.next();
  }

  /**
   * Generates a new solar system based on a seed, updates the state,
   * and handles the overall generation pipeline. This is the primary
   * entry point for creating a new system.
   *
   * The process involves:
   * 1. Emitting systemGenerationStart$.
   * 2. Clearing the current state.
   * 3. Calling the procedural generation library (`@teskooano/procedural-generation`).
   * 4. Processing the resulting stream of `CelestialObject`s, adding them to the state.
   * 5. Finalizing the process by emitting systemGenerationComplete$ and other cleanup signals.
   *
   * @param {string} inputSeed - The seed string to use for generation.
   * @returns {Promise<boolean>} A promise that resolves to `true` if generation
   * and state update succeeded, or `false` otherwise.
   */
  public async generateAndLoadSystem(inputSeed: string): Promise<boolean> {
    // This check for dockviewApi is noted as a candidate for refactoring.
    // The generator service should ideally not be aware of UI-specific APIs.
    if (!this.dockviewApi) {
      console.error("Dockview API not provided to generateAndLoadSystem!");
      engineSignalsService.systemGenerationStart$.next();
      engineSignalsService.systemGenerationComplete$.next();
      return false;
    }

    engineSignalsService.systemGenerationStart$.next();

    seed.updateSeed(inputSeed);
    const finalSeed = StateAccessor.getCurrentSeed();

    // Reset the application state before generating a new system.
    celestialManager.clearState({
      resetCamera: false,
      resetTime: true,
      resetSelection: true,
    });
    actions.resetTime();
    SystemGenerator.dispatchSimulationTimeReset();

    try {
      // Invoke the core procedural generation function.
      const { objects$ } = await generateSystemObservable(finalSeed);

      let isSystemInitialized = false;

      // Create an RxJS pipeline to process the stream of generated objects.
      const processingPipeline$ = objects$.pipe(
        tap(async (celestialObject: CelestialObject) => {
          const creationInput = {
            ...celestialObject,
            atmosphere: celestialObject.atmosphere as any,
          };

          // Handle stars properly using createSolarSystem
          if (celestialObject.type === CelestialType.STAR) {
            if (!isSystemInitialized) {
              // First star: initialize the system and clear state
              celestialManager.createSolarSystem(creationInput);
              isSystemInitialized = true;
            } else {
              // Subsequent stars: don't clear state, just add to existing system
              celestialManager.createSolarSystem(creationInput, false);
            }
          } else {
            // All other objects (planets, moons, etc.) use addCelestial
            celestialManager.addCelestial(creationInput);
          }

          // Note: Renderable objects are automatically created by the renderer system
          // when celestial objects are added to the state via celestialManager
        }),
        catchError((error) => {
          console.error(
            "[SystemGenerator] Error during object processing stream:",
            error,
          );
          return throwError(() => error);
        }),
        finalize(() => {
          actions.resetTime();
          SystemGenerator.dispatchSimulationTimeReset();
          engineSignalsService.systemGenerationComplete$.next();
        }),
      );

      // Wait for the entire pipeline to complete.
      await lastValueFrom(processingPipeline$, { defaultValue: undefined });
      return true;
    } catch (error) {
      console.error(
        "[SystemGenerator] Overall error in generateAndLoadSystem:",
        error,
      );
      engineSignalsService.systemGenerationComplete$.next();
      return false;
    }
  }
}