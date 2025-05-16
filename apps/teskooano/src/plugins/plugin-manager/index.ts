// Attempt imports - paths might need adjustment based on TS path mappings
import type {
  TeskooanoPlugin,
  PanelConfig,
  ToolbarRegistration,
} from "@teskooano/ui-plugin";
import PluginIcon from "@fluentui/svg-icons/icons/plug_connected_24_regular.svg?raw"; // Changed icon
import { PluginManagerPanel } from "./PluginManagerPanel";

// Define the toolbar button registration for Plugin Manager
const toolbarRegistration: ToolbarRegistration = {
  target: "main-toolbar",
  items: [
    {
      id: "plugin-manager-panel-button",
      type: "panel",
      title: "Plugin Manager",
      iconSvg: PluginIcon, // Using a settings/cog icon
      componentName: "teskooano-plugin-manager",
      behaviour: "toggle",
      order: 4, // Adjust order as needed
      tooltipText: "View loaded plugins",
      tooltipTitle: "Plugin Manager",
      tooltipIconSvg: PluginIcon,
      initialPosition: {
        top: window.innerHeight / 2 - 320,
        left: window.innerWidth / 2 - 320,
        width: 1024,
        height: 600,
      },
    },
  ],
};

/**
 * Plugin definition for the Plugin Manager panel.
 *
 * Registers the PluginManagerPanel and its associated toolbar button.
 */
export const plugin: TeskooanoPlugin = {
  id: "teskooano-plugin-manager",
  name: "Plugin Manager",
  description: "Provides the Plugin Manager panel and toolbar button.",
  panels: [
    {
      componentName: "teskooano-plugin-manager",
      panelClass: PluginManagerPanel,
      defaultTitle: "Plugin Manager",
    },
  ],
  toolbarRegistrations: [toolbarRegistration],
  functions: [],
  toolbarWidgets: [],
  managerClasses: [],
  dependencies: [], // No specific dependencies for now
};

// Default export should be the main plugin definition for this file
export default plugin;

export { PluginManagerPanel }; // Still useful if direct import is ever needed
