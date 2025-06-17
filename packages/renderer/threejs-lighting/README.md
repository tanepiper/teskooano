# @teskooano/renderer-threejs-lighting

This package provides a component-based system for managing dynamic, emissive light sources within the Teskooano Three.js rendering pipeline.

## Features

- **`LightingManager`**: A central registry for all dynamic light sources in the scene.
- **`LightSourceComponent`**: A wrapper that links a `THREE.Light` instance to a moving `RenderableCelestialObject`.
- **Performant Lookups**: Provides a `getInfluentialLights()` method to efficiently find the most relevant lights for any object in the scene, which is crucial for shader-based lighting calculations.

## Architecture

The system is designed to be explicit and lightweight. A consumer (like `@teskooano/renderer-threejs-objects`) is responsible for creating `LightSourceComponent` instances for any object that should emit light (e.g., a star) and registering them with the `LightingManager`.

For a more detailed explanation of the design, see the [ARCHITECTURE.md](./ARCHITECTURE.md) file.

## Usage

This package is designed to be used by an integrator package like `@teskooano/renderer-threejs`. The `LightingManager` is instantiated and its `update` method is called on every frame of the render loop.

```typescript
// In a renderer or object manager class

import {
  LightingManager,
  LightSourceComponent,
} from "@teskooano/renderer-threejs-lighting";
import * as THREE from "three";
import type { RenderableCelestialObject } from "@teskooano/data-types";

// --- Initialization ---
const scene = new THREE.Scene();
const lightingManager = new LightingManager(scene);

// --- Object Creation (e.g., when a star is created) ---
// (object is a RenderableCelestialObject representing the star)
const starObject: RenderableCelestialObject = getStarData();
const lightSource = new LightSourceComponent(starObject);
lightingManager.register(lightSource);

// --- In the Render Loop / Pipeline ---
function animate() {
  requestAnimationFrame(animate);

  // Must be called every frame to update light positions
  lightingManager.update();

  // --- Example: A planet renderer needs to find its light source ---
  const planetObject: RenderableCelestialObject = getPlanetData();
  const influentialLights = lightingManager.getInfluentialLights(
    planetObject,
    1,
  );
  if (influentialLights.length > 0) {
    const primaryLight = influentialLights[0];
    // Pass light position, color, etc., to planet's shader uniforms
  }
}

// --- Object Destruction ---
lightingManager.unregister(starObject.celestialObjectId);
```

## Core Components

- **`LightingManager`:** The registry class for all light sources. It adds/removes lights from the scene and provides the `getInfluentialLights` query method.
- **`LightSourceComponent`**: A component that wraps a `THREE.Light` and keeps its position synchronized with a `RenderableCelestialObject`.
