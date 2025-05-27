import { OSVector3 } from "@teskooano/core-math";
import {
  actions,
  celestialFactory,
  getCurrentSeed,
  getCelestialObjects,
  updateSeed,
} from "@teskooano/core-state";
import { simulationManager } from "@teskooano/app-simulation";
import {
  CelestialType,
  CustomEvents,
  type CelestialObject,
} from "@teskooano/data-types";
import { generateStar } from "@teskooano/procedural-generation";
import type {
  FunctionConfig,
  PluginExecutionContext,
} from "@teskooano/ui-plugin";
import type { DockviewApi } from "dockview-core";
import {
  Observable,
  catchError,
  defer,
  finalize,
  fromEvent,
  lastValueFrom,
  of,
  switchMap,
  take,
} from "rxjs";
import { generateAndLoadSystem } from "./system-generator.js";

interface SystemImportData {
  seed: string;
  objects: CelestialObject[];
}

interface ProcessResult {
  success: boolean;
  message?: string;
  symbol: string;
}

/**
 * Processes an imported system file using FileReader, returning an Observable result.
 * @param file The File object to process.
 * @param dockviewApi Optional Dockview API instance.
 * @returns Observable<ProcessResult>
 */
function processImportedFile$(
  file: File,
  _: DockviewApi | null,
): Observable<ProcessResult> {
  return new Observable<ProcessResult>((observer) => {
    const reader = new FileReader();

    const inputElement: HTMLInputElement | null = document.querySelector(
      'input[type="file"][data-importer="system"]',
    );

    reader.onload = (event) => {
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

        celestialFactory.clearState({
          resetCamera: false,
          resetTime: true,
          resetSelection: true,
        });
        actions.resetTime();

        const star = hydratedObjects.find(
          (obj) => obj.type === CelestialType.STAR && obj.parentId == null,
        );
        if (!star) throw new Error("Could not find a primary star.");

        celestialFactory.createSolarSystem(star);
        hydratedObjects.forEach((obj) => {
          if (obj.id !== star.id) {
            celestialFactory.addCelestial(obj);
          }
        });

        updateSeed(parsedData.seed);

        simulationManager.resetSystem(true);

        observer.next({
          success: true,
          symbol: "✅",
          message: "Import successful.",
        });
        observer.complete();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown import error";

        observer.next({ success: false, symbol: "❌", message });
        observer.complete();
      }
    };

    reader.onerror = (error) => {
      console.error("[SystemFunctions] Error reading file:", error);
      observer.next({
        success: false,
        symbol: "❌",
        message: "Error reading file.",
      });
      observer.complete();
    };

    reader.readAsText(file);

    return () => {
      if (inputElement?.parentNode) {
        inputElement.parentNode.removeChild(inputElement);
      }
    };
  });
}

export const generateRandomSystemFunction: FunctionConfig = {
  id: "system:generate_random",
  dependencies: {
    dockView: {
      api: true,
    },
  },
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
    try {
      const seed = options?.seed ?? Math.random().toString(36).substring(2, 10);

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
  dependencies: {},
  execute: async () => {
    try {
      celestialFactory.clearState({
        resetCamera: false,
        resetTime: true,
        resetSelection: true,
      });
      actions.resetTime();

      simulationManager.resetSystem(true);

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
  dependencies: {},
  execute: async () => {
    try {
      const objects = getCelestialObjects();
      const seed = getCurrentSeed();
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
  dependencies: {
    dockView: {
      api: true,
    },
  },
  execute: async (context: PluginExecutionContext) => {
    const { dockviewApi } = context;
    let inputElement: HTMLInputElement | null = null;

    const import$ = defer(() => {
      document
        .querySelectorAll('input[type="file"][data-importer="system"]')
        .forEach((el) => el.remove());

      inputElement = document.createElement("input");
      inputElement.type = "file";
      inputElement.accept = ".json";
      inputElement.style.display = "none";
      inputElement.setAttribute("data-importer", "system");
      document.body.appendChild(inputElement);

      inputElement.click();

      return fromEvent(inputElement, "change");
    }).pipe(
      take(1),
      switchMap((event) => {
        const file = (event.target as HTMLInputElement)?.files?.[0];
        if (file) {
          return processImportedFile$(file, dockviewApi);
        } else {
          return of<ProcessResult>({
            success: false,
            symbol: "🤷",
            message: "File selection cancelled.",
          });
        }
      }),
      catchError((err) => {
        console.error("[SystemFunctions] File input error:", err);
        return of<ProcessResult>({
          success: false,
          symbol: "❌",
          message: "File input error.",
        });
      }),
      finalize(() => {
        if (inputElement?.parentNode) {
          inputElement.parentNode.removeChild(inputElement);
          inputElement = null;
        }
      }),
    );

    return lastValueFrom(import$);
  },
};

export const createBlankSystemFunction: FunctionConfig = {
  id: "system:create_blank",
  dependencies: {
    dockView: {
      api: true,
    },
  },
  execute: async (_: PluginExecutionContext) => {
    try {
      celestialFactory.clearState({
        resetCamera: false,
        resetTime: true,
        resetSelection: true,
      });
      actions.resetTime();

      const star = generateStar(Math.random);
      celestialFactory.createSolarSystem(star);
      updateSeed("");

      simulationManager.resetSystem(true);
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
  dependencies: {},
  execute: async (_: PluginExecutionContext, seedToCopy?: string) => {
    const seed = seedToCopy ?? getCurrentSeed() ?? "";
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
