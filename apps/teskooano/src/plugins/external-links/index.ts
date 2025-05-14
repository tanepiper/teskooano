import type {
  TeskooanoPlugin,
  ComponentConfig,
  ToolbarWidgetConfig,
} from "@teskooano/ui-plugin";

import { ExternalLinksComponent } from "./ExternalLinks";
export * from "./types";

/** Configuration for the ExternalLinksComponent custom element. */
const externalLinksComponentConfig: ComponentConfig = {
  tagName: "teskooano-external-links-component",
  componentClass: ExternalLinksComponent,
};

/** Configuration for adding the ExternalLinksComponent as a toolbar widget. */
const externalLinksWidget: ToolbarWidgetConfig = {
  id: "main-toolbar-external-links",
  target: "main-toolbar",
  componentName: externalLinksComponentConfig.tagName,
  order: 30,
};

/**
 * Teskooano Plugin Definition: External Links
 *
 * This plugin defines and registers the `teskooano-external-links-component`
 * custom element and configures it to be placed as a widget within the
 * main application toolbar (`main-toolbar`).
 */
export const plugin: TeskooanoPlugin = {
  id: "teskooano-external-links",
  name: "External Links Widget",
  description:
    "Provides external link buttons (GitHub, Mastodon) for the main toolbar.",
  dependencies: [],
  panels: [],
  functions: [],
  managerClasses: [],
  components: [externalLinksComponentConfig],
  toolbarRegistrations: [],
  toolbarWidgets: [externalLinksWidget],
  initialize: () => {
    // console.log("External Links plugin initialized.");
  },
  dispose: () => {
    // console.log("External Links plugin disposed.");
  },
};

export { ExternalLinksComponent };
