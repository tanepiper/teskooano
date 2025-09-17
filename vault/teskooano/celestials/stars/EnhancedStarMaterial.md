---
aliases: [EnhancedStarMaterial]
tags: [renderer, threejs, stars, material, shader]
type: Class
package: "@teskooano/celestials-stars"
name: EnhancedStarMaterial
dependencies: ["three", "@teskooano/renderer-threejs-celestial"]
functions: ["update", "dispose"]
status: active
---

# EnhancedStarMaterial

Advanced shader-based material for star rendering with 3-color plasma system, spectral properties, and configurable noise parameters.

## Overview

The `EnhancedStarMaterial` class extends `THREE.ShaderMaterial` and provides a sophisticated material system for rendering stars with realistic plasma effects. It implements a 3-color plasma system (hot, surface, cool), configurable noise parameters, and spectral property integration for accurate stellar rendering.

## Class Definition

```typescript
export class EnhancedStarMaterial extends THREE.ShaderMaterial
```

## Key Features

- **3-Color Plasma System**: Hot, surface, and cool color blending for realistic plasma effects
- **Configurable Noise Parameters**: Adjustable noise scale, intensity, and turbulence
- **Spectral Property Integration**: Automatic color calculation from spectral properties
- **Dynamic Color Updates**: Real-time color updates from star properties
- **Time-Based Animation**: Continuous plasma animation based on simulation time
- **Performance Optimized**: Efficient shader calculations and uniform management

## Constructor

```typescript
constructor(
  object: RenderableCelestialObject,
  color: THREE.Color = new THREE.Color(0xffff00),
  options: {
    noiseScale?: number;
    noiseIntensity?: number;
    plasmaTurbulence?: number;
    lightingIntensity?: number;
  } = {},
)
```

### Parameters

- **object**: The celestial object
- **color**: Base color for the star
- **options**: Material configuration options

### Initialization Process

1. **Star Properties**: Extracts star properties for intelligent defaults
2. **Color Setup**: Sets up hot, surface, and cool colors with fallbacks
3. **Shader Assignment**: Assigns vertex and fragment shaders
4. **Uniform Setup**: Sets up all shader uniforms with default values
5. **Material Properties**: Sets material properties for rendering

## Uniforms

### Time Uniform

```typescript
uTime: {
  value: 0.0;
}
```

- **uTime**: Current time for animation effects

### Color Uniforms

```typescript
uStarColor: {
  value: color;
}
uHotColor: {
  value: hotColor;
}
uSurfaceColor: {
  value: surfaceColor;
}
uCoolColor: {
  value: coolColor;
}
```

- **uStarColor**: Base star color
- **uHotColor**: Hot plasma color (brighter areas)
- **uSurfaceColor**: Surface color (normal areas)
- **uCoolColor**: Cool color (darker areas like sunspots)

### Noise Parameters

```typescript
uNoiseScale: {
  value: options.noiseScale ?? 1.0;
}
uNoiseIntensity: {
  value: options.noiseIntensity ?? 0.2;
}
uPlasmaTurbulence: {
  value: options.plasmaTurbulence ?? 0.1;
}
```

- **uNoiseScale**: Scale of noise patterns
- **uNoiseIntensity**: Intensity of noise effects
- **uPlasmaTurbulence**: Turbulence level of plasma

### Lighting Uniform

```typescript
uLightingIntensity: {
  value: options.lightingIntensity ?? 1.0;
}
```

- **uLightingIntensity**: Overall lighting intensity

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

Updates the material with current time and state.

#### Parameters

- **time**: Current time
- **timeScale**: Time scale factor
- **lightSources**: Map of light sources
- **camera**: Camera for rendering
- **allObjects**: All celestial objects (optional)
- **allMeshes**: All meshes (optional)

#### Process

1. **Time Update**: Updates time uniform for animation
2. **Color Updates**: Updates star colors from object properties
3. **State Updates**: Updates from material parameters if available

### updateStarColors

```typescript
private updateStarColors(starProps: StarProperties): void
```

Updates star colors from properties.

#### Parameters

- **starProps**: Star properties

#### Process

