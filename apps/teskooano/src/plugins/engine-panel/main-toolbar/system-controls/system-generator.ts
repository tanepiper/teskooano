import { actions, currentSeed, updateSeed } from "@teskooano/core-state";
import {
  CelestialType,
  CustomEvents,
  StarProperties,
  type CelestialObject,
} from "@teskooano/data-types";
import { generateSystem } from "@teskooano/procedural-generation";
import { dispatchTextureGenerationComplete } from "@teskooano/systems-celestial";
import { DockviewApi } from "dockview-core";
import {
  defer,
  tap,
  switchMap,
  catchError,
  finalize,
  of,
  lastValueFrom,
  map,
  from,
} from "rxjs";

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

  const generation$ = defer(() => {
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

    return from(generateSystem(finalSeed));
  }).pipe(
    tap((systemResult) => {
      const planetList = (systemResult?.objects || [])
        .filter(
          (obj) =>
            obj.type === CelestialType.PLANET ||
            obj.type === CelestialType.GAS_GIANT,
        )
        .map((planet) => ({ id: planet.id, name: planet.name }));

      dockviewApi.addPanel({
        id: progressPanelId,
        component: "progress_view",
        title: "Generating Textures...",
        params: { planetList: planetList },
        floating: {
          position: { top: 100, left: 100 },
          width: 400,
          height: 300,
        },
      });

      progressPanel = dockviewApi.panels.find((p) => p.id === progressPanelId);
    }),
    switchMap((systemResult) => {
      const { systemName, objects: systemData } = systemResult || {
        systemName: null,
        objects: [],
      };

      if (systemName) {
        console.warn(
          `[SystemGenerator] TODO: Need to implement setting system name "${systemName}" in core-state.`,
        );
      }

      if (!systemData || systemData.length === 0) {
        console.warn("[SystemGenerator] Generator returned no objects.");

        return of({ success: true, data: [] });
      }

      let primaryStar = systemData.find((obj) => {
        if (obj.type !== CelestialType.STAR) return false;
        const props = obj.properties as StarProperties;
        return props?.isMainStar === true;
      });

      if (!primaryStar) {
        console.warn(
          "[SystemGenerator] No star with isMainStar=true found. Falling back to first star.",
        );
        primaryStar = systemData.find(
          (obj) =>
            obj.type === CelestialType.STAR || obj.id.startsWith("star-"),
        );
      }

      if (primaryStar) {
        actions.createSolarSystem(primaryStar);

        systemData.forEach((objData) => {
          if (objData.id !== primaryStar!.id) {
            if (objData.type === CelestialType.STAR && !objData.parentId) {
              console.warn(
                `[SystemGenerator] Found another root star: ${objData.id}. Using createSolarSystem.`,
              );
              actions.createSolarSystem(objData);
            } else {
              actions.addCelestial(objData);
            }
          }
        });
      } else {
        console.error(
          "[SystemGenerator] No primary star found! Adding stars with createSolarSystem and others with addCelestial.",
        );
        systemData
          .filter((obj) => obj.type === CelestialType.STAR && !obj.parentId)
          .forEach((star) => actions.createSolarSystem(star));
        systemData
          .filter((obj) => !(obj.type === CelestialType.STAR && !obj.parentId))
          .forEach((objData) => actions.addCelestial(objData));
      }

      actions.resetTime();
      dispatchSimulationTimeReset();

      return of({ success: true, data: systemData });
    }),
    tap(() => {
      dispatchTextureGenerationComplete();
    }),
    map((result) => result.success),
    catchError((error) => {
      console.error(
        "[SystemGenerator] Error during system generation or state update:",
        error,
      );

      dispatchTextureGenerationComplete();

      return of(false);
    }),
    finalize(() => {
      progressPanel = dockviewApi.panels.find((p) => p.id === progressPanelId);
      progressPanel?.api.close();
      console.log("[SystemGenerator] Generation stream finalized.");
    }),
  );

  return lastValueFrom(generation$);
}

export const handleResetSimulationTime = () => {
  const event = new CustomEvent(CustomEvents.SIMULATION_RESET_TIME);
  window.dispatchEvent(event);
};
