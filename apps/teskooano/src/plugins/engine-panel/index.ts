import type { PanelConfig, TeskooanoPlugin } from "@teskooano/ui-plugin";
import { CompositeEnginePanel } from "./panels/CompositeEnginePanel";

import { addCompositeEnginePanelFunction } from "./main-toolbar/system-controls/functions/engineview-functions";
import {
  clearSystemFunction,
  copySeedFunction,
  createBlankSystemFunction,
  exportSystemFunction,
  generateRandomSystemFunction,
  triggerImportDialogFunction,
} from "./main-toolbar/system-controls/functions/system-functions";

import {
  addViewButtonRegistration,
  simulationControlsWidget,
  systemControlsWidget,
} from "./main-toolbar/toolbar-definitions";

const enginePanelConfig: PanelConfig = {
  componentName: "teskooano-engine-view",
  panelClass: CompositeEnginePanel,
  defaultTitle: "Engine View",
};

/**
 * Plugin definition for the core Engine Panel and related system actions.
 *
 * Registers the main engine view panel (CompositeEnginePanel),
 * various system control functions (generate, clear, import/export), and toolbar widgets/buttons.
 */
export const plugin: TeskooanoPlugin = {
  id: "teskooano-engine-panel",
  name: "Engine Panel & System Actions",
  description:
    "Registers engine view panels and provides core system actions (generate, import, export, clear, etc.).",

  panels: [enginePanelConfig],

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
  components: [],
};

export { CompositeEnginePanel };
