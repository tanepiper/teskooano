import {
  actions,
  celestialFactory,
  getCurrentSeed,
  updateSeed,
} from "@teskooano/core-state";
import {
  CelestialType,
  CustomEvents,
  type CelestialObject,
} from "@teskooano/data-types";
import { generateSystem as generateSystemObservable } from "@teskooano/procedural-generation";
import { dispatchTextureGenerationComplete } from "@teskooano/systems-celestial";
import { type DockviewApi } from "dockview-core";
import { catchError, finalize, lastValueFrom, tap, throwError } from "rxjs";

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
   * Dispatches a global event to signal that the simulation's timer should be reset.
   * @private
   */
  private static dispatchSimulationTimeReset() {
    const event = new CustomEvent(CustomEvents.SIMULATION_RESET_TIME);
    window.dispatchEvent(event);
  }

  /**
   * Generates a new solar system based on a seed, updates the state,
   * and handles the overall generation pipeline. This is the primary
   * entry point for creating a new system.
   *
   * The process involves:
   * 1. Dispatching a `SYSTEM_GENERATION_START` event.
   * 2. Clearing the current state.
   * 3. Calling the procedural generation library (`@teskooano/procedural-generation`).
   * 4. Processing the resulting stream of `CelestialObject`s, adding them to the state.
   * 5. Finalizing the process by dispatching `SYSTEM_GENERATION_COMPLETE` and other cleanup events.
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
      window.dispatchEvent(
        new CustomEvent(CustomEvents.SYSTEM_GENERATION_START),
      );
      window.dispatchEvent(
        new CustomEvent(CustomEvents.SYSTEM_GENERATION_COMPLETE),
      );
      return false;
    }

    window.dispatchEvent(new CustomEvent(CustomEvents.SYSTEM_GENERATION_START));

    updateSeed(inputSeed);
    const finalSeed = getCurrentSeed();

    // Reset the application state before generating a new system.
    celestialFactory.clearState({
      resetCamera: false,
      resetTime: true,
      resetSelection: true,
    });
    actions.resetTime();
    SystemGenerator.dispatchSimulationTimeReset();

    try {
      // Invoke the core procedural generation function.
      const { systemName, objects$ } =
        await generateSystemObservable(finalSeed);

      if (systemName) {
        console.warn(
          `[SystemGenerator] System Name: ${systemName} (handling not implemented)`,
        );
      }

      let isFirstStar = true;

      // Create an RxJS pipeline to process the stream of generated objects.
      const processingPipeline$ = objects$.pipe(
        tap((celestialObject: CelestialObject) => {
          // The first star object establishes the solar system.
          if (celestialObject.type === CelestialType.STAR && isFirstStar) {
            celestialFactory.createSolarSystem(celestialObject);
            isFirstStar = false;
          } else {
            // Subsequent objects are added to the existing system.
            if (
              celestialObject.type === CelestialType.STAR &&
              !celestialObject.parentId
            ) {
              console.warn(
                `[SystemGenerator] Found another root star: ${celestialObject.id}. Using createSolarSystem anyway. Check generator logic.`,
              );
              celestialFactory.createSolarSystem(celestialObject);
            } else {
              celestialFactory.addCelestial(celestialObject);
            }
          }
        }),
        catchError((error) => {
          console.error(
            "[SystemGenerator] Error during object processing stream:",
            error,
          );
          return throwError(() => error);
        }),
        finalize(() => {
          // Once the stream completes, dispatch final events for cleanup and UI updates.
          dispatchTextureGenerationComplete();
          actions.resetTime();
          SystemGenerator.dispatchSimulationTimeReset();
          window.dispatchEvent(
            new CustomEvent(CustomEvents.SYSTEM_GENERATION_COMPLETE),
          );
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
      // Ensure cleanup happens even if the initial generation call fails.
      dispatchTextureGenerationComplete();
      window.dispatchEvent(
        new CustomEvent(CustomEvents.SYSTEM_GENERATION_COMPLETE),
      );
      return false;
    }
  }
}

/**
 * A utility function to dispatch the `SIMULATION_RESET_TIME` event.
 * @deprecated This is a candidate for removal in favor of more direct state management.
 */
export const handleResetSimulationTime = () => {
  const event = new CustomEvent(CustomEvents.SIMULATION_RESET_TIME);
  window.dispatchEvent(event);
};
