# @teskooano/renderer-threejs-effects

This package provides managers and utilities for handling visual effects and optimizations within the Teskooano Three.js rendering pipeline.

## Features

- **`LightManager`**: Manages dynamic light sources, primarily point lights representing stars, and ambient light. Provides methods to add, update, and remove lights, as well as retrieve light data for shaders.
- **`LODManager`**: Manages Level of Detail (LOD) for scene objects using Three.js's built-in `THREE.LOD` class. It dynamically adjusts the geometric detail of objects based on their distance to the camera to optimize performance. Includes helper functions for creating LOD meshes and calculating appropriate distance thresholds.
- **Debug Capabilities**: Includes optional debugging features for visualizing LOD levels and distances.

## Usage

This package is typically used internally by the main `@teskooano/renderer-threejs` package or specific object renderers (e.g., celestial body renderers) to apply lighting and LOD optimizations to the scene.

```typescript
import { EffectsManager } from "@teskooano/renderer-threejs-effects";
import * as THREE from "three";

// Assuming scene and camera are already initialized
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);

const effectsManager = new EffectsManager(scene, camera);

// Add a star light
effectsManager.lightManager.addStarLight(
  "star-1",
  new THREE.Vector3(100, 100, 100),
  new THREE.Color(0xffffff),
);

// Create and add an LOD object (example)
// const lodObject = effectsManager.lodManager.createLODMesh(...);
// scene.add(lodObject);

function animate() {
  requestAnimationFrame(animate);

  // Update effects
  effectsManager.update();

  // ... other rendering logic ...
  renderer.render(scene, camera);
}

animate();
```
