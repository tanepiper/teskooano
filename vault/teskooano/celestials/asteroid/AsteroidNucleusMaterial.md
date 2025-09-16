---
aliases: [AsteroidNucleusMaterial]
tags: [renderer, threejs, asteroids, material, shader]
type: class
package: "@teskooano/celestials-asteroid"
file: "src/material.ts"
extends: "THREE.ShaderMaterial"
status: active
---

# AsteroidNucleusMaterial

Shader material for asteroid surface rendering with procedural texturing, multi-color palettes, and advanced lighting effects.

## Overview

The `AsteroidNucleusMaterial` extends Three.js `ShaderMaterial` to provide specialized surface rendering for asteroids. It features height-based color blending, procedural noise texturing, crater effects, and support for multiple light sources with shadow casting.

## Features

- **Multi-Color Palettes**: Height-based color blending with configurable transitions
- **Procedural Texturing**: Noise-based surface detail with crater and crack effects
- **Advanced Lighting**: Support for multiple light sources with specular highlights
- **Shadow Casting**: Integration with shadow casters for realistic lighting
- **Dynamic Updates**: Real-time lighting and shadow updates during simulation

## Constructor

```typescript
constructor(options: AsteroidNucleusMaterialOptions)
```

### Parameters

- `options` - Configuration object for the material

### Options Interface

