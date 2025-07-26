import { createComponentPlugin } from "@teskooano/ui-plugin";
import { TeskooanoButton } from "./Button";

export * from "./Button";

/**
 * Plugin definition for the core Button component.
 *
 * This component showcases the new Teskooano UI patterns including:
 * - Reactive state management with computed properties
 * - Event-driven communication with typed events
 * - Automatic cleanup and memory management
 * - Declarative tooltip management
 */
export const plugin = createComponentPlugin({
  id: "teskooano-button",
  name: "Teskooano Button",
  description:
    "Modern reactive button component with integrated tooltip functionality. Built with Teskooano UI patterns for superior developer experience.",
  version: "2.0.0",
  components: [
    {
      tagName: "teskooano-button",
      componentClass: TeskooanoButton,
    },
  ],
});
