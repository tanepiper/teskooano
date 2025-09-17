---
aliases: [SatelliteMaterial]
tags: [renderer, threejs, satellites, material, shader]
type: class
package: "@teskooano/celestials-satellite"
file: "src/material.ts"
status: active
---

# SatelliteMaterial

Advanced shader-based material for satellite rendering with PBR lighting calculations, texture preservation, and dynamic emissive lighting.

## Overview

The `SatelliteMaterial` class extends `THREE.ShaderMaterial` and provides a custom shader-based material specifically designed for satellite rendering. It preserves original model textures while enhancing them with advanced lighting calculations, shadow casting, and dynamic emissive lighting for visibility in space.

## Class Definition

```typescript
export class SatelliteMaterial extends THREE.ShaderMaterial
```

## Key Features

- **Texture Preservation**: Preserves original model textures and materials
- **PBR Lighting**: Physically-based rendering with metallic and roughness properties
- **Multi-Source Lighting**: Calculates lighting from multiple dynamic light sources
- **Shadow Casting**: Soft shadows from celestial bodies with penumbra effects
- **Dynamic Emissive**: Automatic emissive lighting in shadows for visibility
- **Environment Maps**: Support for environment map reflections
- **Performance Optimized**: Efficient lighting and shadow calculations

## Interface

### SatelliteMaterialOptions

```typescript
export interface SatelliteMaterialOptions {
  /** Base color multiplier for the satellite */
  color?: THREE.Color;
  /** Metallic factor for PBR materials */
  metalness?: number;
  /** Roughness factor for PBR materials */
  roughness?: number;
  /** Maximum emissive intensity when fully lit */
  maxEmissiveIntensity?: number;
  /** Original material to preserve textures from */
  originalMaterial?: THREE.Material;
  /** Environment map for reflections */
  envMap?: THREE.Texture;
  /** Environment map intensity */
  envMapIntensity?: number;
}
```

## Properties

### Private Properties

#### maxEmissiveIntensity

```typescript
private maxEmissiveIntensity: number;
```

Maximum emissive intensity when fully illuminated.

#### currentNumLights

```typescript
private currentNumLights: number = 0;
```

Current number of active light sources.

#### currentNumShadowCasters

```typescript
private currentNumShadowCasters: number = 0;
```

Current number of active shadow casters.

### Uniforms

#### Base Material Properties

```typescript
baseColor: {
  value: baseColor;
}
metalness: {
  value: metalness;
}
roughness: {
  value: roughness;
}
maxEmissiveIntensity: {
  value: maxEmissiveIntensity;
}
```

#### Dynamic Lighting

```typescript
uDynamicAmbientIntensity: {
  value: 1.0;
}
uEmissiveIntensity: {
  value: 0.0;
}
uEmissiveColor: {
  value: new THREE.Color(0x111111);
}
```

#### Light Sources

```typescript
uNumLights: {
  value: 0;
}
uLightSources: {
  value: LightArrayUtils.createLightSourceArray(MAX_LIGHTS);
}
```

#### Shadow Casters

```typescript
uNumShadowCasters: {
  value: 0;
}
uShadowCasters: {
  value: LightArrayUtils.createShadowCasterArray(MAX_SHADOW_CASTERS);
}
```

#### Texture Uniforms

```typescript
map: {
  value: diffuseMap;
}
normalMap: {
  value: normalMap;
}
roughnessMap: {
  value: roughnessMap;
}
metalnessMap: {
  value: metalnessMap;
}
hasMap: {
  value: !!diffuseMap;
}
hasNormalMap: {
  value: !!normalMap;
}
hasRoughnessMap: {
  value: !!roughnessMap;
}
hasMetalnessMap: {
  value: !!metalnessMap;
}
```

#### Environment Map

```typescript
envMap: {
  value: finalEnvMap;
}
hasEnvMap: {
  value: !!finalEnvMap;
}
envMapIntensity: {
  value: envMapIntensity;
}
```

## Constructor

```typescript
constructor(options: SatelliteMaterialOptions = {})
```

### Parameters

- **options**: Optional configuration object

### Default Values

- **color**: `new THREE.Color(0xdddddd)` - Clean satellite color
- **metalness**: `0.7` - Metallic satellite materials
- **roughness**: `0.3` - Smooth but not mirror-like
- **maxEmissiveIntensity**: `0.6` - Maximum brightness when fully illuminated
- **envMapIntensity**: `1.0` - Environment map reflection intensity

### Initialization Process

1. **Option Processing**: Processes and validates options
2. **Texture Extraction**: Extracts textures from original material
3. **Material Type Handling**: Handles different material types
4. **Uniform Setup**: Sets up all shader uniforms
5. **Shader Assignment**: Assigns vertex and fragment shaders
6. **Material Properties**: Sets material properties

### Texture Extraction