```typescript
export interface AsteroidNucleusMaterialOptions {
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

### Default Values

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

### Constants

- `MAX_LIGHTS`: 4 - Maximum number of light sources
- `MAX_COLORS`: 4 - Maximum number of colors in palette
- `MAX_SHADOW_CASTERS`: 4 - Maximum number of shadow casters

## Shader Configuration

### Defines

- `MAX_LIGHTS`: 4 - Maximum number of light sources
- `MAX_COLORS`: 4 - Maximum number of colors in palette
- `MAX_SHADOW_CASTERS`: 4 - Maximum number of shadow casters
- `NUM_COLORS`: Number of colors in the current palette

### Vertex Shader

Uses [[celestials/asteroid/nucleus.vertex.glsl|Nucleus Vertex Shader]] for:

- World position and normal calculation
- UV coordinate passing
- Logarithmic depth buffer support

### Fragment Shader

Uses [[celestials/asteroid/nucleus.fragment.glsl|Nucleus Fragment Shader]] for:

- Height-based color blending
- Procedural noise texturing
- Crater and crack effects
- Multi-light source lighting
- Shadow casting calculations

## Uniforms

### Color and Height Uniforms

- `uColors[MAX_COLORS]` - Array of colors for the palette
- `uHeights[MAX_COLORS]` - Height thresholds for color blending
- `uNumColors` - Number of active colors in the palette

### Lighting Uniforms

- `uNumLights` - Number of active light sources
- `uLights[MAX_LIGHTS]` - Array of light source data
- `uAmbientStrength` - Ambient lighting strength
- `uMetallicFactor` - Metallic surface factor
- `uRoughness` - Surface roughness
- `uSpecularColor` - Specular highlight color

### Shadow Uniforms

- `uNumShadowCasters` - Number of active shadow casters
- `uShadowCasters[MAX_SHADOW_CASTERS]` - Array of shadow caster data

### Surface Detail Uniforms

- `uNoiseScale` - Scale for base color layering noise
- `uBlendSharpness` - Sharpness of color transitions
- `uCraterScale` - Scale for crater noise
- `uCraterStrength` - Darkness and prominence of craters
- `uSimplePeriod` - Base frequency for noise generation
- `uUndulation` - Surface undulation/waviness amount

### System Uniforms

- `uCameraPosition` - Current camera position
- `uTime` - Current simulation time

## Methods

### update

```typescript
update(
  time: number,
  timeScale: number,
  lightSources?: Map<string, LightSourceData>,
  camera?: THREE.PerspectiveCamera,
  shadowCasters?: { position: THREE.Vector3; radius: number }[]
): void
```

Updates the material with current simulation state.

#### Parameters

- `time` - Current simulation time
- `timeScale` - Time scaling factor
- `lightSources` - Map of light sources for lighting calculations
- `camera` - Current camera for view-dependent effects
- `shadowCasters` - Array of shadow caster objects

#### Update Process

1. Updates time uniform
2. Updates camera position uniform
3. Resizes light arrays if needed
4. Updates light source data
5. Resizes shadow caster arrays if needed
6. Updates shadow caster data

### resizeLightArrays

```typescript
protected resizeLightArrays(newSize: number): void
```

Resizes the light source arrays to accommodate the new number of lights.

### resizeShadowCasterArrays

```typescript
protected resizeShadowCasterArrays(newSize: number): void
```

Resizes the shadow caster arrays to accommodate the new number of shadow casters.

## Shader Features

### Height-Based Color Blending

The fragment shader implements height-based color blending using:

1. **Noise Generation**: Uses `asteroidFBM` function for multi-octave noise
2. **Height Mapping**: Maps noise values to height thresholds
3. **Smooth Blending**: Uses `smoothstep` for smooth color transitions
4. **Sharpness Control**: `uBlendSharpness` controls transition sharpness

### Crater Effects

Crater effects are generated using:

1. **Crater Noise**: Single-octave noise for sharp crater features
2. **Power Function**: `pow(abs(craterNoise), 15.0)` for sharp crater edges
3. **Darkening**: Multiplies base color by `(1.0 - craters * uCraterStrength)`

### Lighting System

The lighting system supports:

1. **Multiple Light Sources**: Up to 4 light sources with individual colors and intensities
2. **Diffuse Lighting**: Standard Lambertian diffuse calculation
3. **Specular Highlights**: Blinn-Phong specular with configurable shininess
4. **Ambient Lighting**: Configurable ambient light strength
5. **Shadow Casting**: Spherical shadow calculations from other celestial bodies

### Shadow Casting

Shadow casting implementation:

1. **Spherical Shadows**: Simple spherical shadow calculations
2. **Multiple Casters**: Support for up to 4 shadow casters
3. **Distance-Based**: Shadow strength based on distance to caster
4. **Configurable Strength**: 80% shadow at center of shadow sphere

## Performance Considerations

- **Array Resizing**: Light and shadow caster arrays are resized only when needed
- **Efficient Noise**: Optimized simplex noise implementation
- **Shader Optimization**: Uses defines to limit loop iterations
- **Memory Management**: Proper cleanup of temporary arrays

## Usage Example

```typescript
import { AsteroidNucleusMaterial } from "@teskooano/celestials-asteroid";
import * as THREE from "three";

// Create material with custom options
const material = new AsteroidNucleusMaterial({
  colors: [
    new THREE.Color(0x8b4513), // Brown
    new THREE.Color(0x696969), // Dark gray
    new THREE.Color(0x2f4f4f), // Dark slate gray
  ],
  heights: [0.0, 0.3, 0.7],
  noiseScale: 3.0,
  craterScale: 15.0,
  craterStrength: 0.6,
});

// Update material with current state
material.update(time, timeScale, lightSources, camera, shadowCasters);
```

## Dependencies

- [[renderer/threejs-celestial/LightArrayUtils|Light Array Utils]] - Utility functions for light array management
- [[celestials/asteroid/nucleus.vertex.glsl|Nucleus Vertex Shader]] - Vertex shader source
- [[celestials/asteroid/nucleus.fragment.glsl|Nucleus Fragment Shader]] - Fragment shader source

## 🔗 Related

- [[celestials/asteroid/AsteroidRenderer|Asteroid Renderer]] - Renderer that uses this material
- [[celestials/asteroid/nucleus.vertex.glsl|Nucleus Vertex Shader]] - Vertex shader implementation
- [[celestials/asteroid/nucleus.fragment.glsl|Nucleus Fragment Shader]] - Fragment shader implementation
