# Camera Manager Plugin (`@teskooano/camera-manager`)

This plugin provides a centralized manager for controlling the camera within a Three.js scene, specifically tailored for the Teskooano engine's `ModularSpaceRenderer`.

## Purpose

To abstract camera movement, focusing logic, state management (position, target, FOV, focus), and user interactions (like smooth transitions and resetting views) away from individual panel components like `CompositeEnginePanel`.

## Features

- **Singleton Instance:** Registered via the `TeskooanoPlugin` system in `index.ts` and retrievable using `getManagerInstance('camera-manager')`.
- **Dependency Injection:** Takes necessary components like `ModularSpaceRenderer` during initialization (`setDependencies` method).
- **State Management:** Maintains internal camera state (position, target, FOV, focused object ID) using an RxJS `BehaviorSubject` (`_cameraStateSubject`).
- **Observable State:** Exposes the camera state via an observable (`getCameraState$()`).
- **Focus Control:**
  - `focusOnObject(objectId, distance?)`: Smoothly transitions the camera to focus on a specific celestial object.
  - `clearFocus()`: Resets focus to the system's origin.
  - `pointCameraAt(targetPosition)`: Points the camera towards a world coordinate without changing its position.
- **Camera Manipulation:**
  - `setFov(fov)`: Changes the camera's Field of View.
  - `resetCameraView()`: Resets the camera to a default position and target.
  - `setCameraPositionTarget(position, target)`: Directly sets camera position and look-at target.
- **Smooth Transitions:** Uses GSAP for smooth camera movements and FOV changes.
- **Event Handling:** Listens for renderer interaction events (like double-clicks) to trigger focus changes.
- **Lifecycle Management:** Includes `setDependencies` for initialization and potentially `destroy` for cleanup (though singleton nature might imply app lifetime).

## Usage

1.  **Registration:** The plugin is automatically registered when loaded via `loadAndRegisterPlugins` if `teskooano-camera-manager` is included in the `pluginConfig`.

2.  **Retrieval:** Get the singleton instance within components that need camera control (e.g., `CompositeEnginePanel`):

    ```typescript
    import { getManagerInstance, CameraManager } from "@teskooano/ui-plugin"; // Assuming CameraManager is re-exported or imported directly
    import { ModularSpaceRenderer } from "@teskooano/renderer-threejs";

    // Inside your component's initialization (e.g., CompositeEnginePanel.init)
    const cameraManager = getManagerInstance<CameraManager>("camera-manager");

    if (cameraManager) {
      const renderer: ModularSpaceRenderer = this.getRenderer(); // Get your renderer instance

      cameraManager.setDependencies({
        renderer: renderer,
        initialFov: 75,
        initialFocusedObjectId: null,
        initialCameraPosition: new THREE.Vector3(100, 100, 100),
        initialCameraTarget: new THREE.Vector3(0, 0, 0),
        onFocusChangeCallback: (focusedId) => {
          // Update panel state if needed
        },
      });

      // Use the manager
      cameraManager.focusOnObject("planet-earth");

      // Subscribe to state changes
      cameraManager.getCameraState$().subscribe((state) => {
        // Update UI based on camera state
      });
    } else {
      console.error("CameraManager instance not found!");
    }
    ```

3.  **Interaction:** Call methods like `focusOnObject`, `resetCameraView`, `setFov` on the retrieved `cameraManager` instance.

## Dependencies

- `@teskooano/ui-plugin`: For plugin registration and retrieval.
- `@teskooano/renderer-threejs`: Requires an instance of `ModularSpaceRenderer` during initialization.
- `three`: Core Three.js library.
- `rxjs`: For state management with `BehaviorSubject`.
- `gsap`: For smooth animation transitions.

## State (`CameraState`)

```typescript
interface CameraState {
  currentPosition: THREE.Vector3;
  currentTarget: THREE.Vector3;
  focusedObjectId: string | null;
  isTransitioning: boolean;
  fov: number;
}
```

## Key Methods

- `setDependencies(deps: CameraManagerDependencies)`: **Crucial initialization step.** Sets up the manager with the renderer and initial state.
- `getCameraState$(): Observable<CameraState>`: Get the observable stream of camera state changes.
- `getCurrentState(): CameraState`: Get the current state snapshot.
- `focusOnObject(objectId: string | null, distanceMultiplier?: number): void`
- `clearFocus(): void`
- `resetCameraView(): void`
- `setFov(fov: number): void`
- `setCameraPositionTarget(position: THREE.Vector3, target: THREE.Vector3): void`
- `pointCameraAt(targetPosition: THREE.Vector3): void`
