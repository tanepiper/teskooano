import type {
  TeskooanoPlugin,
  ComponentConfig,
  ToolbarWidgetConfig,
} from "@teskooano/ui-plugin";

import { ExternalLinksComponent } from "./ExternalLinks";

const externalLinksComponentConfig: ComponentConfig = {
  tagName: "teskooano-external-links-component",
  componentClass: ExternalLinksComponent,
};

const externalLinksWidget: ToolbarWidgetConfig = {
  id: "main-toolbar-external-links",
  target: "main-toolbar",
  componentName: externalLinksComponentConfig.tagName,
  order: 30,
};

/**
 * Plugin definition for the External Links toolbar widget.
 *
 * Registers the ExternalLinksComponent custom element and adds it as a widget
 * to the main application toolbar.
 */
export const plugin: TeskooanoPlugin = {
  id: "teskooano-external-links",
  name: "External Links Widget",
  description: "Provides external link buttons for the main toolbar.",
  dependencies: [],
  panels: [],
  functions: [],
  managerClasses: [],
  components: [externalLinksComponentConfig],
  toolbarRegistrations: [],
  toolbarWidgets: [externalLinksWidget],
  initialize: () => {},
  dispose: () => {},
};

export { ExternalLinksComponent };
