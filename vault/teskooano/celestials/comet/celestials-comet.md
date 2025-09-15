---
aliases: [celestials-comet]
tags: [renderer, threejs, comets]
type: index
package: "@teskooano/celestials-comet"
version: "0.4.0-dev.0"
dependencies:
  [
    "@teskooano/core-math",
    "@teskooano/data-types",
    "@teskooano/renderer-threejs-celestial",
    "three",
    "simplex-noise",
  ]
classes:
  [
    CometRenderer,
    CometNucleusMaterial,
    CometComaMaterial,
    CometParticleMaterial,
    CometJetMaterial,
    CometSimplifiedTailMaterial,
  ]
status: active
---

# Celestials: Comet

A comprehensive comet rendering system for the Teskooano N-Body simulation, featuring realistic comet physics and visual effects with nucleus, coma, particle tails, and gas jets.

## Features

### Visual Components

- **Nucleus**: Procedurally displaced, irregular rocky surface with noise-based detail
- **Coma**: Dynamic gas cloud that scales with solar activity and distance
- **Particle Tails**: Physics-based particle systems simulating dust and gas trails
- **Gas Jets**: Multiple surface emission points with realistic particle behavior
- **LOD System**: Automatic detail reduction for distant viewing performance

### Rendering Architecture

- **Shader-based Materials**: All visual effects use custom GLSL shaders for optimal performance
- **Activity-based Rendering**: Visual intensity changes based on distance from stars
- **Extinct Comet Support**: Special rendering mode for inactive/dead comets
- **Multi-LOD Design**: High-detail particle tails for close viewing, simplified mesh tails for distance
- **Particle Physics**: Realistic particle systems with solar wind and radiation pressure effects

## Package Structure

```
src/
├── shaders/                    # GLSL shader files
│   ├── nucleus.vertex.glsl     # Nucleus vertex shader
│   ├── nucleus.fragment.glsl   # Nucleus surface with noise and lighting
│   ├── coma.vertex.glsl        # Coma vertex shader
│   ├── coma.fragment.glsl      # Volumetric gas effect with density noise
│   ├── particle.vertex.glsl    # Particle tail vertex shader
│   ├── particle.fragment.glsl  # Soft particle rendering
│   ├── jet.vertex.glsl         # Gas jet vertex shader
│   ├── jet.fragment.glsl       # Cloudy gas jet particles
│   ├── simplified-tail.vertex.glsl    # LOD tail vertex shader
│   └── simplified-tail.fragment.glsl  # LOD tail with noise shimmer
├── material.ts                 # Material classes for all components
├── renderer.ts                 # Main CometRenderer class
├── createMesh.ts               # Factory function for mesh creation
└── index.ts                    # Package exports
```

## Usage

```typescript
import { createMesh } from "@teskooano/celestials-comet";
import type { RenderableCelestialObject } from "@teskooano/data-types";

// Create comet mesh with automatic LOD
const cometMesh = createMesh(cometObject, {
  celestialRenderers: renderersMap,
  createLodObject: lodFactory,
});

// The mesh automatically handles:
// - Activity-based visual changes
// - Particle system updates
// - Lighting integration
// - Performance optimization
```

## Technical Details

### Performance Considerations

- Uses instanced rendering for particle systems (up to 12,000 particles)
- Automatic LOD switching at 5 AU render distance
- Particle lifetime management to prevent memory leaks
- Shader-based lighting calculations for efficiency

### Physics Integration

- Particle velocities based on solar wind and radiation pressure
- Activity factor calculated from stellar distance
- Realistic tail orientation (always pointing away from nearest star)
- Dynamic gas jet repositioning on nucleus surface

### Material Properties

All materials support configurable parameters:

- **Nucleus**: Color variations, surface noise scales, lighting response
- **Coma**: Opacity, animated density patterns, spherical falloff
- **Particles**: Size variations, alpha blending, emissive lighting
- **Jets**: Cloudy texture patterns, emission rates, particle lifetimes

## Classes

- [[CometRenderer]] - Main renderer class for comet objects
- [[CometNucleusMaterial]] - Shader material for comet nucleus rendering
- [[CometComaMaterial]] - Shader material for comet coma rendering
- [[CometParticleMaterial]] - Shader material for particle tail rendering
- [[CometJetMaterial]] - Shader material for gas jet rendering
- [[CometSimplifiedTailMaterial]] - Shader material for LOD tail rendering

## Shaders

- [[nucleus.vertex.glsl]] - Vertex shader for nucleus world position and normal calculation
- [[nucleus.fragment.glsl]] - Fragment shader for nucleus surface texturing and lighting
- [[coma.fragment.glsl]] - Fragment shader for volumetric gas effect with density noise
- [[particle.vertex.glsl]] - Vertex shader for particle tail positioning
- [[particle.fragment.glsl]] - Fragment shader for soft particle rendering
- [[jet.vertex.glsl]] - Vertex shader for gas jet positioning
- [[jet.fragment.glsl]] - Fragment shader for cloudy gas jet particles
- [[simplified-tail.vertex.glsl]] - Vertex shader for LOD tail positioning
- [[simplified-tail.fragment.glsl]] - Fragment shader for LOD tail with noise shimmer

## Dependencies

- `@teskooano/data-types` - Core data structures
- `@teskooano/renderer-threejs-celestial` - Base rendering framework
- `@teskooano/core-math` - Seeded random number generation
- `three` - Three.js 3D library
- `simplex-noise` - Procedural noise generation

## 🔗 Related

- Works with [[threejs-orbits|NBodyStrategy]] for trail visualization
- Composable with [[threejs-objects]] factory
- Uses [[BaseCelestialRenderer]] for core functionality
- Integrates with [[LightingManager]] for dynamic lighting
