---
aliases: [RingSystemRenderer]
tags: [renderer, threejs, rings, class]
type: class
package: "@teskooano/celestials-rings"
file: "src/renderer.ts"
extends: "BaseCelestialRenderer"
status: active
---

# RingSystemRenderer

Main renderer class for planetary ring systems and accretion disks, providing LOD management, dynamic lighting, and enhanced axial inclination controls.

## Overview

The `RingSystemRenderer` extends [[BaseCelestialRenderer]] to provide comprehensive ring system visualization with support for both standard planetary rings and accretion disks. It handles LOD management, dynamic lighting, shadow casting, and advanced axial inclination controls including parent tilt inheritance and precession.

## Features

- **Unified Ring Configuration**: Supports both new `ringSystem` config and legacy `rings` property
- **3-Tier LOD System**: High detail, medium detail, and low detail levels
- **Enhanced Axial Inclination**: Individual ring tilt, system tilt, and parent tilt inheritance
- **Precession Support**: Ring systems can precess over time
- **Accretion Disk Support**: Specialized rendering for accretion disks around compact objects
- **Dynamic Lighting**: Real-time lighting and shadow casting from multiple sources
- **Shadow Casting**: Rings cast shadows on parent body and receive shadows from moons
- **Material Management**: Efficient material creation and caching
- **Performance Optimization**: LOD switching and efficient shader management

## Constructor

```typescript
constructor(
  object: RenderableCelestialObject,
  parentRenderer?: BaseCelestialRenderer
)
```

### Parameters

- `object` - The celestial object for this ring system
- `parentRenderer` - Optional parent renderer that owns this ring system

## Properties

### ringMaterials

```typescript
private ringMaterials: Map<string, RingMaterial | AccretionDiskMaterial>
```

Map of ring materials by object ID and ring index for efficient material management.

### parentRenderer

```typescript
private parentRenderer?: BaseCelestialRenderer
```

Parent renderer that owns this ring system, used for material registration and coordination.

### ringMeshes

```typescript
private ringMeshes: Map<string, THREE.Object3D[]>
```

Store references to ring meshes for shadow casting registration.

## Public Methods

### getLODLevels

```typescript
getLODLevels(
  object: RenderableCelestialObject,
  options?: CelestialMeshOptions & { parentLODDistances?: number[] }
): LODLevel[]
```

Creates and returns the array of LOD levels for the ring system.

#### LOD Levels Created

1. **High Detail Level**:
   - Distance: 0
   - Segments: 64 (or specified)
   - Use Case: Close inspection

2. **Medium Detail Level**:
   - Distance: 10 × object radius
   - Segments: 32 (or half of specified)
   - Use Case: Normal viewing

3. **Low Detail Level**:
   - Distance: 30 × object radius
   - Segments: 16 (or quarter of specified)
   - Use Case: Far away viewing

### initialize

```typescript
initialize(
  object: RenderableCelestialObject,
  options?: CelestialMeshOptions
): void
```

Initialize the ring system for a celestial object.

### getRingMeshes

```typescript
getRingMeshes(
  objectId: string,
  detailLevel: string = "high"
): THREE.Object3D[] | undefined
```

Gets ring meshes for a specific detail level. Used by parent renderers to register shadow casters.

### registerWithLightingManager

```typescript
registerWithLightingManager(
  lightingManager: any,
  object: RenderableCelestialObject,
  parentObject: RenderableCelestialObject,
  detailLevel: string = "high"
): void
```

Registers ring shadow casters with the provided lighting manager.

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

Updates the ring system with dynamic lighting and shadow casting.

### dispose

```typescript
dispose(): void
```

Clean up resources used by the renderer.

## Ring System Features

### Enhanced Axial Inclination Control

The renderer supports sophisticated axial inclination controls:

1. **Individual Ring Tilt**: Each ring can have its own tilt relative to the system plane
2. **System Axial Inclination**: Overall tilt of the entire ring system
3. **Parent Tilt Inheritance**: Rings can inherit the parent body's axial tilt
4. **Precession**: Ring systems can precess over time

### Accretion Disk Support

Specialized support for accretion disks around compact objects:

1. **Physics-Based Properties**: Temperature, accretion rate, emission type
2. **Relativistic Effects**: Support for relativistic accretion disks
3. **Temperature-Based Emission**: Color changes based on temperature
4. **Inner Edge Radius**: Configurable inner edge in gravitational radii

## Usage Example

```typescript
import { RingSystemRenderer } from "@teskooano/celestials-rings";

// Create ring system renderer
const ringRenderer = new RingSystemRenderer(celestialObject, parentRenderer);

// Initialize with LOD levels
ringRenderer.initialize(celestialObject, {
  segments: 64,
  detailLevel: "high",
});

// Get LOD levels for integration
const lodLevels = ringRenderer.getLODLevels(celestialObject);

// Update with dynamic lighting
ringRenderer.update(
  celestialObject,
  time,
  timeScale,
  lightSources,
  camera,
  allObjects,
);
```

## Dependencies

- [[BaseCelestialRenderer]] - Base rendering functionality
- [[RingMaterial]] - Standard ring material
- [[AccretionDiskMaterial]] - Accretion disk material
- [[calculateKeplerianRotationRate]] - Physics utility for rotation rates

## 🔗 Related

- [[RingMaterial]] - Standard ring material class
- [[AccretionDiskMaterial]] - Accretion disk material class
- [[ring.vertex.glsl]] - Ring vertex shader
- [[ring.fragment.glsl]] - Ring fragment shader
- [[accretion-disk.fragment.glsl]] - Accretion disk fragment shader
