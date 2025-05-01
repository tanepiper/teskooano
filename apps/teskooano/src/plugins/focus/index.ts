import type {
  TeskooanoPlugin,
  PanelConfig,
  ToolbarRegistration,
} from "@teskooano/ui-plugin";
import { FocusControl } from "./FocusControl"; // Import the panel class
import TargetIcon from "@fluentui/svg-icons/icons/target_24_regular.svg?raw";

// Define the panel configuration using the imported class
const panelConfig: PanelConfig = {
  componentName: "focus-control", // Unique name for Dockview
  panelClass: FocusControl, // The class implementing IContentRenderer
  defaultTitle: "Focus Control",
};

// Define the toolbar registration for the engine toolbar
const toolbarRegistration: ToolbarRegistration = {
  target: "engine-toolbar",
  items: [
    {
      id: "focus-control-button", // Unique ID for the button itself
      type: "panel",
      title: "Focus Control",
      iconSvg: TargetIcon,
      componentName: "focus-control", // The panel to open
      behaviour: "toggle",
      // Use the initial position data previously in FocusControl static config
      initialPosition: {
        top: 150,
        left: 50,
        width: 400,
        height: 650,
      },
      order: 10, // Example order
    },
  ],
};

/**
 * Plugin definition for the Focus Control panel.
 *
 * Registers the FocusControl panel and its associated toolbar button
 * for selecting and focusing on celestial objects.
 */
export const plugin: TeskooanoPlugin = {
  id: "teskooano-focus-controls", // Updated ID
  name: "Focus Controls",
  description: "Provides the focus control panel and toolbar button.",
  panels: [panelConfig], // Register the panel
  toolbarRegistrations: [toolbarRegistration], // Register the toolbar item(s)
  functions: [],
  toolbarWidgets: [],
  managerClasses: [],
};

// Export the panel component directly if needed elsewhere
export { FocusControl };
