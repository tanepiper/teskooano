---
aliases: [CoronaMaterial]
tags: [renderer, threejs, stars, material, corona]
type: class
package: "@teskooano/celestials-stars"
file: "src/base/base-star.ts"
status: active
---

# CoronaMaterial

Material for corona effect around stars.

## Overview

The `CoronaMaterial` class creates atmospheric corona effects around stars. It generates dynamic, noise-based patterns with pulsing animation and smooth edge fading to create realistic stellar corona effects.

## Class Definition

```typescript
export class CoronaMaterial extends THREE.ShaderMaterial
```

**Inheritance:**

- `THREE.ShaderMaterial` - Three.js shader material

## Constructor

```typescript
constructor(
  color: THREE.Color = new THREE.Color(0xffff00),
  options: {
    scale?: number;
    opacity?: number;
    pulseSpeed?: number;
    noiseScale?: number;
  } = {},
)
```

### Parameters

#### color

- **Type**: `THREE.Color`
- **Default**: `new THREE.Color(0xffff00)` (yellow)
- **Description**: Base color of the corona

#### options

- **Type**: Object with optional properties
- **Description**: Configuration options for the corona material

##### scale

- **Type**: `number`
- **Description**: Scale of the corona (not used in current implementation)

##### opacity

- **Type**: `number`
- **Default**: `0.6`
- **Description**: Overall opacity of the corona

##### pulseSpeed

- **Type**: `number`
- **Default**: `0.3`
- **Description**: Speed of pulsing animation

##### noiseScale

- **Type**: `number`
- **Default**: `3.0`
- **Description**: Scale of noise patterns

## Shader Configuration

### Vertex Shader

```typescript
vertexShader: coronaVertexShader;
```

Uses the corona vertex shader for vertex processing.

### Fragment Shader

```typescript
fragmentShader: coronaFragmentShader;
```

Uses the corona fragment shader for fragment processing.

## Uniforms

### Time Uniform

```typescript
uTime: {
  value: 0;
}
```

Current time for animation effects.

### Color Uniform

```typescript
uStarColor: {
  value: color;
}
```

Base star color for corona effects.

### Opacity Uniform

```typescript
uOpacity: {
  value: options.opacity ?? 0.6;
}
```

Overall opacity of the corona.

### Animation Uniforms

```typescript
uPulseSpeed: {
  value: options.pulseSpeed ?? 0.3;
}
uNoiseScale: {
  value: options.noiseScale ?? 3.0;
}
```

- **uPulseSpeed**: Speed of pulsing animation
- **uNoiseScale**: Scale of noise patterns

## Material Properties

### Transparency

```typescript
transparent: true;
```

Corona is transparent for blending effects.

### Side

```typescript
side: THREE.DoubleSide;
```

Renders both sides of the geometry.

### Depth Testing

```typescript
depthTest: true;
depthWrite: false;
```

Enables depth testing but disables depth writing to avoid interfering with main star.

### Blending

```typescript
blending: THREE.AdditiveBlending;
```

Uses additive blending for corona effect.

## Methods

### update

```typescript
update(
  time: number,
  timeScale: number,
  lightSources: LightSourcesMap,
  camera: THREE.PerspectiveCamera,
  allObjects?: Record<string, RenderableCelestialObject>,
  allMeshes?: Record<string, THREE.Object3D>,
): void
```

**Purpose:**
Updates the material with the current time and animation state.

**Parameters:**

- **time**: Current time
- **timeScale**: Time scaling factor
- **lightSources**: Map of light sources
- **camera**: Current camera
- **allObjects**: All celestial objects (optional)
- **allMeshes**: All meshes (optional)

**Process:**

1. Creates a much smaller time scale for visible animation cycles
2. Uses a very small scale to create fast, visible animation cycles
3. Updates the time uniform with scaled animation time
4. Logs animation time for debugging

### dispose

```typescript
dispose(): void
```

**Purpose:**
Disposes of any resources used by the material.

**Process:**

- Currently empty implementation
- Can be overridden if needed

## Corona Effects

