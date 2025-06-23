import { createComponentPlugin } from "@teskooano/ui-plugin";
import { TeskooanoModal } from "./Modal";
import { TeskooanoModalManager } from "./ModalManager";

export * from "./Modal";
export * from "./ModalManager";

/**
 * Plugin definition for the core Modal system.
 */
export const plugin = createComponentPlugin({
  id: "teskooano-modal",
  name: "Teskooano Modal",
  description:
    "Provides the teskooano-modal custom element and the ModalManager service.",

  components: [
    {
      tagName: "teskooano-modal",
      componentClass: TeskooanoModal,
    },
  ],

  managerClasses: [
    {
      id: "modal-manager",
      managerClass: TeskooanoModalManager,
    },
  ],
});
