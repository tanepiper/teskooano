# @teskooano/renderer-threejs-lod

This package provides a manager for handling Level of Detail (LOD) within the Teskooano Three.js rendering pipeline.

## Features

- Manages the lifecycle of `THREE.LOD` objects.
- Applies a scaling factor to LOD distances based on a global performance profile (`low`, `medium`, `high`) from the core state. **Note**: This factor is applied at creation time; existing objects are not dynamically updated.
- Provides an `update()` method that must be called from the main render loop.
- Includes an optional debug mode to display the current LOD level of each object as a 2D label.

## Architecture

The system is centered around a single `LODManager` class that acts as a registry and factory for `THREE.LOD` objects. Consumers, like the `@teskooano/renderer-threejs-objects` package, are responsible for defining the different levels of detail for an object and registering them with the manager.

For a more detailed explanation of the design, see the [ARCHITECTURE.md](./ARCHITECTURE.md) file.

## Usage

This package is designed to be used by an integrator package like `@teskooano/renderer-threejs`.

```typescript
// In a renderer or object manager class

import { LODManager } from "@teskooano/renderer-threejs-lod";
import * as THREE from "three";
import type { RenderableCelestialObject } from "@teskooano/data-types";

// --- Initialization ---
const camera = new THREE.PerspectiveCamera();
const lodManager = new LODManager(camera);

// --- Object Creation (e.g., when a renderable object is created) ---
const myObject: RenderableCelestialObject = getMyObjectData();
const highDetailMesh = new THREE.Mesh(new THREE.IcosahedronGeometry(10, 5));
const lowDetailMesh = new THREE.Mesh(new THREE.IcosahedronGeometry(10, 2));
const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ color: "white" }));

const lod = lodManager.createAndRegisterLOD(myObject, [
  { object: highDetailMesh, distance: 0 },
  { object: lowDetailMesh, distance: 500 },
  { object: sprite, distance: 2000 },
]);
// The manager returns the THREE.LOD object, which is then added to the scene.
scene.add(lod);

// --- In the Render Loop / Pipeline ---
function animate() {
  requestAnimationFrame(animate);

  // Must be called every frame to check distances and swap levels
  lodManager.update();

  renderer.render(scene, camera);
}

// --- Object Destruction ---
lodManager.remove(myObject.celestialObjectId);
```

## API Reference

### `LODManager`

- `constructor(camera)`: Creates a new manager instance.
- `createAndRegisterLOD(object, levels)`: Creates a `THREE.LOD` instance from an array of levels (each an object with a `THREE.Object3D` and a `distance` threshold) and registers it for updates. The distances are automatically scaled by the current performance profile setting.
- `update()`: Updates all registered `LOD` objects. Must be called every frame.
- `remove(objectId)`: Removes an `LOD` object from the manager and its debug label.
- `clear()`: Removes all `LOD` objects.
- `toggleDebug(enabled)`: Toggles the visibility of the debug labels.
