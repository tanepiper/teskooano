# Panel Managers

This directory contains manager and coordinator classes responsible for handling specific pieces of logic for the `CompositeEnginePanel`. This pattern keeps the main panel component lean and focused on orchestration and DOM management, while delegating complex tasks to these specialized classes. This aligns with the **Orchestrator Panel** pattern described in the parent directory's `README.md`.

## Managers

### `PanelLifecycleManager`

- **Responsibility**: Manages the core lifecycle of the panel's renderer and UI.
- **Mechanism**: It subscribes to the global `celestialObjects$` state stream. When celestial objects are added to the simulation, it triggers the creation of the `ModularSpaceRenderer` and its associated UI elements (like the toolbar). When the last object is removed, it tears down the renderer and UI to conserve resources, showing a placeholder instead. It also listens to global system generation events to show a loading/progress state on the placeholder.

### `PanelCameraCoordinator`

- **Responsibility**: Orchestrates the setup and state synchronization of all camera-related components.
- **Mechanism**: It creates and initializes the main `CameraManager` (which handles the Three.js camera's position, target, and controls) and the `EngineCameraManager` (which provides a clean, panel-specific API for camera actions). It ensures that the panel's internal view state is kept in sync with the camera's state (e.g., position, FOV, focused object) and vice-versa.

### `PanelEventManager`

- **Responsibility**: Manages all other event subscriptions for the panel.
- **Mechanism**: It consolidates subscriptions to various streams like `simulationState$` and `layoutOrientation$`. This keeps the main panel's subscription logic clean and centralized, preventing subscription spaghetti in the main component.

## Flow Diagram

This diagram shows how the `CompositeEnginePanel` instantiates the managers and how they subscribe to different event sources to do their work.

```mermaid
graph TD
    subgraph CompositeEnginePanel
        direction LR
        A[HTMLElement / Dockview Renderer]
    end

    subgraph Managers
        direction TB
        B[PanelLifecycleManager]
        C[PanelCameraCoordinator]
        D[PanelEventManager]
    end

    subgraph "Global State & Events"
        direction RL
        E[celestialObjects$]
        F[simulationState$]
        G[Window Events <br/> (system-generation)]
        H[layoutOrientation$]
    end

    A -- "instantiates" --> B;
    A -- "instantiates" --> C;
    A -- "instantiates" --> D;

    E --> B;
    G --> B;
    B -- "triggers create/destroy on" --> A;

    A -- "passes renderer, viewState$ to" --> C;
    C -- "controls camera for" --> A;


    F --> D;
    H --> D;
    D -- "triggers resize/updates on" --> A;
```
