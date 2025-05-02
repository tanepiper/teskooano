import { actions } from "@teskooano/core-state";
import {
  type CelestialObject
} from "@teskooano/data-types";
import { generateStar } from "@teskooano/procedural-generation";
import { DockviewApi } from "dockview-core";
import { generateAndLoadSystem } from "./system-generator.js";

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

    return { success: true, symbol: "💾", message: "Export successful." };
  } catch (error) {
    console.error("Error exporting system:", error);
    const message =
      error instanceof Error ? error.message : "Unknown export error";
    return { success: false, symbol: "❌", message };
  }
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
    console.warn(
      "[teskooano-system-controls.actions] TODO: Need correct action/store to set systemName for blank system.",
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
    return { success: true, symbol: "✓", message: "Seed copied." };
  } catch (err) {
    console.error("Failed to copy seed: ", err);
    const message = err instanceof Error ? err.message : "Failed to copy";
    return { success: false, symbol: "⚠️", message };
  }
}
