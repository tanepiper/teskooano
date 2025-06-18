# Architecture: `@teskooano/renderer-threejs-objects`

This document provides a detailed overview of the architecture for the `@teskooano/renderer-threejs-objects` package.

## Overview

This package is responsible for the entire lifecycle of `THREE.Object3D` instances within the scene. It acts as the bridge between the abstract `RenderableCelestialObject` data from the state and the concrete, visible meshes rendered by Three.js.

The architecture was refactored from a single, monolithic `ObjectManager` into a lean orchestrator that delegates its responsibilities to a suite of specialized, single-responsibility sub-managers. This makes the system more modular, testable, and easier to maintain.

## Core Component: `ObjectManager`

The `ObjectManager` is the public-facing facade of the package. It is instantiated by the main `ModularSpaceRenderer` and holds instances of all the sub-managers.

**Key Responsibilities:**

- **Initialization**: Instantiates all its sub-managers (`ObjectLifecycleManager`, `MeshFactory`, `RendererUpdater`, etc.), providing them with the necessary dependencies (e.g., scene, camera, other managers).
- **State Subscription**: Subscribes to the `renderableObjects$` stream to receive updates on which objects should exist in the scene.
- **Delegation**: Passes the stream of state changes to the `ObjectLifecycleManager` to handle the creation, update, and removal of objects.
- **Update Loop**: Exposes an `update()` method that is called every frame by the `RenderPipeline`. This method, in turn, calls the `update()` methods of its sub-managers (like `RendererUpdater` and `DebrisEffectManager`) in the correct order.
- **API Facade**: Provides a clean public API for interacting with the object system (e.g., `getObject()`, `getCentralBody()`, `setDebugMode()`).

## Sub-Managers

### 1. `ObjectLifecycleManager`

- **Responsibility**: The "brain" of the object management system. It receives the new state of `RenderableCelestialObject`s and compares it to the current state to determine what needs to be added, updated, or removed from the scene.
- **Workflow**:
  - **Add**: If a new object appears in the state, it uses the `MeshFactory` to create the corresponding `THREE.Object3D` and adds it to the scene. It also handles the creation of associated 2D labels.
  - **Update**: For existing objects, it primarily updates their position and rotation. The more complex visual updates are handled by the `RendererUpdater`.
  - **Remove**: If an object disappears from the state, it performs a comprehensive cleanup: removing the object from the scene, disposing of its renderer, unregistering it from the `LODManager` and `LightingManager`, and removing its 2D label.

### 2. `MeshFactory`

- **Responsibility**: A factory responsible for creating a `THREE.Object3D` for a given `RenderableCelestialObject`.
- **Workflow**:
  - It inspects the `object.type` (e.g., `STAR`, `PLANET`).
  - It uses the `createStarRenderer`, `createPlanetRenderer`, etc., factory functions from `@teskooano/systems-celestial` to get the appropriate `CelestialRenderer` instance.
  - The `CelestialRenderer` defines the object's visual representation, including its different levels of detail (LODs).
  - The `MeshFactory` takes these LODs and uses the `LODManager` to create the final `THREE.LOD` object that will be added to the scene.

### 3. `RendererUpdater`

- **Responsibility**: Manages the per-frame updates for all active `CelestialRenderer` instances.
- **Workflow**: It iterates through all the `celestialRenderers` managed by the `ObjectManager` and calls their `update()` method, passing in the necessary context (time, camera, influential lights, etc.). This is where visual effects like shader animations, material changes, and other dynamic updates occur.

### 4. Other Specialized Managers

- **`DebrisEffectManager`**: Listens for `destruction$` events and creates animated particle effects for destroyed objects.
- **`GravitationalLensingHandler`**: Manages the special render-to-texture visual effect for massive objects like black holes and neutron stars.
- **`AccelerationVisualizer`**: A debug utility that draws arrows to visualize the physics forces acting on objects.

## Interaction Diagram

```mermaid
graph TD
    subgraph ModularSpaceRenderer
        MSR
    end

    subgraph RenderPipeline
        RP
    end

    subgraph "@teskooano/core-state"
        State[renderableObjects$]
    end

    subgraph "@teskooano/systems-celestial"
        CRF[Celestial Renderer Factories]
    end

    subgraph "@teskooano/renderer-threejs-lod"
        LODM[LODManager]
    end

    subgraph "@teskooano/renderer-threejs-lighting"
        LM[LightingManager]
    end

    subgraph "@teskooano/renderer-threejs-labels"
        L2DM[Layer2DManager]
    end

    subgraph "This Package (@teskooano/renderer-threejs-objects)"
        OM(ObjectManager)
        OLM(ObjectLifecycleManager)
        MF(MeshFactory)
        RU(RendererUpdater)
    end

    %% Initialization
    MSR -- "Instantiates" --> OM;

    %% Data Flow
    State -- "Provides object data to" --> OM;
    OM -- "Delegates to" --> OLM;

    %% Object Creation
    OLM -- "Uses" --> MF;
    MF -- "Uses" --> CRF;
    MF -- "Uses" --> LODM;
    MF -- "Uses" --> LM;
    OLM -- "Adds/Removes Objects" --> L2DM;


    %% Update Loop
    RP -- "Calls update() on" --> OM;
    OM -- "Calls update() on" --> RU;
    RU -- "Updates all" --> CRF;

    classDef manager fill:#d5e8d4,stroke:#82b366;
    class OM, OLM, MF, RU manager;
```
