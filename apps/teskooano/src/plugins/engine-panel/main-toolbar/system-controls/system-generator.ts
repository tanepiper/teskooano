import { actions, currentSeed, updateSeed } from "@teskooano/core-state";
import {
  CelestialType,
  CustomEvents,
  type CelestialObject,
} from "@teskooano/data-types";
import { generateSystem as generateSystemObservable } from "@teskooano/procedural-generation";
import { dispatchTextureGenerationComplete } from "@teskooano/systems-celestial";
import { DockviewApi } from "dockview-core";
import { catchError, finalize, lastValueFrom, tap, throwError } from "rxjs";

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
    return false;
  }

  const progressPanelId = "texture-progress-panel";
  let progressPanel = dockviewApi.panels.find((p) => p.id === progressPanelId);

  updateSeed(inputSeed);
  const finalSeed = currentSeed.getValue();
  actions.clearState({
    resetCamera: false,
    resetTime: true,
    resetSelection: true,
  });
  actions.resetTime();
  dispatchSimulationTimeReset();

  progressPanel?.api.close();
  progressPanel = undefined;

  dockviewApi.addPanel({
    id: progressPanelId,
    component: "progress_view",
    title: "Generating System...",
    params: { planetList: [] },
    floating: {
      position: { top: 100, left: 100 },
      width: 400,
      height: 300,
    },
  });
  progressPanel = dockviewApi.panels.find((p) => p.id === progressPanelId);

  try {
    const { systemName, objects$ } = await generateSystemObservable(finalSeed);

    if (systemName) {
      console.warn(
        `[SystemGenerator] System Name: ${systemName} (handling not implemented)`,
      );
    }

    let isFirstStar = true;

    const processingPipeline$ = objects$.pipe(
      tap((celestialObject: CelestialObject) => {
        progressPanel?.api.setTitle(`Processing: ${celestialObject.name}`);

        if (celestialObject.type === CelestialType.STAR && isFirstStar) {
          actions.createSolarSystem(celestialObject);
          isFirstStar = false;
        } else {
          if (
            celestialObject.type === CelestialType.STAR &&
            !celestialObject.parentId
          ) {
            console.warn(
              `[SystemGenerator] Found another root star: ${celestialObject.id}. Using createSolarSystem anyway. Check generator logic.`,
            );
            actions.createSolarSystem(celestialObject);
          } else {
            actions.addCelestial(celestialObject);
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
        let finalPanel = dockviewApi.panels.find(
          (p) => p.id === progressPanelId,
        );
        finalPanel?.api.setTitle("Generation Complete");

        setTimeout(() => {
          const panelToClose = dockviewApi.panels.find(
            (p) => p.id === progressPanelId,
          );
          if (panelToClose) {
            panelToClose.api.close();
          }
        }, 1500);

        dispatchTextureGenerationComplete();
        actions.resetTime();
        dispatchSimulationTimeReset();
      }),
    );

    await lastValueFrom(processingPipeline$, { defaultValue: undefined });
    return true;
  } catch (error) {
    console.error(
      "[SystemGenerator] Overall error in generateAndLoadSystem:",
      error,
    );
    progressPanel = dockviewApi.panels.find((p) => p.id === progressPanelId);
    progressPanel?.api.close();
    dispatchTextureGenerationComplete();
    return false;
  }
}

export const handleResetSimulationTime = () => {
  const event = new CustomEvent(CustomEvents.SIMULATION_RESET_TIME);
  window.dispatchEvent(event);
};
