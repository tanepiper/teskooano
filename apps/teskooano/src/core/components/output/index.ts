import { createComponentPlugin } from "@teskooano/ui-plugin";
import { TeskooanoOutputDisplay } from "./OutputDisplay";
import { TeskooanoLabeledValue } from "./LabeledValue";

export * from "./OutputDisplay";
export * from "./LabeledValue";

/**
 * Plugin definition for the core Output components.
 */
export const plugin = createComponentPlugin({
  id: "teskooano-output",
  name: "Teskooano Output Components",
  description:
    "Provides the teskooano-output-display and teskooano-labeled-value custom elements.",

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
