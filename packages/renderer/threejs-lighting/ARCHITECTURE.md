## Architecture: `@teskooano/renderer-threejs-lighting`

This package provides managers and utilities for handling lighting within the Teskooano Three.js rendering pipeline.

### Core Components

- **`LightManager`**: A centralized manager for creating, tracking, and updating all light sources in the scene. It is designed to handle lights that represent stars, which are a primary source of illumination for celestial objects.

### How it works

The `LightManager` is instantiated by the main `ModularSpaceRenderer` and subscribes to the `renderableObjects$` stream from `@teskooano/core-state`. It automatically creates, updates, and removes `THREE.PointLight` instances based on `CelestialType.STAR` objects in the state.

This reactive approach means that other parts of the system, such as celestial renderers, can get an up-to-date list of the most influential light sources for a given object simply by querying the `LightManager`. This allows for dynamic and realistic lighting effects on planets, moons, and other bodies as they move through the system.

A key feature is its ability to manage a specific number of "star lights" and provide their data (color, intensity, position) in a structured way that can be passed to shaders.

### Mermaid Diagram

```mermaid
graph TD
    subgraph "Main Renderer (@teskooano/renderer-threejs)"
        direction LR
        A[ModularSpaceRenderer]
    end

    subgraph "This Package (@teskooano/renderer-threejs-lighting)"
        direction LR
        B[LightManager]
    end

    subgraph "Object Rendering (@teskooano/renderer-threejs-objects)"
        direction LR
        C[ObjectManager]
    end

    A --> B
    C --> B
```
