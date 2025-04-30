# Teskooano Camera Manager Plugin (`camera-manager`)

## What?

This plugin provides the core `CameraManager` class responsible for managing the state and interactions of the camera within a Teskooano 3D engine view (specifically, views using `@teskooano/renderer-threejs`).

It handles:

- Tracking camera position and target.
- Managing the focused object state.
- Controlling the Field of View (FOV).
- Initiating camera transitions (focusing, resetting view).
- Listening to renderer events to update its internal state.
- Exposing its state via a Nanostores atom.

## Why?

- **Decoupling:** Separates camera control logic from specific UI panels (like `CompositeEnginePanel`), making the panel code cleaner and the camera logic reusable.
- **State Management:** Provides a centralized, reactive state store (`WritableAtom<CameraManagerState>`) for camera properties (position, target, focus, FOV).
- **Consistent Control:** Offers a unified API for common camera operations.

## Where?

- **Definition:** `apps/teskooano/src/plugins/camera-manager/`
- **Registration:** Defined in `CameraManager.plugin.ts`.
- **Usage:** Primarily instantiated and used by `CompositeEnginePanel` to manage its camera.

## When?

This manager is used whenever a 3D view requires camera manipulation beyond basic user controls, such as:

- Programmatically focusing on specific celestial objects.
- Setting or changing the camera's FOV.
- Resetting the camera view to a default state.
- Syncing external UI state with the camera's state (e.g., displaying the currently focused object).

## How?

1.  **Plugin Registration:**

    - The plugin is registered with the application via `apps/teskooano/src/config/pluginRegistry.ts`.
    - The `CameraManager.plugin.ts` file defines the plugin metadata.
    - **Important:** To make the class retrievable via the plugin system, ensure the `managerClasses` field is correctly added to `CameraManager.plugin.ts` (this might require rebuilding `@teskooano/ui-plugin` if type errors occur):

      ```typescript
      // In CameraManager.plugin.ts
      import { CameraManager } from "./CameraManager";
      import type { TeskooanoPlugin } from "@teskooano/ui-plugin";

      export const plugin: TeskooanoPlugin = {
        id: "camera-manager",
        // ... other fields
        managerClasses: [
          {
            id: "camera-manager", // Must match plugin ID for convention
            managerClass: CameraManager,
          },
        ],
        // ... other fields
      };
      ```

2.  **Retrieval (in consuming code, e.g., `CompositeEnginePanel`):**

    - Import the necessary functions and types:
      ```typescript
      import { getManagerClass } from "@teskooano/ui-plugin";
      import type { CameraManager } from "../../camera-manager/CameraManager"; // Type import
      ```
    - Get the class constructor from the manager:
      ```typescript
      const CameraManagerClass = getManagerClass("camera-manager");
      if (!CameraManagerClass) {
        // Handle error: CameraManager plugin not loaded or registered correctly
        console.error("Failed to get CameraManager class!");
        return;
      }
      ```

3.  **Instantiation:**

    - Create an instance, providing the renderer and initial state options:

      ```typescript
      const renderer = /* ... get ModularSpaceRenderer instance ... */;
      const initialPanelState = /* ... get initial state (fov, focus, pos, target) ... */;

      const cameraManagerInstance = new CameraManagerClass({
        renderer: renderer,
        initialFov: initialPanelState.fov,
        initialFocusedObjectId: initialPanelState.focusedObjectId,
        initialCameraPosition: initialPanelState.cameraPosition,
        initialCameraTarget: initialPanelState.cameraTarget,
        onFocusChangeCallback: (focusedId: string | null) => {
          // Optional: Update panel state or UI when focus changes
          console.log(`Focus changed to: ${focusedId}`);
        },
      });

      // IMPORTANT: Initialize camera position in the renderer controls
      cameraManagerInstance.initializeCameraPosition();
      ```

4.  **Interaction:**

    - Call methods on the instance:
      ```typescript
      cameraManagerInstance.focusOnObject("earth");
      cameraManagerInstance.setFov(60);
      cameraManagerInstance.resetCameraView();
      ```

5.  **State Subscription:**

    - Listen to the manager's internal state atom:

      ```typescript
      // Get the BehaviorSubject (Observable)
      const cameraState$ = cameraManagerInstance.getCameraState$();

      // Subscribe to changes
      const subscription = cameraState$.subscribe((cameraState) => {
        // Update UI or other state based on camera changes
        const { currentPosition, currentTarget, focusedObjectId, fov } =
          cameraState;
        // ... update panel state ...
      });

      // Remember to call subscription.unsubscribe() on disposal!
      ```

## Cleanup

Call the `destroy()` method on the `CameraManager` instance when the component using it is disposed to remove event listeners.
