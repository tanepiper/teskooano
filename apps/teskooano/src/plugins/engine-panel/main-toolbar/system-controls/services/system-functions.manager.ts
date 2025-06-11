import { simulationManager } from "@teskooano/app-simulation";
import { OSVector3 } from "@teskooano/core-math";
import {
  actions,
  celestialFactory,
  getCelestialObjects,
  getCurrentSeed,
  updateSeed,
} from "@teskooano/core-state";
import { CelestialType, type CelestialObject } from "@teskooano/data-types";
import { generateStar } from "@teskooano/procedural-generation";
import type {
  FunctionConfig,
  PluginExecutionContext,
} from "@teskooano/ui-plugin";
import {
  catchError,
  defer,
  finalize,
  fromEvent,
  lastValueFrom,
  Observable,
  of,
  switchMap,
  take,
  type Observable as ObservableType,
} from "rxjs";
import { SystemGenerator } from "./system-generator.service";

/** Represents the data structure for an imported system file. */
interface SystemImportData {
  seed: string;
  objects: CelestialObject[];
}

/** Represents the standardized result of processing an imported file. */
interface ProcessResult {
  success: boolean;
  message?: string;
  symbol: string;
}

/**
 * Manages the registration and execution of all system-level functions.
 * This class contains the core business logic for actions like clearing,
 * exporting, importing, and generating systems. It is instantiated by the
 * plugin's initializer and provides its methods as executable functions
 * to the `PluginManager`.
 */
export class SystemFunctionsManager {
  private context: PluginExecutionContext;
  private generator: SystemGenerator;

  /**
   * Constructs the manager for system functions.
   * @param {PluginExecutionContext} context - The shared application context.
   * @param {SystemGenerator} generator - The service responsible for system generation.
   */
  constructor(context: PluginExecutionContext, generator: SystemGenerator) {
    this.context = context;
    this.generator = generator;
  }

  /**
   * Processes a file imported by the user. This involves reading the file,
   * parsing the JSON, validating the structure, and rehydrating the celestial
   * objects (including vector instances) before updating the application state.
   *
   * @param {File} file - The file selected by the user.
   * @returns {ObservableType<ProcessResult>} An observable that emits the result of the process.
   * @private
   */
  private processImportedFile$(file: File): ObservableType<ProcessResult> {
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

          // Re-hydrate plain objects into class instances (e.g., OSVector3)
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

          // Clear existing state before loading new data
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

          // Load the new system into the state
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

      // Cleanup the temporary input element
      return () => {
        if (inputElement?.parentNode) {
          inputElement.parentNode.removeChild(inputElement);
        }
      };
    });
  }

  /**
   * Plugin function to generate a new system. If a seed is provided, it's used;
   * otherwise, a random seed is generated.
   *
   * @param {PluginExecutionContext} _ - The execution context (unused).
   * @param {{ seed?: string }} [options] - Optional parameters.
   * @returns {Promise<ProcessResult>} The result of the generation process.
   */
  public async generateRandomSystem(
    _: PluginExecutionContext,
    options?: { seed?: string },
  ) {
    try {
      const seed = options?.seed ?? Math.random().toString(36).substring(2, 10);

      await this.generator.generateAndLoadSystem(seed);
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
  }

  /**
   * Plugin function to clear all celestial objects from the state and reset the simulation.
   * @returns {Promise<ProcessResult>} The result of the clear operation.
   */
  public async clearSystem() {
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
  }

  /**
   * Plugin function to export the current system state (objects and seed) to a JSON file.
   * @returns {Promise<ProcessResult>} The result of the export operation.
   */
  public async exportSystem() {
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
  }

  /**
   * Plugin function that triggers a native file input dialog to allow the user
   * to select a system JSON file for import.
   * @returns {Promise<ProcessResult>} The result of the entire import flow.
   */
  public async triggerImportDialog() {
    let inputElement: HTMLInputElement | null = null;

    const import$ = defer(() => {
      // Clean up any stray input elements first
      document
        .querySelectorAll('input[type="file"][data-importer="system"]')
        .forEach((el) => el.remove());

      // Create a new, temporary input element
      inputElement = document.createElement("input");
      inputElement.type = "file";
      inputElement.accept = ".json";
      inputElement.style.display = "none";
      inputElement.setAttribute("data-importer", "system");
      document.body.appendChild(inputElement);

      inputElement.click();

      // Listen for the 'change' event
      return fromEvent(inputElement, "change");
    }).pipe(
      take(1),
      switchMap((event) => {
        const file = (event.target as HTMLInputElement)?.files?.[0];
        if (file) {
          return this.processImportedFile$(file);
        } else {
          // User cancelled the file dialog
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
        // Ensure the temporary input element is always removed
        if (inputElement?.parentNode) {
          inputElement.parentNode.removeChild(inputElement);
          inputElement = null;
        }
      }),
    );

    return lastValueFrom(import$);
  }

  /**
   * Plugin function to create a new, blank system containing only a single star.
   * @returns {Promise<ProcessResult>} The result of the creation operation.
   */
  public async createBlankSystem() {
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
  }

  /**
   * Plugin function to copy a given seed string to the clipboard.
   * If no seed is provided, it uses the current seed from the state.
   *
   * @param {PluginExecutionContext} _ - The execution context (unused).
   * @param {string} [seedToCopy] - The specific seed string to copy.
   * @returns {Promise<ProcessResult>} The result of the copy operation.
   */
  public async copySeed(_: PluginExecutionContext, seedToCopy?: string) {
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
  }

  /**
   * Gathers all public methods intended for plugin registration and returns
   * them as an array of `FunctionConfig` objects.
   *
   * @returns {FunctionConfig[]} An array of function configurations for the plugin manager.
   */
  public getFunctions(): FunctionConfig[] {
    return [
      {
        id: "system:generate_random",
        dependencies: { dockView: { api: true } },
        execute: this.generateRandomSystem.bind(this),
      },
      {
        id: "system:clear",
        dependencies: {},
        execute: this.clearSystem.bind(this),
      },
      {
        id: "system:export",
        dependencies: {},
        execute: this.exportSystem.bind(this),
      },
      {
        id: "system:trigger_import_dialog",
        dependencies: { dockView: { api: true } },
        execute: this.triggerImportDialog.bind(this),
      },
      {
        id: "system:create_blank",
        dependencies: { dockView: { api: true } },
        execute: this.createBlankSystem.bind(this),
      },
      {
        id: "system:copy_seed",
        dependencies: {},
        execute: this.copySeed.bind(this),
      },
    ];
  }
}
