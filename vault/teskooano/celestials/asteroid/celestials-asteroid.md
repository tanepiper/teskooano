---
aliases: [celestials-asteroid]
tags: [renderer, threejs, asteroids]
type: index
package: "@teskooano/celestials-asteroid"
version: "0.4.0-dev.0"
dependencies:
  [
    "@teskooano/core-math",
    "@teskooano/data-types",
    "@teskooano/renderer-threejs-celestial",
    "three",
    "simplex-noise",
  ]
classes: [AsteroidRenderer, AsteroidNucleusMaterial]
status: active
---

# Celestials: Asteroid

A comprehensive asteroid rendering system for the Teskooano N-Body simulation, featuring procedural geometry generation, advanced surface texturing, and realistic lighting effects.

## Features

### Visual Components

- **Procedural Nucleus**: Irregular rocky surface with noise-based displacement and detail
- **Multi-Layer Texturing**: Height-based color blending with crater and crack effects
- **Advanced Lighting**: Dynamic ambient lighting with shadow casting support
- **LOD System**: Automatic detail reduction for distant viewing performance
- **Realistic Rotation**: Tumbling motion with configurable rotation periods

### Rendering Architecture

- **Shader-based Materials**: Custom GLSL shaders for optimal performance
- **Procedural Geometry**: Noise-displaced cube geometry for irregular asteroid shapes
- **Multi-Color Palettes**: Height-based color blending with configurable transitions
- **Shadow Integration**: Support for shadows cast by other celestial bodies
- **Performance Optimization**: LOD switching at 5 AU render distance

## Package Structure

```
src/
├── shaders/                    # GLSL shader files
│   ├── nucleus.vertex.glsl     # Nucleus vertex shader with world position/normal
│   └── nucleus.fragment.glsl   # Surface texturing with noise, lighting, and shadows
├── material.ts                 # AsteroidNucleusMaterial class
├── renderer.ts                 # Main AsteroidRenderer class
├── createMesh.ts               # Factory function for mesh creation
└── index.ts                    # Package exports
```

## Usage

```typescript
import { createMesh } from "@teskooano/celestials-asteroid";
import type { RenderableCelestialObject } from "@teskooano/data-types";

// Create asteroid mesh with automatic LOD
const asteroidMesh = createMesh(asteroidObject, {
  celestialRenderers: renderersMap,
  createLodObject: lodFactory,
});

// The mesh automatically handles:
// - Procedural geometry generation
// - Multi-layer surface texturing
// - Dynamic lighting and shadows
// - Performance optimization
```

## Technical Details

### Performance Considerations

- Uses procedural geometry generation for unique asteroid shapes
- Automatic LOD switching at 5 AU render distance
- Efficient shader-based lighting calculations
- Optimized noise functions for surface detail

### Physics Integration

- Rotation based on actual sidereal rotation periods
- Tumbling motion simulation with multi-axis rotation
- Dynamic lighting based on distance to light sources
- Shadow casting from other celestial bodies

### Material Properties

The asteroid material supports configurable parameters:

- **Colors**: Multi-color palette with height-based blending
- **Surface Detail**: Noise scales, crater strength, and undulation
- **Lighting**: Ambient strength, metallic factor, and roughness
- **Shadows**: Support for multiple shadow casters

## Classes

- [[celestials/asteroid/AsteroidRenderer|Asteroid Renderer]] - Main renderer class for asteroid objects
- [[celestials/asteroid/AsteroidNucleusMaterial|Asteroid Nucleus Material]] - Shader material for asteroid surface rendering

## Shaders

- [[celestials/asteroid/nucleus.vertex.glsl|Nucleus Vertex Shader]] - Vertex shader for world position and normal calculation
- [[celestials/asteroid/nucleus.fragment.glsl|Nucleus Fragment Shader]] - Fragment shader for surface texturing and lighting

## Dependencies

- `@teskooano/data-types` - Core data structures
- `@teskooano/renderer-threejs-celestial` - Base rendering framework
- `@teskooano/core-math` - Seeded random number generation
- `three` - Three.js 3D library
- `simplex-noise` - Procedural noise generation

## 🔗 Related

- Composable with [[renderer/threejs-objects|Three.js Objects]] factory
- Uses [[renderer/threejs-celestial/BaseCelestialRenderer|Base Celestial Renderer]] for core functionality
- Integrates with [[renderer/threejs-lighting/LightingManager|Lighting Manager]] for dynamic lighting
