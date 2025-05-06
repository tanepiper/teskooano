import type { TeskooanoPlugin, PanelConfig } from "@teskooano/ui-plugin";
import { CompositeEnginePanel } from "./panels/CompositeEnginePanel";
import { ProgressPanel } from "./panels/ProgressPanel";

import { addCompositeEnginePanelFunction } from "./main-toolbar/system-controls/engineview-functions";
import {
  generateRandomSystemFunction,
  clearSystemFunction,
  exportSystemFunction,
  triggerImportDialogFunction,
  createBlankSystemFunction,
  copySeedFunction,
} from "./main-toolbar/system-controls/system-functions";

import {
  simulationControlsWidget,
  systemControlsWidget,
  addViewButtonRegistration,
} from "./main-toolbar/toolbar-definitions";

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

/**
 * Plugin definition for the core Engine Panel and related system actions.
 *
 * Registers the main engine view panel (CompositeEnginePanel), a progress panel,
 * various system control functions (generate, clear, import/export), and toolbar widgets/buttons.
 */
export const plugin: TeskooanoPlugin = {
  id: "teskooano-engine-panel",
  name: "Engine Panel & System Actions",
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
  managerClasses: [],
};

export { CompositeEnginePanel };
