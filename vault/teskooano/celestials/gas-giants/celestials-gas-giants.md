---
aliases: [celestials-gas-giants]
tags: [renderer, threejs, celestials]
type: index
package: "@teskooano/celestials-gas-giants"
version: "0.4.0-dev.0"
dependencies:
  [
    "@teskooano/data-types",
    "@teskooano/renderer-threejs-celestial",
    "@teskooano/celestials-rings",
    "three",
  ]
classes:
  [
    "BaseGasGiantRenderer",
    "ClassIGasGiantRenderer",
    "ClassIIGasGiantRenderer",
    "ClassIIIGasGiantRenderer",
    "ClassIVGasGiantRenderer",
    "ClassVGasGiantRenderer",
    "BaseGasGiantMaterial",
    "BasicGasGiantMaterial",
    "ClassIMaterial",
    "ClassIIMaterial",
    "ClassIIIMaterial",
    "ClassIVMaterial",
    "ClassVMaterial",
  ]
status: active
---

# Celestials: Gas Giants

A comprehensive gas giant rendering system for the Teskooano N-Body simulation, featuring realistic atmospheric shaders, ring system integration, and support for all gas giant classes (I-V) with seeded randomness and procedural generation.

## Features

### Visual Components

- **Atmospheric Shaders**: Procedural atmospheric effects with 4D fractal simplex noise
- **Multi-Class Support**: Specialized renderers for all gas giant classes (I-V)
- **Ring System Integration**: Automatic ring rendering when present
- **LOD System**: 3-tier LOD system with high detail, medium detail, and billboard levels
- **Dynamic Lighting**: Support for multiple light sources and shadow casting
- **Seeded Randomness**: Deterministic procedural generation based on object seeds

### Rendering Architecture

- **Class-Based Renderers**: Specialized renderers for each gas giant class
- **Abstract Base Classes**: Shared functionality through inheritance
- **Material System**: Custom shader materials with dynamic light/shadow support
- **Ring Integration**: Automatic ring system composition when rings are present
- **Performance Optimization**: LOD switching and efficient shader management

## Package Structure

```
src/
├── base/                        # Base classes and shared functionality
│   ├── renderer.ts             # BaseGasGiantRenderer abstract class
│   └── material.ts             # BaseGasGiantMaterial and BasicGasGiantMaterial
├── class-i/                    # Class I gas giants (Ammonia Clouds - Jupiter-like)
│   ├── renderer.ts             # ClassIGasGiantRenderer
│   └── material.ts             # ClassIMaterial
├── class-ii/                   # Class II gas giants (Water Clouds)
│   ├── renderer.ts             # ClassIIGasGiantRenderer
│   └── material.ts             # ClassIIMaterial
├── class-iii/                  # Class III gas giants (Cloudless)
│   ├── renderer.ts             # ClassIIIGasGiantRenderer
│   └── material.ts             # ClassIIIMaterial
├── class-iv/                   # Class IV gas giants (Alkali Metals)
│   ├── renderer.ts             # ClassIVGasGiantRenderer
│   └── material.ts             # ClassIVMaterial
├── class-v/                    # Class V gas giants (Silicate Clouds)
│   ├── renderer.ts             # ClassVGasGiantRenderer
│   └── material.ts             # ClassVMaterial
├── shaders/                    # GLSL shader files
│   ├── class-i.vertex.glsl     # Class I vertex shader
│   ├── class-i.fragment.glsl   # Class I fragment shader with 4D noise
│   ├── class-ii.vertex.glsl    # Class II vertex shader
│   ├── class-ii.fragment.glsl  # Class II fragment shader
│   ├── class-iii.vertex.glsl   # Class III vertex shader
│   ├── class-iii.fragment.glsl # Class III fragment shader
│   ├── class-iv.vertex.glsl    # Class IV vertex shader
│   ├── class-iv.fragment.glsl  # Class IV fragment shader
│   ├── class-v.vertex.glsl     # Class V vertex shader
│   ├── class-v.fragment.glsl   # Class V fragment shader
│   ├── basic.vertex.glsl       # Basic vertex shader for LOD
│   └── basic.fragment.glsl     # Basic fragment shader for LOD
├── createMesh.ts               # Factory function for mesh creation
└── index.ts                    # Package exports
```

## Usage

```typescript
import { createMesh } from "@teskooano/celestials-gas-giants";
import type { RenderableCelestialObject } from "@teskooano/data-types";

// Create gas giant mesh with automatic class detection
const gasGiantMesh = createMesh(gasGiantObject, {
  celestialRenderers: renderersMap,
  createLodObject: lodFactory,
  lightingManager: lightingManager,
});

// The mesh automatically handles:
// - Class-specific rendering based on GasGiantClass
// - Ring system integration when present
// - LOD management for performance
// - Dynamic lighting and shadow casting
```

## Technical Details

### Gas Giant Classes

The system supports all five gas giant classes with specialized rendering:

