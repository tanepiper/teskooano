---
aliases: [AsteroidFieldMaterial]
tags: [renderer, threejs, asteroids, field, material, shader]
type: class
package: "@teskooano/celestials-asteroid-field"
file: "src/material.ts"
extends: "THREE.ShaderMaterial"
status: active
---

# AsteroidFieldMaterial

Shader material for rendering asteroid field particles with multiple texture support and animation capabilities.

## Overview

The `AsteroidFieldMaterial` extends Three.js `ShaderMaterial` to provide specialized surface rendering for asteroid fields. It features multiple texture support for visual variety, point-based particle rendering with size scaling, belt rotation and individual particle animation, and configurable render parameters.

## Features

- **Multiple Texture Support**: 5 different asteroid texture variants for visual variety
- **Point-based Particle Rendering**: Efficient particle rendering with size scaling
- **Belt Rotation Animation**: Animated belt rotation for the entire field
- **Individual Particle Animation**: Time-based individual particle rotation
- **Vertex Color Variations**: Per-particle color variations for realistic appearance
- **Configurable Parameters**: Customizable render scale, rotation speed, and alpha testing
- **Automatic Texture Loading**: Asynchronous texture loading with fallback generation

## Constructor

```typescript
constructor(options: AsteroidFieldMaterialOptions = {})
```

### Parameters

- `options` - Configuration object for the material

### Options Interface

```typescript
interface AsteroidFieldMaterialOptions {
  asteroidTextures?: THREE.Texture[]; // Array of asteroid textures
  alphaTest?: number; // Alpha testing threshold
  particleRotationSpeed?: number; // Speed of particle rotation
  renderScale?: number; // Render scale factor
}
```

### Default Values

- `alphaTest`: 0.2
- `particleRotationSpeed`: 1.5
- `renderScale`: 1.0

### Initialization

The constructor:

1. Sets up shader uniforms with default values
2. Configures vertex and fragment shaders
3. Sets material properties (transparent, depthWrite, blending)
4. Initializes texture loader
5. Loads textures or creates fallback textures

## Shader Configuration

### Vertex Shader

Uses [[asteroid.vert]] for:

- Instance matrix transformations
- Belt rotation calculations
- Attribute passing to fragment shader

### Fragment Shader

Uses [[asteroid.frag]] for:

- Texture sampling from multiple variants
- Rotation animation of texture coordinates
- Alpha testing and color modulation

### Material Properties

- `transparent`: false - Not transparent
- `depthWrite`: true - Enable depth writing
- `blending`: THREE.NormalBlending - Use normal blending
- `vertexColors`: true - Enable vertex colors

## Uniforms

### Texture Uniforms

```glsl
uniform sampler2D asteroidTextures[5];
uniform float alphaTest;
```

- `asteroidTextures`: Array of 5 asteroid texture variants
- `alphaTest`: Alpha testing threshold for transparent pixels

### Animation Uniforms

```glsl
uniform float beltRotationAngle;
uniform float time;
uniform float particleRotationSpeed;
```

- `beltRotationAngle`: Current belt rotation angle
- `time`: Current simulation time for particle animation
- `particleRotationSpeed`: Speed of individual particle rotation

### Rendering Uniforms

```glsl
uniform float renderScale;
```

- `renderScale`: Scale factor for rendering

## Methods

### updateBeltRotation

```typescript
updateBeltRotation(angle: number): void
```

Updates the belt rotation angle for animating the entire field.

#### Parameters

- `angle` - New belt rotation angle in radians

### updateTime

```typescript
updateTime(time: number): void
```

Updates the time uniform for individual particle animations.

#### Parameters

- `time` - Current simulation time

### updateParticleRotationSpeed

```typescript
updateParticleRotationSpeed(speed: number): void
```

Updates the particle rotation speed.

#### Parameters

- `speed` - New particle rotation speed

### updateRenderScale

```typescript
updateRenderScale(scale: number): void
```

Updates the render scale uniform.

#### Parameters

- `scale` - New render scale factor

### setAsteroidTextures

```typescript
setAsteroidTextures(textures: THREE.Texture[]): void
```

Sets custom asteroid textures.

#### Parameters

- `textures` - Array of THREE.Texture objects

### loadTexturesFromPaths

```typescript
loadTexturesFromPaths(texturePaths: string[]): void
```

Loads textures from provided file paths.

#### Parameters

