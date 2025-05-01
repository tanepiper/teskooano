import type { TeskooanoPlugin, PanelConfig } from "@teskooano/ui-plugin";
import { CompositeEnginePanel } from "./panels/CompositeEnginePanel";
import { ProgressPanel } from "./panels/ProgressPanel";

// Import functions from their dedicated files
import { addCompositeEnginePanelFunction } from "./main-toolbar/system-controls/engineview-functions";
import {
  generateRandomSystemFunction,
  clearSystemFunction,
  exportSystemFunction,
  triggerImportDialogFunction,
  createBlankSystemFunction,
  copySeedFunction,
} from "./main-toolbar/system-controls/system-functions";

// Import toolbar definitions
import {
  simulationControlsWidget,
  systemControlsWidget,
  addViewButtonRegistration,
} from "./main-toolbar/toolbar-definitions";

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
