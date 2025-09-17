---
aliases: [createMesh, createAsteroidMesh]
tags: [renderer, threejs, asteroids, factory, function]
type: function
package: "@teskooano/celestials-asteroid"
file: "src/createMesh.ts"
status: active
---

# createMesh

Factory function for creating asteroid meshes with unified API and automatic LOD management.

## Overview

The `createMesh` function provides a unified interface for creating asteroid meshes with automatic LOD (Level of Detail) management, renderer caching, and fallback handling. It's the primary entry point for asteroid mesh creation in the rendering system.

## Signature

```typescript
function createMesh(
  object: RenderableCelestialObject,
  options: CreateMeshOptions,
): THREE.Object3D;
```

### Parameters

- `object` - The asteroid object to create a mesh for
- `options` - Configuration options for mesh creation

### Returns

A Three.js `Object3D` containing the asteroid mesh with LOD levels.

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
2. **Renderer Creation**: Creates new [[celestials/asteroid/AsteroidRenderer|Asteroid Renderer]] if not cached
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

1. **Forced Fallback**: Always uses fallback sphere regardless of renderer creation success
2. **Additional Logging**: Provides detailed console output for debugging
3. **Error Visibility**: Makes errors more visible during development
4. **Bypass Normal Flow**: Completely bypasses the normal renderer creation and LOD generation process

## Implementation Details

### Renderer Creation Process

```typescript
// Check cache first
let renderer = celestialRenderers.get(object.id) as
  | AsteroidRenderer
  | undefined;

if (!renderer) {
  try {
    // Create new renderer
    renderer = new AsteroidRenderer(object);
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
import { createMesh } from "@teskooano/celestials-asteroid";
import type { RenderableCelestialObject } from "@teskooano/data-types";

// Create asteroid mesh
const asteroidMesh = createMesh(asteroidObject, {
  celestialRenderers: renderersMap,
  createLodObject: lodFactory,
});
```

### With Debug Mode

```typescript
// Create asteroid mesh with debug logging
const asteroidMesh = createMesh(asteroidObject, {
  celestialRenderers: renderersMap,
  createLodObject: lodFactory,
  debug: true,
});
```

### With Lighting Manager

```typescript
// Create asteroid mesh with advanced lighting
const asteroidMesh = createMesh(asteroidObject, {
  celestialRenderers: renderersMap,
  createLodObject: lodFactory,
  lightingManager: lightingManager,
});
```

## Backward Compatibility

The function also exports as `createAsteroidMesh` for backward compatibility:

```typescript
// Backward compatible export
export { createMesh as createAsteroidMesh } from "./createMesh";
```

This allows existing code that references `createAsteroidMesh` to continue working without modification.

## Dependencies

- [[celestials/asteroid/AsteroidRenderer|Asteroid Renderer]] - Renderer class for asteroid objects
- [[renderer/threejs-celestial/createFallbackSphere|Create Fallback Sphere]] - Fallback sphere creation utility
- [[renderer/threejs-celestial/LODLevel|LOD Level]] - LOD level data structure
- [[renderer/threejs-celestial/CelestialRenderer|Celestial Renderer]] - Base renderer interface

## Error Scenarios

### Renderer Creation Failure

If renderer creation fails:

1. Error is logged to console
2. Function returns fallback sphere
3. Simulation continues without the specific asteroid

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

## 🔗 Related

- [[celestials/asteroid/AsteroidRenderer|Asteroid Renderer]] - Renderer class used by this factory
- [[renderer/threejs-celestial/createFallbackSphere|Create Fallback Sphere]] - Fallback utility for error cases
- [[renderer/threejs-celestial/LODLevel|LOD Level]] - LOD level data structure
- [[renderer/threejs-celestial/CelestialRenderer|Celestial Renderer]] - Base renderer interface
