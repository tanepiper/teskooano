import { createPanelPlugin } from "@teskooano/ui-plugin";
import CelestialHierarchyPanelSvelte from "./view/CelestialHierarchyPanel.svelte";
import TargetIcon from "@fluentui/svg-icons/icons/target_24_regular.svg?raw";

/**
 * Plugin definition for the Celestial Hierarchy panel.
 * ✅ Migrated to Svelte 5
 */
export const plugin = createPanelPlugin({
  id: "teskooano-celestial-hierarchy",
  name: "Celestial Hierarchy",
  description: "Provides the celestial hierarchy panel and toolbar button.",
  componentName: "celestial-hierarchy",
  svelteComponent: CelestialHierarchyPanelSvelte,
  defaultTitle: "Celestial Hierarchy",
  iconSvg: TargetIcon,
  target: "engine-toolbar",
  order: 10,
  initialPosition: {
    top: 100,
    left: window.innerWidth - 450,
    width: 450,
    height: 750,
  },
});
