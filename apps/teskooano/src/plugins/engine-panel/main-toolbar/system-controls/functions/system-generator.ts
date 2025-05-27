import {
  actions,
  celestialFactory,
  getCurrentSeed,
  updateSeed,
  simulationStateService,
} from "@teskooano/core-state";
import {
  CelestialType,
  CustomEvents,
  type CelestialObject,
} from "@teskooano/data-types";
import { generateSystem as generateSystemObservable } from "@teskooano/procedural-generation";
import { dispatchTextureGenerationComplete } from "@teskooano/systems-celestial";
import { DockviewApi } from "dockview-core";
import { catchError, finalize, lastValueFrom, tap, throwError } from "rxjs";
import { showGeneratedSystemModal } from "../modals/modal-system-generator";

export function dispatchSimulationTimeReset() {
  const event = new CustomEvent(CustomEvents.SIMULATION_RESET_TIME);
  window.dispatchEvent(event);
}

/**
 * Generates a new solar system based on a seed, updates the state,
 * and handles UI feedback via DockviewApi.
 * @param inputSeed The seed string to use for generation. If empty, a default may be used.
 * @param dockviewApi The Dockview API instance for managing panels (e.g., progress).
 * @returns Promise<boolean> True if generation and state update succeeded, false otherwise.
 */
export async function generateAndLoadSystem(
  inputSeed: string,
  dockviewApi: DockviewApi | null,
): Promise<boolean> {
  if (!dockviewApi) {
    console.error("Dockview API not provided to generateAndLoadSystem!");
    // Still dispatch events even if dockviewApi is null for some reason,
    // as other parts of the system might listen.
    window.dispatchEvent(new CustomEvent(CustomEvents.SYSTEM_GENERATION_START));
    window.dispatchEvent(
      new CustomEvent(CustomEvents.SYSTEM_GENERATION_COMPLETE),
    );
    return false;
  }

  // Dispatch system generation start event
  window.dispatchEvent(new CustomEvent(CustomEvents.SYSTEM_GENERATION_START));

  updateSeed(inputSeed);
  const finalSeed = getCurrentSeed();
  celestialFactory.clearState({
    resetCamera: false,
    resetTime: true,
    resetSelection: true,
  });
  actions.resetTime();
  dispatchSimulationTimeReset();

  try {
    const { objects$ } = await generateSystemObservable(finalSeed);

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
        dispatchSimulationTimeReset();

        // Always set physics engine to verlet (advanced) for all newly generated systems
        simulationStateService.setPhysicsEngine("verlet");

        // Dispatch system generation complete event
        window.dispatchEvent(
          new CustomEvent(CustomEvents.SYSTEM_GENERATION_COMPLETE),
        );

        // Show the system information modal with seed
        showGeneratedSystemModal(finalSeed);
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
    // Dispatch system generation complete event even on error
    window.dispatchEvent(
      new CustomEvent(CustomEvents.SYSTEM_GENERATION_COMPLETE),
    );
    return false;
  }
}

export const handleResetSimulationTime = () => {
  const event = new CustomEvent(CustomEvents.SIMULATION_RESET_TIME);
  window.dispatchEvent(event);
};
