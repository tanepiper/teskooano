# @teskooano/celestials-comet

A comprehensive comet rendering system for the Teskooano N-Body simulation, featuring realistic comet physics and visual effects.

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
├── createCometMesh.ts          # Factory function for mesh creation
└── index.ts                    # Package exports
```

## Usage

```typescript
import { createCometMesh } from "@teskooano/celestials-comet";
import type { RenderableCelestialObject } from "@teskooano/data-types";

// Create comet mesh with automatic LOD
const cometMesh = createCometMesh(cometObject, {
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

## Dependencies

- `@teskooano/data-types` - Core data structures
- `@teskooano/renderer-threejs-celestial` - Base rendering framework
- `@teskooano/renderer-threejs-lod` - Level of detail system
- `@teskooano/core-math` - Seeded random number generation
- `three` - Three.js 3D library
- `simplex-noise` - Procedural noise generation
