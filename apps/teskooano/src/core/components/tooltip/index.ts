import { createComponentPlugin } from "@teskooano/ui-plugin";
import { TeskooanoTooltip } from "./Tooltip";

export * from "./Tooltip";

/**
 * Plugin definition for the core Tooltip component.
 *
 * This plugin provides a flexible tooltip component with reactive state management
 * using the new UI patterns.
 */
export const plugin = createComponentPlugin({
  id: "teskooano-tooltip",
  name: "Teskooano Tooltip",
  description:
    "Provides the teskooano-tooltip custom element with reactive state management.",
  components: [
    {
      tagName: "teskooano-tooltip",
      componentClass: TeskooanoTooltip,
    },
  ],
  version: "2.0.0", // Version bump for the new reactive patterns
});
