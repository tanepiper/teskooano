---
aliases: [BaseTerrestrialRenderer]
tags: [renderer, threejs, terrestrial]
type: Class
package: "@teskooano/celestials-terrestrial"
name: BaseTerrestrialRenderer
dependencies:
  [
    "three",
    "@teskooano/renderer-threejs-celestial",
    "@teskooano/celestials-rings",
  ]
functions: ["getLODLevels", "update", "dispose", "registerRingShadowCasters"]
status: active
---

# BaseTerrestrialRenderer

Base renderer class for terrestrial planets and moons with LOD orchestration, material management, and optional ring system composition.

## Overview

The `BaseTerrestrialRenderer` class extends `BaseCelestialRenderer` and provides comprehensive rendering support for terrestrial planets and moons. It orchestrates LOD creation, material management, atmospheric effects, and optional ring system composition.

## Class Definition

```typescript
export class BaseTerrestrialRenderer<
  TTerrestrialMaterial extends ProceduralPlanetMaterial = ProceduralPlanetMaterial,
> extends BaseCelestialRenderer<TTerrestrialMaterial>
```

## Key Features

- **LOD Orchestration**: Creates high/medium/billboard LODs with procedural planet material
- **Ring System Composition**: Conditionally instantiates RingSystemRenderer and merges ring LODs
- **Material Management**: Updates surface uniforms, dynamic ambient, and shadow casters
- **Atmosphere Integration**: Manages atmosphere materials and texture lifecycles
- **Performance Optimization**: Efficient LOD switching and resource management

## Properties

### Protected Properties

#### atmosphereMaterials

```typescript
protected atmosphereMaterials: Map<string, AtmosphereMaterial> = new Map();
```

Map of atmosphere materials keyed by object ID.

#### textureLoader

```typescript
protected textureLoader: THREE.TextureLoader;
```

Three.js texture loader for loading textures.

#### ringSystemRenderer

```typescript
protected ringSystemRenderer?: RingSystemRenderer;
```

Optional ring system renderer for planets with rings.

#### loadedTextures

```typescript
protected loadedTextures: Map<
  string,
  { color: THREE.Texture | null; normal: THREE.Texture | null }
> = new Map();
```

Map of loaded textures for caching.

#### material

```typescript
protected material: ProceduralPlanetMaterial | null = null;
```

Main procedural planet material.

#### materialService

```typescript
protected materialService: PlanetMaterialService;
```

Service for creating planet materials.

#### atmosphereService

```typescript
protected atmosphereService: AtmosphereService;
```

Service for creating atmosphere meshes.

## Constructor

```typescript
constructor(
  object: RenderableCelestialObject,
  deps: TerrestrialRendererDeps,
)
```

### Parameters

- **object**: The celestial object to render
- **deps**: Dependencies including renderer map

### Initialization

1. **Base Class**: Calls `super(object)` to initialize base renderer
2. **Texture Loader**: Initializes Three.js texture loader
3. **Services**: Initializes material and atmosphere services
4. **Renderer Registration**: Registers renderer in dependencies map

## Methods

### createMaterial

```typescript
protected createMaterial(
  object: RenderableCelestialObject,
): TTerrestrialMaterial
```

Creates the appropriate material for this terrestrial object.

#### Parameters

- **object**: The celestial object

#### Returns

- **TTerrestrialMaterial**: The created material

#### Process

1. **Material Creation**: Uses material service to create material
2. **Type Casting**: Casts to appropriate material type
3. **Return**: Returns the created material

### getLODLevels

```typescript
getLODLevels(
  object: RenderableCelestialObject,
  options?: CelestialMeshOptions,
): LODLevel[]
```

Creates and returns an array of LOD levels for the terrestrial object.

#### Parameters

- **object**: The celestial object
- **options**: Optional mesh creation options

#### Returns

- **LODLevel[]**: Array of LOD levels

#### Process

1. **Planet LODs**: Creates planet-specific LOD levels
2. **Ring Check**: Checks if object has rings
3. **Ring Renderer**: Lazy initializes ring system renderer if needed
4. **LOD Combination**: Combines planet and ring LODs if rings exist
5. **Return**: Returns combined or planet-only LOD levels

#### LOD Levels

- **Level 0 (High Detail)**: 0 distance - Full procedural surface + atmosphere
- **Level 1 (Medium Detail)**: 250 \* radius distance - Simplified geometry
- **Level 2 (Billboard)**: 1000 _ radius (planets) or 4000 _ radius (moons) - 2D sprite

### update

```typescript
update(
  object: RenderableCelestialObject,
  time: number,
  timeScale: number,
  lightSources: LightSourcesMap,
  camera: THREE.PerspectiveCamera,
  allObjects?: Record<string, RenderableCelestialObject>,
  allMeshes?: Record<string, THREE.Object3D>,
): void
```

