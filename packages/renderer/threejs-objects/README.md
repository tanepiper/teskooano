# @teskooano/renderer-threejs-objects

This package is responsible for the creation, lifecycle management, and visual representation of all celestial objects within the Three.js scene for the Teskooano engine. It acts as the bridge between the abstract `RenderableCelestialObject` data from the core state and the concrete `THREE.Object3D` meshes displayed to the user.

## Architecture

The package is orchestrated by the central `ObjectManager` class, which composes functionality from several specialized sub-managers and factories.

- **`ObjectManager`**: The main orchestrator. It subscribes to the `renderableStore` from `@teskooano/core-state`.

  - It uses a `MeshFactory` to create `THREE.Object3D` instances for new celestial objects.
  - It adds, updates, and removes objects from the scene based on state changes.
  - It delegates visual effects like debris fields and gravitational lensing to their respective managers.

- **`MeshFactory`**: A factory responsible for creating the appropriate `THREE.Mesh` or `THREE.LOD` for a given `RenderableCelestialObject`. It uses a suite of `create<Type>Mesh` functions (e.g., `createStarMesh`, `createPlanetMesh`) that, in turn, use the `CelestialRenderer` instances from `@teskooano/systems-celestial` to generate the actual geometry and materials via Level of Detail (LOD) levels.

- **`DebrisEffectManager`**: Manages the particle effects for objects with a `DESTROYED` status.

- **`GravitationalLensing`**: Manages the post-processing effect for massive objects like black holes.

- **`ObjectLifecycleManager`**: Handles the logic for adding and removing objects from the `THREE.Scene`.

- **`RendererUpdater`**: Responsible for calling the `update()` method on individual `CelestialRenderer` instances each frame.

## Usage

The `ObjectManager` is typically instantiated and managed by the main `@teskooano/renderer-threejs` package.

```typescript
import { ObjectManager } from "@teskooano/renderer-threejs-objects";
import { SceneManager } from "@teskooano/renderer-threejs-core";
import { LightManager } from "@teskooano/renderer-threejs-lighting";
import { LODManager } from "@teskooano/renderer-threejs-lod";
import { CSS2DManager } from "@teskooano/renderer-threejs-interaction";
import * as THREE from "three";

// --- Initialization ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera();
const lodManager = new LODManager(camera);
const lightManager = new LightManager(scene, camera, false);
const css2dManager = new CSS2DManager(document.body);
const sceneManager = new SceneManager(scene);

const objectManager = new ObjectManager({
  sceneManager,
  lodManager,
  lightManager,
  css2dManager,
  camera,
});

// --- In the Render Loop ---
function animate() {
  requestAnimationFrame(animate);

  // The ObjectManager's update method handles all object-related updates
  objectManager.update(0, camera);

  // ... other renderer updates ...
}

// --- Cleanup ---
objectManager.dispose();
```
