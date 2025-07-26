import { createComponentPlugin } from "@teskooano/ui-plugin";
import { TeskooanoCard } from "./Card";
import CardIcon from "@fluentui/svg-icons/icons/card_ui_portrait_flip_24_regular.svg?raw";

export * from "./Card";

/**
 * Plugin definition for the core Card component.
 *
 * This plugin provides a flexible card component with reactive state management
 * using the new UI patterns.
 */
export const plugin = createComponentPlugin({
  id: "teskooano-card",
  name: "Teskooano Card",
  description:
    "Provides the teskooano-card custom element with reactive state management.",
  version: "2.0.0", // Version bump for the new reactive patterns
  icon: CardIcon,
  components: [
    {
      tagName: "teskooano-card",
      componentClass: TeskooanoCard,
    },
  ],
});
