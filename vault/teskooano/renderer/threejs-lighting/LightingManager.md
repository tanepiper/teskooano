---
aliases: [LightingManager, lighting-manager, light-registry, dynamic-lighting]
tags: [renderer, threejs, lighting, manager, registry, shadows, performance]
type: Class
package: "@teskooano/renderer-threejs-lighting"
name: LightingManager
dependencies: ["@teskooano/core-state", "@teskooano/data-types", "three"]
classes:
  [
    "StateSubscriptionMixin",
    "THREE.Scene",
    "THREE.Object3D",
    "LightSourceComponent",
    "THREE.Vector3",
    "THREE.Box3",
  ]
functions: []
constants:
  [
    "INFLUENCE_THRESHOLD",
    "MAX_INFLUENTIAL_LIGHTS",
    "SHADOW_DISTANCE_THRESHOLD",
    "SHADOW_UPDATE_INTERVAL",
  ]
types: ["RenderableCelestialObject"]
status: active
---

# LightingManager

The central registry for managing dynamic light sources and shadow casting in the Teskooano renderer, providing performance-optimized light queries and automatic planetary shadow management.

## 🎯 Purpose

The `LightingManager` serves as the primary orchestrator for all lighting-related functionality in the space simulation. It maintains a registry of active light sources, provides efficient queries for finding influential lights affecting specific objects, and manages dynamic shadow casting where planets cast shadows on each other when positioned between light sources and targets.

## 🏗️ Architecture

### Core Components

- **Light Source Registry**: Map-based storage of `LightSourceComponent` instances
- **Shadow Caster Management**: Separate registries for planets and ring systems
- **Performance Optimization**: Squared distance calculations and update throttling
- **State Integration**: Reactive updates based on celestial object state changes

### Registry Structure

```typescript
private lightSources: Map<string, LightSourceComponent> = new Map();
private shadowCasters: Map<string, { mesh: THREE.Object3D; object: RenderableCelestialObject }> = new Map();
private ringShadowCasters: Map<string, { meshes: THREE.Object3D[]; object: RenderableCelestialObject; parentObject: RenderableCelestialObject }> = new Map();
```

## 🔧 Core Methods

### Constructor

```typescript
constructor(scene: THREE.Scene, renderableObjects$?: any)
```

- **scene**: Three.js scene for light and shadow management
- **renderableObjects$**: Optional observable for reactive state updates
- **Initialization**: Sets up registries and state subscriptions

### Light Source Management

```typescript
public register(component: LightSourceComponent, meshGroup?: THREE.Object3D): void
public unregister(objectId: string): void
```

- **Registration**: Adds light sources to the registry and scene
- **Mesh Group Support**: Optional attachment to specific mesh groups
- **Cleanup**: Proper disposal and scene removal

### Shadow Caster Management

```typescript
public registerShadowCaster(objectId: string, mesh: THREE.Object3D, object: RenderableCelestialObject): void
public unregisterShadowCaster(objectId: string): void
public registerRingShadowCasters(objectId: string, meshes: THREE.Object3D[], object: RenderableCelestialObject, parentObject: RenderableCelestialObject): void
public unregisterRingShadowCasters(objectId: string): void
```

- **Planet Registration**: Registers planets as potential shadow casters
- **Ring System Support**: Specialized handling for ring system shadows
- **Dynamic Control**: Enables/disables shadow casting based on positions

### Light Source Queries

```typescript
public getInfluentialLights(targetObject: RenderableCelestialObject, maxLights = MAX_INFLUENTIAL_LIGHTS): LightSourceComponent[]
```

- **Distance Calculation**: Uses squared distance for performance
- **Influence Scoring**: Combines intensity and distance for ranking
- **Threshold Filtering**: Only returns lights above influence threshold
- **Self-Exclusion**: Automatically excludes the target object from results

## 🔍 Shadow Casting System

### Dynamic Shadow Calculation

```typescript
private updateShadowCasting(): void
```

- **Geometric Analysis**: Determines when objects block light rays
- **Position-Based Logic**: Only enables shadows when objects are between light and target
- **Performance Optimization**: Throttled updates to prevent frame drops

### Shadow Blocking Algorithm

