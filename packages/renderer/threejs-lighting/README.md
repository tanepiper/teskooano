# @teskooano/renderer-threejs-lighting

This package provides a component-based system for managing dynamic, emissive light sources within the Teskooano Three.js rendering pipeline.

## Features

- **`LightingManager`**: Manages a registry of `LightSourceComponent` instances. It can be queried to find the most influential lights for any object in the scene.
- **`LightSourceComponent`**: A component that wraps a `THREE.Light` and ties it to a `RenderableCelestialObject`, keeping its position and properties synchronized.

## Architecture

This package provides one main manager class, `LightingManager`, and a component class, `LightSourceComponent`. It is designed to be used by a renderer integrator, such as `@teskooano/renderer-threejs`. The `LightingManager` acts as a central registry, while renderers for specific celestial objects (like stars) are responsible for creating and registering `LightSourceComponent` instances.

For more details, see the `ARCHITECTURE.md` file.

## Usage

This package is used internally by the main `@teskooano/renderer-threejs` package. A simplified example of how it might be used is shown below:

```typescript
import {
  LightingManager,
  LightSourceComponent,
} from "@teskooano/renderer-threejs-lighting";
import { RenderableCelestialObject } from "@teskooano/data-types";
import * as THREE from "three";

// Assume a scene is initialized
const scene = new THREE.Scene();

// 1. Instantiate the manager
const lightingManager = new LightingManager(scene);

// 2. A celestial renderer (e.g., for a star) creates a light source component
//    for its specific celestial object.
const myStarObject: RenderableCelestialObject = getMyStar(); // (get a renderable object)
const starLightComponent = new LightSourceComponent(myStarObject);

// 3. The celestial renderer registers the component with the manager.
lightingManager.register(starLightComponent);

function animate() {
  requestAnimationFrame(animate);

  // 4. The lighting manager updates all registered components each frame.
  lightingManager.update();

  // 5. Another object's renderer can now query for influential lights.
  const myPlanetObject: RenderableCelestialObject = getMyPlanet();
  const influentialLights =
    lightingManager.getInfluentialLights(myPlanetObject);
  // ...use these lights in the planet's shader...

  renderer.render(scene, camera);
}

animate();
```
