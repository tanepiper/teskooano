import type { TeskooanoPlugin } from "@teskooano/ui-plugin";
import { ExternalLinksComponent } from "./view/ExternalLinks.view.js";

export * from "./types.js";

/**
 * Plugin definition for the External Links widget.
 */
export const plugin: TeskooanoPlugin = {
  id: "teskooano-external-links",
  name: "External Links Widget",
  description:
    "Provides external link buttons (GitHub, Mastodon) for the main toolbar.",
  components: [
    {
      tagName: "teskooano-external-links-component",
      componentClass: ExternalLinksComponent,
    },
  ],
  toolbarWidgets: [
    {
      id: "main-toolbar-external-links",
      componentName: "teskooano-external-links-component",
      target: "main-toolbar",
      order: 100,
    },
  ],
};

export { ExternalLinksComponent };
