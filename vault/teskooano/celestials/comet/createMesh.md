---
aliases: [createMesh, createCometMesh]
tags: [renderer, threejs, comets, factory, function]
type: function
package: "@teskooano/celestials-comet"
file: "src/createMesh.ts"
status: active
---

# createMesh

Factory function for creating comet meshes with unified API and automatic LOD management.

## Overview

The `createMesh` function provides a unified interface for creating comet meshes with automatic LOD (Level of Detail) management, renderer caching, and fallback handling. It's the primary entry point for comet mesh creation in the rendering system.

## Signature

```typescript
function createMesh(
  object: RenderableCelestialObject,
  options: CreateMeshOptions,
): THREE.Object3D;
```

### Parameters

- `object` - The comet object to create a mesh for
- `options` - Configuration options for mesh creation

### Returns

A Three.js `Object3D` containing the comet mesh with LOD levels.

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

### Renderer Caching

The function implements renderer caching to improve performance:

1. **Cache Check**: First checks if a renderer already exists for the object ID
2. **Renderer Creation**: Creates new [[celestials/comet/CometRenderer|Comet Renderer]] if not cached
3. **Cache Storage**: Stores the renderer in the `celestialRenderers` map
4. **Error Handling**: Falls back to fallback sphere if renderer creation fails

### LOD Management

The function handles LOD (Level of Detail) management:

1. **LOD Level Generation**: Calls `renderer.getLODLevels()` to get LOD levels
2. **LOD Object Creation**: Uses `createLodObject` to create the final LOD object
3. **Validation**: Validates that LOD levels are properly generated
4. **Fallback**: Uses fallback sphere if LOD generation fails

### Debug Mode

When debug mode is enabled:

1. **Forced Fallback**: Always uses fallback sphere regardless of renderer creation
2. **Additional Logging**: Provides detailed console output for debugging
3. **Error Visibility**: Makes errors more visible during development

## Implementation Details

### Renderer Creation Process

```typescript
// Check cache first
let renderer = celestialRenderers.get(object.id) as CometRenderer | undefined;

if (!renderer) {
  try {
    // Create new renderer
    renderer = new CometRenderer(object);
    celestialRenderers.set(object.id, renderer);
  } catch (error) {
    // Fallback on error
    return createFallbackSphere(object);
  }
}
```

### LOD Object Creation Process

```typescript
// Get LOD levels from renderer
const lodLevels = renderer.getLODLevels(object);

if (lodLevels && lodLevels.length > 0) {
  // Create LOD object
  const lod = createLodObject(object, lodLevels);
  return lod;
} else {
  // Fallback if LOD generation fails
  return createFallbackSphere(object);
}
```

### Error Handling

The function implements comprehensive error handling:

1. **Renderer Creation Errors**: Catches and logs renderer creation failures
2. **LOD Generation Errors**: Validates LOD level generation
3. **Fallback Strategy**: Always provides a fallback sphere as last resort
4. **Debug Logging**: Provides detailed error information in debug mode

## Performance Considerations

- **Renderer Caching**: Avoids recreating renderers for the same objects
- **LOD Optimization**: Uses LOD system for performance at different distances
- **Error Recovery**: Graceful fallback prevents rendering failures
- **Memory Management**: Proper cleanup of temporary objects

## Usage Examples

### Basic Usage

```typescript
import { createMesh } from "@teskooano/celestials-comet";
import type { RenderableCelestialObject } from "@teskooano/data-types";

// Create comet mesh
const cometMesh = createMesh(cometObject, {
  celestialRenderers: renderersMap,
  createLodObject: lodFactory,
});
```

### With Debug Mode

```typescript
// Create comet mesh with debug logging
const cometMesh = createMesh(cometObject, {
  celestialRenderers: renderersMap,
  createLodObject: lodFactory,
  debug: true,
});
```

### With Lighting Manager

```typescript
// Create comet mesh with advanced lighting
const cometMesh = createMesh(cometObject, {
  celestialRenderers: renderersMap,
  createLodObject: lodFactory,
  lightingManager: lightingManager,
});
```

## Backward Compatibility

The function also exports as `createCometMesh` for backward compatibility:

```typescript
// Backward compatible export
export { createMesh as createCometMesh } from "./createMesh";
```

This allows existing code that references `createCometMesh` to continue working without modification.

## Dependencies

- [[celestials/comet/CometRenderer|Comet Renderer]] - Renderer class for comet objects
- [[renderer/threejs-celestial/createFallbackSphere|Create Fallback Sphere]] - Fallback sphere creation utility
- [[renderer/threejs-celestial/LODLevel|LOD Level]] - LOD level data structure
- [[renderer/threejs-celestial/CelestialRenderer|Celestial Renderer]] - Base renderer interface

## Error Scenarios

### Renderer Creation Failure

If renderer creation fails:

1. Error is logged to console
2. Function returns fallback sphere
3. Simulation continues without the specific comet

### LOD Generation Failure

If LOD generation fails:

1. Warning is logged to console
2. Function returns fallback sphere
3. Object is still rendered but without LOD optimization

### Invalid LOD Levels

If renderer doesn't provide LOD levels:

1. Warning is logged to console
2. Function returns fallback sphere
3. Object is rendered with basic geometry

## Integration with Comet System

The factory function integrates with the comet rendering system:

1. **Renderer Creation**: Creates [[celestials/comet/CometRenderer|Comet Renderer]] instances
2. **LOD Management**: Handles 2-tier LOD system (high detail → simplified)
3. **Material Integration**: Uses multiple comet materials for different components
4. **Performance Optimization**: Implements caching and fallback strategies

## Comet-Specific Features

The factory function handles comet-specific requirements:

1. **Complex Geometry**: Manages nucleus, coma, particle tails, and gas jets
2. **Activity-based Rendering**: Supports extinct comets and activity-based visual changes
3. **Particle Systems**: Handles up to 12,000 particles in tail systems
4. **Multiple Materials**: Coordinates multiple shader materials for different effects

## 🔗 Related

- [[celestials/comet/CometRenderer|Comet Renderer]] - Renderer class used by this factory
- [[celestials/comet/CometMaterials|Comet Materials]] - Materials used by the renderer
- [[renderer/threejs-celestial/createFallbackSphere|Create Fallback Sphere]] - Fallback utility for error cases
- [[renderer/threejs-celestial/LODLevel|LOD Level]] - LOD level data structure
- [[renderer/threejs-celestial/CelestialRenderer|Celestial Renderer]] - Base renderer interface
