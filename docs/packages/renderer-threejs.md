# @teskooano/renderer-threejs

## Overview

The renderer-threejs package provides Three.js-based rendering functionality for the Open Space game. It handles 3D scene management, camera controls, and celestial object rendering.

## Features

- Three.js scene setup and management
- Camera controls and positioning
- Celestial object rendering
- Window resize handling
- Performance optimization

## API

### ModularSpaceRenderer

```typescript
class ModularSpaceRenderer {
  constructor(container: HTMLElement, options?: RendererOptions);
  render(): void;
  updateCamera(position: Vector3, target: Vector3): void;
  addObject(object: CelestialObject): void;
  removeObject(objectId: string): void;
  onResize(width: number, height: number): void;
}
```

### Scene Management

- Automatic scene setup with proper lighting
- Camera positioning and controls
- Object management (add/remove/update)
- Window resize handling

## Testing

The package includes comprehensive tests in `ModularSpaceRenderer.test.ts` that verify:

- Renderer initialization
- Camera updates
- Object management
- Window resize handling
- Scene setup

## Usage

```typescript
import { ModularSpaceRenderer } from "@teskooano/renderer-threejs";
import type { CelestialObject } from "@teskooano/data-types";

// Create renderer
const container = document.getElementById("game-container");
const renderer = new ModularSpaceRenderer(container);

// Add celestial object
const planet: CelestialObject = {
  id: "earth",
  name: "Earth",
  type: CelestialType.PLANET,
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
  mass: 5.972e24,
  radius: 6371,
};
renderer.addObject(planet);

// Update camera
renderer.updateCamera({ x: 0, y: 1000, z: 1000 }, { x: 0, y: 0, z: 0 });

// Render scene
renderer.render();
```
