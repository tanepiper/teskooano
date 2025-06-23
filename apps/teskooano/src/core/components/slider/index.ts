import { createComponentPlugin } from "@teskooano/ui-plugin";
import { TeskooanoSlider } from "./Slider";

export * from "./Slider";

/**
 * Plugin definition for the core Slider component.
 */
export const plugin = createComponentPlugin({
  id: "teskooano-slider",
  name: "Teskooano Slider",
  description: "Provides the teskooano-slider custom element.",
  components: [
    {
      tagName: "teskooano-slider",
      componentClass: TeskooanoSlider,
    },
  ],
});
