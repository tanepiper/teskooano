---
aliases: [createMesh]
tags: [renderer, threejs, satellites, factory]
type: function
package: "@teskooano/celestials-satellite"
file: "src/createMesh.ts"
status: active
---

# createMesh

Factory function for creating satellite meshes with the unified API, renderer caching, and LOD object creation.

## Overview

The `createMesh` function provides a unified interface for creating satellite meshes in the Teskooano space simulation engine. It handles renderer creation and caching, LOD object creation, and provides debug mode support for development and testing.

## Function Signature

```typescript
export function createMesh(
  object: RenderableCelestialObject,
  options: CreateMeshOptions,
): THREE.Object3D;
```

## Parameters

### object

```typescript
object: RenderableCelestialObject;
```

The celestial object to create a mesh for.

**Required Properties:**

- **id**: Unique identifier for the object
- **type**: Must be `CelestialType.SATELLITE`
- **properties**: Satellite-specific properties

### options

```typescript
options: CreateMeshOptions;
```

Configuration options for mesh creation.

## CreateMeshOptions Interface

```typescript
export interface CreateMeshOptions {
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

### celestialRenderers

```typescript
celestialRenderers: Map<string, CelestialRenderer>;
```

Map to store and cache renderer instances. This prevents creating multiple renderers for the same object and improves performance.

### createLodObject

```typescript
createLodObject: (object: RenderableCelestialObject, levels: LODLevel[]) =>
  THREE.LOD;
```

Function to create LOD objects from LOD levels. This is provided by the main renderer system.

### lightingManager

```typescript
lightingManager?: LightingManager
```

Optional lighting manager for advanced rendering. If provided, enables advanced lighting features.

### debug

```typescript
debug?: boolean
```

Optional debug mode flag. When enabled, forces fallback sphere usage and provides additional logging.

## Returns

```typescript
THREE.Object3D;
```

Returns a Three.js object that can be added to the scene. This is typically a `THREE.LOD` object containing multiple LOD levels.

## Process Flow

### 1. Debug Mode Check

```typescript
if (debug) {
  console.debug(`[Satellite:createMesh] Creating mesh for ${object.id}`);
  console.debug(
    `[Satellite:createMesh] Debug mode enabled, using fallback for ${object.id}`,
  );
  return createFallbackSphere(object);
}
```

If debug mode is enabled:

- Logs debug information
- Forces fallback sphere usage
- Returns immediately with fallback mesh

### 2. Renderer Retrieval/Creation

```typescript
let renderer = celestialRenderers.get(object.id) as
  | SatelliteRenderer
  | undefined;

if (!renderer) {
  try {
    renderer = new SatelliteRenderer(object);
    celestialRenderers.set(object.id, renderer);

    if (debug) {
      console.debug(
        `[Satellite:createMesh] Created new renderer for ${object.id}`,
      );
    }
  } catch (error) {
    console.error(
      `[Satellite:createMesh] Failed to create renderer for ${object.id}:`,
      error,
    );
    return createFallbackSphere(object);
  }
}
```

**Process:**

1. **Cache Check**: Looks for existing renderer in cache
2. **Renderer Creation**: Creates new `SatelliteRenderer` if not found
3. **Cache Storage**: Stores renderer in cache for future use
4. **Error Handling**: Falls back to sphere if renderer creation fails
5. **Debug Logging**: Logs renderer creation if debug mode enabled

### 3. LOD Level Creation

```typescript
if (renderer.getLODLevels) {
  const lodLevels = renderer.getLODLevels(object);
  if (lodLevels && lodLevels.length > 0) {
    const lod = createLodObject(object, lodLevels);

    if (debug) {
      console.debug(
        `[Satellite:createMesh] Created LOD with ${lodLevels.length} levels for ${object.id}`,
      );
    }

    return lod;
  } else {
    console.warn(
      `[Satellite:createMesh] Renderer for ${object.type} ${object.id} provided invalid LOD levels.`,
    );
  }
} else {
  console.warn(
    `[Satellite:createMesh] Renderer for ${object.type} ${object.id} does not have getLODLevels.`,
  );
}
```

**Process:**

1. **Method Check**: Verifies renderer has `getLODLevels` method
2. **LOD Creation**: Calls renderer's `getLODLevels` method
3. **Validation**: Validates LOD levels are valid and non-empty
4. **LOD Object**: Creates LOD object using provided function
5. **Debug Logging**: Logs LOD creation if debug mode enabled
6. **Error Handling**: Warns about invalid LOD levels

### 4. Fallback Return

```typescript
return createFallbackSphere(object);
```

If all else fails, returns a fallback sphere mesh.

## Usage Examples

### Basic Usage

```typescript
import { createMesh } from "@teskooano/celestials-satellite";
import type { RenderableCelestialObject } from "@teskooano/data-types";

