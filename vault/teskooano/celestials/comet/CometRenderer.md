---
aliases: [CometRenderer]
tags: [renderer, threejs, comets, class]
type: class
package: "@teskooano/celestials-comet"
file: "src/renderer.ts"
extends: "BaseCelestialRenderer"
status: active
---

# CometRenderer

Main renderer class for comet objects with nucleus, coma, particle tails, and jet effects.

## Overview

The `CometRenderer` extends [[BaseCelestialRenderer]] to provide specialized rendering capabilities for comet objects. It features procedurally displaced nucleus geometry, dynamic coma that scales with solar activity, particle-based tail systems with realistic physics, multiple gas jets emanating from the nucleus surface, and a comprehensive LOD system with activity-based visual changes.

## Features

- **Procedural Nucleus**: Noise-displaced geometry with irregular rocky surface detail
- **Dynamic Coma**: Gas cloud that scales with solar activity and distance
- **Particle Tails**: Physics-based particle systems with realistic solar wind effects
- **Gas Jets**: Multiple surface emission points with dynamic repositioning
- **LOD System**: High-detail particle tails for close viewing, simplified mesh tails for distance
- **Activity-based Rendering**: Visual intensity changes based on distance from stars
- **Extinct Comet Support**: Special rendering mode for inactive/dead comets

## Constructor

```typescript
constructor(object: RenderableCelestialObject)
```

### Parameters

- `object` - The comet object to render

### Initialization

The constructor:

1. Calls the parent `BaseCelestialRenderer` constructor
2. Initializes a seeded random number generator using the object's seed or ID
3. Creates the nucleus geometry and material
4. Creates the coma geometry and material
5. Creates the particle tail system
6. Creates multiple gas jets

## Methods

### getLODLevels

```typescript
getLODLevels(
  object: RenderableCelestialObject,
  options?: CelestialMeshOptions
): LODLevel[]
```

Returns an array of LOD (Level of Detail) levels for the comet.

#### LOD Levels

- **LOD 0** (0 distance): High detail with nucleus, coma, particle tail, and gas jets
- **LOD 1** (5 AU): Lower detail with simplified nucleus and coma only

#### LOD Generation Process

1. **LOD 0 Assembly**: Creates high-detail container with nucleus, coma, particle tail, and jets
2. **LOD 1 Assembly**: Creates simplified container with cloned nucleus and coma
3. **Group Management**: Uses THREE.Group for nucleus and coma organization
4. **Component Cloning**: Clones nucleus and coma for LOD 1 with separate materials

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

Updates the comet renderer with current simulation state.

#### Parameters

- `object` - The comet object being rendered
- `time` - Current simulation time
- `timeScale` - Time scaling factor
- `lightSources` - Map of light sources for lighting calculations
- `camera` - Current camera for view-dependent effects
- `allObjects` - All celestial objects in the simulation
- `allMeshes` - All rendered meshes in the scene

#### Update Process

1. Calls parent `update` method
2. Updates lighting manager with current light sources
3. Applies centralized light attenuation
4. Calculates dynamic ambient light based on nearby stars
5. Updates nucleus, particle tail, and jets
6. Calculates activity factor based on distance to light sources
7. Updates nucleus rotation with tumbling motion
8. Updates coma with activity-based scaling
9. Updates particle tail physics with solar wind effects
10. Updates gas jet physics with dynamic repositioning

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

