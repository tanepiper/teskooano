---
aliases: [ProceduralPlanetMaterial]
tags: [renderer, threejs, material, shader, terrestrial]
type: Class
package: "@teskooano/celestials-terrestrial"
name: ProceduralPlanetMaterial
dependencies: ["three", "LightArrayUtils"]
functions: ["update"]
status: active
---

# ProceduralPlanetMaterial

Shader-based material for procedural surface generation with noise-driven terrain, height-based color blending, and multi-source lighting.

## Overview

The `ProceduralPlanetMaterial` class extends `THREE.ShaderMaterial` and provides a custom shader-based material specifically designed for procedural terrestrial planet surfaces. It implements noise-driven terrain generation, height-based color blending, multi-source lighting calculations, and shadow casting.

## Class Definition

```typescript
export class ProceduralPlanetMaterial extends THREE.ShaderMaterial
```

## Key Features

- **Noise-Driven Terrain**: Simplex noise-based terrain generation with configurable parameters
- **Height-Based Color Blending**: 5-level color palette with smooth height-based transitions
- **Multi-Source Lighting**: Support for up to 4 dynamic light sources
- **Shadow Casting**: Soft shadows from celestial bodies with penumbra effects
- **Configurable Parameters**: Extensive parameter control for terrain generation
- **Performance Optimized**: Efficient shader calculations and uniform management

## Constructor

```typescript
constructor(surfaceProps: ProceduralSurfaceProperties)
```

### Parameters

- **surfaceProps**: Surface properties for procedural generation

### Initialization Process

1. **Color Parsing**: Parses and validates color values with fallbacks
2. **Uniform Setup**: Sets up all shader uniforms with default values
3. **Shader Assignment**: Assigns vertex and fragment shaders
4. **Material Properties**: Sets material properties for rendering

## Uniforms

### Lighting Uniforms

```typescript
uNumLights: {
  value: 0;
}
uLights: {
  value: LightArrayUtils.createLightSourceArray(MAX_LIGHTS);
}
uAmbientLightColor: {
  value: new THREE.Color(0xffffff);
}
uAmbientLightIntensity: {
  value: surfaceProps.ambientLightIntensity ?? 0.03;
}
uCameraPosition: {
  value: new THREE.Vector3();
}
```

- **uNumLights**: Number of active light sources
- **uLights**: Array of light source data
- **uAmbientLightColor**: Ambient light color
- **uAmbientLightIntensity**: Ambient light intensity
- **uCameraPosition**: Camera position for lighting calculations

### Shadow Uniforms

```typescript
uNumShadowCasters: {
  value: 0;
}
uShadowCasters: {
  value: LightArrayUtils.createShadowCasterArray(MAX_SHADOW_CASTERS);
}
```

- **uNumShadowCasters**: Number of active shadow casters
- **uShadowCasters**: Array of shadow caster data

### Noise Parameters

```typescript
persistence: {
  value: surfaceProps.persistence ?? 0.5;
}
lacunarity: {
  value: surfaceProps.lacunarity ?? 2.0;
}
uSimplePeriod: {
  value: surfaceProps.simplePeriod ?? 4.0;
}
uOctaves: {
  value: surfaceProps.octaves ?? 6;
}
uUndulation: {
  value: surfaceProps.undulation ?? 0.1;
}
```

- **persistence**: Noise persistence (0.0-1.0)
- **lacunarity**: Noise lacunarity (1.0+)
- **uSimplePeriod**: Noise period
- **uOctaves**: Number of noise octaves
- **uUndulation**: Surface undulation

### Color Palette

```typescript
uColor1: {
  value: parseColor(surfaceProps.color1, "#5179B5");
}
uColor2: {
  value: parseColor(surfaceProps.color2, "#4C9341");
}
uColor3: {
  value: parseColor(surfaceProps.color3, "#836F27");
}
uColor4: {
  value: parseColor(surfaceProps.color4, "#A0A0A0");
}
uColor5: {
  value: parseColor(surfaceProps.color5, "#FFFFFF");
}
```

- **uColor1**: Lowest height color (e.g., ocean floor)
- **uColor2**: Low height color (e.g., ocean, lowlands)
- **uColor3**: Medium height color (e.g., hills, plateaus)
- **uColor4**: High height color (e.g., mountains, peaks)
- **uColor5**: Highest height color (e.g., snow caps, peaks)

### Height Levels

