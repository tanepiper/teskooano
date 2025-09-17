---
aliases: [AsteroidRenderer]
tags: [renderer, threejs, asteroids, class]
type: class
package: "@teskooano/celestials-asteroid"
file: "src/renderer.ts"
extends: "BaseCelestialRenderer"
status: active
---

# AsteroidRenderer

Main renderer class for asteroid objects with procedural nucleus geometry and advanced lighting.

## Overview

The `AsteroidRenderer` extends [[renderer/threejs-celestial/BaseCelestialRenderer|Base Celestial Renderer]] to provide specialized rendering capabilities for asteroid objects. It features procedural geometry generation, multi-layer surface texturing, and realistic lighting effects with shadow casting support.

## Features

- **Procedural Geometry**: Noise-displaced cube geometry for irregular asteroid shapes
- **Multi-Layer Texturing**: Height-based color blending with crater and crack effects
- **Advanced Lighting**: Dynamic ambient lighting with shadow casting support
- **LOD System**: Automatic detail reduction for distant viewing performance
- **Realistic Rotation**: Tumbling motion with configurable rotation periods

## Constructor

```typescript
constructor(object: RenderableCelestialObject)
```

### Parameters

- `object` - The asteroid object to render

### Initialization

The constructor:

1. Calls the parent `BaseCelestialRenderer` constructor
2. Initializes a seeded random number generator using the object's seed or ID
3. Creates the nucleus geometry and material

## Methods

### getLODLevels

```typescript
getLODLevels(
  object: RenderableCelestialObject,
  options?: CelestialMeshOptions
): LODLevel[]
```

Returns an array of LOD (Level of Detail) levels for the asteroid.

#### LOD Levels

- **LOD 0** (0 distance): High detail with full nucleus geometry
- **LOD 1** (5 \* SCALE.RENDER_SCALE_AU): Lower detail with simplified mesh nucleus

#### Returns

Array of `LODLevel` objects containing distance thresholds and corresponding mesh objects.

### update

```typescript
update(
  object: RenderableCelestialObject,
  time: number,
  timeScale: number,
  lightSources: LightSourcesMap,
  camera: THREE.PerspectiveCamera,
  allObjects?: Record<string, RenderableCelestialObject>,
  allMeshes?: Record<string, THREE.Object3D>
): void
```

Updates the asteroid renderer with current simulation state.

#### Parameters

- `object` - The asteroid object being rendered
- `time` - Current simulation time
- `timeScale` - Time scaling factor
- `lightSources` - Map of light sources for lighting calculations
- `camera` - Current camera for view-dependent effects
- `allObjects` - All celestial objects in the simulation
- `allMeshes` - All rendered meshes in the scene

#### Update Process

1. Calls parent `update` method
2. Updates light sources and applies light attenuation
3. Calculates dynamic ambient light based on nearby stars
4. Updates nucleus material with current lighting and shadow data
5. Calculates activity factor based on distance to light sources
6. Updates nucleus rotation with tumbling motion

## Private Methods

### createNucleus

```typescript
private createNucleus(object: RenderableCelestialObject): void
```

Creates the main nucleus mesh with procedural geometry and material.

### createNucleusGeometry

```typescript
private createNucleusGeometry(object: RenderableCelestialObject): THREE.BufferGeometry
```

Generates procedural geometry for the asteroid nucleus.

#### Geometry Generation Process

1. Creates a cube geometry with 32x32x32 subdivisions
2. Spherifies the cube by normalizing vertex positions
3. Applies noise-based displacement for irregular shape
4. Recalculates vertex normals for correct lighting

#### Displacement Parameters

- `noiseFrequency`: 1.0 - Controls noise detail level
- `bumpiness`: 0.2 - Controls displacement strength

### createNucleusMaterial

```typescript
private createNucleusMaterial(object: RenderableCelestialObject): AsteroidNucleusMaterial
```

Creates the shader material for the asteroid surface.

#### Material Configuration

