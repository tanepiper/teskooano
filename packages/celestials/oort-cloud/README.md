# @teskooano/celestials-oort-cloud

A particle-based rendering system for Oort Cloud objects in the Teskooano N-Body simulation, representing the sparse collection of icy bodies at the outer edge of stellar systems.

## Features

### Visual Components

- **Spherical Distribution**: Particles arranged in a thick spherical shell
- **Realistic Scale**: Configurable inner and outer radii (typically 2000-20000 AU)
- **Subtle Appearance**: Very small, dark particles for astronomical accuracy
- **Color Variation**: Seeded random color variations within a realistic palette
- **Texture Support**: Asteroid texture with fallback canvas generation

### Rendering Architecture

- **Particle System**: Uses THREE.Points for efficient rendering of many small objects
- **Shader-based**: Custom GLSL vertex and fragment shaders for optimal performance
- **Single LOD**: Always visible with consistent appearance regardless of distance
- **Seeded Generation**: Deterministic particle placement and properties
- **Configurable Density**: Adjustable particle count and distribution parameters

## Package Structure

```
src/
├── shaders/                    # GLSL shader files
│   ├── oort-cloud.vertex.glsl  # Vertex shader with size and color handling
│   └── oort-cloud.fragment.glsl # Fragment shader with texture sampling
├── material.ts                 # OortCloudMaterial class
├── OortCloudRenderer.ts        # Main renderer class
├── createOortCloudMesh.ts      # Factory function for mesh creation
└── index.ts                    # Package exports
```

## Usage

```typescript
import {
  createOortCloudMesh,
  OortCloudMaterial,
  OortCloudRenderer,
} from "@teskooano/celestials-oort-cloud";
import type { RenderableCelestialObject } from "@teskooano/data-types";

// Create Oort Cloud mesh using the factory function
const oortCloudMesh = createOortCloudMesh(oortCloudObject, {
  celestialRenderers: renderersMap,
  createLodObject: lodFactory,
});

// Or create material and renderer separately for custom setups
const material = new OortCloudMaterial({
  pointSizeScale: 0.5,
  particleRotationSpeed: 1.0,
});

// The mesh automatically handles:
// - Spherical particle distribution
// - Seeded random generation
// - Texture loading with fallback
// - Performance optimization
```

## Technical Details

### Particle Distribution

- Uses spherical coordinates for uniform distribution on sphere surface
- Radius varies between configurable inner and outer bounds
- Typically renders 150-1000 particles for optimal performance/appearance balance

### Performance Considerations

- Single BufferGeometry with instanced attributes
- Frustum culling enabled for off-screen optimization
- Minimal particle sizes to reduce fillrate impact
- Texture caching and fallback generation

### Material Properties

The shader material supports:

- **Color Variations**: Subtle HSL adjustments within dark palette
- **Size Attributes**: Per-particle size scaling
- **Texture Sampling**: Point-based texture coordinates
- **Alpha Testing**: Transparent areas properly discarded

### Physical Accuracy

- Realistic distance scales (thousands of AU from system center)
- Very sparse particle density matching astronomical observations
- Dark, icy appearance consistent with cometary nuclei
- Spherical shell geometry representing gravitational influence boundary

## Configuration

Oort Cloud properties can be configured via `OortCloudProperties`:

```typescript
interface OortCloudProperties {
  innerRadiusAU: number; // Inner boundary (default: 2000 AU)
  outerRadiusAU: number; // Outer boundary (default: 20000 AU)
  visualParticleCount: number; // Number of particles (default: 150)
  visualParticleColor: string; // Base color (default: "#353536")
  visualDensity: number; // Density factor (default: 0.1)
  composition: string[]; // Material composition (["ice"])
}
```

## Dependencies

- `@teskooano/data-types` - Core data structures and types
- `@teskooano/renderer-threejs-celestial` - Base rendering framework
- `@teskooano/renderer-threejs-lod` - Level of detail system
- `@teskooano/core-math` - Seeded random number generation
- `three` - Three.js 3D rendering library
