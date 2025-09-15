---
aliases: [createMesh]
tags: [data, types, factory]
type: Function
package: "@teskooano/data-types"
file: "src/createMesh.ts"
status: active
---

# createMesh

Factory function for creating celestial object meshes with unified API across all celestial types.

## Overview

The `createMesh` function provides a unified interface for creating 3D meshes for all types of celestial objects. It serves as the primary entry point for mesh creation, handling renderer selection, caching, and fallback mechanisms.

## Function Definition

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

- **Type**: `RenderableCelestialObject`
- **Required**: Yes
- **Usage**: Provides all data needed for mesh creation

### options

```typescript
options: CreateMeshOptions;
```

Configuration options for mesh creation.

```typescript
export interface CreateMeshOptions {
  celestialRenderers: Map<string, CelestialRenderer>;
  createLodObject: (
    object: RenderableCelestialObject,
    levels: LODLevel[],
  ) => THREE.LOD;
  lightingManager?: LightingManager;
  debug?: boolean;
}
```

**Properties:**

- **celestialRenderers**: Map to store and cache renderer instances
- **createLodObject**: Function to create LOD objects from levels
- **lightingManager**: Lighting manager for advanced rendering
- **debug**: Enable debug mode for additional logging and fallback usage

## Returns

```typescript
THREE.Object3D;
```

A Three.js object ready for rendering.

- **Type**: `THREE.Object3D`
- **Description**: LOD object or fallback sphere

## Implementation Process

### 1. Debug Mode Check

```typescript
if (debug) {
  console.debug(
    `[createMesh] Debug mode enabled, using fallback for ${object.id}`,
  );
  return createFallbackSphere(object);
}
```

### 2. Renderer Lookup

```typescript
let renderer = celestialRenderers.get(object.id);
```

### 3. Renderer Creation

```typescript
if (!renderer) {
  renderer = createSpecificRenderer(object, lightingManager);
  if (renderer) {
    celestialRenderers.set(object.id, renderer);
  }
}
```

### 4. LOD Generation

```typescript
if (renderer?.getLODLevels) {
  const lodLevels = renderer.getLODLevels(object);
  const lod = createLodObject(object, lodLevels);
  renderer.initialize(object);
  return lod;
}
```

### 5. Fallback

```typescript
return createFallbackSphere(object);
```

## Usage Examples

### Basic Usage

```typescript
import { createMesh, CreateMeshOptions } from "@teskooano/data-types";

const options: CreateMeshOptions = {
  celestialRenderers: new Map(),
  createLodObject: (object, levels) => {
    const lod = new THREE.LOD();
    levels.forEach((level) => {
      lod.addLevel(level.object, level.distance);
    });
    return lod;
  },
  lightingManager: myLightingManager,
  debug: false,
};

const starMesh = createMesh(starObject, options);
const planetMesh = createMesh(planetObject, options);
const cometMesh = createMesh(cometObject, options);
```

### With Renderer Caching

```typescript
const rendererCache = new Map<string, CelestialRenderer>();

function createCelestialMesh(
  object: RenderableCelestialObject,
): THREE.Object3D {
  const options: CreateMeshOptions = {
    celestialRenderers: rendererCache, // Reuse cached renderers
    createLodObject: createStandardLOD,
    lightingManager: globalLightingManager,
    debug: false,
  };

  return createMesh(object, options);
}
```

### Debug Mode Usage

```typescript
function createDebugMesh(object: RenderableCelestialObject): THREE.Object3D {
  const options: CreateMeshOptions = {
    celestialRenderers: new Map(),
    createLodObject: createStandardLOD,
    debug: true, // Forces fallback sphere
  };

  return createMesh(object, options);
}
```

### Batch Mesh Creation

