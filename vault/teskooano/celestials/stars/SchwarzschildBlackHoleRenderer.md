---
aliases: [SchwarzschildBlackHoleRenderer, SchwarzschildBlackHoleMaterial]
tags: [renderer, threejs, stars, black-holes, schwarzschild]
type: class
package: "@teskooano/celestials-stars"
file: "src/black-holes/schwarzschild-black-hole.ts"
status: active
---

# SchwarzschildBlackHoleRenderer & Material

Non-rotating black hole renderer with Schwarzschild geometry, event horizon visualization, and gravitational lensing effects.

## Overview

The `SchwarzschildBlackHoleRenderer` and `SchwarzschildBlackHoleMaterial` provide specialized rendering for Schwarzschild black holes, which are non-rotating, spherically symmetric black holes defined only by their mass. These black holes have an event horizon and photon sphere, but no charge or angular momentum.

## Class Definition

```typescript
export class SchwarzschildBlackHoleRenderer extends BaseStarRenderer<SchwarzschildBlackHoleMaterial>
export class SchwarzschildBlackHoleMaterial extends THREE.ShaderMaterial
```

**Inheritance:**

- `BaseStarRenderer<SchwarzschildBlackHoleMaterial>` - Base star renderer
- `THREE.ShaderMaterial` - Three.js shader material

## Key Features

### Schwarzschild Geometry

- **Non-Rotating**: No angular momentum or frame dragging
- **Spherically Symmetric**: Perfect spherical geometry
- **Mass-Only**: Defined solely by mass parameter
- **Event Horizon**: Schwarzschild radius (2GM/c²)
- **Photon Sphere**: At 1.5 times the Schwarzschild radius

### Visual Effects

- **Pure Black**: Schwarzschild black holes emit no light
- **Gravitational Lensing**: Spacetime distortion around the black hole
- **Event Horizon**: Visual representation of the event horizon
- **Accretion Disk**: Optional accretion disk visualization
- **Photon Sphere**: Ring of light at the photon sphere

### Physical Properties

- **Event Horizon**: `r_s = 2GM/c²`
- **Photon Sphere**: `r_ph = 3GM/c² = 1.5r_s`
- **No Charge**: Electrically neutral
- **No Rotation**: Zero angular momentum
- **No Hawking Radiation**: Simplified model without quantum effects

## Constructor

### SchwarzschildBlackHoleRenderer

```typescript
constructor(
  object: RenderableCelestialObject,
  options: BaseCelestialRendererOptions = {},
)
```

**Parameters:**

- **object**: The celestial object to render
- **options**: Optional renderer configuration

### SchwarzschildBlackHoleMaterial

```typescript
constructor();
```

Creates a material for Schwarzschild black hole rendering.

## Shader Implementation

### Vertex Shader

```glsl
varying vec2 vUv;
varying vec3 vNormal;

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
```

### Fragment Shader

```glsl
uniform float time;
varying vec2 vUv;
varying vec3 vNormal;

void main() {
  // Schwarzschild black holes emit no light - pure black
  vec3 baseColor = vec3(0.0, 0.0, 0.0);

  // Add subtle edge effects for event horizon
  float edgeEffect = smoothstep(0.8, 1.0, length(vUv - 0.5));
  baseColor = mix(baseColor, vec3(0.1, 0.1, 0.1), edgeEffect);

  gl_FragColor = vec4(baseColor, 1.0);
}
```

## Methods

### createMaterial

```typescript
protected createMaterial(
  object: RenderableCelestialObject,
): SchwarzschildBlackHoleMaterial
```

Creates a new `SchwarzschildBlackHoleMaterial` instance.

### getCustomLODs

```typescript
protected getCustomLODs(
  object: RenderableCelestialObject,
  options?: CelestialMeshOptions,
): LODLevel[]
```

Returns custom LOD levels for Schwarzschild black holes, including gravitational lensing effects.

### getBillboardLODDistance

```typescript
protected getBillboardLODDistance(
  object: RenderableCelestialObject,
): number
```

