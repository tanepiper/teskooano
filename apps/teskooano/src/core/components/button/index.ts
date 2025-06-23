import { createComponentPlugin } from "@teskooano/ui-plugin";
import { TeskooanoButton } from "./Button";

export * from "./Button";

/**
 * Plugin definition for the core Button component.
 */
export const plugin = createComponentPlugin({
  id: "teskooano-button",
  name: "Teskooano Button",
  description: "Provides the teskooano-button custom element.",
  components: [
    {
      tagName: "teskooano-button",
      componentClass: TeskooanoButton,
    },
  ],
});