Updates uniforms for the planet based on time and lighting.

#### Parameters

- **object**: The celestial object
- **time**: Current time
- **timeScale**: Time scale factor
- **lightSources**: Map of light sources
- **camera**: Camera for rendering
- **allObjects**: All celestial objects (optional)
- **allMeshes**: All meshes (optional)

#### Process

1. **Base Update**: Calls parent update method
2. **Light Source Update**: Updates lighting manager with light sources
3. **Light Attenuation**: Applies centralized light attenuation
4. **Dynamic Ambient**: Calculates dynamic ambient light
5. **Material Update**: Updates procedural planet material
6. **Surface Uniforms**: Updates surface-specific uniforms
7. **Atmosphere Update**: Updates atmosphere material
8. **Ring Update**: Updates ring system renderer if present

### dispose

```typescript
dispose(): void
```

Disposes of all materials and textures.

#### Process

1. **Base Disposal**: Calls parent dispose method
2. **Ring Disposal**: Disposes of ring system renderer
3. **Atmosphere Disposal**: Disposes of all atmosphere materials
4. **Texture Disposal**: Disposes of all loaded textures
5. **Map Clearing**: Clears all material and texture maps

### registerRingShadowCasters

```typescript
public registerRingShadowCasters(
  lightingManager: any,
  object: RenderableCelestialObject,
): void
```

Registers ring shadow casters with the lighting manager if rings exist.

#### Parameters

- **lightingManager**: The lighting manager to register with
- **object**: The celestial object

#### Process

1. **Ring Check**: Checks if ring system renderer exists
2. **Registration**: Registers ring shadow casters with lighting manager
3. **High Detail**: Registers high detail level for shadow casting

## LOD System

### Distance Thresholds

- **Level 0 (High Detail)**: 0 distance
  - Full procedural surface with noise generation
  - Atmospheric effects
  - Maximum visual fidelity
  - All shader effects enabled

- **Level 1 (Medium Detail)**: 250 \* radius distance
  - Simplified geometry (32 segments)
  - Basic material with base color
  - No atmospheric effects
  - Reduced visual complexity

- **Level 2 (Billboard)**: 1000 _ radius (planets), 4000 _ radius (moons)
  - 2D sprite for distant viewing
  - Minimal performance impact
  - Maintained visibility

### Ring Integration

When rings are present:

- **Lazy Initialization**: Ring system renderer created only when needed
- **LOD Combination**: Ring LODs combined with planet LODs
- **Shadow Integration**: Ring shadow casters registered with lighting system
- **Performance**: Rings only rendered at appropriate LOD levels

## Performance Optimizations

### LOD Optimization

- **Distance-Based**: LOD switching based on camera distance
- **Performance Scaling**: Reduced complexity at distance
- **Smooth Transitions**: No visual artifacts during LOD changes

### Material Optimization

- **Shader Efficiency**: Optimized shader calculations
- **Uniform Management**: Efficient uniform updates
- **Texture Caching**: Cached texture loading

### Ring Optimization

- **Lazy Loading**: Rings only created when needed
- **LOD Integration**: Efficient LOD level combination
- **Shadow Optimization**: Efficient shadow caster management

## Error Handling

### Material Creation Failures

- **Graceful Fallback**: Falls back to standard material if procedural material fails
- **Error Logging**: Comprehensive error logging for debugging
- **Resource Management**: Proper cleanup of failed resources

### Performance Issues

- **LOD Fallback**: Falls back to simpler LOD levels if performance issues
- **Memory Management**: Proper cleanup of resources
- **Error Recovery**: Recovers from rendering errors

## Integration

### Base Renderer

- **Extends**: `BaseCelestialRenderer` for common functionality
- **Lighting Manager**: Integrates with lighting management system
- **LOD System**: Uses centralized LOD management

### Dependencies

- **Three.js**: Core 3D graphics library
- **Ring System**: Optional ring system integration
- **Data Types**: Type definitions and data structures

## 🔗 Related

- [[celestials/terrestrial/ProceduralPlanetMaterial|ProceduralPlanetMaterial]] - Material used by this renderer
- [[celestials/terrestrial/AtmosphereMaterial|AtmosphereMaterial]] - Atmosphere material used by this renderer
- [[celestials/terrestrial/PlanetMaterialService|PlanetMaterialService]] - Service for creating materials
- [[celestials/terrestrial/AtmosphereService|AtmosphereService]] - Service for creating atmospheres
- [[celestials/terrestrial/createMesh|createMesh]] - Factory function that creates this renderer
- [[renderer/threejs-celestial/threejs-celestial|Three.js Celestial Renderer]] - Base renderer system
- [[celestials/rings/celestials-rings|Celestials Rings]] - Ring system integration
- [[data/data-types/data-types|Data Types]] - Type definitions
