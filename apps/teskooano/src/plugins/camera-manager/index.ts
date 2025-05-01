import type { TeskooanoPlugin } from "@teskooano/ui-plugin";
import { CameraManager } from "./CameraManager";

/**
 * Plugin definition for the CameraManager.
 *
 * Registers the CameraManager class so it can be retrieved as a singleton instance
 * using `getManagerInstance('camera-manager')` from `@teskooano/ui-plugin`.
 */
export const plugin: TeskooanoPlugin = {
  id: "teskooano-camera-manager", // Updated ID
  name: "Camera Manager",
  description: "Provides camera control and state management logic.",
  managerClasses: [
    {
      id: "camera-manager", // Keep this ID for retrieval
      managerClass: CameraManager,
    },
  ],
  panels: [],
  functions: [],
  toolbarRegistrations: [],
  toolbarWidgets: [],
};

// Export the class directly as well
export { CameraManager };
