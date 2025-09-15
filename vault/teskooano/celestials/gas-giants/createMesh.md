---
aliases: [createMesh, createGasGiantMesh]
tags: [renderer, threejs, gas-giants, factory, function]
type: function
package: "@teskooano/celestials-gas-giants"
file: "src/createMesh.ts"
status: active
---

# createMesh

Factory function for creating gas giant meshes with unified API, automatic class detection, and ring system integration.

## Overview

The `createMesh` function provides a unified interface for creating gas giant meshes with automatic class detection, LOD management, ring system integration, and fallback handling. It's the primary entry point for gas giant mesh creation in the rendering system.

## Signature

```typescript
function createMesh(
  object: RenderableCelestialObject,
  options: CreateMeshOptions,
): THREE.Object3D;
```

### Parameters

- `object` - The gas giant object to create a mesh for
- `options` - Configuration options for mesh creation

### Returns

A Three.js `Object3D` containing the gas giant mesh with LOD levels and optional ring system.

## Options Interface

```typescript
interface CreateMeshOptions {
  /** Map to store and cache renderer instances */
  celestialRenderers: Map<string, CelestialRenderer>;
  /** Function to create LOD objects from levels */
  createLodObject: (
    object: RenderableCelestialObject,
    levels: LODLevel[],
  ) => THREE.LOD;
  /** Lighting manager for advanced rendering */
  lightingManager?: LightingManager;
  /** Enable debug mode for additional logging and fallback usage */
  debug?: boolean;
}
```

### Options Properties

- `celestialRenderers` - Map for caching renderer instances to avoid recreation
- `createLodObject` - Factory function for creating LOD objects from LOD levels
- `lightingManager` - Optional lighting manager for advanced rendering features
- `debug` - Optional debug flag for additional logging and fallback behavior

## Function Behavior

### Class Detection and Renderer Creation

The function automatically detects the gas giant class and creates the appropriate renderer:

1. **Class Detection**: Extracts `classType` from `GasGiantProperties`
2. **Renderer Selection**: Selects appropriate renderer based on class
3. **Renderer Creation**: Creates class-specific renderer instance
4. **Cache Storage**: Stores renderer in the `celestialRenderers` map
5. **Error Handling**: Falls back to fallback sphere if renderer creation fails

### Supported Gas Giant Classes

| Class                     | Renderer                     | Description                   |
| ------------------------- | ---------------------------- | ----------------------------- |
| `GasGiantClass.CLASS_I`   | [[ClassIGasGiantRenderer]]   | Ammonia Clouds (Jupiter-like) |
| `GasGiantClass.CLASS_II`  | [[ClassIIGasGiantRenderer]]  | Water Clouds                  |
| `GasGiantClass.CLASS_III` | [[ClassIIIGasGiantRenderer]] | Cloudless                     |
| `GasGiantClass.CLASS_IV`  | [[ClassIVGasGiantRenderer]]  | Alkali Metals                 |
| `GasGiantClass.CLASS_V`   | [[ClassVGasGiantRenderer]]   | Silicate Clouds               |

### LOD Management

The function handles LOD (Level of Detail) management:

1. **LOD Level Generation**: Calls `renderer.getLODLevels()` to get LOD levels
2. **LOD Object Creation**: Uses `createLodObject` to create the final LOD object
3. **Validation**: Validates that LOD levels are properly generated
4. **Fallback**: Uses fallback sphere if LOD generation fails

### Ring System Integration

When a lighting manager is provided:

1. **Ring Detection**: Checks if the gas giant has ring properties
2. **Shadow Caster Registration**: Registers ring shadow casters with lighting manager
3. **Automatic Integration**: Ring system is automatically integrated into LOD levels

### Debug Mode

When debug mode is enabled:

1. **Forced Fallback**: Always uses fallback sphere regardless of renderer creation
2. **Additional Logging**: Provides detailed console output for debugging
3. **Error Visibility**: Makes errors more visible during development

## Implementation Details

### Renderer Creation Process

```typescript
// Check cache first
let renderer = celestialRenderers.get(object.id) as
  | BaseGasGiantRenderer
  | undefined;

if (!renderer) {
  const properties = object.properties as GasGiantProperties;
  const gasGiantClass = properties.classType;

  // Create class-specific renderer
  switch (gasGiantClass) {
    case GasGiantClass.CLASS_I:
      newRenderer = new ClassIGasGiantRenderer(object, rendererDeps);
      break;
    case GasGiantClass.CLASS_II:
      newRenderer = new ClassIIGasGiantRenderer(object, rendererDeps);
      break;
    // ... other classes
  }

  // Cache the renderer
  celestialRenderers.set(object.id, renderer);
}
```

### LOD Object Creation Process

```typescript
// Get LOD levels from renderer
const lodLevels = renderer.getLODLevels(object);

if (lodLevels && lodLevels.length > 0) {
  // Create LOD object
  const lod = createLodObject(object, lodLevels);

  // Register ring shadow casters if lighting manager is available
  if (options.lightingManager) {
    renderer.registerRingShadowCasters(options.lightingManager, object);
  }

  return lod;
} else {
  // Fallback if LOD generation fails
  return createFallbackSphere(object);
}
```

