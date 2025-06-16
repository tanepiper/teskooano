# Architecture: `@teskooano/renderer-threejs-labels`

This document outlines the architecture of the labels package, which provides a flexible, layer-based system for rendering `CSS2D` UI elements on top of the Three.js scene.

## Core Concepts

The system is built around three main components:

1.  **`Layer2DManager`**: A lightweight orchestrator responsible for managing the `CSS2DRenderer`, handling the render loop for labels, and providing a registry for different layers. It does not contain any logic specific to any single type of label.

2.  **`BaseLabelLayer`**: An abstract base class that defines the common interface for all label layers. Each layer is a self-contained module responsible for a specific type of label (e.g., celestial object names, AU distance markers).

3.  **Label Components**: Standard `HTMLElement` custom elements that define the visual appearance and behavior of a label (e.g., `CelestialLabelComponent`).

## Layer Registration and Flexibility

The key to the system's flexibility is its dynamic layer registration. The `Layer2DManager` is not aware of any specific layer types at compile time. Instead, a higher-level consumer (like `ModularSpaceRenderer`) is responsible for instantiating the desired layers and registering them with the manager.

This pattern decouples the manager from the layers, allowing new types of labels to be created and used without ever modifying the `Layer2DManager` itself.

### Self-Contained Layers

Each layer is responsible for its own logic and dependencies. This includes:

- **Creating and Managing Labels**: Handling the logic for when and how to create its specific `CSS2DObject` instances.
- **Update Logic**: Implementing an `update` method for per-frame logic, such as visibility culling based on camera distance.
- **Component Registration**: Declaring its required HTML Custom Elements via the `getRequiredComponents()` method. The `Layer2DManager` automatically handles the `customElements.define()` call when a layer is registered.

## Data Flow Diagram

The following diagram illustrates how the components interact:

```mermaid
graph TD
    subgraph ModularSpaceRenderer (Consumer)
        A[Create CelestialLabelLayer]
        B[Create AuMarkerLabelLayer]
        C[Create Layer2DManager]
    end

    subgraph Layer2DManager
        D{Layers Registry};
        E[Render Loop];
        F[Component Registration];
    end

    subgraph "Label Layers"
        G[CelestialLabelLayer]
        H[AuMarkerLabelLayer]
    end

    I[CelestialLabelComponent]
    J[AuMarkerLabelComponent]

    C --> D;
    A --> K(registerLayer);
    B --> L(registerLayer);

    K --> D;
    L --> D;

    D -- "Updates on" --> E;
    E -- "Calls update()" --> G;
    E -- "Calls update()" --> H;

    K -- "getRequiredComponents()" --> F;
    L -- "getRequiredComponents()" --> F;

    F -- "Defines" --> I;
    F -- "Defines" --> J;

    G -- "Creates" --> I;
    H -- "Creates" --> J;

    classDef consumer fill:#cde4ff,stroke:#5a96d8;
    classDef manager fill:#d5e8d4,stroke:#82b366;
    classDef layer fill:#f8cecc,stroke:#b85450;
    class A,B,C consumer;
    class D,E,F manager;
    class G,H layer;
```
