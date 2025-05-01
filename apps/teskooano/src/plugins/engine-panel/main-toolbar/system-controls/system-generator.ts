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

  // Update seed store
  updateSeed(inputSeed);
  const finalSeed = currentSeed.getValue();

  // Clear state
  actions.clearState({
    resetCamera: false,
    resetTime: true,
    resetSelection: true,
  });
  actions.resetTime();
  dispatchSimulationTimeReset();

  // --- Show Progress Panel ---
  const progressPanelId = "texture-progress-panel";
  let progressPanel = dockviewApi.panels.find((p) => p.id === progressPanelId);
  // Close existing panel first if found
  progressPanel?.api.close();

  // Generate the system data (including name)
  let systemData: CelestialObject[] = [];
  let systemName: string | null = null;
  let planetList: { id: string; name: string }[] = [];
  let success = false;

  try {
    // Destructure the result from generateSystem
    const { systemName: generatedName, objects: generatedObjects } =
      await generateSystem(finalSeed);
    systemName = generatedName; // Store the name
    systemData = generatedObjects; // Store the objects

    console.warn(
      `[SystemGenerator] TODO: Need to implement setting system name "${systemName}" in core-state.`,
    );
    // --- End Update System Name ---

    planetList = systemData
      .filter(
        (obj) =>
          obj.type === CelestialType.PLANET ||
          obj.type === CelestialType.GAS_GIANT,
      )
      .map((planet) => ({ id: planet.id, name: planet.name }));

    // Add the progress panel *after* generating data but *before* adding to state
    dockviewApi.addPanel({
      id: progressPanelId,
      component: "progress_view",
      title: "Generating Textures...",
      params: { planetList: planetList },
      floating: {
        position: { top: 100, left: 100 }, // TODO: Maybe center this later?
        width: 400,
        height: 300,
      },
    });

    // Add objects to the state store
    if (systemData && systemData.length > 0) {
      // Find the primary star first
      let primaryStar = systemData.find((obj) => {
        if (obj.type !== CelestialType.STAR) return false;
        const props = obj.properties as StarProperties;
        return props?.isMainStar === true;
      });

      // Fallback to any star if no isMainStar flag is found
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
          if (objData.id !== primaryStar.id) {
            // Check if this is another primary star (should use createSolarSystem)
            if (objData.type === CelestialType.STAR && !objData.parentId) {
              console.warn(
                `[SystemGenerator] Found another root star: ${objData.id}. Using createSolarSystem.`,
              );
              actions.createSolarSystem(objData);
            } else {
              // Add other objects normally
              actions.addCelestial(objData);
            }
          }
        });
      } else {
        // Fallback if no primary star found
        console.error(
          "[SystemGenerator] No primary star found! Adding stars with createSolarSystem and others with addCelestial.",
        );
        // Add stars first
        systemData
          .filter((obj) => obj.type === CelestialType.STAR && !obj.parentId)
          .forEach((star) => {
            actions.createSolarSystem(star);
          });
        // Then add other objects
        systemData
          .filter((obj) => !(obj.type === CelestialType.STAR && !obj.parentId))
          .forEach((objData) => {
            actions.addCelestial(objData);
          });
      }

      // Reset time again
      actions.resetTime();
      dispatchSimulationTimeReset();

      dispatchTextureGenerationComplete();
      success = true;
    } else {
      console.warn("[SystemGenerator] Generator returned no objects.");
      dispatchTextureGenerationComplete();
      dockviewApi.panels.find((p) => p.id === progressPanelId)?.api.close();
      success = true;
    }
  } catch (error) {
    console.error(
      "[SystemGenerator] Error during system generation or state update:",
      error,
    );
    dockviewApi.panels.find((p) => p.id === progressPanelId)?.api.close();
    dispatchTextureGenerationComplete();
    success = false;
  } finally {
  }
  return success;
}

export const handleResetSimulationTime = () => {
  // dispatch event to reset simulation time
  const event = new CustomEvent(CustomEvents.SIMULATION_RESET_TIME);
  window.dispatchEvent(event);
};
