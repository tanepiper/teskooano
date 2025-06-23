import { createComponentPlugin } from "@teskooano/ui-plugin";
import { ExternalLinksComponent } from "./view/ExternalLinks.view.js";

export * from "./types.js";

/**
 * Plugin definition for the External Links widget.
 * ✅ Refactored to use createComponentPlugin factory - reduced from 46 lines to 18 lines
 */
export const plugin = createComponentPlugin({
  id: "teskooano-external-links",
  name: "External Links Widget",
  description: "Provides external link buttons (GitHub, Mastodon) for the main toolbar.",
  components: [
    {
      tagName: "teskooano-external-links-component",
      componentClass: ExternalLinksComponent,
    },
  ],
});

export { ExternalLinksComponent };
