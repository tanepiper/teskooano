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

export class SystemGenerator {
  private dockviewApi: DockviewApi | null;

  constructor(dockviewApi: DockviewApi | null) {
    this.dockviewApi = dockviewApi;
  }

  private static dispatchSimulationTimeReset() {
    const event = new CustomEvent(CustomEvents.SIMULATION_RESET_TIME);
    window.dispatchEvent(event);
  }

  /**
   * Generates a new solar system based on a seed, updates the state,
   * and handles UI feedback via DockviewApi.
   * @param inputSeed The seed string to use for generation. If empty, a default may be used.
   * @returns Promise<boolean> True if generation and state update succeeded, false otherwise.
   */
  public async generateAndLoadSystem(inputSeed: string): Promise<boolean> {
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
    celestialFactory.clearState({
      resetCamera: false,
      resetTime: true,
      resetSelection: true,
    });
    actions.resetTime();
    SystemGenerator.dispatchSimulationTimeReset();

    try {
      const { systemName, objects$ } =
        await generateSystemObservable(finalSeed);

      if (systemName) {
        console.warn(
          `[SystemGenerator] System Name: ${systemName} (handling not implemented)`,
        );
      }

      let isFirstStar = true;

      const processingPipeline$ = objects$.pipe(
        tap((celestialObject: CelestialObject) => {
          if (celestialObject.type === CelestialType.STAR && isFirstStar) {
            celestialFactory.createSolarSystem(celestialObject);
            isFirstStar = false;
          } else {
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
          dispatchTextureGenerationComplete();
          actions.resetTime();
          SystemGenerator.dispatchSimulationTimeReset();
          window.dispatchEvent(
            new CustomEvent(CustomEvents.SYSTEM_GENERATION_COMPLETE),
          );
        }),
      );

      await lastValueFrom(processingPipeline$, { defaultValue: undefined });
      return true;
    } catch (error) {
      console.error(
        "[SystemGenerator] Overall error in generateAndLoadSystem:",
        error,
      );
      dispatchTextureGenerationComplete();
      window.dispatchEvent(
        new CustomEvent(CustomEvents.SYSTEM_GENERATION_COMPLETE),
      );
      return false;
    }
  }
}

export const handleResetSimulationTime = () => {
  const event = new CustomEvent(CustomEvents.SIMULATION_RESET_TIME);
  window.dispatchEvent(event);
};