| Class         | Description     | Characteristics                         | Example            |
| ------------- | --------------- | --------------------------------------- | ------------------ |
| **Class I**   | Ammonia Clouds  | Jupiter-like, ammonia cloud layers      | Jupiter, Saturn    |
| **Class II**  | Water Clouds    | Water vapor clouds, cooler temperatures | Neptune, Uranus    |
| **Class III** | Cloudless       | Clear atmospheres, hot temperatures     | Hot Jupiters       |
| **Class IV**  | Alkali Metals   | Alkali metal clouds, very hot           | Ultra-hot Jupiters |
| **Class V**   | Silicate Clouds | Silicate dust clouds, extremely hot     | Lava planets       |

### LOD System

The renderer uses a 3-tier LOD system for optimal performance:

| LOD Level   | Distance      | Geometry                    | Use Case         |
| ----------- | ------------- | --------------------------- | ---------------- |
| **Level 0** | 0             | High detail (64 segments)   | Close inspection |
| **Level 1** | 800 × radius  | Medium detail (32 segments) | Normal viewing   |
| **Level 2** | 2000 × radius | Billboard sprite            | Far away         |

### Performance Considerations

- **Dynamic Light Arrays**: Efficiently handles variable numbers of light sources
- **Shadow Casting**: Real-time shadow calculations with penumbra effects
- **Ring Integration**: Lazy initialization of ring systems
- **Material Caching**: Reuses materials across LOD levels
- **Shader Optimization**: LOD-controlled octave counts for noise generation

### Physics Integration

- **Atmospheric Effects**: Realistic atmospheric scattering and absorption
- **Ring Shadow Casting**: Rings cast shadows on the planet surface
- **Dynamic Lighting**: Real-time lighting calculations with multiple sources
- **Seeded Generation**: Deterministic procedural effects based on object properties

## Classes

### Base Classes

- [[celestials/gas-giants/BaseGasGiantRenderer|Base Gas Giant Renderer]] - Abstract base renderer for all gas giant classes
- [[celestials/gas-giants/GasGiantMaterials|Base Gas Giant Material]] - Abstract base material with dynamic light/shadow support
- [[celestials/gas-giants/GasGiantMaterials|Basic Gas Giant Material]] - Simple material for LOD levels

### Class-Specific Renderers

- [[celestials/gas-giants/ClassIGasGiantRenderer|Class I Gas Giant Renderer]] - Renderer for Class I gas giants (Ammonia Clouds)
- [[celestials/gas-giants/ClassIIGasGiantRenderer|Class II Gas Giant Renderer]] - Renderer for Class II gas giants (Water Clouds)
- [[celestials/gas-giants/ClassIIIGasGiantRenderer|Class III Gas Giant Renderer]] - Renderer for Class III gas giants (Cloudless)
- [[celestials/gas-giants/ClassIVGasGiantRenderer|Class IV Gas Giant Renderer]] - Renderer for Class IV gas giants (Alkali Metals)
- [[celestials/gas-giants/ClassVGasGiantRenderer|Class V Gas Giant Renderer]] - Renderer for Class V gas giants (Silicate Clouds)

### Class-Specific Materials

- [[celestials/gas-giants/GasGiantMaterials|Class I Material]] - Material for Class I gas giants with 4D fractal noise
- [[celestials/gas-giants/GasGiantMaterials|Class II Material]] - Material for Class II gas giants
- [[celestials/gas-giants/GasGiantMaterials|Class III Material]] - Material for Class III gas giants
- [[celestials/gas-giants/GasGiantMaterials|Class IV Material]] - Material for Class IV gas giants
- [[celestials/gas-giants/GasGiantMaterials|Class V Material]] - Material for Class V gas giants

## Shaders

### Class I Shaders

- [[celestials/gas-giants/class-i.vertex.glsl|Class I Vertex Shader]] - Vertex shader for Class I gas giants
- [[celestials/gas-giants/class-i.fragment.glsl|Class I Fragment Shader]] - Fragment shader with 4D fractal simplex noise

### Basic Shaders

- [[celestials/gas-giants/basic.vertex.glsl|Basic Vertex Shader]] - Basic vertex shader for LOD levels
- [[celestials/gas-giants/basic.fragment.glsl|Basic Fragment Shader]] - Basic fragment shader for LOD levels

## Dependencies

- `@teskooano/data-types` - Core data structures and gas giant properties
- `@teskooano/renderer-threejs-celestial` - Base rendering framework
- `@teskooano/celestials-rings` - Ring system integration
- `three` - Three.js 3D library

## 🔗 Related

- Composes with [[celestials/rings/RingSystemRenderer|Ring System Renderer]] when rings present
- Uses [[renderer/threejs-celestial/BaseCelestialRenderer|Base Celestial Renderer]] for core functionality
- Integrates with [[renderer/threejs-lighting/LightingManager|Lighting Manager]] for dynamic lighting
- Works with [[renderer/threejs-objects/threejs-objects|Three.js Objects]] factory system