```typescript
uHeight1: {
  value: surfaceProps.height1 ?? 0.0;
}
uHeight2: {
  value: surfaceProps.height2 ?? 0.2;
}
uHeight3: {
  value: surfaceProps.height3 ?? 0.4;
}
uHeight4: {
  value: surfaceProps.height4 ?? 0.6;
}
uHeight5: {
  value: surfaceProps.height5 ?? 0.8;
}
```

- **uHeight1**: Height threshold 1 (0.0)
- **uHeight2**: Height threshold 2 (0.2)
- **uHeight3**: Height threshold 3 (0.4)
- **uHeight4**: Height threshold 4 (0.6)
- **uHeight5**: Height threshold 5 (0.8)

### Material Properties

```typescript
uBumpScale: {
  value: surfaceProps.bumpScale ?? 1;
}
uRoughness: {
  value: surfaceProps.roughness ?? 0.5;
}
uShininess: {
  value: surfaceProps.shininess ?? 16.0;
}
uSpecularStrength: {
  value: surfaceProps.specularStrength ?? 0.3;
}
```

- **uBumpScale**: Bump mapping scale
- **uRoughness**: Surface roughness
- **uShininess**: Surface shininess
- **uSpecularStrength**: Specular reflection strength

### Terrain Parameters

```typescript
uTerrainType: {
  value: surfaceProps.terrainType ?? 2;
}
uTerrainAmplitude: {
  value: surfaceProps.terrainAmplitude ?? 1.0;
}
uTerrainSharpness: {
  value: surfaceProps.terrainSharpness ?? 1.0;
}
uTerrainOffset: {
  value: surfaceProps.terrainOffset ?? 0.0;
}
```

- **uTerrainType**: Terrain generation type (1=simple, 2=sharp peaks, 3=sharp valleys)
- **uTerrainAmplitude**: Terrain height scale
- **uTerrainSharpness**: Terrain feature definition
- **uTerrainOffset**: Base height offset

### Time Uniform

```typescript
uTime: {
  value: 0.0;
}
```

- **uTime**: Current time for animation effects

## Methods

### resizeLightArrays

```typescript
protected resizeLightArrays(newSize: number): void
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
protected resizeShadowCasterArrays(newSize: number): void
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
  time: number,
  timeScale: number,
  lightSources?: Map<string, LightSourceData>,
  camera?: THREE.PerspectiveCamera,
  shadowCasters?: { position: THREE.Vector3; radius: number }[],
): void
```

Updates the material with current time, camera position, light sources, and shadow casters.

#### Parameters

- **time**: Current time
- **timeScale**: Time scale factor
- **lightSources**: Map of light sources (optional)
- **camera**: Camera for rendering (optional)
- **shadowCasters**: Array of shadow casting objects (optional)

#### Process

1. **Time Update**: Updates time uniform
2. **Camera Update**: Updates camera position uniform
3. **Light Count**: Calculates number of lights
4. **Array Resize**: Resizes light arrays if needed
5. **Light Update**: Updates light source uniforms
6. **Shadow Count**: Calculates number of shadow casters
7. **Shadow Resize**: Resizes shadow caster arrays if needed
8. **Shadow Update**: Updates shadow caster uniforms

#### Light Source Update

```typescript
if (lightSources) {
  let i = 0;
  for (const lightData of lightSources.values()) {
    this.uniforms.uLights.value[i].position.copy(lightData.position);
    this.uniforms.uLights.value[i].color.copy(lightData.color);
    this.uniforms.uLights.value[i].intensity = lightData.intensity ?? 1.0;
    i++;
  }
}
```

#### Shadow Caster Update

```typescript
if (shadowCasters) {
  for (let i = 0; i < numShadowCasters; i++) {
    this.uniforms.uShadowCasters.value[i].position.copy(
      shadowCasters[i].position,
    );
    this.uniforms.uShadowCasters.value[i].radius = shadowCasters[i].radius;
  }
}
```

## Shader Integration

### Vertex Shader

The material uses `procedural.vertex.glsl` which provides:

- **World Position**: `vWorldPosition` for lighting calculations
- **World Normal**: `vWorldNormal` for lighting direction
- **Object Position**: `vObjectPosition` for seamless noise generation
- **UV Coordinates**: `vUv` for texture sampling

### Fragment Shader

The material uses `procedural.fragment.glsl` which implements:

- **Terrain Generation**: Noise-based terrain height calculation
- **Color Blending**: Height-based color palette blending
- **Multi-Source Lighting**: Lighting from multiple light sources
- **Shadow Casting**: Soft shadows with penumbra effects
- **Material Properties**: PBR material calculations

