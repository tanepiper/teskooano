import type { TeskooanoPlugin } from "@teskooano/ui-plugin";
import { DockViewModalManager } from "./DockViewModalManager";
import { ModalPanel } from "./view/modal-panel.component";

// Export DockView-based modal system
export {
  DockViewModalManager,
  type DockViewModalOptions,
  type ModalResultWithId,
} from "./DockViewModalManager";
export {
  ModalPanel,
  type ModalPanelOptions,
  type ModalResult,
} from "./view/modal-panel.component";
export * from "./view/modal-panel.template";
export * from "./controller/modal-panel.controller";

/**
 * Plugin definition for the core Modal system.
 * Provides DockView-based modal dialogs as floating panels.
 */
export const plugin: TeskooanoPlugin = {
  id: "teskooano-modal",
  name: "Teskooano Modal",
  description:
    "Provides modal dialog components using DockView floating panels.",

  components: [
    {
      tagName: "teskooano-modal-panel",
      componentClass: ModalPanel,
    },
  ],

  panels: [
    {
      componentName: "teskooano-modal-panel",
      panelClass: ModalPanel,
      defaultTitle: "Modal",
    },
  ],

  managerClasses: [
    {
      id: "dockview-modal-manager",
      managerClass: DockViewModalManager,
    },
  ],

  functions: [],
  toolbarRegistrations: [],
  toolbarWidgets: [],
};
