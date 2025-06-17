# @teskooano/renderer-threejs-objects

This package is responsible for managing the lifecycle of all `THREE.Object3D` instances that represent celestial bodies in the scene.

## Features

- **State-Driven Object Management**: Subscribes to the application's `renderableObjects$` state stream and automatically adds, updates, and removes `THREE.Object3D` instances to match the state.
- **Modular Architecture**: The main `ObjectManager` class delegates tasks to specialized sub-managers for handling object creation, per-frame visual updates, and lifecycle events.
- **Dynamic Renderer Selection**: Uses a `MeshFactory` to select the appropriate `CelestialRenderer` from the `@teskooano/systems-celestial` package based on the object's type (e.g., `Star`, `Planet`, `GasGiant`).
- **Integration with other Renderer Packages**:
  - Works with `@teskooano/renderer-threejs-lod` to create `THREE.LOD` objects.
  - Works with `@teskooano/renderer-threejs-lighting` to register light sources from stars.
  - Works with `@teskooano/renderer-threejs-labels` to create and manage 2D labels.
- **Special Effects**: Includes handlers for special visual effects like gravitational lensing and particle-based debris from destroyed objects.

## Architecture

The `ObjectManager` is a high-level orchestrator. Its primary job is to initialize a set of sub-managers and delegate tasks to them. This includes an `ObjectLifecycleManager` that syncs the scene with the application state, a `MeshFactory` that builds the 3D objects using renderers from the celestial systems package, and a `RendererUpdater` that calls the `update` method on all active renderers each frame.

For a complete breakdown and a component diagram, please see the `ARCHITECTURE.md` file.

## Usage

This package is an internal dependency of `@teskooano/renderer-threejs`. The main `ModularSpaceRenderer` instantiates the `ObjectManager`, subscribes it to the state store, and calls its `update()` method from the main render pipeline. It is not designed to be used directly by the application.

```typescript
// Simplified conceptual usage inside ModularSpaceRenderer

import { ObjectManager } from "@teskooano/renderer-threejs-objects";
import { renderableStore } from "@teskooano/core-state";

// --- Initialization ---
// (scene, camera, renderer, etc., are assumed to be initialized)
const objectManager = new ObjectManager(
  this.scene,
  this.camera,
  renderableStore.renderableObjects$, // The state stream
  this.renderer,
  this.css2DManager,
);

// --- In the Render Loop / Pipeline ---
function animate() {
  // This single call triggers all sub-manager updates
  objectManager.update(this.renderer, this.scene, this.camera);
}

// --- Cleanup ---
objectManager.dispose();
```
