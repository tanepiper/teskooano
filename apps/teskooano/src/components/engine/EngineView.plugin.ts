import type {
  TeskooanoPlugin,
  PanelConfig,
  FunctionConfig,
  PluginExecutionContext,
  ToolbarRegistration,
  ToolbarWidgetConfig,
  FunctionToolbarItemConfig,
} from "@teskooano/ui-plugin";
import { CompositeEnginePanel } from "./CompositeEnginePanel";
import { ProgressPanel } from "./ProgressPanel";

import {
  actions,
  celestialObjectsStore,
  currentSeed,
} from "@teskooano/core-state";
import { CelestialType, type CelestialObject } from "@teskooano/data-types";
import { generateStar } from "@teskooano/procedural-generation";
import { OSVector3 } from "@teskooano/core-math";
import { generateAndLoadSystem } from "../../systems/system-generator.js";
import { CustomEvents } from "@teskooano/data-types";

import SparkleIcon from "@fluentui/svg-icons/icons/sparkle_24_regular.svg?raw";
import AddIcon from "@fluentui/svg-icons/icons/add_24_regular.svg?raw";
import type { DockviewApi, AddPanelOptions } from "dockview-core";

let enginePanelCounter = 0;

interface SystemImportData {
  seed: string;
  objects: CelestialObject[];
}

const enginePanelConfig: PanelConfig = {
  componentName: "composite_engine_view",
  panelClass: CompositeEnginePanel,
  defaultTitle: "Engine View",
};

const progressPanelConfig: PanelConfig = {
  componentName: "progress_view",
  panelClass: ProgressPanel,
  defaultTitle: "Processing...",
};

const addCompositeEnginePanelFunction: FunctionConfig = {
  id: "engine:add_composite_panel",
  execute: async (context: PluginExecutionContext) => {
    const { dockviewApi, dockviewController } = context;
    if (!dockviewApi || !dockviewController) {
      console.error(
        "[EngineViewPlugin] Cannot add panel: Dockview API (or Controller) not provided in context.",
      );
      return;
    }

    enginePanelCounter++;
    const counter = enginePanelCounter;
    const compositeViewId = `composite_engine_view_${counter}`;
    const compositeViewTitle = `Teskooano ${counter}`;

    const panelOptions: AddPanelOptions = {
      id: compositeViewId,
      component: "composite_engine_view",
      title: compositeViewTitle,
      params: {
        title: compositeViewTitle,
        dockviewController: dockviewController,
      },
    };

    try {
      const newPanel = dockviewApi.addPanel(panelOptions);
      newPanel.api.setActive();

      console.log(`[EngineViewPlugin] Added panel '${compositeViewId}'`);
    } catch (error) {
      console.error(
        `[EngineViewPlugin] Failed to add engine panel for counter ${counter}:`,
        error,
      );
      enginePanelCounter--;
    }
  },
};

const generateRandomSystemFunction: FunctionConfig = {
  id: "system:generate_random",
  execute: async (
    context: PluginExecutionContext,
    options?: { seed?: string },
  ) => {
    const { dockviewApi } = context;
    if (!dockviewApi) {
      console.error(
        "[EngineViewPlugin] Cannot generate random: Dockview API not available.",
      );
      return;
    }
    console.log("[EngineViewPlugin] Executing system:generate_random...");
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
      console.error(
        "[EngineViewPlugin] Error generating random system:",
        error,
      );
      return {
        success: false,
        symbol: "❌",
        message: "Failed to generate random system.",
      };
    }
  },
};

const clearSystemFunction: FunctionConfig = {
  id: "system:clear",
  execute: async () => {
    console.log("[EngineViewPlugin] Executing system:clear...");
    try {
      actions.clearState({
        resetCamera: false,
        resetTime: true,
        resetSelection: true,
      });
      actions.resetTime();
      return { success: true, symbol: "🗑️", message: "System cleared." };
    } catch (error) {
      console.error("[EngineViewPlugin] Error clearing system:", error);
      return {
        success: false,
        symbol: "❌",
        message: "Failed to clear system.",
      };
    }
  },
};

const exportSystemFunction: FunctionConfig = {
  id: "system:export",
  execute: async () => {
    console.log("[EngineViewPlugin] Executing system:export...");
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
      console.error("[EngineViewPlugin] Error exporting system:", error);
      const message =
        error instanceof Error ? error.message : "Unknown export error";
      return { success: false, symbol: "❌", message };
    }
  },
};

