## Common Renderer Architecture

This directory provides the foundational building blocks and reusable components for all celestial renderers in the system. It defines the core contracts (interfaces), provides a base implementation with shared logic, and offers specialized helpers for complex or cross-cutting concerns like debugging and visual effects.

---

### Core Components

#### 1. `CelestialRenderer.ts` - The Contract

This file defines the `CelestialRenderer` interface, which is the primary contract that all specific renderers (for stars, planets, etc.) must implement.

- **Purpose**: To ensure that the main rendering engine can interact with any renderer in a consistent, polymorphic way.
- **Key Methods**:
  - `getLODLevels(...)`: The most critical method. Each renderer must define how to create the different levels of detail for a given celestial object.
  - `update(...)`: Handles time-based animations and updates to shader uniforms.
  - `dispose()`: Ensures proper cleanup of Three.js resources (materials, textures, geometries) to prevent memory leaks.
- **Shared Types**: It also defines shared data structures like `CelestialMeshOptions` (for controlling detail levels) and `LightSourceData`, which are used as a common language between the renderers and the systems that use them.

#### 2. `BaseCelestialRenderer.ts` - The Foundation

This is an `abstract` class that provides a partial implementation of the `CelestialRenderer` interface. Most specific renderers should `extend` this class to inherit common functionality and reduce boilerplate code.

- **Purpose**: To provide shared, reusable logic for all renderers.
- **Key Features**:
  - **Resource Management**: Includes a `materials` map to automatically track and dispose of all materials created by a renderer instance.
  - **Time Tracking**: Manages `elapsedTime` to simplify time-based shader animations.
  - **State Access**: Contains helper methods like `getWorldPosition` and `findPrimaryLightSource` that connect to the core state store (`@teskooano/core-state`) to fetch live data about other objects in the simulation.
  - **Utility Methods**: Provides helpers for common tasks like mapping a detail level string to geometry segments (`getSegmentsForDetailLevel`).

#### 3. `gravitational-lensing.ts` - Reusable VFX Helper

This file provides a complex, self-contained visual effect for simulating the gravitational lensing caused by extremely massive objects like black holes and neutron stars.

- **`GravitationalLensingMaterial`**: A custom `THREE.ShaderMaterial` that implements the core distortion logic. Its fragment shader samples the background scene and displaces the UV coordinates to create the bending-of-light effect.
- **`GravitationalLensingHelper`**: A manager class that encapsulates the entire setup and update logic. This is the public API for the effect.
- **Technique**: It uses a sophisticated **render-to-texture** approach. In each frame, the helper:
  1.  Hides the lensing mesh itself.
  2.  Renders the main scene into an off-screen buffer (`THREE.WebGLRenderTarget`), effectively taking a snapshot of the background.
  3.  Passes this snapshot as a `tBackground` texture uniform to the `GravitationalLensingMaterial`.
  4.  Makes the lensing mesh visible again.
  5.  When the main scene is rendered, the lensing mesh distorts the background texture that it received.

#### 4. `CelestialRendererDebugHelper.ts` - Debugging Bridge

This is a helper class designed to be instantiated by individual renderer instances to report their internal state to the main debug UI.

- **Purpose**: To act as a bridge between the rendering system and the centralized `@teskooano/core-debug` package, decoupling the renderer from the global debugger.
- **Functionality**: Provides methods like `updateDebugVectors`, `updateOrbitalDebugData`, and `updatePhysicsDebugData` that format renderer-specific data (e.g., light direction, velocity, orbital parameters) and send it to the `celestialDebugger` for visualization.

### Architectural Patterns

- **Template Method Pattern**: `BaseCelestialRenderer` defines the skeleton of the rendering algorithm (e.g., in its `dispose` and `update` methods) but defers the implementation of specific steps (like `getLODLevels`) to its subclasses.
- **Interface-based Polymorphism**: The `CelestialRenderer` interface allows the `ObjectManager` to treat all renderers interchangeably, simplifying the main render loop. It can call `update()` on any renderer without needing to know its concrete type.
- **Helper/Service Class**: `GravitationalLensingHelper` and `CelestialRendererDebugHelper` are classic helper classes. They encapsulate a specific, complex piece of functionality, making it easy to reuse and keeping the primary classes (the renderers) focused on their core responsibilities.
