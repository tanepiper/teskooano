import type { TeskooanoPlugin } from "@teskooano/ui-plugin";
import { EngineToolbarManager } from "./EngineToolbarManager";

// --- Plugin Definition ---
// This plugin provides the EngineToolbarManager service
export const plugin: TeskooanoPlugin = {
  id: "core-engine-toolbar",
  name: "Core Engine Toolbar",
  description: "Provides the manager service for engine overlay toolbars.",
  panels: [], // Does not provide Dockview panels
  components: [], // Does not provide standalone custom elements
  functions: [], // No functions exposed currently
  toolbarRegistrations: [], // Does not register buttons itself, only provides the manager
  managerClasses: [
    {
      id: "engine-toolbar-manager", // ID to use with getManagerClass()
      managerClass: EngineToolbarManager, // The class providing the service
    },
  ],
  // Optional initialize/dispose if the manager needs setup/teardown
};
