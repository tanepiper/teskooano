import {
  actions,
  celestialObjectsStore,
  currentSeed,
} from "@teskooano/core-state";
import { CelestialType, type CelestialObject } from "@teskooano/data-types";
import { generateStar } from "@teskooano/procedural-generation";
import { OSVector3 } from "@teskooano/core-math";
import { generateAndLoadSystem } from "../../systems/system-generator.js";
import { DockviewApi } from "dockview-core";
import { CustomEvents } from "@teskooano/data-types";

/**
 * Represents the data structure for importing/exporting system state.
 * Duplicated here to avoid circular dependency, consider moving to a shared types file.
 */
interface SystemImportData {
  seed: string;
  objects: CelestialObject[];
}

export interface ActionResult {
  success: boolean;
  message?: string;
  symbol: string; // Symbol for feedback
  seed?: string; // Optionally return generated seed
}

/**
 * Creates a default star object.
 * @returns {CelestialObject} A newly generated star object.
 */
function createDefaultStar(): CelestialObject {
  return generateStar(Math.random);
}

/**
 * Handles exporting the current system state to a JSON file.
 * @param seed The current system seed.
 * @param objects The current map of celestial objects.
 * @returns Promise resolving to an ActionResult.
 */
export async function exportSystem(
  seed: string,
  objects: Record<string, CelestialObject>,
): Promise<ActionResult> {
  try {
    const objectsArray = Object.values(objects);

    if (objectsArray.length === 0) {
      console.warn("Nothing to export.");
      return { success: false, symbol: "🤷", message: "Nothing to export." };
    }

    const exportData: SystemImportData = {
      seed: seed || "", // Ensure seed is a string
      objects: objectsArray,
    };

    const jsonString = JSON.stringify(exportData, null, 2); // Pretty print JSON
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `teskooano-system-${seed || Date.now()}.json`; // Filename with seed or timestamp
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log("System exported successfully.");
    return { success: true, symbol: "💾", message: "Export successful." };
  } catch (error) {
    console.error("Error exporting system:", error);
    const message =
      error instanceof Error ? error.message : "Unknown export error";
    return { success: false, symbol: "❌", message };
  }
}

/**
 * Handles importing a system state from a JSON file.
 * @param file The File object selected by the user.
 * @param dockviewApi Optional Dockview API instance.
 * @returns Promise resolving to an ActionResult.
 */
export async function importSystem(
  file: File,
  dockviewApi: DockviewApi | null,
): Promise<ActionResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = async (event) => {
      let inputElement = document.querySelector(
        'input[type="file"][data-importer="system"]',
      ); // Find our temp input
      try {
        const fileContent = event.target?.result as string;
        if (!fileContent) throw new Error("File content is empty.");

        const parsedData = JSON.parse(fileContent) as SystemImportData;

        // Basic Validation
        if (
          !parsedData ||
          typeof parsedData !== "object" ||
          typeof parsedData.seed !== "string" ||
          !Array.isArray(parsedData.objects)
        ) {
          throw new Error(
            "Invalid file format. Expected { seed: string, objects: CelestialObject[] }.",
          );
        }

        // Hydrate Physics State Vectors
        const hydratedObjects = parsedData.objects.map((obj) => {
          if (obj.physicsStateReal) {
            if (
              obj.physicsStateReal.position_m &&
              !(obj.physicsStateReal.position_m instanceof OSVector3)
            ) {
              const pos = obj.physicsStateReal.position_m as any;
              obj.physicsStateReal.position_m = new OSVector3(
                pos.x,
                pos.y,
                pos.z,
              );
            }
            if (
              obj.physicsStateReal.velocity_mps &&
              !(obj.physicsStateReal.velocity_mps instanceof OSVector3)
            ) {
              const vel = obj.physicsStateReal.velocity_mps as any;
              obj.physicsStateReal.velocity_mps = new OSVector3(
                vel.x,
                vel.y,
                vel.z,
              );
            }
          }
          return obj;
        });

        console.log(
          `Importing system with seed "${parsedData.seed}" and ${hydratedObjects.length} objects...`,
        );

        // 1. Clear existing state
        actions.clearState({
          resetCamera: false,
          resetTime: true,
          resetSelection: true,
        });
        actions.resetTime();

        // 2. Load objects
        const star = hydratedObjects.find(
          (obj) => obj.type === CelestialType.STAR && obj.parentId == null,
        );

        if (!star) {
          throw new Error("Could not find a primary star in imported data.");
        }

        actions.createSolarSystem(star);

        hydratedObjects.forEach((obj) => {
          if (obj.id !== star.id) {
            if (typeof actions.addCelestialObject === "function") {
              actions.addCelestialObject(obj);
            } else {
              console.error(
                `Cannot add object ${obj.name} (ID: ${obj.id}) - actions.addCelestialObject missing.`,
              );
            }
          }
        });

        console.log("System imported successfully.");
        // Dispatch event to reset the simulation loop's internal timer
        window.dispatchEvent(
          new CustomEvent(CustomEvents.SIMULATION_RESET_TIME),
        );
        console.log("Dispatched resetSimulationTime event.");

        resolve({ success: true, symbol: "✅", message: "Import successful." });
      } catch (error) {
        console.error("Error importing system:", error);
        const message =
          error instanceof Error ? error.message : "Unknown import error";
        resolve({ success: false, symbol: "❌", message });
      } finally {
        if (inputElement && inputElement.parentNode) {
          inputElement.parentNode.removeChild(inputElement);
        }
      }
    };

    reader.onerror = (error) => {
      let inputElement = document.querySelector(
        'input[type="file"][data-importer="system"]',
      ); // Find our temp input
      console.error("Error reading file:", error);
      resolve({ success: false, symbol: "❌", message: "Error reading file." });
      if (inputElement && inputElement.parentNode) {
        inputElement.parentNode.removeChild(inputElement);
      }
    };

    reader.readAsText(file);
  });
}

