import { createPanelPlugin } from "@teskooano/ui-plugin";
import DebugPanelSvelte from "./view/DebugPanel.svelte";
import bugIcon from "./assets/bug_icon.svg?raw";

/**
 * The Debug Panel plugin provides a powerful "System Inspector" for viewing
 * real-time simulation state, intended to be opened from an engine view's toolbar.
 * ✅ Migrated to Svelte 5
 */
export const plugin = createPanelPlugin({
  id: "teskooano-debug-panel",
  name: "System Inspector",
  description: "System Inspector for viewing real-time simulation state",
  componentName: "teskooano-debug-panel",
  svelteComponent: DebugPanelSvelte,
  defaultTitle: "System Inspector",
  iconSvg: bugIcon,
  target: "engine-toolbar",
  order: 101,
});
