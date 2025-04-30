import type { TeskooanoPlugin } from "@teskooano/ui-plugin";
import { CameraManager } from "./CameraManager";

/**
 * Plugin definition for the core CameraManager.
 *
 * Note: CameraManager is not a UI component (Panel/Widget/Function).
 * It provides camera control logic used by other components (like CompositeEnginePanel).
 * The TeskooanoPlugin interface might need a dedicated field (e.g., 'managers',
 * 'services', or 'classes') to formally register such non-UI plugins.
 * For now, its presence as a plugin file primarily serves dependency tracking.
 */
export const plugin: TeskooanoPlugin = {
  id: "camera-manager", // Unique ID for this plugin
  name: "Camera Manager",
  description: "Provides camera control and state management logic.",
  managerClasses: [
    {
      id: "camera-manager", // ID used to retrieve the class later
      managerClass: CameraManager,
    },
  ],
  panels: [], // Still not a UI panel
  functions: [], // Not a UI function
  toolbarRegistrations: [], // No toolbar items
  toolbarWidgets: [], // No toolbar widgets
}; 