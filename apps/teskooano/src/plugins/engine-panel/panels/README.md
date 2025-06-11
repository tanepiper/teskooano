# Engine Panel (`@teskooano/engine-panel/panels`)

This directory contains the core UI component for rendering the 3D space simulation: the `CompositeEnginePanel`.

## Architecture: The Orchestrator Panel Pattern

The `CompositeEnginePanel` is a self-contained, stateful component responsible for a single "view" into the shared simulation. It's designed to be instantiated multiple times, allowing users to have multiple independent camera angles and view settings.

It follows an **Orchestrator Panel** pattern. The `CompositeEnginePanel` custom element acts as a lean orchestrator, delegating complex logic to specialized manager classes. This keeps the component itself focused on its core responsibilities: managing its shadow DOM, handling Dockview lifecycle events, and coordinating its managers.

### Core Responsibilities & Managers

- **`CompositeEnginePanel.ts` (The Orchestrator)**:

  - **State Management**: Manages its own private RxJS `BehaviorSubject` for its view state (`CompositeEngineState`), ensuring panel independence.
  - **DOM & Lifecycle**: Owns the shadow DOM and implements the `IContentRenderer` interface for Dockview integration.
  - **Manager Coordination**: Instantiates and orchestrates the three dedicated managers described below.

- **`PanelLifecycleManager`**:

  - **Responsibility**: Manages the creation and destruction of the `ModularSpaceRenderer`.
  - **Mechanism**: Subscribes to the global `celestialObjects$` state. When objects appear, it triggers the renderer's initialization. When objects disappear, it tears the renderer down to conserve resources and shows a placeholder. It also listens for global `SYSTEM_GENERATION` events to display loading indicators.

- **`PanelCameraCoordinator`**:

  - **Responsibility**: Orchestrates all camera-related components (`CameraManager` and `EngineCameraManager`).
  - **Mechanism**: It creates the camera systems and links their state to the panel's view state, ensuring that camera position, FOV, and focused object are synchronized.

- **`PanelEventManager`**:
  - **Responsibility**: Manages all other event subscriptions.
  - **Mechanism**: Consolidates subscriptions to streams like `simulationState$` and `layoutOrientation$` to keep the main panel's logic clean.

### Data Flow & Component Interaction

The following diagram illustrates how the `CompositeEnginePanel` delegates its work to the managers, which in turn interact with global state and the underlying renderer.

```mermaid
graph TD
    subgraph "Global State & Events"
        A[celestialObjects$] -->|Objects Exist?| E;
        C[simulationState$] -->|Physics Ticks| D;
        G[Window Events: system-generation] -->|Start/Complete| E;
    end

    subgraph "CompositeEnginePanel (Orchestrator)"
        B(CompositeEnginePanel Instance);
        B -- "instantiates & delegates to" --> D[PanelEventManager];
        B -- "instantiates & delegates to" --> E[PanelLifecycleManager];
        B -- "instantiates & delegates to" --> F[PanelCameraCoordinator];
    end

    subgraph "Owned Components"
        E -- "creates/destroys" --> H(ModularSpaceRenderer);
        F -- "creates/controls" --> I(EngineCameraManager);
    end

    subgraph "Core Dependencies"
        I -- "wraps" --> J(CameraManager);
        H -- "contains" --> J
    end

    style "Global State & Events" fill:#f9f,stroke:#333,stroke-width:2px;
    style "CompositeEnginePanel (Orchestrator)" fill:#ccf,stroke:#333,stroke-width:2px;
    style "Owned Components" fill:#cfc,stroke:#333,stroke-width:2px;
    style "Core Dependencies" fill:#e6e6e6,stroke:#333,stroke-width:2px
```
