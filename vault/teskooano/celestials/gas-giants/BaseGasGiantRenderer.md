---
aliases: [BaseGasGiantRenderer]
tags: [renderer, threejs, gas-giants, class, abstract]
type: class
package: "@teskooano/celestials-gas-giants"
file: "src/base/renderer.ts"
extends: "BaseCelestialRenderer"
status: active
---

# BaseGasGiantRenderer

Abstract base renderer for gas giants, implementing the LOD system with ring system integration and dynamic lighting support.

## Overview

The `BaseGasGiantRenderer` is an abstract base class that provides the foundation for all gas giant renderers. It extends [[renderer/threejs-celestial/BaseCelestialRenderer|Base Celestial Renderer]] and implements a comprehensive LOD system, ring system integration, and dynamic lighting with shadow casting support. This class serves as the template for specialized gas giant renderers for each class (I-V).

## Features

- **3-Tier LOD System**: High detail, medium detail, and billboard levels
- **Ring System Integration**: Automatic ring rendering when present
- **Dynamic Lighting**: Support for multiple light sources and shadow casting
- **Material Management**: Efficient material creation and caching
- **Performance Optimization**: LOD switching and efficient shader management
- **Abstract Material Creation**: Template method for class-specific materials

## Generic Type Parameter

```typescript
BaseGasGiantRenderer<TGasGiantMaterial extends BaseGasGiantMaterial = BaseGasGiantMaterial>
```

- `TGasGiantMaterial` - The specific gas giant material type this renderer works with

## Constructor

```typescript
constructor(object: RenderableCelestialObject, deps: GasGiantRendererDeps)
```

### Parameters

- `object` - The gas giant object to render
- `deps` - Dependencies including renderer map and lighting manager

### Dependencies Interface

```typescript
interface GasGiantRendererDeps {
  celestialRenderers: Map<string, CelestialRenderer>;
  lightingManager?: LightingManager;
}
```

### Initialization

The constructor:

1. Calls the parent `BaseCelestialRenderer` constructor
2. Registers the renderer in the `celestialRenderers` map
3. Initializes texture loader and ring system renderer

## Abstract Methods

### createMaterial

```typescript
protected abstract createMaterial(object: RenderableCelestialObject): TGasGiantMaterial
```

Abstract method for subclasses to create their specific gas giant material.

#### Parameters

- `object` - The gas giant object

#### Returns

The specific gas giant material instance

#### Implementation

Subclasses must implement this method to create their class-specific material (e.g., [[celestials/gas-giants/GasGiantMaterials|Class I Material]], [[celestials/gas-giants/GasGiantMaterials|Class II Material]], etc.).

## Public Methods

### getLODLevels

```typescript
public getLODLevels(
  object: RenderableCelestialObject,
  options?: CelestialMeshOptions
): LODLevel[]
```

Creates and returns the array of LOD levels for the gas giant with ring system integration.

#### Parameters

- `object` - The gas giant object
- `options` - Optional LOD configuration options

#### Returns

Array of `LODLevel` objects containing distance thresholds and corresponding mesh objects

#### LOD Generation Process

1. **Planet LOD Creation**: Creates planet-specific LOD levels
2. **Ring System Detection**: Checks for ring properties
3. **Lazy Ring Initialization**: Creates ring renderer only when needed
4. **LOD Combination**: Combines planet and ring LOD levels
5. **Group Management**: Organizes LOD levels into groups

### update

```typescript
update(
  object: RenderableCelestialObject,
  time: number,
  timeScale: number,
  lightSources: LightSourcesMap,
  camera: THREE.PerspectiveCamera,
  allObjects?: Record<string, RenderableCelestialObject>
): void
```

Updates the gas giant's appearance with dynamic lighting and shadow casting.

#### Parameters

- `object` - The gas giant object being rendered
- `time` - Current simulation time
- `timeScale` - Time scaling factor
- `lightSources` - Map of light sources for lighting calculations
- `camera` - Current camera for view-dependent effects
- `allObjects` - All celestial objects in the simulation

#### Update Process

1. Calls parent `update` method
2. Updates lighting manager with current light sources
3. Applies centralized light attenuation
4. Calculates dynamic ambient light
5. Converts light sources to shader format
6. Finds and converts shadow casters
7. Updates high-detail material
8. Updates medium-detail material
9. Updates ring system renderer if present

### registerRingShadowCasters

```typescript
public registerRingShadowCasters(
  lightingManager: any,
  object: RenderableCelestialObject
): void
```

Registers ring shadow casters with the lighting manager if rings exist.

#### Parameters

- `lightingManager` - The lighting manager to register with
- `object` - The celestial object

#### Process

1. Checks if ring system renderer exists
2. Registers ring system with lighting manager
3. Uses high detail level for shadow casting

### dispose

```typescript
dispose(): void
```

Disposes of all materials and textures.

#### Cleanup Process

1. Calls parent `dispose` method
2. Disposes ring system renderer if present
3. Cleans up all registered materials

## Protected Methods

### \_createPlanetLODs

```typescript
protected _createPlanetLODs(
  object: RenderableCelestialObject,
  options?: CelestialMeshOptions
): LODLevel[]
```

Creates the array of LOD levels for the planet body itself.

#### LOD Levels Created

1. **Level 0 (High Detail)**:
   - Distance: 0
   - Geometry: High detail sphere (64 segments)
   - Material: Class-specific material

2. **Level 1 (Medium Detail)**:
   - Distance: 800 × radius
   - Geometry: Medium detail sphere (32 segments)
   - Material: [[celestials/gas-giants/GasGiantMaterials|Basic Gas Giant Material]]

