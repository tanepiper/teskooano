---
aliases:
  [
    GasGiantMaterials,
    BaseGasGiantMaterial,
    BasicGasGiantMaterial,
    ClassIMaterial,
    ClassIIMaterial,
    ClassIIIMaterial,
    ClassIVMaterial,
    ClassVMaterial,
  ]
tags: [renderer, threejs, gas-giants, materials, shader]
type: class
package: "@teskooano/celestials-gas-giants"
file: "src/base/material.ts"
extends: "THREE.ShaderMaterial"
status: active
---

# Gas Giant Materials

Comprehensive collection of shader materials for gas giant rendering, including base materials, class-specific materials, and LOD materials with dynamic lighting and shadow casting support.

## Overview

The gas giant material system provides specialized shader materials for each gas giant class, enabling realistic atmospheric rendering with procedural effects, dynamic lighting, and shadow casting. All materials extend Three.js `ShaderMaterial` and use custom GLSL shaders for optimal performance and visual quality.

## Base Material Classes

### BaseGasGiantMaterial

Abstract base material for gas giants with dynamic light and shadow caster support.

#### Features

- **Dynamic Light Arrays**: Efficiently handles variable numbers of light sources
- **Shadow Caster Support**: Real-time shadow calculations with penumbra effects
- **Array Resizing**: Automatic array resizing for performance optimization
- **Abstract Base**: Template for class-specific materials

#### Constructor

```typescript
constructor(parameters?: THREE.ShaderMaterialParameters)
```

#### Properties

- `currentNumLights: number` - Current number of active light sources
- `currentNumShadowCasters: number` - Current number of active shadow casters

#### Methods

##### update

```typescript
update(
  time: number,
  timeScale: number,
  lights: CalculatedLight[],
  camera: THREE.PerspectiveCamera,
  shadowCasters: CalculatedShadowCaster[]
): void
```

Updates the material with current time and pre-calculated light data.

###### Parameters

- `time` - Current simulation time
- `timeScale` - Time scaling factor
- `lights` - Array of calculated light data
- `camera` - Current camera
- `shadowCasters` - Array of calculated shadow caster data

###### Update Process

1. **Time Updates**: Updates time uniform if present
2. **Light Array Management**: Resizes and updates light arrays
3. **Shadow Caster Management**: Resizes and updates shadow caster arrays
4. **Performance Optimization**: Only updates when array sizes change

##### resizeLightArrays

```typescript
protected resizeLightArrays(newSize: number): void
```

Resizes the light arrays to accommodate the new number of lights.

##### resizeShadowCasterArrays

```typescript
protected resizeShadowCasterArrays(newSize: number): void
```

Resizes the shadow caster arrays to accommodate the new number of shadow casters.

### BasicGasGiantMaterial

Basic gas giant material using simple shaders for LOD levels.

#### Features

- **Simple Rendering**: Basic shader implementation for performance
- **LOD Optimization**: Designed for medium and distant LOD levels
- **Dynamic Lighting**: Support for multiple light sources and shadow casting
- **Performance Focus**: Optimized for distant viewing

#### Constructor

```typescript
constructor(baseColor: THREE.Color = new THREE.Color(0xffffff))
```

#### Parameters

- `baseColor` - Base color for the gas giant (default: white)

#### Material Properties

- **Defines**: MAX_LIGHTS (4), MAX_SHADOW_CASTERS (8)
- **Uniforms**: baseColor, time, uLights, uNumLights, uShadowCasters, uNumShadowCasters, uDynamicAmbientIntensity
- **Shaders**: [[basic.vertex.glsl]], [[basic.fragment.glsl]]

## Class-Specific Materials

### ClassIMaterial

Material for Class I gas giants (Ammonia Clouds - Jupiter-like) with 4D fractal simplex noise.

#### Features

