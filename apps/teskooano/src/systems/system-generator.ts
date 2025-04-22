import {
  actions,
  celestialObjectsStore,
  currentSeed,
  systemNameStore,
  updateSeed,
} from "@teskooano/core-state";
import {
  CelestialType,
  StarProperties,
  type CelestialObject,
} from "@teskooano/data-types";
import { generateSystem } from "@teskooano/procedural-generation";
import { dispatchTextureGenerationComplete } from "@teskooano/systems-celestial";
import { DockviewApi } from "dockview-core";

// Custom event name for simulation time reset
const RESET_SIMULATION_TIME_EVENT = "resetSimulationTime";

// Define the custom event for resetting simulation accumulated time
export function dispatchSimulationTimeReset() {
  const event = new CustomEvent(RESET_SIMULATION_TIME_EVENT);
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

  console.log(
    `[SystemGenerator] Starting generation with input seed: "${inputSeed}"`,
  );

  // Update seed store
  updateSeed(inputSeed);
  const finalSeed = currentSeed.get();
  console.log(`[SystemGenerator] Using final seed: "${finalSeed}"`);

  // Clear state
  console.log("[SystemGenerator] Clearing existing state...");
  actions.clearState({
    resetCamera: false,
    resetTime: true,
    resetSelection: true,
  });
  actions.resetTime();
  dispatchSimulationTimeReset();
  systemNameStore.set(null);
  currentSeed.set("");
  console.log("[SystemGenerator] State cleared.");

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
    console.log("[SystemGenerator] Generating system data and name...");
    // Destructure the result from generateSystem
    const { systemName: generatedName, objects: generatedObjects } =
      await generateSystem(finalSeed);
    systemName = generatedName; // Store the name
    systemData = generatedObjects; // Store the objects
    console.log(
      `[SystemGenerator] Generated system "${systemName}" with ${systemData.length} celestial objects.`,
    );

    // --- Update System Name and Seed in State ---
    systemNameStore.set(systemName);
    currentSeed.set(finalSeed);
    console.log(
      `[SystemGenerator] System name "${systemName}" and seed "${finalSeed}" set in state.`,
    );
    // --- End Update System Name and Seed ---

    planetList = systemData
      .filter(
        (obj) =>
          obj.type === CelestialType.PLANET ||
          obj.type === CelestialType.GAS_GIANT,
      )
      .map((planet) => ({ id: planet.id, name: planet.name }));

    console.log(
      `[SystemGenerator] Found ${planetList.length} planets/gas giants for texture generation.`,
    );

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
    console.log("[SystemGenerator] Progress panel added.");

    // Add objects to the state store
    if (systemData && systemData.length > 0) {
      console.log("[SystemGenerator] Adding generated objects to state...");
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
        console.log(
          `[SystemGenerator] Found primary star: ${primaryStar.id}. Creating solar system...`,
        );
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
              // console.log(`[SystemGenerator] Adding celestial: ${objData.id} (${objData.type})`);
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
            console.log(
              `[SystemGenerator] Adding root star (fallback): ${star.id}`,
            );
            actions.createSolarSystem(star);
          });
        // Then add other objects
        systemData
          .filter((obj) => !(obj.type === CelestialType.STAR && !obj.parentId))
          .forEach((objData) => {
            // console.log(`[SystemGenerator] Adding celestial (fallback): ${objData.id} (${objData.type})`);
            actions.addCelestial(objData);
          });
      }
      console.log("[SystemGenerator] Finished adding objects to state.");

      // Reset time again
      actions.resetTime();
      dispatchSimulationTimeReset();

      dispatchTextureGenerationComplete(true);
      success = true;
      console.log(
        "[SystemGenerator] System generation and state update successful.",
      );
    } else {
      console.warn("[SystemGenerator] Generator returned no objects.");
      dispatchTextureGenerationComplete(true);
      dockviewApi.panels.find((p) => p.id === progressPanelId)?.api.close();
      success = true;
    }
  } catch (error) {
    console.error(
      "[SystemGenerator] Error during system generation or state update:",
      error,
    );
    dockviewApi.panels.find((p) => p.id === progressPanelId)?.api.close();
    dispatchTextureGenerationComplete(false, 1);
    success = false;
  } finally {
    console.log(`[SystemGenerator] Process finished. Success: ${success}`);
  }
  return success;
}
