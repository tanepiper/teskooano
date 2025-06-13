# @teskooano/renderer-threejs-lighting

This package provides managers and utilities for handling visual effects and optimizations within the Teskooano Three.js rendering pipeline.

## Features

- **`LightManager`**: Manages dynamic light sources. It reactively creates, updates, and removes `THREE.PointLight` sources based on star data from the core state, and also manages global ambient light.
- **`LODManager`**: Manages Level of Detail (LOD) for scene objects using Three.js's built-in `THREE.LOD` class. It dynamically adjusts the geometric detail of objects based on their distance to the camera to optimize performance.
- **Debug Capabilities**: Includes optional debugging features for visualizing LOD levels and distances.

## Architecture

This package provides two main, independent manager classes: `LightManager` and `LODManager`. They are designed to be instantiated and used directly by a renderer integrator, such as `@teskooano/renderer-threejs`.

For more details, see the `ARCHITECTURE.md` file.

## Usage

This package is used internally by the main `@teskooano/renderer-threejs` package. The `ModularSpaceRenderer` class instantiates both `LightManager` and `LODManager` and integrates them into its render loop.

An example of how to use the `LightManager` can be found in the main `ModularSpaceRenderer` class, but a simple example is shown below:

```typescript
import { LightManager } from "@teskooano/renderer-threejs-lighting";
import * as THREE from "three";

// Assuming scene and camera are already initialized
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);

// Instantiate managers directly
const lightManager = new LightManager(scene, camera, false);
const lodManager = new LODManager(camera);

// Create an LOD object and add it to the scene
// (In the real app, this is done by the ObjectManager/MeshFactory)
// const lodObject = lodManager.createAndRegisterLOD(...);
// scene.add(lodObject);

function animate() {
  requestAnimationFrame(animate);

  // Update managers in the render loop
  lodManager.update();
  // LightManager updates reactively via its state subscription

  // ... other rendering logic ...
  renderer.render(scene, camera);
}

animate();
```
