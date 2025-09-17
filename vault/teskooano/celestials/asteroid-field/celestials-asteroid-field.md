---
aliases: [celestials-asteroid-field]
tags: [renderer, threejs, asteroids]
type: index
package: "@teskooano/celestials-asteroid-field"
version: "0.4.0-dev.0"
dependencies:
  [
    "@teskooano/core-math",
    "@teskooano/data-types",
    "@teskooano/renderer-threejs-celestial",
    "three",
  ]
classes: [AsteroidFieldRenderer, AsteroidFieldMaterial]
status: active
---

# Celestials: Asteroid Field

A high-performance, deterministic asteroid field renderer for the Teskooano N-Body simulation, featuring instanced particle systems, procedural texturing, and adaptive Level of Detail (LOD) rendering.

## Features

### Visual Components

- **Instanced Particle Systems**: High-performance rendering using THREE.InstancedMesh
- **Multiple Texture Variants**: 5 different asteroid texture variants for visual variety
- **Procedural Generation**: Seeded randomization ensures consistent asteroid fields
- **Adaptive LOD**: Dynamic particle counts based on viewing distance (50k → 1k particles)
- **Animated Rotation**: Individual asteroid rotation and belt-wide rotation
- **Realistic Scaling**: Proper size distribution and distance-based visibility

### Rendering Architecture

- **Shader-based Materials**: Custom GLSL shaders for optimal performance
- **Instanced Rendering**: Uses THREE.InstancedMesh for efficient particle rendering
- **Texture Management**: Automatic texture loading with fallback generation
- **LOD System**: 4-tier LOD system for optimal performance at different distances
- **Performance Optimization**: Efficient memory management and update cycles

## Package Structure

```
src/
├── shaders/                     # GLSL shader files
│   ├── asteroid.vert            # Vertex shader for particle positioning
│   └── asteroid.frag            # Fragment shader for texture rendering
├── material.ts                  # AsteroidFieldMaterial class
├── renderer.ts                  # Main AsteroidFieldRenderer class
├── createMesh.ts                # Factory function for mesh creation
└── index.ts                     # Package exports
```

## Usage

```typescript
import { createMesh } from "@teskooano/celestials-asteroid-field";
import type { RenderableCelestialObject } from "@teskooano/data-types";

// Create asteroid field mesh with automatic LOD
const asteroidField = createMesh(asteroidFieldObject, {
  celestialRenderers: renderersMap,
  createLodObject: lodFactory,
});

// The mesh automatically handles:
// - Multiple LOD level generation
// - Seeded particle placement
// - Texture loading and management
// - Animation state updates
```

## Technical Details

### Performance Considerations

- Uses THREE.InstancedMesh for efficient particle rendering
- 4-tier LOD system with particle counts from 50,000 to 1,000
- Automatic texture loading with fallback generation
- Efficient memory management and update cycles

### LOD System

The renderer uses a 4-tier LOD system for optimal performance:

| LOD Level   | Distance | Particle Count | Use Case         |
| ----------- | -------- | -------------- | ---------------- |
| **Level 0** | 0 AU     | 50,000         | Close inspection |
| **Level 1** | 1 AU     | 25,000         | Normal viewing   |
| **Level 2** | 5 AU     | 10,000         | Medium distance  |
| **Level 3** | 20 AU    | 1,000          | Far away         |

### Physics Integration

- Belt rotation with configurable speed
- Individual asteroid rotation with time-based animation
- Seeded randomization for deterministic generation
- Realistic size distribution based on belt dimensions

### Material Properties

The asteroid field material supports configurable parameters:

- **Textures**: Multiple texture variants with automatic loading
- **Animation**: Belt rotation and particle rotation speeds
- **Rendering**: Render scale and alpha testing
- **Performance**: Efficient texture management and fallback generation

## Classes

- [[celestials/asteroid-field/AsteroidFieldRenderer|Asteroid Field Renderer]] - Main renderer class for asteroid field objects
- [[celestials/asteroid-field/AsteroidFieldMaterial|Asteroid Field Material]] - Shader material for asteroid field rendering

## Shaders

- [[celestials/asteroid-field/asteroid.vert|Asteroid Vertex Shader]] - Vertex shader for particle positioning and belt rotation
- [[celestials/asteroid-field/asteroid.frag|Asteroid Fragment Shader]] - Fragment shader for texture rendering and rotation

## Dependencies

- `@teskooano/data-types` - Core data structures
- `@teskooano/renderer-threejs-celestial` - Base rendering framework
- `@teskooano/core-math` - Seeded random number generation
- `three` - Three.js 3D library

## 🔗 Related

- Composable with [[renderer/threejs-objects/threejs-objects|Three.js Objects]] factory
- Uses [[renderer/threejs-celestial/BaseCelestialRenderer|Base Celestial Renderer]] for core functionality
- Integrates with [[renderer/threejs-lighting/LightingManager|Lighting Manager]] for dynamic lighting