- **4D Fractal Noise**: Advanced procedural atmospheric effects
- **Ammonia Cloud Simulation**: Realistic Jupiter-like atmospheric rendering
- **Storm Map Support**: Optional storm texture overlay
- **LOD-Controlled Octaves**: Dynamic noise complexity based on distance

#### Constructor

```typescript
constructor(options: {
  atmosphereColor: THREE.Color;
  cloudColor: THREE.Color;
  seed: string | number;
  stormMap?: THREE.Texture;
})
```

#### Options

- `atmosphereColor` - Base atmosphere color
- `cloudColor` - Cloud layer color
- `seed` - Seed for procedural generation
- `stormMap` - Optional storm texture overlay

#### Material Properties

- **Defines**: MAX_LIGHTS (4), MAX_SHADOW_CASTERS (16)
- **Uniforms**: mainColor1, mainColor2, darkColor, uSeed, time, uLights, uNumLights, uShadowCasters, uNumShadowCasters, uWarpOctaves, uColorOctaves, stormMap, hasStormMap, uDynamicAmbientIntensity
- **Shaders**: [[class-i.vertex.glsl]], [[class-i.fragment.glsl]]

#### Noise Parameters

- **Warp Octaves**: 5 - Controls atmospheric warping complexity
- **Color Octaves**: 3 - Controls color variation complexity
- **LOD Control**: Octave counts can be reduced for distant viewing

### ClassIIMaterial

Material for Class II gas giants (Water Clouds).

#### Features

- **Water Cloud Simulation**: Realistic water vapor cloud rendering
- **Cooler Temperature Effects**: Atmospheric effects for cooler gas giants
- **Procedural Generation**: Seeded randomness for consistent appearance

#### Constructor

```typescript
constructor(options: {
  atmosphereColor: THREE.Color;
  cloudColor: THREE.Color;
  seed: string | number;
})
```

#### Options

- `atmosphereColor` - Base atmosphere color
- `cloudColor` - Water cloud color
- `seed` - Seed for procedural generation

### ClassIIIMaterial

Material for Class III gas giants (Cloudless).

#### Features

- **Clear Atmosphere**: Rendering for cloudless gas giants
- **Hot Temperature Effects**: Atmospheric effects for hot gas giants
- **Simplified Rendering**: Optimized for clear atmospheres

#### Constructor

```typescript
constructor(options: {
  atmosphereColor: THREE.Color;
  seed: string | number;
})
```

#### Options

- `atmosphereColor` - Base atmosphere color
- `seed` - Seed for procedural generation

### ClassIVMaterial

Material for Class IV gas giants (Alkali Metals).

#### Features

- **Alkali Metal Clouds**: Rendering for alkali metal cloud layers
- **Very Hot Temperature Effects**: Atmospheric effects for very hot gas giants
- **Metallic Appearance**: Specialized rendering for metal-rich atmospheres

#### Constructor

```typescript
constructor(options: {
  atmosphereColor: THREE.Color;
  metalColor: THREE.Color;
  seed: string | number;
})
```

#### Options

- `atmosphereColor` - Base atmosphere color
- `metalColor` - Alkali metal cloud color
- `seed` - Seed for procedural generation

### ClassVMaterial

Material for Class V gas giants (Silicate Clouds).

#### Features

- **Silicate Cloud Simulation**: Rendering for silicate dust clouds
- **Extremely Hot Temperature Effects**: Atmospheric effects for extremely hot gas giants
- **Dusty Appearance**: Specialized rendering for silicate-rich atmospheres

#### Constructor

```typescript
constructor(options: {
  atmosphereColor: THREE.Color;
  silicateColor: THREE.Color;
  seed: string | number;
})
```

#### Options

- `atmosphereColor` - Base atmosphere color
- `silicateColor` - Silicate cloud color
- `seed` - Seed for procedural generation

## Common Features

### Dynamic Lighting System

All materials support:

