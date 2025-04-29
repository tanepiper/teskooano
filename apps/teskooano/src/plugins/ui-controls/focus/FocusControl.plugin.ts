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

// Export the plugin definition adhering to the TeskooanoPlugin interface
export const plugin: TeskooanoPlugin = {
  id: "core-focus-controls", // Unique ID for this plugin
  name: "Core Focus Controls",
  description: "Provides the focus control panel and toolbar button.",
  panels: [panelConfig], // Register the panel
  toolbarRegistrations: [toolbarRegistration], // Register the toolbar item(s)
  // No components to register here, FocusControl itself is a panel, not a base component
  // Optional initialize function if needed
  // initialize: () => { ... }
};
