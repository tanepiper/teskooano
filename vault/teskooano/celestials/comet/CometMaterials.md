---
aliases:
  [
    CometMaterials,
    CometNucleusMaterial,
    CometComaMaterial,
    CometParticleMaterial,
    CometJetMaterial,
    CometSimplifiedTailMaterial,
  ]
tags: [renderer, threejs, comets, materials, shader]
type: class
package: "@teskooano/celestials-comet"
file: "src/material.ts"
extends: "THREE.ShaderMaterial"
status: active
---

# Comet Materials

Comprehensive collection of shader materials for comet rendering, including nucleus, coma, particle tails, gas jets, and simplified tail effects.

## Overview

The comet material system provides specialized shader materials for each component of a comet, enabling realistic rendering of nucleus surfaces, gas clouds, particle trails, and jet effects. All materials extend Three.js `ShaderMaterial` and use custom GLSL shaders for optimal performance and visual quality.

## Material Classes

### CometNucleusMaterial

Shader material for comet nucleus surface rendering with procedural texturing and advanced lighting.

#### Features

- **Multi-Color Palettes**: Height-based color blending with configurable transitions
- **Procedural Texturing**: Noise-based surface detail with crater and crack effects
- **Advanced Lighting**: Support for multiple light sources with specular highlights
- **Surface Detail**: Configurable noise scales, crater strength, and undulation

#### Constructor

```typescript
constructor(options: CometNucleusMaterialOptions)
```

#### Options Interface

```typescript
interface CometNucleusMaterialOptions {
  colors: THREE.Color[]; // Array of colors for the palette
  heights: number[]; // Height thresholds for each color
  noiseScale?: number; // Scale for base color layering noise
  blendSharpness?: number; // Sharpness of color transitions
  craterScale?: number; // Scale for crater noise
  craterStrength?: number; // Darkness and prominence of craters
  simplePeriod?: number; // Base frequency for noise generation
  undulation?: number; // Surface undulation/waviness amount
  ambientStrength?: number; // Ambient lighting strength
  metallicFactor?: number; // Metallic surface factor
  roughness?: number; // Surface roughness
  specularColor?: THREE.Color; // Specular highlight color
}
```

#### Default Values

- `noiseScale`: 2.0
- `blendSharpness`: 1.0
- `craterScale`: 12.0
- `craterStrength`: 0.5
- `simplePeriod`: 1.0
- `undulation`: 0.1
- `ambientStrength`: 0.01
- `metallicFactor`: 0.0
- `roughness`: 0.5
- `specularColor`: `new THREE.Color(0xffffff)`

#### Shaders

- **Vertex Shader**: [[nucleus.vertex.glsl]] - World position and normal calculation
- **Fragment Shader**: [[nucleus.fragment.glsl]] - Surface texturing with noise and lighting

### CometComaMaterial

Shader material for comet coma (gas cloud) rendering with volumetric effects and density animation.

#### Features

- **Volumetric Rendering**: Spherical gas cloud with density-based opacity
- **Animated Density**: Time-based density noise for realistic gas movement
- **Lighting Integration**: Support for multiple light sources
- **Spherical Falloff**: Natural opacity falloff from center to edge

#### Constructor

```typescript
constructor(options: { color: THREE.Color; opacity: number })
```

#### Options

- `color` - Base color for the gas cloud
- `opacity` - Base opacity for the coma

#### Material Properties

- `transparent`: true - Enables transparency
- `blending`: THREE.NormalBlending - Normal blending mode
- `depthWrite`: true - Writes to depth buffer
- `depthTest`: true - Enables depth testing

#### Shaders

- **Vertex Shader**: [[coma.vertex.glsl]] - Basic vertex transformation
- **Fragment Shader**: [[coma.fragment.glsl]] - Volumetric gas effect with density noise

### CometParticleMaterial

Shader material for comet particle tail rendering with soft particle effects.

#### Features

- **Soft Particle Rendering**: Smooth particle appearance with size scaling
- **Additive Blending**: Bright, glowing particle effects
- **Lighting Integration**: Support for light intensity and ambient lighting
- **Performance Optimization**: Efficient particle rendering

#### Constructor

```typescript
constructor(options: { color: THREE.Color })
```

#### Options

- `color` - Base color for the particles

#### Material Properties

- `transparent`: true - Enables transparency
- `blending`: THREE.AdditiveBlending - Additive blending for glowing effect
- `depthWrite`: false - Particles don't write to depth buffer
- `depthTest`: true - Enables depth testing

#### Shaders

- **Vertex Shader**: [[particle.vertex.glsl]] - Particle positioning and size
- **Fragment Shader**: [[particle.fragment.glsl]] - Soft particle rendering

### CometJetMaterial

Shader material for gas jet rendering with lighting effects.

#### Features

- **Lighting Integration**: Support for light position, color, and intensity
- **Additive Blending**: Bright, glowing jet effects
- **Ambient Lighting**: Configurable ambient light strength
- **Performance Optimization**: Efficient jet particle rendering

#### Constructor

```typescript
constructor(options: { color: THREE.Color })
```

#### Options

- `color` - Base color for the jet particles

#### Material Properties