Returns the distance at which the billboard LOD appears (object.radius \* 500).

## LOD System

### High Detail LOD

- **Distance**: 0 (closest)
- **Features**: Full black hole with gravitational lensing
- **Geometry**: High-detail sphere with lensing distortion
- **Effects**: Event horizon and photon sphere visualization

### Medium Detail LOD

- **Distance**: `object.radius * 50`
- **Features**: Simplified black hole without lensing
- **Geometry**: Medium-detail sphere
- **Effects**: Basic event horizon visualization

### Billboard LOD

- **Distance**: `object.radius * 500`
- **Features**: 2D representation for distant viewing
- **Type**: Black billboard sprite

## Gravitational Lensing

### Lensing Effects

- **Spacetime Distortion**: Visual distortion around the black hole
- **Light Bending**: Simulated gravitational light bending
- **Event Horizon**: Visual representation of the Schwarzschild radius
- **Photon Sphere**: Ring of light at the photon sphere

### Implementation

- **GravitationalLensingHelper**: Specialized helper for lensing effects
- **Schwarzschild Geometry**: Accurate Schwarzschild metric implementation
- **Performance**: Optimized for real-time rendering

## Material Properties

### Base Properties

- **Color**: Pure black (0.0, 0.0, 0.0)
- **Transparency**: Opaque
- **Side**: Front side only
- **Depth Testing**: Enabled
- **Depth Writing**: Enabled

### Shader Uniforms

- **time**: Current time for animation effects
- **vUv**: Texture coordinates
- **vNormal**: Transformed normal

## Usage

### Basic Usage

```typescript
const blackHoleObject = {
  id: "black-hole-1",
  properties: {
    mass: 10.0, // 10 solar masses
    radius: 0.0001, // Schwarzschild radius in AU
    type: "SCHWARZSCHILD",
  },
};

const renderer = new SchwarzschildBlackHoleRenderer(blackHoleObject);
```

### With Custom Options

```typescript
const renderer = new SchwarzschildBlackHoleRenderer(blackHoleObject, {
  lightingManager: lightingManager,
  detailLevel: "high",
});
```

### With Accretion Disk

```typescript
// Add accretion disk visualization
const renderer = new SchwarzschildBlackHoleRenderer(blackHoleObject);
// Accretion disk would be added as a separate component
```

## Performance

### Optimizations

- **LOD System**: Efficient LOD switching based on distance
- **Gravitational Lensing**: Only rendered at high detail
- **Simple Shaders**: Minimal shader complexity for performance
- **Effect Scaling**: Effects scaled by distance

### Memory Usage

- **Efficient Memory**: Minimal memory footprint
- **Resource Management**: Proper cleanup of lensing effects
- **Caching**: Material caching for performance

## Error Handling

### Validation

- **Mass Validation**: Validates black hole mass
- **Property Validation**: Ensures required properties exist
- **Lensing Validation**: Validates lensing effect parameters

### Fallbacks

- **Default Properties**: Uses standard black hole properties
- **Error Recovery**: Graceful handling of rendering errors
- **LOD Fallback**: Falls back to simpler LOD levels if needed

## Compatibility

### Three.js Versions

- **Version**: Compatible with Three.js 0.179.1
- **Features**: Uses modern Three.js features
- **Extensions**: Supports gravitational lensing extensions

### GPU Compatibility

- **OpenGL ES**: Compatible with OpenGL ES 2.0+
- **WebGL**: Compatible with WebGL 1.0+
- **Mobile**: Optimized for mobile GPUs

## 🔗 Related

- [[celestials/stars/BaseStarRenderer|Base Star Renderer]] - Base renderer class
- [[celestials/stars/GravitationalLensingHelper|Gravitational Lensing Helper]] - Lensing effects
- [[celestials/stars/KerrBlackHoleRenderer|Kerr Black Hole Renderer]] - Rotating black hole renderer
- [[renderer/threejs-celestial/threejs-celestial|Three.js Celestial Renderer]] - Base renderer system
- [[data/data-types/data-types|Data Types]] - Type definitions
