import { createComponentPlugin } from "@teskooano/ui-plugin";
import { TeskooanoSelect } from "./Select";

export * from "./Select";

/**
 * Plugin definition for the core Select component.
 *
 * This plugin provides a custom select dropdown component with reactive state management
 * using the new UI patterns.
 */
export const plugin = createComponentPlugin({
  id: "teskooano-select",
  name: "Teskooano Select Component",
  description:
    "Provides the teskooano-select custom element with reactive state management.",
  components: [
    {
      tagName: "teskooano-select",
      componentClass: TeskooanoSelect,
    },
  ],
  version: "2.0.0", // Version bump for the new reactive patterns
});
