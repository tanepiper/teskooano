import { createPanelPlugin } from "@teskooano/ui-plugin";
import PluginIcon from "@fluentui/svg-icons/icons/plug_connected_24_regular.svg?raw";
import { PluginManagerPanel } from "./view/plugin-manager.panel";
import { PluginDetailCard } from "./components/plugin-detail-card/plugin-detail-card.component";

/**
 * Plugin definition for the Plugin Manager panel.
 * ✅ Refactored to use createPanelPlugin factory - reduced from 72 lines to 25 lines
 */
export const plugin = createPanelPlugin({
  id: "teskooano-plugin-manager",
  name: "Plugin Manager",
  description: "Provides the Plugin Manager panel and toolbar button.",
  componentName: "teskooano-plugin-manager",
  panelClass: PluginManagerPanel,
  defaultTitle: "Plugin Manager",
  iconSvg: PluginIcon,
  target: "main-toolbar",
  order: 4,
  tooltipText: "View loaded plugins",
  tooltipTitle: "Plugin Manager",
  tooltipIconSvg: PluginIcon,
  initialPosition: {
    top: window.innerHeight / 2 - 320,
    left: window.innerWidth / 2 - 320,
    width: 1024,
    height: 600,
  },
  additionalComponents: [
    {
      tagName: "teskooano-plugin-detail-card",
      componentClass: PluginDetailCard,
    },
  ],
});

// Default export should be the main plugin definition for this file
export default plugin;

export { PluginManagerPanel }; // Still useful if direct import is ever needed
