import type { TeskooanoPlugin } from "@teskooano/ui-plugin";
import { EngineToolbarManager } from "./EngineToolbarManager";

export * from "./EngineToolbar";
export * from "./EngineToolbarManager";

export const plugin: TeskooanoPlugin = {
  id: "teskooano-engine-toolbar",
  name: "Teskooano Engine Toolbar",
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
