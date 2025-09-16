---
aliases: [AsteroidFieldRenderer]
tags: [renderer, threejs, asteroids, field, class]
type: class
package: "@teskooano/celestials-asteroid-field"
file: "src/renderer.ts"
extends: "BaseCelestialRenderer<AsteroidFieldMaterial>"
status: active
---

# AsteroidFieldRenderer

Main renderer class for asteroid field objects using instanced meshes with LOD support.

## Overview

The `AsteroidFieldRenderer` extends [[renderer/threejs-celestial/BaseCelestialRenderer|Base Celestial Renderer]] to provide specialized rendering capabilities for asteroid field objects. It creates multiple LOD levels with varying particle counts to provide optimal performance at different viewing distances using THREE.InstancedMesh for efficient particle rendering.

## Features

- **Instanced Particle Systems**: High-performance rendering using THREE.InstancedMesh
- **Adaptive LOD**: 4-tier LOD system with particle counts from 50,000 to 1,000
- **Procedural Generation**: Seeded randomization ensures consistent asteroid fields
- **Animated Rotation**: Individual asteroid rotation and belt-wide rotation
- **Realistic Scaling**: Proper size distribution based on belt dimensions
- **Performance Optimization**: Efficient memory management and update cycles

## Constructor

```typescript
constructor(
  object: RenderableCelestialObject,
  options: AsteroidFieldRendererOptions = {}
)
```

### Parameters

- `object` - The asteroid field object to render
- `options` - Configuration options for the renderer

### Options Interface

```typescript
interface AsteroidFieldRendererOptions extends CelestialMeshOptions {
  beltRotationSpeed?: number; // Speed of belt rotation (radians per second)
  disableBillboard?: boolean; // Whether to disable billboard LOD levels
}
```

### Default Values

- `beltRotationSpeed`: 0.00005
- `disableBillboard`: true

### Initialization

The constructor:

1. Calls the parent `BaseCelestialRenderer` constructor
2. Sets up the object ID and base geometry
3. Initializes performance-optimized temporary objects
4. Creates a simple sphere geometry for instanced rendering

## Methods

### getLODLevels

```typescript
getLODLevels(
  object: RenderableCelestialObject,
  options?: AsteroidFieldRendererOptions
): LODLevel[]
```

Creates and returns an array of LOD levels with varying particle counts.

#### LOD Levels

- **Level 0** (0 distance): 50,000 particles for close inspection
- **Level 1** (1,000 units): 25,000 particles for normal viewing
- **Level 2** (5,000 units): 10,000 particles for medium distance
- **Level 3** (20,000 units): 1,000 particles for far away viewing

#### LOD Generation Process

1. **Renderer Setup**: Initializes seeded random generator and material
2. **Asteroid Data Generation**: Creates asteroid data for each LOD level
3. **InstancedMesh Creation**: Creates THREE.InstancedMesh for each LOD level
4. **Instance Population**: Populates instance matrices and colors
5. **LOD Assembly**: Assembles LOD levels with distance thresholds

#### Returns

Array of `LODLevel` objects containing distance thresholds and corresponding instanced mesh objects.

### update

```typescript
update(
  object: RenderableCelestialObject,
  time: number,
  timeScale: number,
  lightSources: LightSourcesMap,
  camera: THREE.PerspectiveCamera
): void
```

Updates the asteroid field renderer with current simulation state.

#### Parameters

- `object` - The asteroid field object being rendered
- `time` - Current simulation time
- `timeScale` - Time scaling factor
- `lightSources` - Map of light sources for lighting calculations
- `camera` - Current camera for view-dependent effects

#### Update Process

1. Calls parent `update` method
2. Calculates delta time and updates belt rotation
3. Updates cumulative particle time for individual rotation
4. Updates material uniforms with current state
5. Updates instance matrices for each asteroid in the field

### dispose

```typescript
dispose(): void
```

Disposes of all resources and cleans up memory.

#### Cleanup Process

1. Calls parent `dispose` method
2. Disposes base geometry
3. Removes and disposes instanced meshes
4. Clears asteroid data arrays
5. Resets animation state variables

## Private Methods

### createMaterial

```typescript
protected createMaterial(object: RenderableCelestialObject): AsteroidFieldMaterial
```

Creates the material for the asteroid field.

#### Material Creation Process

1. Extracts asteroid field properties from the object
2. Creates [[celestials/asteroid-field/AsteroidFieldMaterial|Asteroid Field Material]] with default options
3. Loads textures from provided paths if available
4. Returns the configured material

### \_generateAsteroidData

```typescript
private _generateAsteroidData(
  object: RenderableCelestialObject,
  count: number
): typeof this.asteroidData
```