```typescript
function createSystemMeshes(
  objects: RenderableCelestialObject[],
  lightingManager: LightingManager,
): Map<string, THREE.Object3D> {
  const meshes = new Map<string, THREE.Object3D>();
  const rendererCache = new Map<string, CelestialRenderer>();

  const options: CreateMeshOptions = {
    celestialRenderers: rendererCache,
    createLodObject: createStandardLOD,
    lightingManager,
    debug: false,
  };

  for (const object of objects) {
    try {
      const mesh = createMesh(object, options);
      meshes.set(object.id, mesh);
    } catch (error) {
      console.error(`Failed to create mesh for ${object.id}:`, error);
      // Create fallback mesh
      meshes.set(object.id, createFallbackSphere(object));
    }
  }

  return meshes;
}
```

## Renderer Selection Logic

### Type-Based Selection

```typescript
function createSpecificRenderer(
  object: RenderableCelestialObject,
  lightingManager?: LightingManager,
): CelestialRenderer | null {
  switch (object.type) {
    case CelestialType.STAR:
      return createStarRenderer(object, lightingManager);

    case CelestialType.PLANET:
    case CelestialType.MOON:
    case CelestialType.DWARF_PLANET:
      return createPlanetRenderer(object, lightingManager);

    case CelestialType.GAS_GIANT:
      return createGasGiantRenderer(object, lightingManager);

    case CelestialType.ASTEROID:
      return createAsteroidRenderer(object, lightingManager);

    case CelestialType.COMET:
      return createCometRenderer(object, lightingManager);

    case CelestialType.ASTEROID_FIELD:
      return createAsteroidFieldRenderer(object, lightingManager);

    case CelestialType.OORT_CLOUD:
      return createOortCloudRenderer(object, lightingManager);

    case CelestialType.RING_SYSTEM:
      return createRingSystemRenderer(object, lightingManager);

    case CelestialType.SATELLITE:
      return createSatelliteRenderer(object, lightingManager);

    default:
      console.warn(`No renderer available for type: ${object.type}`);
      return null;
  }
}
```

## Error Handling

### Graceful Fallbacks

```typescript
function createMeshWithFallback(
  object: RenderableCelestialObject,
  options: CreateMeshOptions,
): THREE.Object3D {
  try {
    return createMesh(object, options);
  } catch (error) {
    console.error(`Mesh creation failed for ${object.id}:`, error);

    // Try simplified creation
    try {
      return createSimplifiedMesh(object);
    } catch (fallbackError) {
      console.error(
        `Fallback creation failed for ${object.id}:`,
        fallbackError,
      );

      // Final fallback - basic sphere
      return createBasicSphere(object);
    }
  }
}
```

### Validation

```typescript
function validateMeshCreation(
  object: RenderableCelestialObject,
  options: CreateMeshOptions,
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!object.id) {
    errors.push("Object missing required ID");
  }

  if (!object.type) {
    errors.push("Object missing required type");
  }

  if (object.radius <= 0) {
    errors.push("Object radius must be positive");
  }

  if (!options.createLodObject) {
    errors.push("createLodObject function required");
  }

  if (!options.celestialRenderers) {
    errors.push("celestialRenderers map required");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
```

## Performance Considerations

### Renderer Caching

- Renderers are cached by object ID
- Avoids recreating expensive renderer instances
- Enables efficient material reuse

### LOD Management

- LOD levels are created based on object properties
- Distance-based quality adjustment
- Smooth transitions between detail levels

### Memory Management

- Proper disposal of unused renderers
- Efficient geometry sharing
- Resource cleanup on object removal

## Integration

### Rendering Pipeline

- Primary entry point for mesh creation
- Integrates with LOD system
- Supports all celestial object types

### Factory Pattern

- Unified interface for different object types
- Type-safe renderer selection
- Extensible for new object types

### Caching System

- Renderer instance caching
- Material sharing
- Performance optimization

## 🔗 Related

- [[RenderableCelestialObject]] - Input object type
- [[CreateMeshOptions]] - Configuration options
- [[CelestialRenderer]] - Renderer interface
- [[LODLevel]] - Level of detail definition
- [[@teskooano/renderer-threejs-celestial]] - Base renderer system
