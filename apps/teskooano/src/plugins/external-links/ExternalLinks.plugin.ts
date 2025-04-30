import type {
  TeskooanoPlugin,
  // Remove unused toolbar item types
  // PanelToolbarItemConfig,
  // ComponentToolbarItemConfig,
  // Add required types
  // Remove unused ToolbarRegistration and ToolbarWidgetConfig
  // ToolbarRegistration,
  ComponentConfig,
  ToolbarWidgetConfig,
} from "@teskooano/ui-plugin";

// Import the component class
import { ExternalLinksComponent } from "./ExternalLinks";

// Icon for the toolbar button
// import ArrowExportLtrRegular from "@fluentui/svg-icons/icons/arrow_export_ltr_24_regular.svg?raw";
// Not needed for direct component embedding, maybe? Let's remove for now.

// Remove the panel config - no longer needed
// const externalLinksPanelConfig: PanelConfig = {
//   componentName: "teskooano-external-links-panel",
//   panelClass: ExternalLinksPanel,
//   defaultTitle: "External Links",
// };

// Define the component configuration for registration
const externalLinksComponentConfig: ComponentConfig = {
  tagName: "teskooano-external-links-component",
  componentClass: ExternalLinksComponent,
};

// Toolbar Widget Configuration (defined locally)
const externalLinksWidget: ToolbarWidgetConfig = {
  id: "main-toolbar-external-links", // Matches ID used in toolbar-definitions.ts (consistency)
  target: "main-toolbar", // Target the main toolbar's widget area
  componentName: externalLinksComponentConfig.tagName, // Tag name of the component
  order: 30, // Suggest an order (adjust as needed)
};

// Define the overall plugin using the correct structure
export const plugin: TeskooanoPlugin = {
  id: "core-external-links",
  name: "External Links",
  description: "Provides external link buttons for the main toolbar.",
  dependencies: [],
  panels: [], // No panels
  functions: [], // No functions
  managerClasses: [], // No manager classes
  components: [externalLinksComponentConfig], // Register the custom element
  toolbarRegistrations: [], // No standard toolbar buttons/functions
  toolbarWidgets: [externalLinksWidget], // Register the widget directly
  initialize: () => {
    console.log("[ExternalLinksPlugin] Initialized.");
  },
  dispose: () => {
    console.log("[ExternalLinksPlugin] Disposed.");
  },
};
