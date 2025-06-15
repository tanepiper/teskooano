# @teskooano/renderer-threejs-lod

This package provides a manager for handling Level of Detail (LOD) within the Teskooano Three.js rendering pipeline.

## Features

- **`LODManager`**: Manages Level of Detail for scene objects using Three.js's built-in `THREE.LOD` class. It dynamically adjusts the geometric detail of objects based on their distance to the camera to optimize performance.
- **Debug Capabilities**: Includes optional debugging features for visualizing LOD levels and distances.

## Architecture

This package provides a single manager class, `LODManager`. It is designed to be instantiated and used directly by a renderer integrator, such as `@teskooano/renderer-threejs`.

For more details, see the `ARCHITECTURE.md` file.

## Usage

This package is used internally by the main `@teskooano/renderer-threejs` package. The `ModularSpaceRenderer` class instantiates `LODManager` and integrates it into its render loop.

An example of how to use the `LODManager` can be found in the main `ModularSpaceRenderer` class, but a simple example is shown below:

```typescript
import { LODManager } from "@teskooano/renderer-threejs-lod";
import * as THREE from "three";

// Assuming scene and camera are already initialized
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);

// Instantiate manager
const lodManager = new LODManager(camera);

// Create an LOD object and add it to the scene
// (In the real app, this is done by the ObjectManager/MeshFactory)
// const lodObject = lodManager.createAndRegisterLOD(...);
// scene.add(lodObject);

function animate() {
  requestAnimationFrame(animate);

  // Update the manager in the render loop
  lodManager.update();

  // ... other rendering logic ...
  renderer.render(scene, camera);
}

animate();
```
