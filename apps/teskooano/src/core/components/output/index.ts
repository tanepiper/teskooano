import { createComponentPlugin } from "@teskooano/ui-plugin";
import { TeskooanoOutputDisplay } from "./OutputDisplay";
import { TeskooanoLabeledValue } from "./LabeledValue";

export * from "./OutputDisplay";
export * from "./LabeledValue";

/**
 * Plugin definition for the core Output components.
 *
 * This plugin provides output display components with reactive state management
 * using the new UI patterns.
 */
export const plugin = createComponentPlugin({
  id: "teskooano-output",
  name: "Teskooano Output Components",
  description:
    "Provides the teskooano-output-display and teskooano-labeled-value custom elements with reactive state management.",
  version: "2.0.0", // Version bump for the new reactive patterns

  components: [
    {
      tagName: "teskooano-output-display",
      componentClass: TeskooanoOutputDisplay,
    },
    {
      tagName: "teskooano-labeled-value",
      componentClass: TeskooanoLabeledValue,
    },
  ],
});
