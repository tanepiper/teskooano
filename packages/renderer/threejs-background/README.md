# @teskooano/renderer-threejs-background

This package manages the rendering and animation of the dynamic, multi-layered background within the Three.js scene for the Teskooano engine.

## Features

- **Multi-Layered Starfield**: Creates several layers of stars with varying densities, sizes, and colors to simulate depth.
- **Procedural Nebula**: Generates a beautiful, complex gas nebula using a custom GLSL shader with domain-warped 3D Simplex noise.
- **Randomized Palettes**: The nebula is colored using a randomly selected palette from a set of scientifically-inspired options on each load.
- **Parallax Effect**: The background subtly shifts based on camera movement, enhancing the sense of scale.
- **Dynamic Animation**: Star layers gently rotate at different speeds, creating a living, non-static environment.
- **Debug Mode**: A built-in debug mode helps visualize the different star field layers by coloring them and showing their spherical boundaries.

## Architecture

The system is controlled by a single `BackgroundManager` class that orchestrates different types of environmental effect layers (`Fields`). This modular, field-based architecture makes it easy to add new effects like asteroid fields or different nebulae in the future.

For a more detailed explanation and a component diagram, please see the `ARCHITECTURE.md` file.

## Usage

This package is designed to be used by an integrator package like `@teskooano/renderer-threejs`. The `BackgroundManager` is initialized and its `update` method is called on every frame of the render loop.

```typescript
// In the main renderer class (e.g., ModularSpaceRenderer)

import { BackgroundManager } from "@teskooano/renderer-threejs-background";
import * as THREE from "three";

// ... inside the main renderer's constructor ...
this.backgroundManager = new BackgroundManager(this.sceneManager.scene);
this.backgroundManager.setCamera(this.sceneManager.camera);

// ... inside the render loop / pipeline's update function ...
this.backgroundManager.update(deltaTime);

// To toggle debug visuals
this.backgroundManager.toggleDebug();
```
