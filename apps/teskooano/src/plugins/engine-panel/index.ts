import type { TeskooanoPlugin } from "@teskooano/ui-plugin";
import { plugin as viewsPlugin } from "./panels";
import { addCompositeEnginePanelFunction } from "./main-toolbar/engine-view/EngineViewManager";
import { plugin as systemControlsPlugin } from "./main-toolbar/system-controls";

import {
  simulationControlsWidget,
  systemControlsWidget,
  addViewButtonRegistration,
} from "./main-toolbar/toolbar-definitions";

/**
 * A composite plugin that aggregates all functionality related to the engine panel.
 *
 * This plugin bundles:
 * - The engine view panel itself from the 'panels' module.
 * - The system controls plugin, which provides its own functions and components.
 * - Toolbar widgets and registrations.
 */
export const plugin: TeskooanoPlugin = {
  id: "teskooano-engine-panel",
  name: "Engine Panel & System Actions",
  description:
    "Registers engine view panels and provides core system actions (generate, import, export, clear, etc.).",

  // Aggregate all parts from sub-modules directly
  panels: [...(viewsPlugin.panels ?? [])],
  functions: [
    addCompositeEnginePanelFunction,
    ...(systemControlsPlugin.functions ?? []),
  ],
  components: [...(systemControlsPlugin.components ?? [])],
  toolbarRegistrations: [addViewButtonRegistration],
  toolbarWidgets: [simulationControlsWidget, systemControlsWidget],
};
