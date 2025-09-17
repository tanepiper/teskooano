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

- [[celestials/comet/CometRenderer|Comet Renderer]] - Main renderer class for comet objects
- [[celestials/comet/CometMaterials|Comet Nucleus Material]] - Shader material for comet nucleus rendering
- [[celestials/comet/CometMaterials|Comet Coma Material]] - Shader material for comet coma rendering
- [[celestials/comet/CometMaterials|Comet Particle Material]] - Shader material for particle tail rendering
- [[celestials/comet/CometMaterials|Comet Jet Material]] - Shader material for gas jet rendering
- [[celestials/comet/CometMaterials|Comet Simplified Tail Material]] - Shader material for LOD tail rendering

## Shaders

- [[celestials/comet/nucleus.vertex.glsl|Nucleus Vertex Shader]] - Vertex shader for nucleus world position and normal calculation
- [[celestials/comet/nucleus.fragment.glsl|Nucleus Fragment Shader]] - Fragment shader for nucleus surface texturing and lighting
- [[celestials/comet/coma.fragment.glsl|Coma Fragment Shader]] - Fragment shader for volumetric gas effect with density noise
- [[celestials/comet/particle.vertex.glsl|Particle Vertex Shader]] - Vertex shader for particle tail positioning
- [[celestials/comet/particle.fragment.glsl|Particle Fragment Shader]] - Fragment shader for soft particle rendering
- [[celestials/comet/jet.vertex.glsl|Jet Vertex Shader]] - Vertex shader for gas jet positioning
- [[celestials/comet/jet.fragment.glsl|Jet Fragment Shader]] - Fragment shader for cloudy gas jet particles
- [[celestials/comet/simplified-tail.vertex.glsl|Simplified Tail Vertex Shader]] - Vertex shader for LOD tail positioning
- [[celestials/comet/simplified-tail.fragment.glsl|Simplified Tail Fragment Shader]] - Fragment shader for LOD tail with noise shimmer

## Dependencies

- `@teskooano/data-types` - Core data structures
- `@teskooano/renderer-threejs-celestial` - Base rendering framework
- `@teskooano/core-math` - Seeded random number generation
- `three` - Three.js 3D library
- `simplex-noise` - Procedural noise generation

## 🔗 Related

- Works with [[renderer/threejs-orbits/threejs-orbits|Three.js Orbits]] for trail visualization
- Composable with [[renderer/threejs-objects/threejs-objects|Three.js Objects]] factory
- Uses [[renderer/threejs-celestial/BaseCelestialRenderer|Base Celestial Renderer]] for core functionality
- Integrates with [[renderer/threejs-lighting/LightingManager|Lighting Manager]] for dynamic lighting
