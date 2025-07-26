import { createComponentPlugin } from "@teskooano/ui-plugin";
import { TeskooanoSlider } from "./Slider";

export * from "./Slider";

/**
 * Plugin definition for the core Slider component.
 *
 * This plugin provides a highly configurable range input slider component
 * with reactive state management using the new UI patterns.
 */
export const plugin = createComponentPlugin({
  id: "teskooano-slider",
  name: "Teskooano Slider",
  description:
    "Provides the teskooano-slider custom element with reactive state management.",
  components: [
    {
      tagName: "teskooano-slider",
      componentClass: TeskooanoSlider,
    },
  ],
  version: "2.0.0", // Version bump for the new reactive patterns
});