The constructor extracts textures from the original material:

#### MeshStandardMaterial

- **Diffuse Map**: `originalMaterial.map`
- **Normal Map**: `originalMaterial.normalMap`
- **Roughness Map**: `originalMaterial.roughnessMap`
- **Metalness Map**: `originalMaterial.metalnessMap`
- **Environment Map**: `originalMaterial.envMap`

#### MeshBasicMaterial

- **Diffuse Map**: `originalMaterial.map`

#### MeshPhongMaterial

- **Diffuse Map**: `originalMaterial.map`
- **Normal Map**: `originalMaterial.normalMap`
- **Environment Map**: `originalMaterial.envMap`

## Methods

### resizeLightArrays

```typescript
private resizeLightArrays(newSize: number): void
```

Resizes the light source arrays to accommodate the new number of lights.

#### Parameters

- **newSize**: New size for the light arrays

#### Process

1. **Array Resize**: Uses `LightArrayUtils.resizeLightArray`
2. **Size Update**: Updates current number of lights
3. **Uniform Update**: Updates uniform values

### resizeShadowCasterArrays

```typescript
private resizeShadowCasterArrays(newSize: number): void
```

Resizes the shadow caster arrays to accommodate the new number of shadow casters.

#### Parameters

- **newSize**: New size for the shadow caster arrays

#### Process

1. **Array Resize**: Uses `LightArrayUtils.resizeShadowCasterArray`
2. **Size Update**: Updates current number of shadow casters
3. **Uniform Update**: Updates uniform values

### update

```typescript
update(
  satellitePosition: THREE.Vector3,
  lightSources: LightSourcesMap,
  shadowCasters?: { position: THREE.Vector3; radius: number }[],
): void
```

Updates the material with current lighting information.

#### Parameters

- **satellitePosition**: World position of the satellite
- **lightSources**: Map of light sources
- **shadowCasters**: Array of shadow casting objects (optional)

#### Process

1. **Light Count**: Calculates number of lights (max 4)
2. **Array Resize**: Resizes light arrays if needed
3. **Light Update**: Updates light source uniforms
4. **Shadow Update**: Updates shadow caster uniforms
5. **Emissive Calculation**: Calculates dynamic emissive intensity

#### Light Source Update

```typescript
for (const lightData of lightSources.values()) {
  if (i >= MAX_LIGHTS) break;

  this.uniforms.uLightSources.value[i].position.copy(lightData.position);
  this.uniforms.uLightSources.value[i].color.copy(lightData.color);
  this.uniforms.uLightSources.value[i].intensity = lightData.intensity ?? 1.0;
  i++;
}
```

#### Shadow Caster Update

```typescript
for (let i = 0; i < numShadowCasters; i++) {
  const uniformCaster = this.uniforms.uShadowCasters.value[i];
  uniformCaster.position.copy(shadowCasters[i].position);
  uniformCaster.radius = shadowCasters[i].radius;
}
```

### Emissive Intensity Calculation

The material calculates dynamic emissive intensity based on lighting conditions:

#### Shadow Factor Calculation

```typescript
// Calculate overall shadow factor for emissive calculation
let overallShadowFactor = 1.0;
if (shadowCasters && shadowCasters.length > 0 && lightSources.size > 0) {
  // Get the primary light source (usually the Sun)
  const primaryLight = Array.from(lightSources.values())[0];
  const lightDirection = primaryLight.position
    .clone()
    .sub(satellitePosition)
    .normalize();

  // Check if any shadow caster is blocking the light
  for (const shadowCaster of shadowCasters) {
    const oc = satellitePosition.clone().sub(shadowCaster.position);
    const b = oc.dot(lightDirection);
    const c = oc.dot(oc) - shadowCaster.radius * shadowCaster.radius;
    const discriminant = b * b - c;

    // If the satellite is in the shadow cone
    if (discriminant > 0.0) {
      const t = -b - Math.sqrt(discriminant);
      if (t > 0.001) {
        // Calculate shadow intensity (0.0 = full shadow, 1.0 = fully lit)
        const penumbra = shadowCaster.radius * 0.3; // Reduced from 0.8 to 0.3
        const penumbraSq = penumbra * penumbra;
        const shadowIntensity = 1.0 - Math.min(1.0, discriminant / penumbraSq);

        // Apply the darkest shadow with more aggressive falloff
        overallShadowFactor = Math.min(
          overallShadowFactor,
          shadowIntensity * 0.5,
        );
      }
    }
  }
}
```

#### Emissive Intensity Levels

```typescript
if (overallShadowFactor < 0.3) {
  // In deep shadow - strong emissive for visibility
  emissiveIntensity =
    this.maxEmissiveIntensity * (1.0 - overallShadowFactor) * 1.5;
} else if (overallShadowFactor < 0.7) {
  // In partial shadow - moderate emissive
  emissiveIntensity =
    this.maxEmissiveIntensity * (1.0 - overallShadowFactor) * 0.8;
} else {
  // Well lit - minimal emissive
  emissiveIntensity = this.maxEmissiveIntensity * 0.05;
}
```