- `texturePaths` - Array of texture file paths

### isMaterialReady

```typescript
isMaterialReady(): boolean
```

Returns whether all textures have been loaded and the material is ready.

#### Returns

Boolean indicating if the material is ready for rendering.

### getAsteroidTextures

```typescript
getAsteroidTextures(): THREE.Texture[]
```

Returns the loaded asteroid textures.

#### Returns

Array of loaded THREE.Texture objects.

### dispose

```typescript
dispose(): void
```

Disposes of all textures and cleans up resources.

#### Cleanup Process

1. Calls parent `dispose` method
2. Disposes all loaded textures
3. Clears texture array
4. Resets material ready state

## Private Methods

### loadTextures

```typescript
private loadTextures(texturePaths?: string[]): void
```

Loads asteroid textures asynchronously from provided paths or creates fallback textures.

#### Loading Process

1. **Path Validation**: Checks if texture paths are provided
2. **Fallback Creation**: Creates fallback textures if no paths provided
3. **Async Loading**: Loads textures asynchronously with error handling
4. **Completion Handling**: Updates material when all textures are loaded

### createFallbackTexture

```typescript
private createFallbackTexture(): THREE.Texture
```

Creates a single fallback texture for asteroid rendering.

#### Fallback Texture Generation

1. **Canvas Creation**: Creates 64x64 canvas for texture generation
2. **Base Color**: Fills with brown base color (#8B7355)
3. **Noise Detail**: Adds random noise/detail spots
4. **Crater Effects**: Adds darker spots for crater appearance
5. **Texture Creation**: Converts canvas to THREE.CanvasTexture

### createFallbackTextures

```typescript
private createFallbackTextures(): void
```

Creates fallback textures for when no texture paths are provided.

#### Fallback Creation

- Creates 5 fallback textures using `createFallbackTexture`
- Sets material ready state to true
- Updates uniforms with fallback textures

## Texture Management

### Automatic Loading

The material automatically handles texture loading:

1. **Path-based Loading**: Loads textures from provided file paths
2. **Error Handling**: Creates fallbacks for failed texture loads
3. **Completion Detection**: Tracks loading progress and updates material
4. **Fallback Generation**: Creates procedural fallback textures

### Fallback Textures

When texture loading fails or no paths are provided:

- **Procedural Generation**: Creates textures using canvas and 2D context
- **Realistic Appearance**: Brown base color with noise and crater effects
- **Consistent Quality**: All fallback textures have similar appearance
- **Performance**: Efficient canvas-based texture generation

## Performance Considerations

### Texture Loading

- **Asynchronous Loading**: Non-blocking texture loading
- **Error Recovery**: Graceful fallback for failed loads
- **Memory Management**: Proper texture disposal and cleanup
- **Ready State**: Material ready state prevents rendering before textures load

### Shader Optimization

- **Efficient Sampling**: Optimized texture sampling in fragment shader
- **Alpha Testing**: Early pixel discard for transparent areas
- **Vertex Colors**: Efficient vertex color modulation
- **Rotation Animation**: GPU-based rotation calculations

## Usage Example

```typescript
import { AsteroidFieldMaterial } from "@teskooano/celestials-asteroid-field";
import * as THREE from "three";

// Create material with custom options
const material = new AsteroidFieldMaterial({
  alphaTest: 0.3,
  particleRotationSpeed: 2.0,
  renderScale: 1.5,
});

// Load textures from paths
material.loadTexturesFromPaths([
  "textures/asteroid1.jpg",
  "textures/asteroid2.jpg",
  "textures/asteroid3.jpg",
  "textures/asteroid4.jpg",
  "textures/asteroid5.jpg",
]);

// Update material with current state
material.updateBeltRotation(angle);
material.updateTime(time);
material.updateParticleRotationSpeed(speed);
material.updateRenderScale(scale);

// Check if material is ready
if (material.isMaterialReady()) {
  // Material is ready for rendering
}

// Clean up when done
material.dispose();
```

## Dependencies

- [[asteroid.vert]] - Vertex shader source
- [[asteroid.frag]] - Fragment shader source
- THREE.TextureLoader - Texture loading utility
- THREE.CanvasTexture - Fallback texture generation

## 🔗 Related

- [[AsteroidFieldRenderer]] - Renderer that uses this material
- [[asteroid.vert]] - Vertex shader implementation
- [[asteroid.frag]] - Fragment shader implementation