- Extracts colors and heights from `AsteroidProperties`
- Applies visual properties from the object's properties
- Creates [[celestials/asteroid/AsteroidNucleusMaterial|Asteroid Nucleus Material]] instance

### generateColorPalette

```typescript
private generateColorPalette(): THREE.Color[]
```

**Note**: This is a private method that generates a random palette of 2-4 colors suitable for rocky asteroids. It's used internally by the renderer but not exposed in the public API.

#### Color Generation

- **Base Hue**: 0.02 (reddish) to 0.12 (brownish)
- **Saturation**: 0% to 40%
- **Lightness**: 20% to 50%
- **Variations**: Small random shifts for each color

### updateNucleus

```typescript
private updateNucleus(
  object: RenderableCelestialObject,
  attenuatedLightSources: Map<string, any>,
  dynamicAmbientIntensity: number,
  camera: THREE.PerspectiveCamera,
  allObjects?: Record<string, RenderableCelestialObject>
): void
```

Updates the nucleus material with current lighting and shadow data.

#### Update Process

1. Updates dynamic ambient lighting intensity
2. Finds shadow casters using centralized utility
3. Converts shadow casters to shader format
4. Calls material's update method with all parameters

### calculateActivityFactor

```typescript
private calculateActivityFactor(object: RenderableCelestialObject): number
```

Calculates the activity factor based on distance to light sources.

#### Activity Calculation

- Finds closest light source
- Calculates distance-based activity factor
- Uses smoothstep interpolation for smooth transitions
- Activity distance threshold: 2 AU

### updateNucleusRotation

```typescript
private updateNucleusRotation(
  object: RenderableCelestialObject,
  deltaTime: number,
  activityFactor: number
): void
```

Updates the nucleus rotation with realistic tumbling motion.

#### Rotation Parameters

- **Primary Rotation**: Y-axis rotation based on sidereal rotation period
- **Tumbling Effect**: X-axis rotation at 25% of primary speed
- **Synchronization**: LOD1 mesh copies LOD0 rotation

## Properties

### nucleus

```typescript
private nucleus?: THREE.Mesh
```

Main nucleus mesh for LOD 0 (high detail).

### nucleus_lod1

```typescript
private nucleus_lod1?: THREE.Mesh
```

Simplified nucleus mesh for LOD 1 (distant viewing).

### clock

```typescript
private clock = new THREE.Clock()
```

Three.js clock for delta time calculations.

### noise

```typescript
private noise = new SimplexNoise()
```

Simplex noise generator for procedural geometry displacement.

### random

```typescript
private random: () => number = () => 0
```

Seeded random number generator for deterministic color palette generation.

## Dependencies

- [[renderer/threejs-celestial/BaseCelestialRenderer|Base Celestial Renderer]] - Base rendering functionality
- [[celestials/asteroid/AsteroidNucleusMaterial|Asteroid Nucleus Material]] - Surface material
- [[renderer/threejs-lighting/LightingManager|Lighting Manager]] - Dynamic lighting calculations
- [[renderer/threejs-celestial/ShadowCasterUtils|Shadow Caster Utils]] - Shadow casting utilities
- `SimplexNoise` - Three.js simplex noise for procedural geometry displacement

## Usage Example

```typescript
import { AsteroidRenderer } from "@teskooano/celestials-asteroid";
import type { RenderableCelestialObject } from "@teskooano/data-types";

// Create renderer for an asteroid object
const renderer = new AsteroidRenderer(asteroidObject);

// Get LOD levels for mesh creation
const lodLevels = renderer.getLODLevels(asteroidObject);

// Update renderer with current state
renderer.update(
  asteroidObject,
  time,
  timeScale,
  lightSources,
  camera,
  allObjects,
  allMeshes,
);
```

## 🔗 Related

- [[celestials/asteroid/AsteroidNucleusMaterial|Asteroid Nucleus Material]] - Surface material used by this renderer
- [[renderer/threejs-celestial/BaseCelestialRenderer|Base Celestial Renderer]] - Base class providing core functionality
- [[celestials/asteroid/createMesh|Create Mesh Factory]] - Factory function for creating asteroid meshes