async function processImportedFile(
  file: File,
  dockviewApi: DockviewApi | null,
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
      resolve({ success: false, symbol: "❌", message: "Error reading file." });
      if (inputElement?.parentNode)
        inputElement.parentNode.removeChild(inputElement);
    };
    reader.readAsText(file);
  });
}

const triggerImportDialogFunction: FunctionConfig = {
  id: "system:trigger_import_dialog",
  execute: async (context: PluginExecutionContext) => {
    const { dockviewApi } = context;
    if (!dockviewApi) {
      console.error(
        "[EngineViewPlugin] Cannot trigger import: Dockview API not available.",
      );
      return {
        success: false,
        symbol: "❌",
        message: "Internal error: API unavailable.",
      };
    }

    return new Promise((resolve, reject) => {
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
        console.error("File input error:", err);
        resolve({ success: false, symbol: "❌", message: "File input error." });
      };
      document.body.appendChild(input);
      input.click();
    });
  },
};

const createBlankSystemFunction: FunctionConfig = {
  id: "system:create_blank",
  execute: async () => {
    console.log("[EngineViewPlugin] Executing system:create_blank...");
    try {
      actions.clearState({
        resetCamera: false,
        resetTime: true,
        resetSelection: true,
      });
      actions.resetTime();

      const star = generateStar(Math.random);
      actions.createSolarSystem(star);
      currentSeed.set("");

      window.dispatchEvent(new CustomEvent(CustomEvents.SIMULATION_RESET_TIME));
      return { success: true, symbol: "📄", message: "Blank system created." };
    } catch (error) {
      console.error("[EngineViewPlugin] Error creating blank system:", error);
      return {
        success: false,
        symbol: "❌",
        message: "Failed to create blank system.",
      };
    }
  },
};

const copySeedFunction: FunctionConfig = {
  id: "system:copy_seed",
  execute: async (context: PluginExecutionContext, seedToCopy?: string) => {
    console.log("[EngineViewPlugin] Executing system:copy_seed...");
    const seed = seedToCopy ?? currentSeed.get() ?? "";
    if (!seed) {
      return { success: false, symbol: "🤷", message: "No seed to copy." };
    }
    try {
      await navigator.clipboard.writeText(seed);
      return { success: true, symbol: "📋", message: "Seed copied!" };
    } catch (err) {
      console.error("Failed to copy seed: ", err);
      return { success: false, symbol: "❌", message: "Failed to copy seed." };
    }
  },
};

// --- Define Toolbar Widget Configurations --- //
const simulationControlsWidget: ToolbarWidgetConfig = {
  id: "main-toolbar-sim-controls",
  target: "main-toolbar",
  componentName: "teskooano-simulation-controls",
  order: 10, // Render before system controls
};

const systemControlsWidget: ToolbarWidgetConfig = {
  id: "main-toolbar-teskooano-system-controls",
  target: "main-toolbar",
  componentName: "teskooano-system-controls",
  order: 20, // Render after sim controls
};

// Registration for the 'Add Engine View' button
const addViewButtonRegistration: ToolbarRegistration = {
  target: "main-toolbar", // Target the main toolbar area
  items: [
    {
      id: "main-toolbar-add-view",
      type: "function",
      title: "Add Engine View",
      iconSvg: AddIcon,
      functionId: addCompositeEnginePanelFunction.id,
      order: 150,
      tooltipText: "Add a new composite engine view panel to the layout.",
      tooltipTitle: "Add Engine View",
      tooltipIconSvg: AddIcon,
    },
  ],
};

export const plugin: TeskooanoPlugin = {
  id: "core-engine-view",
  name: "Core Engine View & System Actions",
  description:
    "Registers engine view panels and provides core system actions (generate, import, export, clear, etc.).",
  panels: [enginePanelConfig, progressPanelConfig],
  functions: [
    addCompositeEnginePanelFunction,
    generateRandomSystemFunction,
    clearSystemFunction,
    exportSystemFunction,
    triggerImportDialogFunction,
    createBlankSystemFunction,
    copySeedFunction,
  ],
  toolbarRegistrations: [addViewButtonRegistration],
  toolbarWidgets: [simulationControlsWidget, systemControlsWidget],
};