Generates procedural geometry for the comet nucleus.

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
private createNucleusMaterial(object: RenderableCelestialObject): CometNucleusMaterial
```

Creates the shader material for the comet nucleus surface.

#### Material Configuration

- Extracts colors and heights from `CometProperties`
- Provides fallback colors for procedurally generated comets
- Creates [[CometNucleusMaterial]] instance with visual properties

### createComa

```typescript
private createComa(object: RenderableCelestialObject): void
```

Creates the coma (gas cloud) mesh if properties are available.

#### Coma Creation Process

1. Checks for coma properties (radius, color, opacity)
2. Creates [[CometComaMaterial]] with specified properties
3. Generates sphere geometry with optimized segments
4. Scales geometry based on comet type and properties

### createParticleTail

```typescript
private createParticleTail(object: RenderableCelestialObject): void
```

Creates the particle tail system for dust and gas trails.

#### Particle System Setup

1. Creates buffer geometry for up to 12,000 particles
2. Initializes particle attributes (size, alpha, lifetime, velocity)
3. Creates [[CometParticleMaterial]] for tail rendering
4. Sets up THREE.Points object for particle rendering

### \_createJets

```typescript
private _createJets(object: RenderableCelestialObject): void
```

Creates multiple gas jets emanating from the nucleus surface.

#### Jet Creation Process

1. Creates 3 gas jets with 200 particles each
2. Sets up buffer geometry and attributes for each jet
3. Creates [[CometJetMaterial]] for jet rendering
4. Initializes repositioning timers for dynamic emission points

### updateNucleus

```typescript
private updateNucleus(
  object: RenderableCelestialObject,
  dynamicAmbientIntensity: number
): void
```

Updates the nucleus material with current lighting data.

### updateParticleTail

```typescript
private updateParticleTail(object: RenderableCelestialObject): void
```

Updates the particle tail material with current lighting data.

### updateJets

```typescript
private updateJets(object: RenderableCelestialObject): void
```

Updates all gas jet materials with current lighting data.

### calculateActivityFactor

```typescript
private calculateActivityFactor(object: RenderableCelestialObject): number
```

Calculates the activity factor based on distance to light sources and comet properties.

#### Activity Calculation

- Finds closest light source
- Calculates distance-based activity factor
- Uses smoothstep interpolation for smooth transitions
- Activity distance threshold: 2 AU
- Extinct comets (activity = 0) have no activity

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
- **Group Rotation**: Rotates nucleus and coma together
- **LOD Synchronization**: LOD1 group copies LOD0 rotation

### updateComa

```typescript
private updateComa(
  object: RenderableCelestialObject,
  time: number,
  attenuatedLightSources: Map<string, any> | undefined,
  activityFactor: number
): void
```

Updates the coma with activity-based scaling and lighting.

#### Coma Updates

- **Activity-based Opacity**: Coma opacity scales with activity factor
- **Dynamic Scaling**: Coma scale increases with activity
- **Lighting Updates**: Updates material with current light sources
- **Performance Optimization**: Skips updates when comet is inactive

### updateParticleTailPhysics

```typescript
private updateParticleTailPhysics(
  deltaTime: number,
  activityFactor: number,
  object: RenderableCelestialObject
): void
```

Updates particle tail physics with solar wind and radiation pressure effects.

#### Physics Updates

- **Particle Lifetime**: Manages particle lifetimes and cleanup
- **Solar Wind Effects**: Particles move away from nearest star
- **Activity-based Emission**: More particles emitted when comet is active
- **Realistic Tail Orientation**: Tail always points away from light source

### updateJetsPhysics

```typescript
private updateJetsPhysics(
  deltaTime: number,
  activityFactor: number,
  object: RenderableCelestialObject
): void
```

Updates gas jet physics with dynamic repositioning and emission.

#### Jet Physics

- **Dynamic Repositioning**: Jets reposition every 3-7 seconds
- **Surface Emission**: Particles emit from random nucleus surface points
- **Activity-based Visibility**: Jets hidden when comet is inactive
- **Realistic Particle Behavior**: Shorter lifetimes and different velocities

## Properties

### Nucleus Components

- `nucleus` - Main nucleus mesh for LOD 0
- `nucleus_lod1` - Simplified nucleus mesh for LOD 1

### Coma Components

- `coma` - Main coma mesh for LOD 0
- `coma_lod1` - Simplified coma mesh for LOD 1
- `comaMaterial` - Coma material reference

### Particle Systems

- `particleTail` - Main particle tail system
- `particleGeometry` - Buffer geometry for particle tail
- `particlePositions` - Position data for particles
- `particleAttributes` - Size, alpha, lifetime, and velocity data

### Gas Jets

- `jets` - Array of gas jet systems with geometry and attributes

### Animation Properties

- `lastParticleIndex` - Index for particle emission cycling
- `clock` - Three.js clock for delta time calculations
- `noise` - Simplex noise generator for procedural effects
- `random` - Seeded random number generator
- `camera` - Current camera reference

### Constants

- `MAX_PARTICLES`: 12,000 - Maximum particles in tail system
- `PARTICLE_LIFETIME`: 5.0 seconds - Default particle lifetime

## Performance Considerations

### Particle Management

- **Lifetime Management**: Automatic particle cleanup prevents memory leaks
- **Activity-based Updates**: Skips expensive physics when comet is inactive
- **Efficient Emission**: Cycles through particle array for continuous emission
- **Memory Optimization**: Reuses particle positions and attributes

### LOD Optimization

- **2-tier LOD System**: Reduces complexity at distance
- **Component Cloning**: Efficient LOD 1 creation
- **Group Management**: Organized hierarchy for better performance

### Physics Optimization

- **Solar Wind Simulation**: Realistic particle behavior with minimal computation
- **Dynamic Repositioning**: Jets reposition efficiently without full recreation
- **Activity-based Rendering**: Reduces updates for distant comets

## Usage Example

```typescript
import { CometRenderer } from "@teskooano/celestials-comet";
import type { RenderableCelestialObject } from "@teskooano/data-types";

// Create renderer for a comet object
const renderer = new CometRenderer(cometObject);

// Get LOD levels for mesh creation
const lodLevels = renderer.getLODLevels(cometObject);

// Update renderer with current state
renderer.update(
  cometObject,
  time,
  timeScale,
  lightSources,
  camera,
  allObjects,
  allMeshes,
);
```

## Dependencies

- [[BaseCelestialRenderer]] - Base rendering functionality
- [[CometNucleusMaterial]] - Nucleus surface material
- [[CometComaMaterial]] - Coma gas cloud material
- [[CometParticleMaterial]] - Particle tail material
- [[CometJetMaterial]] - Gas jet material
- [[createSeededRandomSync]] - Seeded random number generation
- [[SCALE]] - Render scale constants

## 🔗 Related

- [[CometNucleusMaterial]] - Material used for nucleus rendering
- [[CometComaMaterial]] - Material used for coma rendering
- [[CometParticleMaterial]] - Material used for particle tail rendering
- [[CometJetMaterial]] - Material used for gas jet rendering
- [[BaseCelestialRenderer]] - Base class providing core functionality
- [[createMesh]] - Factory function for creating comet meshes