- `transparent`: true - Enables transparency
- `blending`: THREE.AdditiveBlending - Additive blending for glowing effect
- `depthWrite`: false - Jet effects don't write to depth buffer
- `depthTest`: true - Enables depth testing

#### Shaders

- **Vertex Shader**: [[jet.vertex.glsl]] - Jet particle positioning
- **Fragment Shader**: [[jet.fragment.glsl]] - Cloudy gas jet particles

### CometSimplifiedTailMaterial

Shader material for simplified tail rendering in LOD mode.

#### Features

- **LOD Optimization**: Simplified rendering for distant viewing
- **Noise Shimmer**: Animated noise effects for visual interest
- **Transparency Support**: Configurable opacity
- **Performance Focus**: Optimized for distant rendering

#### Constructor

```typescript
constructor(options: { color: THREE.Color; opacity: number })
```

#### Options

- `color` - Base color for the simplified tail
- `opacity` - Opacity for the tail effect

#### Material Properties

- `transparent`: true - Enables transparency
- `blending`: THREE.NormalBlending - Normal blending mode
- `depthWrite`: true - Writes to depth buffer
- `depthTest`: true - Enables depth testing

#### Shaders

- **Vertex Shader**: [[simplified-tail.vertex.glsl]] - Simplified tail positioning
- **Fragment Shader**: [[simplified-tail.fragment.glsl]] - LOD tail with noise shimmer

## Common Features

### Shader Configuration

All materials use custom GLSL shaders with:

- **Uniform Management**: Efficient uniform updates for animation
- **Lighting Support**: Integration with the lighting system
- **Performance Optimization**: Optimized shader code for real-time rendering

### Material Properties

Common material properties across all comet materials:

- **Transparency**: Most materials support transparency for realistic effects
- **Blending Modes**: Appropriate blending for different visual effects
- **Depth Management**: Proper depth testing and writing for correct rendering order

### Performance Considerations

- **Efficient Shaders**: Optimized GLSL code for real-time performance
- **Minimal Uniforms**: Only necessary uniforms for each material type
- **GPU Optimization**: Shader code optimized for GPU execution

## Usage Examples

### Nucleus Material

```typescript
import { CometNucleusMaterial } from "@teskooano/celestials-comet";
import * as THREE from "three";

const nucleusMaterial = new CometNucleusMaterial({
  colors: [
    new THREE.Color(0x2c3e50),
    new THREE.Color(0x596a7a),
    new THREE.Color(0x8c9baa),
    new THREE.Color(0xd0d5da),
  ],
  heights: [0.0, 0.4, 0.6, 0.85],
  noiseScale: 3.0,
  craterScale: 15.0,
  craterStrength: 0.6,
});
```

### Coma Material

```typescript
import { CometComaMaterial } from "@teskooano/celestials-comet";
import * as THREE from "three";

const comaMaterial = new CometComaMaterial({
  color: new THREE.Color(0x87ceeb),
  opacity: 0.5,
});
```

### Particle Material

```typescript
import { CometParticleMaterial } from "@teskooano/celestials-comet";
import * as THREE from "three";

const particleMaterial = new CometParticleMaterial({
  color: new THREE.Color(0xdce6ff),
});
```

### Jet Material

```typescript
import { CometJetMaterial } from "@teskooano/celestials-comet";
import * as THREE from "three";

const jetMaterial = new CometJetMaterial({
  color: new THREE.Color(0xffffff),
});
```

### Simplified Tail Material

```typescript
import { CometSimplifiedTailMaterial } from "@teskooano/celestials-comet";
import * as THREE from "three";

const simplifiedTailMaterial = new CometSimplifiedTailMaterial({
  color: new THREE.Color(0xdce6ff),
  opacity: 0.3,
});
```

## Integration with CometRenderer

The materials are used by [[CometRenderer]] for:

1. **Nucleus Rendering**: [[CometNucleusMaterial]] for surface detail
2. **Coma Rendering**: [[CometComaMaterial]] for gas cloud effects
3. **Particle Tail Rendering**: [[CometParticleMaterial]] for dust trails
4. **Gas Jet Rendering**: [[CometJetMaterial]] for surface emissions
5. **LOD Tail Rendering**: [[CometSimplifiedTailMaterial]] for distant viewing

## Dependencies

- **Three.js ShaderMaterial**: Base material class
- **LightArrayUtils**: Utility functions for light array management
- **GLSL Shaders**: Custom shader implementations for each material type

## 🔗 Related

- [[CometRenderer]] - Renderer that uses these materials
- [[nucleus.vertex.glsl]] - Nucleus vertex shader
- [[nucleus.fragment.glsl]] - Nucleus fragment shader
- [[coma.fragment.glsl]] - Coma fragment shader
- [[particle.vertex.glsl]] - Particle vertex shader
- [[particle.fragment.glsl]] - Particle fragment shader
- [[jet.vertex.glsl]] - Jet vertex shader
- [[jet.fragment.glsl]] - Jet fragment shader
- [[simplified-tail.vertex.glsl]] - Simplified tail vertex shader
- [[simplified-tail.fragment.glsl]] - Simplified tail fragment shader
