import type { TeskooanoPlugin } from "@teskooano/ui-plugin";
import { CameraManager } from "./CameraManager";

/**
 * Plugin definition for the CameraManager.
 *
 * Registers the CameraManager class so it can be retrieved as a singleton instance
 * using `getManagerInstance('camera-manager')` from `@teskooano/ui-plugin`.
 */
export const plugin: TeskooanoPlugin = {
  id: "teskooano-camera-manager",
  name: "Teskooano Camera Manager",
  description: "Provides camera control and state management logic.",
  managerClasses: [
    {
      id: "camera-manager",
      managerClass: CameraManager,
    },
  ],
  panels: [],
  functions: [],
  toolbarRegistrations: [],
  toolbarWidgets: [],
};

export { CameraManager };