Generates asteroid data (positions, colors, sizes, etc.) for a given count.

#### Data Generation Process

1. **Seeded Randomization**: Uses object seed for deterministic generation
2. **Position Generation**: Creates toroidal distribution within belt bounds
3. **Color Variation**: Applies color variations based on base color
4. **Size Distribution**: Calculates realistic size distribution
5. **Texture Assignment**: Randomly assigns texture indices (0-4)
6. **Rotation Setup**: Sets initial rotation for each asteroid

#### Generated Data Structure

```typescript
{
  position: THREE.Vector3; // 3D position in toroidal distribution
  color: THREE.Color; // Per-particle color variations
  size: number; // Individual particle size
  textureIndex: number; // Texture variant selection (0-4)
  initialRotation: number; // Random rotation offset per particle
}
```

### \_getAsteroidFieldProperties

```typescript
private _getAsteroidFieldProperties(
  object: RenderableCelestialObject
): CentralAsteroidFieldProperties
```

Extracts and validates asteroid field properties from the object.

#### Property Extraction

- **Type Validation**: Ensures object is an asteroid field type
- **Property Access**: Extracts properties from object.properties
- **Default Fallback**: Provides default properties if none exist

#### Default Properties

```typescript
{
  type: CelestialType.ASTEROID_FIELD,
  innerRadiusAU: 2.0,
  outerRadiusAU: 3.0,
  heightAU: 0.2,
  count: 100000,
  color: "#8B7355",
  composition: ["rock"]
}
```

## Properties

### baseGeometry

```typescript
private baseGeometry: THREE.BufferGeometry
```

Base geometry for a single asteroid (simple sphere).

### instancedMeshes

```typescript
private instancedMeshes: THREE.InstancedMesh[] = []
```

Array of instanced meshes for each LOD level.

### asteroidData

```typescript
private asteroidData: {
  position: THREE.Vector3;
  color: THREE.Color;
  size: number;
  textureIndex: number;
  initialRotation: number;
}[]
```

Array of asteroid data for the current LOD level.

### Animation Properties

- `beltRotationSpeed`: Speed of belt rotation (radians per second)
- `particleRotationSpeed`: Speed of individual particle rotation
- `beltRotationAngle`: Current belt rotation angle
- `cumulativeParticleTime`: Cumulative time for particle animation

### Performance Properties

- `renderScale`: Scale factor for rendering
- `random`: Seeded random number generator
- `objectId`: Unique identifier for the object

### Temporary Objects

Pre-allocated objects for performance optimization:

- `_tempMatrix`: Temporary matrix for transformations
- `_tempPosition`: Temporary vector for position calculations
- `_tempRotation`: Temporary euler for rotation calculations
- `_tempScale`: Temporary vector for scale calculations

## Performance Considerations

### Instanced Rendering

- Uses THREE.InstancedMesh for efficient particle rendering
- Single draw call per LOD level regardless of particle count
- Efficient GPU-based instancing for optimal performance

### Memory Management

- Pre-allocated temporary objects to avoid garbage collection
- Efficient disposal of resources in cleanup methods
- Proper management of instanced mesh attributes

### LOD Optimization

- 4-tier LOD system reduces particle count at distance
- Automatic LOD switching based on camera distance
- Efficient geometry reuse across LOD levels

## Usage Example

```typescript
import { AsteroidFieldRenderer } from "@teskooano/celestials-asteroid-field";
import type { RenderableCelestialObject } from "@teskooano/data-types";

// Create renderer for an asteroid field object
const renderer = new AsteroidFieldRenderer(asteroidFieldObject, {
  beltRotationSpeed: 0.0001,
  disableBillboard: true,
});

// Get LOD levels for mesh creation
const lodLevels = renderer.getLODLevels(asteroidFieldObject);

// Update renderer with current state
renderer.update(asteroidFieldObject, time, timeScale, lightSources, camera);

// Clean up when done
renderer.dispose();
```

## Dependencies

- [[renderer/threejs-celestial/BaseCelestialRenderer|Base Celestial Renderer]] - Base rendering functionality
- [[celestials/asteroid-field/AsteroidFieldMaterial|Asteroid Field Material]] - Surface material
- [[core/core-math/Random|Random Utilities]] - Seeded random number generation
- [[core/core-math/Constants|Constants]] - Render scale constants

## 🔗 Related

- [[celestials/asteroid-field/AsteroidFieldMaterial|Asteroid Field Material]] - Material used by this renderer
- [[renderer/threejs-celestial/BaseCelestialRenderer|Base Celestial Renderer]] - Base class providing core functionality
- [[celestials/asteroid-field/createMesh|Create Mesh Factory]] - Factory function for creating asteroid field meshes
