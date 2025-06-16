# @teskooano/renderer-threejs-lighting

This package provides a manager for handling lighting within the Teskooano Three.js rendering pipeline.

## Features

- **`LightManager`**: Manages dynamic light sources. It reactively creates, updates, and removes `THREE.PointLight` sources based on star data from the core state, and also manages global ambient light.

## Architecture

This package provides one main manager class: `LightManager`. It is designed to be instantiated and used directly by a renderer integrator, such as `@teskooano/renderer-threejs`.

For more details, see the `ARCHITECTURE.md` file.

## Usage

This package is used internally by the main `@teskooano/renderer-threejs` package. The `ModularSpaceRenderer` class instantiates the `LightManager` and integrates it into its render loop.

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

// Instantiate the manager
const lightManager = new LightManager(scene, camera, false);

function animate() {
  requestAnimationFrame(animate);

  // LightManager updates reactively via its state subscription

  // ... other rendering logic ...
  renderer.render(scene, camera);
}

animate();
```
