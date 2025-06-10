import type { TeskooanoPlugin } from "@teskooano/ui-plugin";
import { plugin as viewsPlugin } from "./panels";
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

/**
 * A composite plugin that aggregates all functionality related to the engine panel.
 *
 * This plugin bundles:
 * - The engine view panel itself (`engine-panel-views`).
 * - Core system control functions (generate, clear, import/export).
 * - Toolbar widgets for simulation and system controls.
 */
export const plugin: TeskooanoPlugin = {
  id: "teskooano-engine-panel",
  name: "Engine Panel & System Actions",
  description:
    "Registers engine view panels and provides core system actions (generate, import, export, clear, etc.).",

  panels: [...(viewsPlugin.panels ?? [])],

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
