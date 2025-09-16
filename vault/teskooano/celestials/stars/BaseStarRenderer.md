---
aliases: [BaseStarRenderer]
tags: [renderer, threejs, stars]
type: Class
package: "@teskooano/celestials-stars"
name: BaseStarRenderer
dependencies:
  [
    "three",
    "@teskooano/renderer-threejs-celestial",
    "@teskooano/renderer-threejs-lighting",
  ]
functions:
  [
    "getLODLevels",
    "update",
    "dispose",
    "getCustomLODs",
    "getBillboardLODDistance",
  ]
status: active
---

# BaseStarRenderer

Abstract base class for all star renderers with common functionality including LOD management, corona effects, material management, and lighting integration.

## Overview

The `BaseStarRenderer` class extends `BaseCelestialRenderer` and provides the foundation for all star rendering in the Teskooano system. It handles LOD creation, corona effect generation, material management, and lighting integration for all stellar objects.

## Class Definition

```typescript
export abstract class BaseStarRenderer<
  TStarMaterial extends BaseStarMaterial = BaseStarMaterial,
> extends BaseCelestialRenderer<TStarMaterial>
```

## Key Features

- **LOD Management**: Creates and manages LOD levels for stars
- **Corona Effects**: Generates atmospheric corona effects around stars
- **Material Management**: Manages star materials and uniform updates
- **Lighting Integration**: Integrates with the lighting system
- **Billboard Support**: Creates billboard LODs for distant viewing
- **Performance Optimization**: Efficient rendering with LOD switching

## Properties

### Protected Properties

#### coronaMaterials

```typescript
protected coronaMaterials: Map<string, CoronaMaterial[]> = new Map();
```

Map of corona materials keyed by object ID.

#### starLightingManager

```typescript
protected starLightingManager?: LightingManager;
```

Optional lighting manager for advanced lighting calculations.

## Constructor

```typescript
constructor(
  object: RenderableCelestialObject,
  options: BaseCelestialRendererOptions = {},
)
```

### Parameters

- **object**: The celestial object to render
- **options**: Optional renderer configuration

### Initialization

1. **Base Class**: Calls `super(object, options)` to initialize base renderer
2. **Lighting Manager**: Stores lighting manager reference
3. **Corona Materials**: Initializes corona materials map

## Abstract Methods

### createMaterial

```typescript
protected abstract createMaterial(
  object: RenderableCelestialObject,
): TStarMaterial
```

Creates the appropriate material for this star type.

**Must be implemented by subclasses.**

### getCustomLODs

```typescript
protected abstract getCustomLODs(
  object: RenderableCelestialObject,
  options?: CelestialMeshOptions,
): LODLevel[]
```

Provides custom LOD levels for the star.

**Must be implemented by subclasses.**

### getBillboardLODDistance

```typescript
protected abstract getBillboardLODDistance(
  object: RenderableCelestialObject,
): number
```

Defines the distance at which the billboard LOD appears.

**Must be implemented by subclasses.**

## Methods

### getLODLevels

```typescript
getLODLevels(
  object: RenderableCelestialObject,
  options?: CelestialMeshOptions,
): LODLevel[]
```

Assembles and returns all LOD levels for the star, combining custom meshes with a standard billboard for distant viewing.

#### Parameters

- **object**: The celestial object
- **options**: Optional mesh creation options

#### Returns

- **LODLevel[]**: Array of LOD levels sorted by distance

#### Process

1. **Custom LODs**: Gets custom LOD levels from subclass
2. **Billboard Distance**: Gets billboard distance from subclass
3. **Star Color**: Gets star color for billboard
4. **Billboard Creation**: Creates billboard LOD
5. **Combination**: Combines custom and billboard LODs
6. **Sorting**: Sorts LODs by distance

### \_createCoronaGroup

```typescript
protected _createCoronaGroup(object: RenderableCelestialObject): THREE.Group
```

Creates a group containing the corona meshes for a star.

#### Parameters

- **object**: The celestial object

#### Returns

- **THREE.Group**: Group containing corona meshes

#### Process

1. **Group Creation**: Creates main corona group
2. **Corona Addition**: Adds corona meshes to group
3. **Return**: Returns complete corona group

### \_addCoronaToGroup

```typescript
protected _addCoronaToGroup(
  object: RenderableCelestialObject,
  group: THREE.Group,
): void
```

Adds corona effect to a given group.

#### Parameters

- **object**: The celestial object
- **group**: The group to add corona to

#### Process

1. **Star Color**: Gets star color for corona
2. **Corona Materials**: Initializes corona materials array
3. **Corona Scales**: Defines corona scales (1.1x, 1.2x)
4. **Corona Opacities**: Defines corona opacities (0.1, 0.05)
5. **Corona Creation**: Creates corona meshes for each scale
6. **Material Setup**: Configures corona materials
7. **Group Addition**: Adds corona meshes to group

### getStarColor

```typescript
protected getStarColor(object: RenderableCelestialObject): THREE.Color
```

Gets the color of the star from its properties.

#### Parameters

- **object**: The celestial object

#### Returns

- **THREE.Color**: Star color

#### Process

1. **Properties**: Gets star properties
2. **Color Extraction**: Extracts color from properties
3. **Color Conversion**: Converts to THREE.Color
4. **Return**: Returns star color

### update

```typescript
public override update(
  object: RenderableCelestialObject,
  time: number,
  timeScale: number,
  lightSources: LightSourcesMap,
  camera: THREE.PerspectiveCamera,
  allObjects?: Record<string, RenderableCelestialObject>,
  allMeshes?: Record<string, THREE.Object3D>,
): void
```