1. **Main Color**: Updates main star color
2. **Hot Color**: Updates hot color with fallback to brighter main color
3. **Surface Color**: Updates surface color with fallback to main color
4. **Cool Color**: Updates cool color with fallback to darker main color

#### Color Fallbacks

```typescript
// Hot color fallback
if (starProps.hotColor && this.uniforms.uHotColor) {
  this.uniforms.uHotColor.value.set(starProps.hotColor);
} else if (starProps.color && this.uniforms.uHotColor) {
  const hotColor = new THREE.Color(starProps.color);
  hotColor.multiplyScalar(1.4); // Make it brighter
  this.uniforms.uHotColor.value.copy(hotColor);
}

// Cool color fallback
if (starProps.coolColor && this.uniforms.uCoolColor) {
  this.uniforms.uCoolColor.value.set(starProps.coolColor);
} else if (starProps.color && this.uniforms.uCoolColor) {
  const coolColor = new THREE.Color(starProps.color);
  coolColor.multiplyScalar(0.3); // Make it much darker
  this.uniforms.uCoolColor.value.copy(coolColor);
}
```

### updateFromState

```typescript
private updateFromState(materialParams: any): void
```

Updates noise parameters from state.

#### Parameters

- **materialParams**: Material parameters

#### Process

1. **Noise Parameters**: Updates noise-related uniforms
2. **Lighting Parameters**: Updates lighting-related uniforms
3. **Validation**: Validates uniform existence

#### Uniform Updates

```typescript
const updateUniform = (uniformName: string, value: any) => {
  if (this.uniforms[uniformName] && value !== undefined) {
    this.uniforms[uniformName].value = value;
  }
};

// Update noise parameters
updateUniform("uNoiseScale", materialParams.noiseScale);
updateUniform("uNoiseIntensity", materialParams.noiseIntensity);
updateUniform("uPlasmaTurbulence", materialParams.plasmaTurbulence);

// Update lighting
updateUniform("uLightingIntensity", materialParams.lightingIntensity);
```

### dispose

```typescript
dispose(): void
```

Cleans up resources.

#### Process

1. **Resource Cleanup**: Cleans up any resources if needed
2. **Parent Disposal**: Calls parent dispose method

## Shader Integration

### Vertex Shader

The material uses `enhanced-star.vertex.glsl` which provides:

- **UV Coordinates**: `vUv` for texture sampling
- **Normal**: `vNormal` for lighting calculations
- **Position**: `vPosition` for noise generation
- **Time**: `uTime` for animation effects

### Fragment Shader

The material uses `enhanced-star.fragment.glsl` which implements:

- **Plasma Generation**: Noise-based plasma effects
- **Color Blending**: 3-color plasma system
- **Animation**: Time-based plasma animation
- **Lighting**: Uniform lighting intensity

## 3-Color Plasma System

### Color Palette

The system uses a 3-color palette for realistic plasma effects:

1. **Hot Color**: Brightest areas (plasma, flares, convection centers)
2. **Surface Color**: Normal surface areas
3. **Cool Color**: Darker areas (sunspots, cooler regions)

### Color Blending

```glsl
// Mix colors based on plasma intensity
vec3 hotPlasma = mix(uSurfaceColor, uHotColor, plasmaPattern * 0.8);
vec3 coolPlasma = mix(uSurfaceColor, uCoolColor, (1.0 - plasmaPattern) * 0.6);

// Final color blend
vec3 finalColor = mix(coolPlasma, hotPlasma, plasmaPattern);
```

### Plasma Pattern

The plasma pattern is generated using:

- **Noise Functions**: Simplex noise for plasma generation
- **Fractal Brownian Motion**: Multi-octave noise for complexity
- **Turbulence**: Additional turbulence for chaotic effects
- **Animation**: Time-based animation for movement

## Noise Parameters

### Noise Scale

- **Range**: 0.01-1.0
- **Default**: 1.0
- **Effect**: Controls the size of plasma features
- **Usage**: Smaller values create finer detail

### Noise Intensity

- **Range**: 0.05-0.5
- **Default**: 0.2
- **Effect**: Controls the strength of plasma effects
- **Usage**: Higher values create more dramatic effects

