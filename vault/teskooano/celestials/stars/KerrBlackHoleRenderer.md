---
aliases: [KerrBlackHoleRenderer, KerrBlackHoleMaterial, ErgosphereMaterial]
tags: [renderer, threejs, stars, black-holes, kerr, rotating]
type: class
package: "@teskooano/celestials-stars"
file: "src/black-holes/kerr-black-hole.ts"
status: active
---

# KerrBlackHoleRenderer & Material

Kerr black hole renderer for rotating black holes with ergosphere effects and frame dragging. Features advanced gravitational lensing and accretion disk visualization.

## Overview

The `KerrBlackHoleRenderer` and `KerrBlackHoleMaterial` provide specialized rendering for Kerr black holes, which are rotating black holes with ergosphere effects and frame dragging. These black holes have more complex geometry than Schwarzschild black holes.

## Class Definition

```typescript
export class KerrBlackHoleRenderer extends BaseStarRenderer<KerrBlackHoleMaterial>
export class KerrBlackHoleMaterial extends SchwarzschildBlackHoleMaterial
export class ErgosphereMaterial extends THREE.ShaderMaterial
```

**Inheritance:**

- `BaseStarRenderer<KerrBlackHoleMaterial>` - Base star renderer
- `SchwarzschildBlackHoleMaterial` - Base black hole material
- `THREE.ShaderMaterial` - Three.js shader material

## Key Features

### Black Hole Type

- **Kerr Black Hole**: Rotating black hole
- **Ergosphere**: Region where space-time is dragged by rotation
- **Frame Dragging**: Space-time rotation effects
- **Accretion Disk**: Optional accretion disk visualization

### Physical Properties

- **Rotation**: Rotating black hole
- **Ergosphere**: Region of frame dragging
- **Event Horizon**: Schwarzschild radius
- **Gravitational Lensing**: Advanced lensing effects

### Visual Effects

- **Ergosphere Effects**: Space-time dragging visualization
- **Frame Dragging**: Rotation effects on space-time
- **Gravitational Lensing**: Advanced lensing effects
- **Accretion Disk**: Optional disk visualization

## Constructor

### KerrBlackHoleRenderer

```typescript
constructor(
  object: RenderableCelestialObject,
  options: BaseCelestialRendererOptions = {},
)
```

**Parameters:**

- **object**: The celestial object to render
- **options**: Optional renderer configuration

### KerrBlackHoleMaterial

```typescript
constructor(object: RenderableCelestialObject)
```

**Parameters:**

- **object**: The celestial object with black hole properties

### ErgosphereMaterial

```typescript
constructor();
```

Creates a new ergosphere material with rotation effects.

## Material Configuration

### Ergosphere Shader

The ergosphere material uses a custom shader for frame dragging effects:

```glsl
uniform float time;
uniform float rotationSpeed;
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
```

### Shader Uniforms

- **time**: Current time for animation
- **rotationSpeed**: Speed of rotation (default: 0.5)

## Methods

### createMaterial

```typescript
protected createMaterial(
  object: RenderableCelestialObject,
): KerrBlackHoleMaterial
```

Creates a new `KerrBlackHoleMaterial` instance for the given object.

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

Updates the material with ergosphere and frame dragging effects.

**Parameters:**

- **time**: Current simulation time
- **timeScale**: Time scaling factor
- **lightSources**: Map of light sources
- **camera**: Camera for distance calculations
- **allObjects**: Optional map of all celestial objects
- **allMeshes**: Optional map of all meshes

## Visual Effects

### Ergosphere Effects

The material implements ergosphere effects:

- **Frame Dragging**: Space-time rotation effects
- **Ergosphere Visualization**: Region of frame dragging
- **Rotation Effects**: Rotating space-time visualization

### Gravitational Lensing

- **Advanced Lensing**: More complex than Schwarzschild
- **Frame Dragging**: Rotation effects on light paths
- **Ergosphere Lensing**: Lensing within the ergosphere

### Accretion Disk

- **Optional Disk**: Can include accretion disk
- **Ring System**: Uses ring system renderer
- **Disk Properties**: Generated accretion disk properties

## Usage

### Basic Usage

```typescript
const kerrBlackHoleObject = {
  id: "kerr-black-hole-1",
  properties: {
    mass: 10.0,
    radius: 0.03, // Schwarzschild radius
    temperature: 0,
    stellarType: "KERR_BLACK_HOLE",
    rotationSpeed: 0.5,
  },
};

const renderer = new KerrBlackHoleRenderer(kerrBlackHoleObject);
const material = renderer.createMaterial(kerrBlackHoleObject);
```

### With Custom Options

```typescript
const renderer = new KerrBlackHoleRenderer(kerrBlackHoleObject, {
  lightingManager: lightingManager,
  detailLevel: "high",
});
```

## Performance

### Optimizations

- **Material Caching**: Materials are cached by object ID
- **Efficient Updates**: Optimized update cycles
- **Shader Optimization**: Optimized shader performance

### Memory Usage

- **Minimal Memory**: Efficient memory usage
- **Resource Management**: Proper resource cleanup
- **Caching**: Material caching for performance

## Error Handling

### Validation

- **Property Validation**: Ensures required properties exist
- **Fallback Values**: Provides defaults for missing data
- **Error Recovery**: Graceful handling of invalid data

### Fallbacks

- **Default Properties**: Uses Kerr black hole defaults for missing data
- **Error Recovery**: Graceful handling of invalid data

## Compatibility

### Three.js Versions

- **Version**: Compatible with Three.js 0.179.1
- **Features**: Uses modern Three.js features
- **Extensions**: No custom extensions required

### GPU Compatibility

- **OpenGL ES**: Compatible with OpenGL ES 2.0+
- **WebGL**: Compatible with WebGL 1.0+
- **Mobile**: Optimized for mobile GPUs

## 🔗 Related

- [[celestials/stars/BaseStarRenderer|Base Star Renderer]] - Base renderer class
- [[celestials/stars/SchwarzschildBlackHoleRenderer|Schwarzschild Black Hole Renderer]] - Non-rotating variant
- [[celestials/stars/GravitationalLensingHelper|Gravitational Lensing Helper]] - Lensing effects
- [[celestials/rings/RingSystemRenderer|Ring System Renderer]] - Accretion disk
- [[celestials/stars/enhanced-star.vertex.glsl|Enhanced Star Vertex Shader]] - Vertex shader
- [[celestials/stars/enhanced-star.fragment.glsl|Enhanced Star Fragment Shader]] - Fragment shader
- [[renderer/threejs-celestial/threejs-celestial|Three.js Celestial Renderer]] - Base renderer system
- [[data/data-types/data-types|Data Types]] - Type definitions
