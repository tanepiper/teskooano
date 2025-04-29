import type {
  FunctionConfig,
  PluginExecutionContext,
} from "@teskooano/ui-plugin";
import {
  actions,
  celestialObjectsStore,
  currentSeed,
} from "@teskooano/core-state";
import {
  CelestialType,
  CustomEvents,
  type CelestialObject,
} from "@teskooano/data-types";
import { generateStar } from "@teskooano/procedural-generation";
import { generateAndLoadSystem } from "../../../../systems/system-generator.js";
import { OSVector3 } from "@teskooano/core-math";
import type { DockviewApi } from "dockview-core";

interface SystemImportData {
  seed: string;
  objects: CelestialObject[];
}

async function processImportedFile(
  file: File,
  dockviewApi: DockviewApi | null, // Keep DockviewApi reference if needed for future context
): Promise<{ success: boolean; message?: string; symbol: string }> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      let inputElement: HTMLInputElement | null = document.querySelector(
        'input[type="file"][data-importer="system"]',
      );
      try {
        const fileContent = event.target?.result as string;
        if (!fileContent) throw new Error("File content is empty.");
        const parsedData = JSON.parse(fileContent) as SystemImportData;
        if (
          !parsedData ||
          typeof parsedData !== "object" ||
          typeof parsedData.seed !== "string" ||
          !Array.isArray(parsedData.objects)
        ) {
          throw new Error("Invalid file format.");
        }

        // Hydrate OSVector3 instances
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

        actions.clearState({
          resetCamera: false,
          resetTime: true,
          resetSelection: true,
        });
        actions.resetTime();

        const star = hydratedObjects.find(
          (obj) => obj.type === CelestialType.STAR && obj.parentId == null,
        );
        if (!star) throw new Error("Could not find a primary star.");

        actions.createSolarSystem(star);
        hydratedObjects.forEach((obj) => {
          if (obj.id !== star.id) actions.addCelestialObject(obj);
        });

        currentSeed.set(parsedData.seed);

        // Inform simulation/UI to reset time-based elements
        window.dispatchEvent(
          new CustomEvent(CustomEvents.SIMULATION_RESET_TIME),
        );
        resolve({ success: true, symbol: "✅", message: "Import successful." });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown import error";
        resolve({ success: false, symbol: "❌", message });
      } finally {
        if (inputElement?.parentNode)
          inputElement.parentNode.removeChild(inputElement);
      }
    };
    reader.onerror = (error) => {
      let inputElement: HTMLInputElement | null = document.querySelector(
        'input[type="file"][data-importer="system"]',
      );
      console.error("[SystemFunctions] Error reading file:", error);
      resolve({ success: false, symbol: "❌", message: "Error reading file." });
      if (inputElement?.parentNode)
        inputElement.parentNode.removeChild(inputElement);
    };
    reader.readAsText(file);
  });
}

export const generateRandomSystemFunction: FunctionConfig = {
  id: "system:generate_random",
  execute: async (
    context: PluginExecutionContext,
    options?: { seed?: string },
  ) => {
    const { dockviewApi } = context;
    if (!dockviewApi) {
      console.error(
        "[SystemFunctions] Cannot generate random: Dockview API not available.",
      );
      return;
    }
    console.log("[SystemFunctions] Executing system:generate_random...");
    try {
      const seed = options?.seed ?? Math.random().toString(36).substring(2, 10);
      // Assuming generateAndLoadSystem handles progress updates via dockviewApi if needed
      await generateAndLoadSystem(seed, dockviewApi);
      return {
        success: true,
        symbol: "✨",
        message: seed
          ? `System generated from seed.`
          : "Random system generated.",
      };
    } catch (error) {
      console.error("[SystemFunctions] Error generating random system:", error);
      return {
        success: false,
        symbol: "❌",
        message: "Failed to generate random system.",
      };
    }
  },
};

