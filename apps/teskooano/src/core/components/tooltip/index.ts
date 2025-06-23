import { createComponentPlugin } from "@teskooano/ui-plugin";
import { TeskooanoTooltip } from "./Tooltip";

export * from "./Tooltip";

/**
 * Plugin definition for the core Tooltip component.
 */
export const plugin = createComponentPlugin({
  id: "teskooano-tooltip",
  name: "Teskooano Tooltip",
  description: "Provides the teskooano-tooltip custom element.",
  components: [
    {
      tagName: "teskooano-tooltip",
      componentClass: TeskooanoTooltip,
    },
  ],
});
