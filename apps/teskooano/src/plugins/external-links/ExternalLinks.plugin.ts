import type {
  TeskooanoPlugin,
  // Remove unused toolbar item types
  // PanelToolbarItemConfig,
  // ComponentToolbarItemConfig,
  // Add required types
  // Remove unused ToolbarRegistration and ToolbarWidgetConfig
  // ToolbarRegistration,
  ComponentConfig,
  // ToolbarWidgetConfig,
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

// Remove the toolbar widget configuration - it seems components are registered directly
// const externalLinksToolbarWidget: ToolbarWidgetConfig = {
//   id: "widget-external-links", // Unique ID for the widget instance
//   target: "main-toolbar", // <--- Changed target to main-toolbar
//   componentName: externalLinksComponentConfig.tagName, // Tag name of the component
//   order: 900, // Display order (may need adjustment relative to main toolbar items)
//   // Alignment might need to be handled by CSS in the toolbar layout
// };

// Define the overall plugin using the correct structure
export const plugin: TeskooanoPlugin = {
  id: "core-external-links",
  name: "External Links",
  description: "Provides external link buttons embedded in the main toolbar.", // Updated description
  dependencies: [],
  panels: [], // No panels
  functions: [], // No functions
  managerClasses: [], // No manager classes
  components: [externalLinksComponentConfig], // Register the custom element
  toolbarRegistrations: [], // No toolbar registrations needed if components are handled directly
  initialize: () => {
    console.log("[ExternalLinksPlugin] Initialized.");
  },
  dispose: () => {
    console.log("[ExternalLinksPlugin] Disposed.");
  },
}; 