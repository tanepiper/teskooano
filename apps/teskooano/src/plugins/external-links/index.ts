import type {
  TeskooanoPlugin,
  ComponentConfig,
  ToolbarWidgetConfig,
} from "@teskooano/ui-plugin";

// Import the component class
import { ExternalLinksComponent } from "./ExternalLinks";

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

/**
 * Plugin definition for the External Links toolbar widget.
 *
 * Registers the ExternalLinksComponent custom element and adds it as a widget
 * to the main application toolbar.
 */
export const plugin: TeskooanoPlugin = {
  id: "teskooano-external-links", // Updated ID
  name: "External Links Widget",
  description: "Provides external link buttons for the main toolbar.",
  dependencies: [],
  panels: [], // No panels
  functions: [], // No functions
  managerClasses: [], // No manager classes
  components: [externalLinksComponentConfig], // Register the custom element
  toolbarRegistrations: [], // No standard toolbar buttons/functions
  toolbarWidgets: [externalLinksWidget], // Register the widget directly
  initialize: () => {},
  dispose: () => {},
};

// Export the component class directly if needed elsewhere
export { ExternalLinksComponent };
