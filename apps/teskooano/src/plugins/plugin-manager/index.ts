import { createPanelPlugin } from "@teskooano/ui-plugin";
import PluginIcon from "@fluentui/svg-icons/icons/plug_connected_24_regular.svg?raw";
import PluginManagerPanelSvelte from "./view/PluginManagerPanel.svelte";

/**
 * Plugin definition for the Plugin Manager panel.
 * Migrated to Svelte — no custom elements registered.
 */
export const plugin = createPanelPlugin({
  id: "teskooano-plugin-manager",
  name: "Plugin Manager",
  description: "Provides the Plugin Manager panel and toolbar button.",
  componentName: "teskooano-plugin-manager",
  svelteComponent: PluginManagerPanelSvelte,
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
});

export default plugin;