The update loop for the star renderer.

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
2. **Material Update**: Updates star material
3. **Color Updates**: Updates star colors from properties
4. **Material Parameters**: Updates material parameters
5. **Time Uniform**: Updates time uniform for animation

### setMaterialUniforms

```typescript
setMaterialUniforms(key: string, uniform: THREE.Uniform): void
```

Sets material uniforms for the star.

#### Parameters

- **key**: Uniform key
- **uniform**: Uniform value

#### Process

1. **Material Retrieval**: Gets material from material manager
2. **Uniform Update**: Updates uniform value
3. **Validation**: Validates material exists

### \_updateStarMaterialUniforms

```typescript
private _updateStarMaterialUniforms(
  material: TStarMaterial,
  materialParams: any,
): void
```

Updates material uniforms from star properties.

#### Parameters

- **material**: The star material
- **materialParams**: Material parameters

#### Process

1. **Noise Parameters**: Updates noise-related uniforms
2. **Lighting Parameters**: Updates lighting-related uniforms
3. **Validation**: Validates uniform existence

### \_updateUniformIfDefined

```typescript
private _updateUniformIfDefined(
  material: TStarMaterial,
  uniformName: string,
  value: any,
): void
```

Helper method to update a uniform if it exists and the value is defined.

#### Parameters

- **material**: The star material
- **uniformName**: Name of the uniform
- **value**: Value to set

#### Process

1. **Validation**: Checks if uniform exists and value is defined
2. **Update**: Updates uniform value if valid

### dispose

```typescript
public override dispose(): void
```

Disposes of all resources.

#### Process

1. **Base Disposal**: Calls parent dispose method
2. **Material Disposal**: Disposes of material manager
3. **Corona Disposal**: Disposes of all corona materials
4. **Map Clearing**: Clears corona materials map

## LOD System

### Custom LODs

Subclasses must implement `getCustomLODs` to provide:

- **High Detail**: Full star rendering with corona effects
- **Medium Detail**: Simplified star rendering
- **Additional Levels**: Any additional LOD levels needed

### Billboard LOD

The base class automatically creates a billboard LOD for distant viewing:

- **Distance**: Determined by subclass implementation
- **Size**: 0.05 (configurable)
- **Color**: Star color from properties
- **Albedo**: 1.0 (stars are emissive)

### LOD Combination

The system combines custom LODs with billboard LOD:

1. **Custom LODs**: From subclass implementation
2. **Billboard LOD**: Automatically created
3. **Sorting**: LODs sorted by distance
4. **Return**: Complete LOD array

## Corona System

### Corona Layers

The corona system creates multiple layers:

- **Inner Corona**: 1.1x star radius, 0.1 opacity
- **Outer Corona**: 1.2x star radius, 0.05 opacity

### Corona Properties

- **Scale**: Configurable corona scales
- **Opacity**: Configurable opacity values
- **Pulse Speed**: Configurable pulsing rate
- **Noise Scale**: Procedural pattern scale

### Corona Materials

- **CoronaMaterial**: Specialized material for corona effects
- **Additive Blending**: Creates glowing effect
- **Transparency**: Supports transparency
- **Animation**: Time-based animation

## Performance Optimizations

### LOD Optimization

- **Distance-Based**: LOD switching based on camera distance
- **Performance Scaling**: Reduced complexity at distance
- **Smooth Transitions**: No visual artifacts during LOD changes

### Material Optimization

- **Material Caching**: Cached materials for reuse
- **Uniform Updates**: Efficient uniform updates
- **Resource Management**: Proper resource cleanup

### Corona Optimization

- **Layered Rendering**: Efficient multi-layer rendering
- **Additive Blending**: Optimized blending for glow effects
- **Transparency**: Efficient transparency handling

## Error Handling

### Material Creation Failures

- **Graceful Fallback**: Falls back to default materials if needed
- **Error Logging**: Comprehensive error logging for debugging
- **Resource Management**: Proper cleanup of failed resources

### Performance Issues

- **LOD Fallback**: Falls back to simpler LOD levels if needed
- **Memory Management**: Proper cleanup of resources
- **Error Recovery**: Recovers from rendering errors

## Integration

### Base Renderer

- **Extends**: `BaseCelestialRenderer` for common functionality
- **Lighting Manager**: Integrates with lighting management system
- **LOD System**: Uses centralized LOD management

### Dependencies

- **Three.js**: Core 3D graphics library
- **Lighting System**: Advanced lighting calculations
- **Data Types**: Type definitions and data structures

## 🔗 Related

- [[celestials/stars/BaseStarMaterial|Base Star Material]] - Base material class used by this renderer
- [[celestials/stars/CoronaMaterial|Corona Material]] - Corona material used by this renderer
- [[celestials/stars/MainSequenceStarRenderer|Main Sequence Star Renderer]] - Concrete implementation for main sequence stars
- [[celestials/stars/ClassGStarRenderer|Class G Star Renderer]] - Concrete implementation for G-class stars
- [[celestials/stars/ClassOStarRenderer|Class O Star Renderer]] - Concrete implementation for O-class stars
- [[celestials/stars/NeutronStarRenderer|Neutron Star Renderer]] - Concrete implementation for neutron stars
- [[celestials/stars/createMesh|Create Mesh Factory]] - Factory function that creates this renderer
- [[renderer/threejs-celestial/threejs-celestial|Three.js Celestial Renderer]] - Base renderer system
- [[renderer/threejs-lighting/threejs-lighting|Three.js Lighting System]] - Lighting system
- [[data/data-types/data-types|Data Types]] - Type definitions
