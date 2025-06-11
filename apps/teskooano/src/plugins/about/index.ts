// Attempt imports - paths might need adjustment based on TS path mappings
import type {
  TeskooanoPlugin,
  PanelConfig,
  ToolbarRegistration,
  ComponentConfig,
} from "@teskooano/ui-plugin";
import { AboutPanel } from "./view/AboutPanel.view.js";
import QuestionIcon from "@fluentui/svg-icons/icons/question_circle_24_regular.svg?raw"; // Using info icon

// Define how the AboutPanel is registered in Dockview
const panelConfig: PanelConfig = {
  componentName: AboutPanel.componentName,
  panelClass: AboutPanel,
  defaultTitle: `About Teskooano`,
  // Removed dependencies from here
};

// Define the toolbar button registration
const toolbarRegistration: ToolbarRegistration = {
  // Target the main application toolbar (adjust if different)
  target: "main-toolbar",
  items: [
    {
      id: "about-panel-button",
      type: "panel",
      title: `About Teskooano`,
      iconSvg: QuestionIcon,
      componentName: panelConfig.componentName, // Links button to the panel
      behaviour: "toggle", // Open/close panel on click
      order: 5, // Place it towards the end of the toolbar
      tooltipText: "Version and dependency information",
      tooltipTitle: `🔭 Teskooano ${import.meta.env.PACKAGE_VERSION}`,
      tooltipIconSvg: QuestionIcon,
      // Optional: Define initial floating position and size
      initialPosition: {
        top: 100,
        left: 100,
        width: 450,
        height: 500,
      },
    },
  ],
};

const componentConfig: ComponentConfig = {
  tagName: AboutPanel.componentName,
  componentClass: AboutPanel,
};

/**
 * Plugin definition for the About panel.
 *
 * Registers the AboutPanel and its associated toolbar button.
 */
export const plugin: TeskooanoPlugin = {
  id: "teskooano-about",
  name: "About Panel",
  description: "Provides the About panel and toolbar button.",
  panels: [panelConfig],
  toolbarRegistrations: [toolbarRegistration],
  functions: [],
  components: [componentConfig],
  managerClasses: [],
  // Add dependencies if needed, e.g., core components
  dependencies: ["teskooano-card"],
};