3. **Level 2 (Billboard)**:
   - Distance: 2000 × radius
   - Geometry: Billboard sprite
   - Material: Billboard material

#### LOD Creation Process

1. **High Detail Level**: Creates sphere with optimized segments and class-specific material
2. **Medium Detail Level**: Creates sphere with reduced segments and basic material
3. **Billboard Level**: Creates billboard sprite for distant viewing
4. **Group Organization**: Organizes each level into groups

### \_getBaseGasGiantColor

```typescript
private _getBaseGasGiantColor(object: RenderableCelestialObject): THREE.Color
```

Helper to get a representative base color for the gas giant.

#### Parameters

- `object` - The gas giant object

#### Returns

Base color for the gas giant

#### Color Selection Process

1. Extracts `atmosphereColor` from gas giant properties
2. Validates color format
3. Returns fallback color (0xccaa88) if invalid

## Properties

### textureLoader

```typescript
protected textureLoader: THREE.TextureLoader
```

Three.js texture loader for loading textures.

### ringSystemRenderer

```typescript
protected ringSystemRenderer: RingSystemRenderer | null
```

Ring system renderer instance, lazily initialized when rings are present.

## LOD System Details

### LOD Level 0 (High Detail)

- **Distance**: 0 (always visible when object is in view)
- **Geometry**: High detail sphere with optimized segments
- **Material**: Class-specific material (e.g., [[celestials/gas-giants/GasGiantMaterials|Class I Material]])
- **Use Case**: Close inspection and detailed viewing

### LOD Level 1 (Medium Detail)

- **Distance**: 800 × object radius
- **Geometry**: Medium detail sphere with reduced segments
- **Material**: [[celestials/gas-giants/GasGiantMaterials|Basic Gas Giant Material]] for performance
- **Use Case**: Normal viewing distance

### LOD Level 2 (Billboard)

- **Distance**: 2000 × object radius
- **Geometry**: Billboard sprite
- **Material**: Billboard material
- **Use Case**: Far away viewing for performance

## Ring System Integration

### Lazy Initialization

The ring system renderer is created only when:

1. Ring system renderer doesn't exist
2. Object has ring properties
3. Rings array has length > 0

### LOD Combination

When rings are present:

1. Creates ring LOD levels
2. Combines planet and ring LOD levels
3. Organizes into combined groups
4. Maintains distance thresholds

## Performance Optimizations

### Material Caching

- **High Detail Material**: Class-specific material for detailed rendering
- **Medium Detail Material**: Basic material for performance
- **Material Reuse**: Materials cached and reused across LOD levels

### Dynamic Lighting

- **Light Array Management**: Efficiently handles variable numbers of light sources
- **Shadow Caster Management**: Dynamic shadow caster array resizing
- **Light Attenuation**: Centralized light attenuation calculations

### LOD Optimization

- **Distance-based Switching**: Automatic LOD switching based on camera distance
- **Geometry Reduction**: Reduced geometry complexity at distance
- **Material Simplification**: Simpler materials for distant viewing

## Usage Example

```typescript
import { BaseGasGiantRenderer } from "@teskooano/celestials-gas-giants";
import type { RenderableCelestialObject } from "@teskooano/data-types";

// Abstract class - must be extended
class MyGasGiantRenderer extends BaseGasGiantRenderer<MyGasGiantMaterial> {
  protected createMaterial(
    object: RenderableCelestialObject,
  ): MyGasGiantMaterial {
    return new MyGasGiantMaterial(object);
  }
}

// Create renderer
const renderer = new MyGasGiantRenderer(gasGiantObject, {
  celestialRenderers: renderersMap,
  lightingManager: lightingManager,
});

// Get LOD levels
const lodLevels = renderer.getLODLevels(gasGiantObject);

// Update renderer
renderer.update(
  gasGiantObject,
  time,
  timeScale,
  lightSources,
  camera,
  allObjects,
);
```

## Dependencies

- [[renderer/threejs-celestial/BaseCelestialRenderer|Base Celestial Renderer]] - Base rendering functionality
- [[celestials/rings/RingSystemRenderer|Ring System Renderer]] - Ring system integration
- [[celestials/gas-giants/GasGiantMaterials|Base Gas Giant Material]] - Base material functionality
- [[celestials/gas-giants/GasGiantMaterials|Basic Gas Giant Material]] - Basic material for LOD levels
- [[renderer/threejs-celestial/LightArrayUtils|Light Array Utils]] - Light array management utilities
- [[renderer/threejs-celestial/ShadowCasterUtils|Shadow Caster Utils]] - Shadow caster management utilities

## 🔗 Related

- [[celestials/gas-giants/ClassIGasGiantRenderer|Class I Gas Giant Renderer]] - Class I gas giant renderer implementation
- [[celestials/gas-giants/ClassIIGasGiantRenderer|Class II Gas Giant Renderer]] - Class II gas giant renderer implementation
- [[celestials/gas-giants/ClassIIIGasGiantRenderer|Class III Gas Giant Renderer]] - Class III gas giant renderer implementation
- [[celestials/gas-giants/ClassIVGasGiantRenderer|Class IV Gas Giant Renderer]] - Class IV gas giant renderer implementation
- [[celestials/gas-giants/ClassVGasGiantRenderer|Class V Gas Giant Renderer]] - Class V gas giant renderer implementation
- [[celestials/gas-giants/GasGiantMaterials|Base Gas Giant Material]] - Base material class
- [[celestials/gas-giants/GasGiantMaterials|Basic Gas Giant Material]] - Basic material for LOD levels
- [[celestials/gas-giants/createMesh|Create Mesh Factory]] - Factory function for creating gas giant meshes
