import type { TeskooanoPlugin } from "@teskooano/ui-plugin";
import { EngineToolbarManager } from "./EngineToolbarManager";

export * from "./EngineToolbar";
export * from "./EngineToolbarManager";

export const plugin: TeskooanoPlugin = {
  id: "core-engine-toolbar",
  name: "Core Engine Toolbar Manager",
  description: "Provides the manager service for engine overlay toolbars.",
  panels: [],
  components: [],
  functions: [],
  toolbarRegistrations: [],
  managerClasses: [
    {
      id: "engine-toolbar-manager",
      managerClass: EngineToolbarManager,
    },
  ],
};
