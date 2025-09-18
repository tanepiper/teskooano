import { createPanelPlugin } from "@teskooano/ui-plugin";
import { DebugPanel } from "./view/debug-panel.view";
import bugIcon from "./assets/bug_icon.svg?raw";
import { RendererStatsComponent } from "./components/renderer-stats/renderer-stats.component";
import { SystemHierarchyComponent } from "./components/system-hierarchy/system-hierarchy.component";
import { HierarchyStatsComponent } from "./components/hierarchy-stats/hierarchy-stats.component";

const COMPONENT_NAME = "teskooano-debug-panel";

/**
 * The Debug Panel plugin provides a powerful "System Inspector" for viewing
 * real-time simulation state, intended to be opened from an engine view's toolbar.
 * ✅ Refactored to use createPanelPlugin factory - reduced from 55 lines to 25 lines
 */
export const plugin = createPanelPlugin({
  id: "teskooano-debug-panel",
  name: "System Inspector",
  description: "System Inspector for viewing real-time simulation state",
  componentName: COMPONENT_NAME,
  panelClass: DebugPanel,
  defaultTitle: "System Inspector",
  iconSvg: bugIcon,
  target: "engine-toolbar",
  order: 101,
  additionalComponents: [
    {
      tagName: "teskooano-renderer-stats",
      componentClass: RendererStatsComponent,
    },
    {
      tagName: "teskooano-system-hierarchy",
      componentClass: SystemHierarchyComponent,
    },
    {
      tagName: "hierarchy-stats",
      componentClass: HierarchyStatsComponent,
    },
  ],
});