- **Multiple Light Sources**: Up to 4 light sources (configurable)
- **Real-time Updates**: Light positions and intensities updated per frame
- **Efficient Array Management**: Automatic array resizing for performance
- **Light Attenuation**: Centralized light attenuation calculations

### Shadow Casting System

All materials support:

- **Multiple Shadow Casters**: Up to 16 shadow casters (configurable)
- **Real-time Shadow Calculations**: Ray-sphere intersection tests
- **Penumbra Effects**: Soft shadow edges for realistic appearance
- **Performance Optimization**: Efficient shadow caster management

### LOD Support

Materials support LOD optimization:

- **Octave Control**: Noise octave counts can be reduced for distant viewing
- **Material Switching**: Different materials for different LOD levels
- **Performance Scaling**: Reduced complexity at distance

## Data Structures

### CalculatedLight

```typescript
interface CalculatedLight {
  position: THREE.Vector3;
  color: THREE.Color;
  intensity: number;
}
```

### CalculatedShadowCaster

```typescript
interface CalculatedShadowCaster {
  position: THREE.Vector3;
  radius: number;
}
```

## Performance Considerations

### Array Management

- **Dynamic Resizing**: Arrays resize automatically based on active lights/shadow casters
- **Memory Optimization**: Efficient memory usage with proper cleanup
- **Update Optimization**: Only updates when array sizes change

### Shader Optimization

- **LOD Control**: Noise complexity reduces with distance
- **Efficient Calculations**: Optimized shader code for real-time performance
- **GPU Optimization**: Shader code optimized for GPU execution

### Material Caching

- **Reuse Across LOD**: Materials cached and reused across LOD levels
- **Efficient Updates**: Minimal uniform updates for performance
- **Memory Management**: Proper disposal of materials and textures

## Usage Examples

### Basic Material

```typescript
import { BasicGasGiantMaterial } from "@teskooano/celestials-gas-giants";
import * as THREE from "three";

const basicMaterial = new BasicGasGiantMaterial(new THREE.Color(0x87ceeb));
```

### Class I Material

```typescript
import { ClassIMaterial } from "@teskooano/celestials-gas-giants";
import * as THREE from "three";

const classIMaterial = new ClassIMaterial({
  atmosphereColor: new THREE.Color(0xffffe0),
  cloudColor: new THREE.Color(0xd2b48c),
  seed: "jupiter-123",
  stormMap: stormTexture,
});
```

### Class II Material

```typescript
import { ClassIIMaterial } from "@teskooano/celestials-gas-giants";
import * as THREE from "three";

const classIIMaterial = new ClassIIMaterial({
  atmosphereColor: new THREE.Color(0x4169e1),
  cloudColor: new THREE.Color(0x87ceeb),
  seed: "neptune-456",
});
```

## Integration with Gas Giant System

The materials are used by:

1. **BaseGasGiantRenderer**: Manages material creation and updates
2. **Class-Specific Renderers**: Create appropriate materials for each class
3. **LOD System**: Different materials for different LOD levels
4. **Lighting System**: Dynamic lighting and shadow casting

## Dependencies

- **Three.js ShaderMaterial**: Base material class
- **LightArrayUtils**: Utility functions for light array management
- **GLSL Shaders**: Custom shader implementations for each material type

## 🔗 Related

- [[BaseGasGiantRenderer]] - Renderer that uses these materials
- [[ClassIGasGiantRenderer]] - Class I renderer implementation
- [[ClassIIGasGiantRenderer]] - Class II renderer implementation
- [[ClassIIIGasGiantRenderer]] - Class III renderer implementation
- [[ClassIVGasGiantRenderer]] - Class IV renderer implementation
- [[ClassVGasGiantRenderer]] - Class V renderer implementation
- [[class-i.vertex.glsl]] - Class I vertex shader
- [[class-i.fragment.glsl]] - Class I fragment shader
- [[basic.vertex.glsl]] - Basic vertex shader
- [[basic.fragment.glsl]] - Basic fragment shader