const satellite: RenderableCelestialObject = {
  id: "iss-001",
  type: CelestialType.SATELLITE,
  name: "International Space Station",
  realRadius_m: 50,
  position: new THREE.Vector3(0, 0, 0),
  properties: {
    type: CelestialType.SATELLITE,
    modelPath: "models/satellites/iss.glb",
    modelScale: 1.0,
    missionType: "scientific",
  },
};

const mesh = createMesh(satellite, {
  celestialRenderers: rendererCache,
  createLodObject: createLodObjectFunction,
  lightingManager: lightingManagerInstance,
});
```

### Debug Mode Usage

```typescript
const mesh = createMesh(satellite, {
  celestialRenderers: rendererCache,
  createLodObject: createLodObjectFunction,
  lightingManager: lightingManagerInstance,
  debug: true, // Forces fallback sphere usage
});
```

### With Custom Properties

```typescript
const cubesat: RenderableCelestialObject = {
  id: "cubesat-001",
  type: CelestialType.SATELLITE,
  name: "CubeSat",
  realRadius_m: 0.1,
  position: new THREE.Vector3(0, 0, 0),
  properties: {
    type: CelestialType.SATELLITE,
    modelPath: "models/satellites/cubesat.glb",
    modelScale: 2.0,
    missionType: "communications",
    materialProperties: {
      metalness: 0.8,
      roughness: 0.2,
      envMapIntensity: 1.2,
    },
  },
};

const mesh = createMesh(cubesat, options);
```

## Error Handling

### Renderer Creation Failures

```typescript
try {
  renderer = new SatelliteRenderer(object);
  celestialRenderers.set(object.id, renderer);
} catch (error) {
  console.error(
    `[Satellite:createMesh] Failed to create renderer for ${object.id}:`,
    error,
  );
  return createFallbackSphere(object);
}
```

**Handling:**

- Catches renderer creation errors
- Logs error details
- Returns fallback sphere mesh
- Prevents application crashes

### Invalid LOD Levels

```typescript
if (lodLevels && lodLevels.length > 0) {
  // Process LOD levels
} else {
  console.warn(
    `[Satellite:createMesh] Renderer for ${object.type} ${object.id} provided invalid LOD levels.`,
  );
}
```

**Handling:**

- Validates LOD levels exist and are non-empty
- Logs warning for invalid LOD levels
- Falls back to sphere mesh

### Missing Methods

```typescript
if (renderer.getLODLevels) {
  // Process LOD levels
} else {
  console.warn(
    `[Satellite:createMesh] Renderer for ${object.type} ${object.id} does not have getLODLevels.`,
  );
}
```

**Handling:**

- Checks for required methods
- Logs warning for missing methods
- Falls back to sphere mesh

## Performance Optimizations

### Renderer Caching

```typescript
let renderer = celestialRenderers.get(object.id) as
  | SatelliteRenderer
  | undefined;
```

**Benefits:**

- Prevents duplicate renderer creation
- Improves performance for multiple instances
- Reduces memory usage
- Enables model sharing

### Early Returns

```typescript
if (debug) {
  return createFallbackSphere(object);
}
```

**Benefits:**

- Skips expensive operations in debug mode
- Provides immediate fallback
- Improves development experience

### Validation Shortcuts

```typescript
if (lodLevels && lodLevels.length > 0) {
  // Process valid LOD levels
}
```

**Benefits:**

- Early validation prevents unnecessary processing
- Reduces error propagation
- Improves error handling

## Integration

### Renderer System

- **Unified API**: Follows same pattern as other celestial renderers
- **Cache Integration**: Integrates with renderer caching system
- **LOD Integration**: Uses centralized LOD management

### Lighting System

- **Optional Integration**: Lighting manager is optional
- **Advanced Features**: Enables advanced lighting when provided
- **Performance**: Graceful degradation when not available

### Debug System

- **Development Support**: Debug mode for development
- **Fallback Testing**: Easy fallback testing
- **Logging**: Comprehensive logging for debugging

## Dependencies

### Required Dependencies

- **@teskooano/data-types**: Type definitions
- **@teskooano/renderer-threejs-celestial**: Base renderer utilities
- **@teskooano/renderer-threejs-lighting**: Lighting system
- **three**: Three.js 3D graphics library

### Internal Dependencies

- **SatelliteRenderer**: Main renderer class
- **createFallbackSphere**: Fallback mesh creation utility

## Backward Compatibility

### Legacy Export

```typescript
// Re-export the old factory function name for backward compatibility
export { createMesh as createSatelliteMesh } from "./createMesh";
```

The function is also exported as `createSatelliteMesh` for backward compatibility.

## 🔗 Related

- [[SatelliteRenderer]] - Main renderer class used by this function
- [[SatelliteMaterial]] - Material used by the renderer
- [[@teskooano/renderer-threejs-celestial]] - Base renderer system
- [[@teskooano/renderer-threejs-lighting]] - Lighting system
- [[@teskooano/data-types]] - Type definitions
