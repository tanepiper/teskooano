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
} from "rxjs"; // Import RxJS operators

// Define the custom event for resetting simulation accumulated time
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
    // Initial synchronous setup
    updateSeed(inputSeed);
    const finalSeed = currentSeed.getValue();
    actions.clearState({
      resetCamera: false,
      resetTime: true,
      resetSelection: true,
    });
    actions.resetTime();
    dispatchSimulationTimeReset();

    // Close existing panel if found
    progressPanel?.api.close();
    progressPanel = undefined; // Reset reference

    // Return an observable that starts the async generation
    return from(generateSystem(finalSeed)); // Convert promise to observable
  }).pipe(
    tap((systemResult) => {
      // Side effect: Prepare and show progress panel *after* generation data is ready
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
      // Update panel reference after adding
      progressPanel = dockviewApi.panels.find((p) => p.id === progressPanelId);
    }),
    switchMap((systemResult) => {
      // Process the generated system data
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
        // If no objects, we still consider it a "successful" generation (of nothing)
        // but return an empty array to skip state updates.
        return of({ success: true, data: [] });
      }

      // Find the primary star
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
        // Create the system with the primary star first
        actions.createSolarSystem(primaryStar);

        // Add all *other* objects
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
        // Fallback if no primary star found
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

      // Reset time again after adding objects
      actions.resetTime();
      dispatchSimulationTimeReset();

      // Signal success for the stream
      return of({ success: true, data: systemData });
    }),
    tap(() => {
      // Side effect after successful processing or empty generation
      dispatchTextureGenerationComplete();
    }),
    map((result) => result.success), // Map to boolean indicating success
    catchError((error) => {
      console.error(
        "[SystemGenerator] Error during system generation or state update:",
        error,
      );
      // Dispatch completion event even on error
      dispatchTextureGenerationComplete();
      // Return an observable indicating failure
      return of(false);
    }),
    finalize(() => {
      // Always try to close the progress panel, regardless of success/error
      progressPanel = dockviewApi.panels.find((p) => p.id === progressPanelId); // Re-find panel just in case
      progressPanel?.api.close();
      console.log("[SystemGenerator] Generation stream finalized.");
    }),
  );

  // Execute the observable stream and return the resulting promise
  return lastValueFrom(generation$);
}

export const handleResetSimulationTime = () => {
  // dispatch event to reset simulation time
  const event = new CustomEvent(CustomEvents.SIMULATION_RESET_TIME);
  window.dispatchEvent(event);
};
