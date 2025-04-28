import type { TeskooanoPlugin, PanelConfig } from "@teskooano/ui-plugin";
import { CompositeEnginePanel } from "./CompositeEnginePanel";
import { ProgressPanel } from "./ProgressPanel";

// Import functions from their dedicated files
import { addCompositeEnginePanelFunction } from "./engineview-functions";
import {
  generateRandomSystemFunction,
  clearSystemFunction,
  exportSystemFunction,
  triggerImportDialogFunction,
  createBlankSystemFunction,
  copySeedFunction,
} from "./system-functions";

// Import toolbar definitions
import {
  simulationControlsWidget,
  systemControlsWidget,
  addViewButtonRegistration,
} from "./toolbar-definitions";

// --- Panel Definitions --- //

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

// --- Plugin Export --- //

export const plugin: TeskooanoPlugin = {
  id: "core-engine-view",
  name: "Core Engine View & System Actions",
  description:
    "Registers engine view panels and provides core system actions (generate, import, export, clear, etc.).",
  // Register panels
  panels: [enginePanelConfig, progressPanelConfig],
  // Register functions imported from other files
  functions: [
    addCompositeEnginePanelFunction,
    generateRandomSystemFunction,
    clearSystemFunction,
    exportSystemFunction,
    triggerImportDialogFunction,
    createBlankSystemFunction,
    copySeedFunction,
  ],
  // Register toolbar items imported from another file
  toolbarRegistrations: [addViewButtonRegistration],
  // Register toolbar widgets imported from another file
  toolbarWidgets: [simulationControlsWidget, systemControlsWidget],
};
