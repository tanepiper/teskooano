import type { TeskooanoPlugin } from "@teskooano/ui-plugin";
import { DebugPanel } from "./view/debug-panel.view";
import bugIcon from "./assets/bug_icon.svg?raw";
import { RendererStatsComponent } from "./components/renderer-stats/renderer-stats.component";
import { SystemHierarchyComponent } from "./components/system-hierarchy/system-hierarchy.component";

const COMPONENT_NAME = "teskooano-debug-panel";

/**
 * The Debug Panel plugin provides a powerful "System Inspector" for viewing
 * real-time simulation state, intended to be opened from an engine view's toolbar.
 */
export const plugin: TeskooanoPlugin = {
  id: "teskooano-debug-panel",
  name: "System Inspector",
  components: [
    {
      tagName: COMPONENT_NAME,
      componentClass: DebugPanel,
    },
    {
      tagName: "teskooano-renderer-stats",
      componentClass: RendererStatsComponent,
    },
    {
      tagName: "teskooano-system-hierarchy",
      componentClass: SystemHierarchyComponent,
    },
  ],
  panels: [
    {
      componentName: COMPONENT_NAME,
      panelClass: DebugPanel,
      defaultTitle: "System Inspector",
    },
  ],
  toolbarRegistrations: [
    {
      target: "engine-toolbar",
      items: [
        {
          id: "debug-panel-button",
          title: "System Inspector",
          iconSvg: bugIcon,
          order: 101,
          type: "panel",
          componentName: COMPONENT_NAME,
          panelTitle: "System Inspector",
          behaviour: "toggle",
        },
      ],
    },
  ],
};