### Error Handling

The function implements comprehensive error handling:

1. **Unknown Class Errors**: Logs warning and uses fallback for unknown classes
2. **Renderer Creation Errors**: Catches and logs renderer creation failures
3. **LOD Generation Errors**: Validates LOD level generation
4. **Fallback Strategy**: Always provides a fallback sphere as last resort
5. **Debug Logging**: Provides detailed error information in debug mode

## Performance Considerations

- **Renderer Caching**: Avoids recreating renderers for the same objects
- **Class-Specific Optimization**: Each class uses optimized rendering techniques
- **LOD Optimization**: Uses 3-tier LOD system for performance at different distances
- **Ring Integration**: Lazy initialization of ring systems
- **Error Recovery**: Graceful fallback prevents rendering failures
- **Memory Management**: Proper cleanup of temporary objects

## Usage Examples

### Basic Usage

```typescript
import { createMesh } from "@teskooano/celestials-gas-giants";
import type { RenderableCelestialObject } from "@teskooano/data-types";

// Create gas giant mesh
const gasGiantMesh = createMesh(gasGiantObject, {
  celestialRenderers: renderersMap,
  createLodObject: lodFactory,
});
```

### With Lighting Manager

```typescript
// Create gas giant mesh with advanced lighting and ring shadows
const gasGiantMesh = createMesh(gasGiantObject, {
  celestialRenderers: renderersMap,
  createLodObject: lodFactory,
  lightingManager: lightingManager,
});
```

### With Debug Mode

```typescript
// Create gas giant mesh with debug logging
const gasGiantMesh = createMesh(gasGiantObject, {
  celestialRenderers: renderersMap,
  createLodObject: lodFactory,
  debug: true,
});
```

## Backward Compatibility

The function also exports as `createGasGiantMesh` for backward compatibility:

```typescript
// Backward compatible export
export { createMesh as createGasGiantMesh } from "./createMesh";
```

This allows existing code that references `createGasGiantMesh` to continue working without modification.

## Dependencies

- [[BaseGasGiantRenderer]] - Base renderer class for all gas giant classes
- [[ClassIGasGiantRenderer]] - Class I gas giant renderer
- [[ClassIIGasGiantRenderer]] - Class II gas giant renderer
- [[ClassIIIGasGiantRenderer]] - Class III gas giant renderer
- [[ClassIVGasGiantRenderer]] - Class IV gas giant renderer
- [[ClassVGasGiantRenderer]] - Class V gas giant renderer
- [[createFallbackSphere]] - Fallback sphere creation utility
- [[LODLevel]] - LOD level data structure
- [[CelestialRenderer]] - Base renderer interface

## Error Scenarios

### Unknown Gas Giant Class

If an unknown gas giant class is encountered:

1. Warning is logged to console
2. Function returns fallback sphere
3. Simulation continues without the specific gas giant

### Renderer Creation Failure

If renderer creation fails:

1. Error is logged to console
2. Function returns fallback sphere
3. Simulation continues without the specific gas giant

### LOD Generation Failure

If LOD generation fails:

1. Warning is logged to console
2. Function returns fallback sphere
3. Object is still rendered but without LOD optimization

## Integration with Gas Giant System

The factory function integrates with the gas giant rendering system:

1. **Class Detection**: Automatically detects gas giant class from properties
2. **Renderer Selection**: Selects appropriate renderer for each class
3. **LOD Management**: Handles 3-tier LOD system (high detail → medium detail → billboard)
4. **Ring Integration**: Automatic ring system integration when present
5. **Material Management**: Coordinates multiple materials for different LOD levels
6. **Performance Optimization**: Implements caching and fallback strategies

## Gas Giant-Specific Features

The factory function handles gas giant-specific requirements:

1. **Class-Specific Rendering**: Different renderers for each gas giant class
2. **Atmospheric Effects**: Specialized atmospheric rendering for each class
3. **Ring System Integration**: Automatic ring rendering when present
4. **Dynamic Lighting**: Support for multiple light sources and shadow casting
5. **LOD Optimization**: Efficient rendering at different distances

## 🔗 Related

- [[BaseGasGiantRenderer]] - Base renderer class used by this factory
- [[ClassIGasGiantRenderer]] - Class I gas giant renderer
- [[ClassIIGasGiantRenderer]] - Class II gas giant renderer
- [[ClassIIIGasGiantRenderer]] - Class III gas giant renderer
- [[ClassIVGasGiantRenderer]] - Class IV gas giant renderer
- [[ClassVGasGiantRenderer]] - Class V gas giant renderer
- [[GasGiantMaterials]] - Materials used by the renderers
- [[createFallbackSphere]] - Fallback utility for error cases
- [[LODLevel]] - LOD level data structure
- [[CelestialRenderer]] - Base renderer interface