/**
 * Triggers the file input dialog for system import.
 * @returns Promise resolving when the file input changes (or rejects on error).
 */
export async function triggerImportDialog(): Promise<File> {
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.style.display = "none";
    input.setAttribute("data-importer", "system"); // Mark our input

    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        resolve(file);
      } else {
        // User cancelled the dialog
        console.log("File selection cancelled.");
        // Reject or resolve with null/undefined? Rejecting seems cleaner
        // for the calling component to handle cancellation.
        reject(new Error("File selection cancelled."));
        // Clean up the input element immediately if cancelled
        if (input.parentNode) {
          input.parentNode.removeChild(input);
        }
      }
      // Don't remove the input here if a file WAS selected,
      // it's removed in the importSystem onload/onerror handlers.
    };

    input.onerror = (err) => {
      reject(err);
      // Clean up on error too
      if (input.parentNode) {
        input.parentNode.removeChild(input);
      }
    };

    document.body.appendChild(input);
    input.click();
  });
}

/**
 * Generates and loads a system with a new random seed.
 * @param dockviewApi Optional Dockview API instance.
 * @returns Promise resolving to an ActionResult.
 */
export async function generateRandomSystem(
  dockviewApi: DockviewApi | null,
): Promise<ActionResult> {
  const randomSeed = Math.random().toString(36).substring(2, 10);
  console.log("Generating random system with seed:", randomSeed);
  try {
    const success = await generateAndLoadSystem(randomSeed, dockviewApi);
    if (success) {
      return {
        success: true,
        symbol: "🎲",
        seed: randomSeed,
        message: "Random generation successful.",
      };
    } else {
      throw new Error("generateAndLoadSystem returned false");
    }
  } catch (error) {
    console.error("Error during random generation:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Unknown random generation error";
    return { success: false, symbol: "❌", message };
  }
}

/**
 * Clears the current system state.
 * @returns Promise resolving to an ActionResult.
 */
export async function clearSystem(): Promise<ActionResult> {
  try {
    console.log("Clearing system via action...");
    actions.clearState({
      resetCamera: false,
      resetTime: true,
      resetSelection: true,
    });
    actions.resetTime(); // Ensure time resets
    return { success: true, symbol: "🗑️", message: "System cleared." };
  } catch (error) {
    console.error("Error clearing system:", error);
    const message =
      error instanceof Error ? error.message : "Unknown clear error";
    return { success: false, symbol: "❌", message };
  }
}

/**
 * Creates a new blank system with just a default star.
 * @returns Promise resolving to an ActionResult.
 */
export async function createBlankSystem(): Promise<ActionResult> {
  try {
    console.log("Creating blank system with default star...");
    // 1. Clear existing state
    actions.clearState({
      resetCamera: false,
      resetTime: true,
      resetSelection: true,
    });
    actions.resetTime();

    // 2. Create the default star object
    const defaultStar = createDefaultStar();

    // 3. Add the default star using createSolarSystem
    actions.createSolarSystem(defaultStar);
    console.log(`Default star "${defaultStar.name}" added to the system.`);
    console.warn(
      "[system-controls.actions] TODO: Need correct action/store to set systemName for blank system.",
    );

    return { success: true, symbol: "📝", message: "Blank system created." };
  } catch (error) {
    console.error("Error creating default solar system:", error);
    const message =
      error instanceof Error ? error.message : "Unknown blank system error";
    return { success: false, symbol: "❌", message };
  }
}

/**
 * Copies the provided seed string to the clipboard.
 * @param seed The seed string to copy.
 * @returns Promise resolving to an ActionResult.
 */
export async function copySystemSeed(seed: string): Promise<ActionResult> {
  if (!seed) {
    console.warn("No seed available to copy.");
    return { success: false, symbol: "⚠️", message: "No seed to copy." };
  }

  try {
    await navigator.clipboard.writeText(seed);
    console.log("Seed copied to clipboard:", seed);
    return { success: true, symbol: "✓", message: "Seed copied." };
  } catch (err) {
    console.error("Failed to copy seed: ", err);
    const message = err instanceof Error ? err.message : "Failed to copy";
    return { success: false, symbol: "⚠️", message };
  }
}