## Procedural Generation

### Noise Parameters

#### Persistence

- **Range**: 0.0 to 1.0
- **Default**: 0.5
- **Effect**: Controls how much each octave contributes to the final result
- **Usage**: Higher values create more detailed terrain

#### Lacunarity

- **Range**: 1.0+
- **Default**: 2.0
- **Effect**: Controls the frequency multiplier between octaves
- **Usage**: Higher values create more varied terrain features

#### Octaves

- **Range**: 1-16
- **Default**: 6
- **Effect**: Number of noise octaves combined
- **Usage**: More octaves create more detailed terrain

#### Simple Period

- **Range**: 1.0+
- **Default**: 4.0
- **Effect**: Controls the scale of terrain features
- **Usage**: Higher values create larger terrain features

#### Undulation

- **Range**: 0.0-1.0
- **Default**: 0.1
- **Effect**: Controls surface smoothness
- **Usage**: Higher values create more undulating surfaces

### Terrain Types

#### Type 1: Simple

- **Description**: Basic noise-based terrain
- **Use Case**: General purpose terrain
- **Characteristics**: Smooth, natural-looking features

#### Type 2: Sharp Peaks

- **Description**: Terrain with sharp, mountain-like peaks
- **Use Case**: Mountainous planets
- **Characteristics**: Dramatic elevation changes

#### Type 3: Sharp Valleys

- **Description**: Terrain with deep valleys and canyons
- **Use Case**: Canyon worlds, ice moons
- **Characteristics**: Deep, dramatic valleys

### Color Palette System

The system uses a 5-level color palette with height-based blending:

1. **Color1**: Lowest height (e.g., ocean floor, deep valleys)
2. **Color2**: Low height (e.g., ocean, lowlands)
3. **Color3**: Medium height (e.g., hills, plateaus)
4. **Color4**: High height (e.g., mountains, peaks)
5. **Color5**: Highest height (e.g., snow caps, peaks)

### Height Levels

- **Height1**: 0.0 (0% of terrain range)
- **Height2**: 0.2 (20% of terrain range)
- **Height3**: 0.4 (40% of terrain range)
- **Height4**: 0.6 (60% of terrain range)
- **Height5**: 0.8 (80% of terrain range)

## Performance Optimizations

### Array Management

- **Dynamic Resizing**: Arrays resize based on actual usage
- **Memory Efficiency**: Only allocates memory for active lights/casters
- **Uniform Updates**: Efficient uniform value updates

### Shader Optimization

- **Efficient Calculations**: Optimized shader calculations
- **Minimal Loops**: Optimized loop structures
- **GPU Optimization**: Optimized for GPU execution

### Uniform Management

- **Conditional Updates**: Only updates uniforms when values change
- **Batch Updates**: Batches uniform updates for efficiency
- **Memory Management**: Proper uniform memory management

## Error Handling

### Color Parsing

```typescript
const parseColor = (
  hex: string | undefined,
  defaultColor: string,
): THREE.Color => {
  try {
    return new THREE.Color(hex ?? defaultColor);
  } catch (e) {
    console.warn(
      `Error parsing color ${hex}, using default ${defaultColor}`,
      e,
    );
    return new THREE.Color(defaultColor);
  }
};
```

**Handling:**

- Validates color values before parsing
- Provides fallback colors for invalid values
- Logs warnings for debugging

### Uniform Validation

- **Range Clamping**: Clamps uniform values to valid ranges
- **Type Safety**: Ensures uniform types are correct
- **Error Prevention**: Prevents shader compilation errors

## Integration

### Base Material

- **Extends**: `THREE.ShaderMaterial` for shader-based rendering
- **Compatibility**: Maintains compatibility with Three.js material system
- **Performance**: Optimized for procedural planet rendering

### Dependencies

- **Three.js**: Core 3D graphics library
- **LightArrayUtils**: Utility for managing light arrays
- **Shader System**: Custom vertex and fragment shaders

## 🔗 Related

- [[BaseTerrestrialRenderer]] - Renderer that uses this material
- [[procedural.vertex.glsl]] - Vertex shader used by this material
- [[procedural.fragment.glsl]] - Fragment shader used by this material
- [[PlanetMaterialService]] - Service that creates this material
- [[@teskooano/renderer-threejs-celestial]] - Base renderer system
- [[@teskooano/data-types]] - Type definitions
