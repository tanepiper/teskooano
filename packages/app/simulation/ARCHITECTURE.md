## Simulation Package Analysis (`packages/app/simulation`)

**Purpose**: This package manages the core simulation lifecycle, the physics loop, high-level camera control, and system initialization. It acts as the "engine" that drives the simulation based on data from the state management packages.

**Key Components:**

1.  **`SimulationManager.ts`**: This is the heart of the package, implemented as a singleton.

    - **Physics Loop (`simulationStep`)**: Manages the core `requestAnimationFrame` loop. It's not started by default; it is reactively started by the UI (specifically `PanelLifecycleManager`) when a system is loaded.
    - **Time Management**: Calculates `deltaTime` between frames, caps it for stability (to prevent physics explosions), and applies the `timeScale` from the global state.
    - **State Integration**:
      1.  Reads the current physics state from `@teskooano/core-state` using the `physicsSystemAdapter`.
      2.  Calls the `updateSimulation` function from `@teskooano/core-physics` to perform all calculations.
      3.  Receives the results and updates the global state via `physicsSystemAdapter.updateStateFromResult`.
    - **Event Bus**: Uses RxJS `Subject`s (`onOrbitUpdate`, `onDestructionOccurred`, `onResetTime`) to broadcast key simulation events to any listeners.
    - **Lifecycle**: Provides `startLoop`, `stopLoop`, and `dispose` methods. `resetSystem` is used to clear the current simulation state.

2.  **`camera/CameraManager.ts`**: A class responsible for the _semantic_ state of the camera.

    - **Decoupled Logic**: It does not directly manipulate the `THREE.Camera`. Instead, it manages the high-level state, such as which object is focused (`focusedObjectId`), the desired FOV, and the current camera position/target.
    - **State Emission**: Exposes its state via an RxJS `BehaviorSubject` (`getCameraState$`), allowing UI components to react to camera changes.
    - **API for Intent**: Provides a clean API for camera actions like `followObject(objectId)`, `pointCameraAt(position)`, `setFov(fov)`, and `resetCameraView()`. These actions are translated into commands for the renderer's `ControlsManager`.
    - **Dependency Injection**: It receives the `ModularSpaceRenderer` instance and other dependencies via a `setDependencies` method, making it independent of how the renderer is created.

3.  **`systems/`**: This directory contains modules for initializing predefined star systems (e.g., `solar-system/`).
    - **Data-Driven**: These modules are not part of the core simulation logic. They are simply data initializers that use `actions` from `@teskooano/core-state` to populate the stores with the celestial objects that the `SimulationManager` will then act upon. The `initializeSun` function in `star.ts`, for instance, calls `actions.createSolarSystem`, which clears previous state and sets up the new primary star.

**Key Characteristics & Design:**

- **Singleton Manager**: The `SimulationManager` provides a single, consistent entry point for controlling the simulation loop.
- **Reactive Loop**: The simulation loop is not always running. It's a resource that is started and stopped based on application state (i.e., whether there are objects to simulate).
- **Clear Separation of Concerns**:
  - `SimulationManager` handles the "when" and "how" of the physics update cycle.
  - `CameraManager` handles the "what" of camera intent, separate from the low-level rendering implementation.
  - `@teskooano/core-physics` handles the "what" of the physics calculations.
  - `@teskooano/core-state` is the single source of truth for all data.
- **Event-Driven Communication**: Core events are broadcast via RxJS observables, decoupling the simulation from its listeners.

**Data Flow Summary:**

1.  **Initialization**: A UI action triggers an initializer function from `systems/`.
2.  **State Population**: The initializer calls `actions` in `@teskooano/core-state` to populate the `celestialObjects$` store.
3.  **Loop Start**: A UI component (`PanelLifecycleManager`) detects the new objects in the state and calls `simulationManager.startLoop()`.
4.  **Physics Update**: In each frame, `simulationManager` reads from `core-state` (via adapter), calls `core-physics`, and writes results back to `core-state`.
5.  **Event Emission**: `simulationManager` emits an `onOrbitUpdate` event with the new positions.
6.  **Rendering**: (Managed externally) `@teskooano/renderer-threejs` listens to state changes (`renderableObjects$`) and draws the scene.
7.  **Camera Control**: UI components call methods on `CameraManager` (e.g., `followObject('earth')`), which then directs the renderer's `ControlsManager` to perform the action.

**Dependencies**: `@teskooano/core-state`, `@teskooano/core-physics`, `@teskooano/data-types`, `three`.
