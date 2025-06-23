import { createComponentPlugin } from "@teskooano/ui-plugin";
import { TeskooanoCard } from "./Card";
import CardIcon from "@fluentui/svg-icons/icons/card_ui_portrait_flip_24_regular.svg?raw";

export * from "./Card";

/**
 * Plugin definition for the core Card component.
 */
export const plugin = createComponentPlugin({
  id: "teskooano-card",
  name: "Teskooano Card",
  description: "Provides the teskooano-card custom element.",
  version: "0.0.1",
  icon: CardIcon,
  components: [
    {
      tagName: "teskooano-card",
      componentClass: TeskooanoCard,
    },
  ],
});