export const clearSystemFunction: FunctionConfig = {
  id: "system:clear",
  execute: async () => {
    console.log("[SystemFunctions] Executing system:clear...");
    try {
      actions.clearState({
        resetCamera: false,
        resetTime: true,
        resetSelection: true,
      });
      actions.resetTime(); // Ensure time resets
      return { success: true, symbol: "🗑️", message: "System cleared." };
    } catch (error) {
      console.error("[SystemFunctions] Error clearing system:", error);
      return {
        success: false,
        symbol: "❌",
        message: "Failed to clear system.",
      };
    }
  },
};

export const exportSystemFunction: FunctionConfig = {
  id: "system:export",
  execute: async () => {
    console.log("[SystemFunctions] Executing system:export...");
    try {
      const objects = celestialObjectsStore.get();
      const seed = currentSeed.get();
      const objectsArray = Object.values(objects);

      if (objectsArray.length === 0) {
        return { success: false, symbol: "🤷", message: "Nothing to export." };
      }

      const exportData: SystemImportData = {
        seed: seed || "",
        objects: objectsArray,
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `teskooano-system-${seed || Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return { success: true, symbol: "💾", message: "Export successful." };
    } catch (error) {
      console.error("[SystemFunctions] Error exporting system:", error);
      const message =
        error instanceof Error ? error.message : "Unknown export error";
      return { success: false, symbol: "❌", message };
    }
  },
};

export const triggerImportDialogFunction: FunctionConfig = {
  id: "system:trigger_import_dialog",
  execute: async (context: PluginExecutionContext) => {
    const { dockviewApi } = context;
    // We still need dockviewApi potentially for processImportedFile context
    if (!dockviewApi) {
      console.error(
        "[SystemFunctions] Cannot trigger import: Dockview API not available.",
      );
      return {
        success: false,
        symbol: "❌",
        message: "Internal error: API unavailable.",
      };
    }

    return new Promise((resolve) => {
      // Ensure previous importers are removed
      document
        .querySelectorAll('input[type="file"][data-importer="system"]')
        .forEach((el) => el.remove());

      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".json";
      input.style.display = "none";
      input.setAttribute("data-importer", "system");

      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          const result = await processImportedFile(file, dockviewApi);
          resolve(result);
        } else {
          // No file selected, remove the input
          if (input.parentNode) input.parentNode.removeChild(input);
          resolve({
            success: false,
            symbol: "🤷",
            message: "File selection cancelled.",
          });
        }
      };

      input.onerror = (err) => {
        if (input.parentNode) input.parentNode.removeChild(input);
        console.error("[SystemFunctions] File input error:", err);
        resolve({ success: false, symbol: "❌", message: "File input error." });
      };

      document.body.appendChild(input);
      input.click(); // Trigger file selection dialog
    });
  },
};

export const createBlankSystemFunction: FunctionConfig = {
  id: "system:create_blank",
  execute: async () => {
    console.log("[SystemFunctions] Executing system:create_blank...");
    try {
      actions.clearState({
        resetCamera: false,
        resetTime: true,
        resetSelection: true,
      });
      actions.resetTime(); // Ensure time resets

      const star = generateStar(Math.random); // Generate a default star
      actions.createSolarSystem(star);
      currentSeed.set(""); // No seed for a blank system

      // Inform simulation/UI to reset time-based elements
      window.dispatchEvent(new CustomEvent(CustomEvents.SIMULATION_RESET_TIME));
      return { success: true, symbol: "📄", message: "Blank system created." };
    } catch (error) {
      console.error("[SystemFunctions] Error creating blank system:", error);
      return {
        success: false,
        symbol: "❌",
        message: "Failed to create blank system.",
      };
    }
  },
};

export const copySeedFunction: FunctionConfig = {
  id: "system:copy_seed",
  execute: async (context: PluginExecutionContext, seedToCopy?: string) => {
    console.log("[SystemFunctions] Executing system:copy_seed...");
    const seed = seedToCopy ?? currentSeed.get() ?? "";
    if (!seed) {
      return { success: false, symbol: "🤷", message: "No seed to copy." };
    }
    try {
      await navigator.clipboard.writeText(seed);
      return { success: true, symbol: "📋", message: "Seed copied!" };
    } catch (err) {
      console.error("[SystemFunctions] Failed to copy seed: ", err);
      return { success: false, symbol: "❌", message: "Failed to copy seed." };
    }
  },
};
