import type {
  TeskooanoPlugin,
  FunctionConfig,
  ComponentConfig,
} from "@teskooano/ui-plugin";
import { SystemControls } from "./components/SystemControls";
import {
  showGeneratedSystemModal,
  SystemGeneratorModal,
} from "./modals/modal-system-generator";
import {
  showSolarSystemModal,
  SolarSystemModal,
} from "./modals/modal-solar-system";

import {
  generateRandomSystemFunction,
  clearSystemFunction,
  exportSystemFunction,
  triggerImportDialogFunction,
} from "./functions/system-functions";
import { addCompositeEnginePanelFunction } from "./functions/engineview-functions";

const allFunctions: FunctionConfig[] = [
  generateRandomSystemFunction,
  clearSystemFunction,
  exportSystemFunction,
  triggerImportDialogFunction,
  addCompositeEnginePanelFunction,
];

const systemControlsComponent: ComponentConfig = {
  tagName: "teskooano-system-controls",
  componentClass: SystemControls,
};

const systemGeneratorModalComponent: ComponentConfig = {
  tagName: "teskooano-system-generator-modal",
  componentClass: SystemGeneratorModal,
};

const solarSystemModalComponent: ComponentConfig = {
  tagName: "teskooano-solar-system-modal",
  componentClass: SolarSystemModal,
};

/**
 * Plugin definition for the System Controls component and related functions.
 *
 * Registers the SystemControls custom element and various functions for
 * system generation, clearing, import/export, and adding engine panels.
 */
export const plugin: TeskooanoPlugin = {
  id: "teskooano-system-controls",
  name: "System Controls",
  description:
    "Provides the system controls component and related system/view functions.",
  components: [
    systemControlsComponent,
    systemGeneratorModalComponent,
    solarSystemModalComponent,
  ],
  functions: allFunctions,

  panels: [],
  toolbarRegistrations: [],
  toolbarWidgets: [],
  managerClasses: [],
};

export {
  SystemControls,
  showGeneratedSystemModal,
  SystemGeneratorModal,
  showSolarSystemModal,
  SolarSystemModal,
};