### Atmospheric Corona

- **Realistic**: Creates realistic stellar corona effects
- **Dynamic**: Time-based animation
- **Natural**: Noise-based patterns
- **Smooth**: Smooth edge transitions

### Animation Effects

- **Pulsing**: Continuous pulsing animation
- **Noise Movement**: Animated noise patterns
- **Color Variation**: Dynamic color changes
- **Alpha Variation**: Dynamic transparency

### Visual Features

- **Edge Fading**: Smooth edge transitions
- **Noise Patterns**: Fractal Brownian motion
- **Color Blending**: Inner and outer color blending
- **Alpha Transparency**: Proper alpha channel handling

## Performance

### Optimizations

- **Efficient Shaders**: Uses optimized shader code
- **Minimal Uniforms**: Only necessary uniforms
- **GPU Optimized**: Optimized for GPU execution

### Memory Usage

- **Minimal Memory**: Efficient memory usage
- **Resource Management**: Proper resource disposal

## Usage

### Basic Usage

```typescript
const coronaMaterial = new CoronaMaterial(new THREE.Color(0xffff00), {
  opacity: 0.8,
  pulseSpeed: 0.5,
  noiseScale: 2.0,
});
```

### With Star Renderer

```typescript
const coronaGroup = new THREE.Group();
const coronaMaterial = new CoronaMaterial(starColor, {
  scale: 1.1,
  opacity: 0.1,
  pulseSpeed: 0.12,
  noiseScale: 1.2,
});

const coronaGeometry = new THREE.SphereGeometry(
  coronaRadius,
  segments,
  segments,
);
const coronaMesh = new THREE.Mesh(coronaGeometry, coronaMaterial);
coronaGroup.add(coronaMesh);
```

## Integration

### With BaseStarRenderer

The corona material is used by the `BaseStarRenderer` to create corona effects:

```typescript
protected _addCoronaToGroup(
  object: RenderableCelestialObject,
  group: THREE.Group,
): void {
  const starColor = this.getStarColor(object);
  const coronaMaterials: CoronaMaterial[] = [];

  this.coronaMaterials.set(object.id, coronaMaterials);

  const coronaScales = [1.1, 1.2];
  const opacities = [0.1, 0.05];

  coronaScales.forEach((scale, index) => {
    const coronaRadius = object.radius * scale;
    const coronaMaterial = new CoronaMaterial(starColor, {
      scale: scale,
      opacity: opacities[index],
      pulseSpeed: 0.12 + index * 0.03,
      noiseScale: 1.2 + index * 0.3,
    });
    // ... create mesh and add to group
  });
}
```

### Multiple Corona Layers

The renderer creates multiple corona layers with different properties:

- **Scale**: Different scales (1.1, 1.2)
- **Opacity**: Different opacities (0.1, 0.05)
- **Pulse Speed**: Different pulse speeds
- **Noise Scale**: Different noise scales

## Error Handling

### Validation

- **Parameter Validation**: Validates constructor parameters
- **Uniform Validation**: Ensures uniforms exist
- **Type Safety**: TypeScript type checking

### Fallbacks

- **Default Values**: Provides default values for missing parameters
- **Error Recovery**: Recovers from errors gracefully
- **Graceful Degradation**: Maintains functionality with errors

## Compatibility

### Three.js Versions

- **Version**: Compatible with Three.js 0.179.1
- **Features**: Uses standard Three.js features
- **Extensions**: No custom extensions required

### GPU Compatibility

- **OpenGL ES**: Compatible with OpenGL ES 2.0+
- **WebGL**: Compatible with WebGL 1.0+
- **Mobile**: Optimized for mobile GPUs

## 🔗 Related

- [[BaseStarMaterial]] - Base star material
- [[BaseStarRenderer]] - Base star renderer
- [[corona.vertex.glsl]] - Corona vertex shader
- [[corona.fragment.glsl]] - Corona fragment shader
- [[@teskooano/renderer-threejs-celestial]] - Base renderer system
- [[@teskooano/data-types]] - Type definitions