### updateLighting

```typescript
updateLighting(lightSources: any): void
```

Updates lighting uniforms - kept for API compatibility.

#### Parameters

- **lightSources**: Light sources (unused)

#### Note

This method is kept for API compatibility but does nothing since the custom shader handles lighting automatically.

## Shader Integration

### Vertex Shader

The material uses `satellite.vertex.glsl` which provides:

- **World Position**: `vWorldPosition` for lighting calculations
- **World Normal**: `vWorldNormal` for lighting direction
- **View Direction**: `vViewDirection` for reflection calculations
- **UV Coordinates**: `vUv` for texture sampling

### Fragment Shader

The material uses `satellite.fragment.glsl` which implements:

- **PBR Lighting**: Physically-based rendering calculations
- **Multi-Source Lighting**: Lighting from multiple light sources
- **Shadow Casting**: Soft shadows with penumbra effects
- **Texture Sampling**: Diffuse, normal, roughness, and metalness maps
- **Environment Reflection**: Environment map reflections
- **Dynamic Emissive**: Emissive lighting based on shadow conditions

## PBR Material Properties

### Metallic

- **Range**: 0.0 to 1.0
- **Default**: 0.7
- **Effect**: Controls metallic vs dielectric behavior
- **Usage**: Higher values make the material more metallic

### Roughness

- **Range**: 0.0 to 1.0
- **Default**: 0.3
- **Effect**: Controls surface roughness and specular reflection
- **Usage**: Lower values create smoother, more reflective surfaces

### Environment Map Intensity

- **Range**: 0.0 to 2.0
- **Default**: 1.0
- **Effect**: Controls intensity of environment map reflections
- **Usage**: Higher values increase reflection intensity

## Lighting System

### Multi-Source Lighting

- **Maximum Lights**: 4 dynamic light sources
- **Light Properties**: Position, color, and intensity
- **Attenuation**: Distance-based light attenuation
- **Shadow Integration**: Shadows affect lighting calculations

### Shadow Casting

- **Maximum Casters**: 4 shadow-casting objects
- **Soft Penumbra**: Realistic shadow falloff
- **Performance Optimized**: Efficient shadow calculations
- **Multiple Casters**: Support for multiple shadow sources

### Dynamic Emissive

- **Shadow-Based**: Emissive intensity based on shadow conditions
- **Visibility Enhancement**: Ensures satellites remain visible in shadows
- **Smooth Transitions**: Gradual changes in emissive intensity
- **Performance Optimized**: Efficient emissive calculations

## Performance Optimizations

### Array Management

- **Dynamic Resizing**: Arrays resize based on actual usage
- **Memory Efficiency**: Only allocates memory for active lights/casters
- **Uniform Updates**: Efficient uniform value updates

### Lighting Calculations

- **Early Exits**: Skips calculations when not needed
- **Clamped Values**: Prevents lighting artifacts
- **Efficient Algorithms**: Optimized shadow and lighting calculations

### Texture Handling

- **Conditional Sampling**: Only samples textures when available
- **Efficient Blending**: Optimized texture blending operations
- **Memory Management**: Proper texture disposal

## Error Handling

### Texture Validation

- **Null Checks**: Validates texture existence before use
- **Fallback Values**: Provides fallback values for missing textures
- **Error Recovery**: Recovers from texture loading failures

### Uniform Validation

- **Range Clamping**: Clamps uniform values to valid ranges
- **Type Safety**: Ensures uniform types are correct
- **Error Prevention**: Prevents shader compilation errors

## Integration

### Base Material

- **Extends**: `THREE.ShaderMaterial` for shader-based rendering
- **Compatibility**: Maintains compatibility with Three.js material system
- **Performance**: Optimized for satellite rendering

### Dependencies

- **Three.js**: Core 3D graphics library
- **LightArrayUtils**: Utility for managing light arrays
- **Shader System**: Custom vertex and fragment shaders

## 🔗 Related

- [[celestials/satellite/SatelliteRenderer|Satellite Renderer]] - Renderer that uses this material
- [[celestials/satellite/satellite.vertex.glsl|Satellite Vertex Shader]] - Vertex shader used by this material
- [[celestials/satellite/satellite.fragment.glsl|Satellite Fragment Shader]] - Fragment shader used by this material
- [[renderer/threejs-celestial/threejs-celestial|Three.js Celestial Renderer]] - Base renderer system
- [[renderer/threejs-lighting/threejs-lighting|Three.js Lighting System]] - Lighting system
- [[data/data-types/data-types|Data Types]] - Type definitions