### Plasma Turbulence

- **Range**: 0.1-2.0
- **Default**: 0.1
- **Effect**: Controls the chaotic nature of plasma
- **Usage**: Higher values create more turbulent effects

## Spectral Property Integration

### Automatic Color Calculation

The material automatically calculates colors from spectral properties:

```typescript
// Get star properties for intelligent defaults
const starProps = object.properties as StarProperties;

// Set up colors with fallbacks
const hotColor = starProps?.hotColor
  ? new THREE.Color(starProps.hotColor)
  : color.clone().multiplyScalar(1.4);
const surfaceColor = starProps?.surfaceColor
  ? new THREE.Color(starProps.surfaceColor)
  : color;
const coolColor = starProps?.coolColor
  ? new THREE.Color(starProps.coolColor)
  : color.clone().multiplyScalar(0.3);
```

### B-V Color Index Support

The material supports B-V color index conversion for accurate stellar colors:

- **Spectral Classes**: Automatic color calculation from spectral class
- **Temperature Mapping**: Color mapping based on stellar temperature
- **Physical Properties**: Integration with mass, radius, luminosity

## Performance Optimizations

### Shader Optimization

- **Efficient Noise**: Optimized noise functions
- **Reduced Octaves**: Limited noise octaves for performance
- **GPU Optimization**: Optimized for GPU execution

### Uniform Management

- **Conditional Updates**: Only updates uniforms when values change
- **Batch Updates**: Batches uniform updates for efficiency
- **Memory Management**: Proper uniform memory management

### Animation Optimization

- **Time Scaling**: Efficient time scaling for animation
- **Continuous Animation**: Smooth continuous animation
- **Performance**: Optimized animation calculations

## Error Handling

### Color Validation

- **Color Parsing**: Validates color values before parsing
- **Fallback Colors**: Provides fallback colors for invalid values
- **Error Recovery**: Recovers from color parsing errors

### Uniform Validation

- **Range Clamping**: Clamps uniform values to valid ranges
- **Type Safety**: Ensures uniform types are correct
- **Error Prevention**: Prevents shader compilation errors

## Integration

### Base Material

- **Extends**: `THREE.ShaderMaterial` for shader-based rendering
- **Compatibility**: Maintains compatibility with Three.js material system
- **Performance**: Optimized for star rendering

### Dependencies

- **Three.js**: Core 3D graphics library
- **Data Types**: Type definitions and data structures
- **Shader System**: Custom vertex and fragment shaders

## Usage Examples

### Basic Usage

```typescript
const material = new EnhancedStarMaterial(
  starObject,
  new THREE.Color(0xffff00),
  {
    noiseScale: 0.03,
    noiseIntensity: 0.12,
    plasmaTurbulence: 0.6,
    lightingIntensity: 1.0,
  },
);
```

### With Spectral Properties

```typescript
const material = new EnhancedStarMaterial(
  starObject,
  new THREE.Color(0xffff00),
);
// Colors will be automatically calculated from spectral properties
```

### Dynamic Updates

```typescript
material.update(time, timeScale, lightSources, camera);
// Material automatically updates colors and parameters
```

## 🔗 Related

- [[celestials/stars/BaseStarMaterial|Base Star Material]] - Base material class
- [[celestials/stars/BaseStarRenderer|Base Star Renderer]] - Renderer that uses this material
- [[celestials/stars/MainSequenceStarRenderer|Main Sequence Star Renderer]] - Renderer that uses this material
- [[celestials/stars/ClassGStarRenderer|Class G Star Renderer]] - G-class star renderer that uses this material
- [[celestials/stars/ClassOStarRenderer|Class O Star Renderer]] - O-class star renderer that uses this material
- [[celestials/stars/enhanced-star.vertex.glsl|Enhanced Star Vertex Shader]] - Vertex shader used by this material
- [[celestials/stars/enhanced-star.fragment.glsl|Enhanced Star Fragment Shader]] - Fragment shader used by this material
- [[renderer/threejs-celestial/threejs-celestial|Three.js Celestial Renderer]] - Base renderer system
- [[data/data-types/data-types|Data Types]] - Type definitions