```typescript
private isObjectBlockingLight(lightPos: THREE.Vector3, casterPos: THREE.Vector3, targetPos: THREE.Vector3, casterMesh: THREE.Object3D): boolean
```

- **Ray Intersection**: Calculates closest point on light ray to caster
- **Distance Threshold**: Only considers casters within shadow distance
- **Radius-Based Blocking**: Uses object radius to determine shadow casting

### Ring System Shadows

```typescript
private isRingBlockingLightToObject(lightPos: THREE.Vector3, ringPos: THREE.Vector3, targetPos: THREE.Vector3, targetRadius: number): boolean
```

- **Disc Geometry**: Specialized calculations for flat ring systems
- **Plane Intersection**: Determines where light ray intersects ring plane
- **Ring Area Check**: Verifies intersection is within ring boundaries

## 🚀 Usage Example

```typescript
// Create lighting manager
const lightingManager = new LightingManager(scene, renderableObjects$);

// Register star light sources
const starComponent = new LightSourceComponent(starObject);
lightingManager.register(starComponent);

// Register planets as shadow casters
const planetMesh = createPlanetMesh(planetObject);
planetMesh.receiveShadow = true;
lightingManager.registerShadowCaster(planetObject.id, planetMesh, planetObject);

// Register ring system shadows
const ringMeshes = createRingMeshes(ringObject);
lightingManager.registerRingShadowCasters(
  ringObject.id,
  ringMeshes,
  ringObject,
  parentPlanet,
);

// Query for influential lights
const influentialLights = lightingManager.getInfluentialLights(
  targetObject,
  3, // max 3 lights
);

// Update is called automatically by state subscription
// Shadows are calculated dynamically based on positions
```

## 🎯 Performance Optimizations

### Light Source Queries

- **Squared Distance**: Avoids expensive square root operations
- **Distance Thresholds**: Limits queries to relevant light sources
- **Influence Caching**: Results cached until object positions change

### Shadow Casting

- **Update Throttling**: Shadow updates limited to prevent performance impact
- **Distance Thresholds**: Only considers casters within reasonable distance
- **Geometric Optimization**: Efficient ray-object intersection calculations

### Memory Management

- **Component Lifecycle**: Automatic cleanup when objects are removed
- **Scene Integration**: Proper Three.js scene management
- **Registry Cleanup**: Efficient map-based storage and retrieval

## 🔧 Configuration

### Performance Constants

```typescript
const INFLUENCE_THRESHOLD = 0.0; // Minimum influence for light consideration
const MAX_INFLUENTIAL_LIGHTS = 4; // Maximum lights returned per query
const SHADOW_DISTANCE_THRESHOLD = 10000; // Max distance for shadow casting
const SHADOW_UPDATE_INTERVAL = 500; // Shadow update frequency in ms
```

### Shadow Distance Thresholds

- **Planetary Shadows**: Objects within 10,000 scene units can cast shadows
- **Ring System Shadows**: Specialized calculations for flat disc geometry
- **Performance Scaling**: Thresholds can be adjusted for different performance targets

## 🔍 Debug Features

### Shadow Visualization

- **Debug Spheres**: Visual representation of shadow caster positions
- **Shadow Lines**: Lines showing shadow casting relationships
- **Performance Metrics**: Monitor shadow calculation frequency

### Light Source Debugging

- **Registry Inspection**: View all registered light sources
- **Query Performance**: Track light source query performance
- **Influence Visualization**: Color-coded spheres showing light influence

## 📚 Related Components

- **[[LightSourceComponent]]** - Individual light source components
- **[[calculateLightSourceMaps]]** - Light source hierarchy calculation
- **[[threejs-objects]]** - Creates and manages light source components
- **[[threejs-celestial]]** - Uses light source data for shader calculations

## 🏛️ Architecture Patterns

- **Registry Pattern**: Centralized management of light sources and shadow casters
- **Observer Pattern**: Reactive updates based on state changes
- **Query Pattern**: Efficient light source queries for renderers
- **Shadow Pattern**: Dynamic shadow casting based on geometric relationships
- **Performance Pattern**: Optimized calculations with throttling and caching

---

_The LightingManager provides the foundation for realistic space lighting with dynamic shadows and efficient light source management._
