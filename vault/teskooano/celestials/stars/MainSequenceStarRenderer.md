---
aliases: [MainSequenceStarRenderer]
tags: [renderer, threejs, stars, main-sequence]
type: class
package: "@teskooano/celestials-stars"
file: "src/main-sequence/main-sequence-star.ts"
status: active
---

# MainSequenceStarRenderer

Main sequence star renderer for rendering main sequence stars with enhanced shader effects.

## Overview

The `MainSequenceStarRenderer` class is a specialized renderer for main sequence stars. It extends the `BaseStarRenderer` and provides optimized LOD management, material caching, and corona effects for main sequence stars.

## Class Definition

```typescript
export class MainSequenceStarRenderer<
  TMainSequenceMaterial extends MainSequenceStarMaterial = MainSequenceStarMaterial,
> extends BaseStarRenderer<TMainSequenceMaterial>
```

**Inheritance:**

- `BaseStarRenderer<TMainSequenceMaterial>` - Base star renderer
- Generic type parameter for material type

## Constructor

```typescript
constructor(
  object: RenderableCelestialObject,
  options: BaseCelestialRendererOptions = {},
)
```

### Parameters

#### object

- **Type**: `RenderableCelestialObject`
- **Description**: The celestial object to render

#### options

- **Type**: `BaseCelestialRendererOptions`
- **Default**: `{}`
- **Description**: Configuration options for the renderer

## Properties

### materialCache

```typescript
private materialCache: Map<string, TMainSequenceMaterial> = new Map();
```

**Purpose:**
Caches materials by object ID to avoid recreating them.

**Type:**

- **Key**: `string` (object ID)
- **Value**: `TMainSequenceMaterial` (cached material)

## Methods

### createMaterial

```typescript
protected createMaterial(
  object: RenderableCelestialObject<StarProperties>,
): TMainSequenceMaterial
```

**Purpose:**
Creates or retrieves the appropriate material for a main sequence star.

**Parameters:**

- **object**: The celestial object with star properties

**Returns:**

- **Type**: `TMainSequenceMaterial`
- **Description**: The material for the star

**Process:**

1. Checks if material is already cached
2. If cached, returns the cached material
3. If not cached, creates new material
4. Caches the new material
5. Returns the material

### getCustomLODs

```typescript
protected getCustomLODs(
  object: RenderableCelestialObject<StarProperties>,
  options?: CelestialMeshOptions,
): LODLevel[]
```

**Purpose:**
Returns the custom LOD levels for main sequence stars.

**Parameters:**

- **object**: The celestial object with star properties
- **options**: Optional mesh options

**Returns:**

- **Type**: `LODLevel[]`
- **Description**: Array of LOD levels

**Process:**

1. Creates and registers material
2. Gets optimized star segments
3. Creates high-detail geometry and mesh
4. Creates group with mesh and corona
5. Creates medium-detail geometry and mesh
6. Returns LOD levels with distances

### getBillboardLODDistance

```typescript
protected getBillboardLODDistance(
  object: RenderableCelestialObject<StarProperties>,
): number
```

**Purpose:**
Returns the distance at which the billboard LOD appears.

**Parameters:**

- **object**: The celestial object with star properties

**Returns:**

- **Type**: `number`
- **Description**: Distance for billboard LOD

**Process:**

- Returns `object.radius * 2000` (increased from 500)
- Makes billboards much more distant to avoid occlusion issues
- Only uses billboards when objects are truly far away

### getStarColor

```typescript
protected getStarColor(
  star: RenderableCelestialObject<StarProperties>,
): THREE.Color
```

**Purpose:**
Gets the star color based on its properties.

**Parameters:**

- **star**: The celestial object with star properties

**Returns:**

- **Type**: `THREE.Color`
- **Description**: The star color

**Process:**

1. Gets properties from the star
2. If color is defined in properties, returns that color
3. Otherwise, returns default color (0xffcc00)

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

**Purpose:**
Updates the renderer with current state.

**Parameters:**

- **object**: The celestial object
- **time**: Current time
- **timeScale**: Time scaling factor
- **lightSources**: Map of light sources
- **camera**: Current camera
- **allObjects**: All celestial objects (optional)
- **allMeshes**: All meshes (optional)

**Process:**

- Calls the parent class update method
- Inherits all update functionality from BaseStarRenderer

## LOD System

### High Detail LOD

- **Distance**: 0 (closest)
- **Geometry**: High-detail sphere geometry
- **Segments**: Optimized star segments (64)
- **Features**: Full mesh with corona effects

### Medium Detail LOD

- **Distance**: `object.radius * 100`
- **Geometry**: Medium-detail sphere geometry
- **Segments**: Optimized star segments (32)
- **Features**: Simplified mesh without corona

### Billboard LOD

- **Distance**: `object.radius * 2000`
- **Type**: Billboard sprite
- **Features**: 2D representation for distant viewing

## Material Management

### Material Caching

- **Cache**: `Map<string, TMainSequenceMaterial>`
- **Key**: Object ID
- **Value**: Cached material
- **Purpose**: Avoids recreating materials

### Material Creation

- **Type**: `MainSequenceStarMaterial`
- **Base**: `EnhancedStarMaterial`
- **Features**: Enhanced shader effects

## Corona Effects

### Corona Integration

- **Method**: `_addCoronaToGroup`
- **Layers**: Multiple corona layers
- **Scales**: 1.1, 1.2
- **Opacities**: 0.1, 0.05

### Corona Properties

- **Material**: `CoronaMaterial`
- **Blending**: Additive blending
- **Transparency**: Transparent
- **Depth**: No depth writing

## Performance Optimizations

### LOD Optimization

- **Distance-Based**: Different LODs at different distances
- **Geometry Reduction**: Reduced segments for distant LODs
- **Billboard Fallback**: 2D sprites for very distant objects

### Material Caching

- **Reuse**: Reuses cached materials
- **Memory**: Efficient memory usage
- **Performance**: Avoids material recreation

### Geometry Optimization

- **Segments**: Optimized segment counts
- **LOD**: Different detail levels
- **Efficiency**: Balanced quality and performance

## Usage

### Basic Usage

```typescript
const renderer = new MainSequenceStarRenderer(starObject, {
  lightingManager: lightingManager,
});
```

### With Custom Material

```typescript
class CustomMainSequenceMaterial extends MainSequenceStarMaterial {
  // Custom implementation
}

const renderer = new MainSequenceStarRenderer<CustomMainSequenceMaterial>(
  starObject,
  options,
);
```

### LOD Management

```typescript
const lodLevels = renderer.getLODLevels(starObject, {
  detailLevel: "high",
});
```

## Error Handling

### Validation

- **Object Validation**: Validates celestial object
- **Properties Validation**: Validates star properties
- **Material Validation**: Validates material creation

### Fallbacks

- **Default Colors**: Provides default colors
- **Default Materials**: Provides default materials
- **Error Recovery**: Recovers from errors gracefully

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

- [[celestials/stars/MainSequenceStarMaterial|Main Sequence Star Material]] - Material used by this renderer
- [[celestials/stars/BaseStarRenderer|Base Star Renderer]] - Base star renderer
- [[celestials/stars/EnhancedStarMaterial|Enhanced Star Material]] - Enhanced star material
- [[celestials/stars/CoronaMaterial|Corona Material]] - Corona material
- [[renderer/threejs-celestial/threejs-celestial|Three.js Celestial Renderer]] - Base renderer system
- [[data/data-types/data-types|Data Types]] - Type definitions
