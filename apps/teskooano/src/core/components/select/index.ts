import { createComponentPlugin } from "@teskooano/ui-plugin";
import { TeskooanoSelect } from "./Select";

export * from "./Select";

/**
 * Plugin definition for the core Select component.
 */
export const plugin = createComponentPlugin({
  id: "teskooano-select",
  name: "Teskooano Select Component",
  description: "Provides the teskooano-select custom element.",
  components: [
    {
      tagName: "teskooano-select",
      componentClass: TeskooanoSelect,
    },
  ],
});
