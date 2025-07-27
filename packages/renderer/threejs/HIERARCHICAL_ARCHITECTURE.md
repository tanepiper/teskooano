# Hierarchical Rendering Architecture

This document describes the new hierarchical rendering architecture implemented in the Teskooano Three.js renderer. This architecture provides significant performance improvements and better scene organization through proper use of Groups, LOD management, and instanced rendering.

## Overview

The hierarchical rendering system addresses key challenges in space simulation rendering:

1. **Scene Graph Organization**: Creates logical hierarchies that mirror orbital relationships
2. **Level of Detail (LOD)**: Automatically adjusts detail based on distance and performance settings
3. **Instanced Rendering**: Efficiently renders thousands of similar objects
4. **Spatial Culling**: Eliminates entire regions from rendering when outside camera view
5. **Hierarchical Visibility**: Shows/hides child objects (e.g., moons) based on parent proximity

## Architecture Components

### 1. SceneGraphManager

The `SceneGraphManager` creates a logical hierarchy that mirrors the orbital relationships in your celestial data:

```
Universe Group
├── Solar System Groups
│   ├── Star Groups
│   │   ├── Star Body Group (contains mesh)
│   │   └── Star Orbit Group (for binary systems)
│   ├── Planet Groups
│   │   ├── Planet Body Group (contains mesh)
│   │   └── Planet Orbit Group (for moons)
│   │       └── Moon Groups
│   │           ├── Moon Body Group (contains mesh)
│   │           └── Satellite Orbit Groups
│   └── Other Objects (asteroids, comets, etc.)
└── Spatial Quadrants (for large-scale culling)
```

**Key Features:**
- Automatic hierarchy creation based on parent-child relationships
- Spatial partitioning for large-scale culling
- Orbital position updates that maintain hierarchy
- Support for binary and multi-star systems

**Usage:**
```typescript
// The SceneGraphManager is automatically used by ModularSpaceRenderer
// Updates happen automatically when objects change
const bodyGroup = renderer.sceneGraphManager.getBodyGroup(objectId);
const orbitGroup = renderer.sceneGraphManager.getOrbitGroup(objectId);
```

### 2. SceneQuery

The `SceneQuery` class provides powerful search and query capabilities over the hierarchical scene:

**Key Features:**
- Fast object lookup by name, type, or ID
- Spatial queries (find objects in radius, nearest object)
- Hierarchical queries (find all moons of a planet)
- Complex multi-criteria searches
- Frustum culling queries

**Usage:**
```typescript
// Find all objects near a position
const nearbyObjects = renderer.sceneQuery.findObjectsInRadius(
  new THREE.Vector3(100, 0, 0), 
  50
);

// Get all moons of a specific planet
const moons = renderer.sceneQuery.getMoonsOfPlanet("earth");

// Complex search
const results = renderer.sceneQuery.search({
  type: 'planet',
  minDistance: 100,
  maxDistance: 500,
  position: cameraPosition,
  visible: true
});

// Get scene hierarchy for debugging
console.log(renderer.sceneQuery.getSceneHierarchyString());
```

### 3. HierarchicalLODManager

Enhanced LOD management that works with the hierarchical scene graph:

**Key Features:**
- Automatic LOD distance calculation based on object type and size
- Hierarchical visibility (moons only visible when close to planet)
- Performance-tier based threshold adjustment
- Distance caching for performance
- Group-level culling

**Usage:**
```typescript
// Create automatic LOD for an object
const lod = renderer.hierarchicalLODManager.createAutoLOD(object, {
  high: highDetailMesh,
  medium: mediumDetailMesh,
  low: lowDetailMesh,
  billboard: billboardMesh
});

// Custom LOD levels
const customLOD = renderer.hierarchicalLODManager.createCustomLOD(objectId, [
  { object: highDetailGroup, distance: 0, showChildren: true },
  { object: mediumDetailMesh, distance: 100, showChildren: false },
  { object: lowDetailMesh, distance: 500, showChildren: false }
]);

// Set custom visibility threshold for children
renderer.setChildrenVisibilityThreshold("jupiter", 200);
```

### 4. InstancedObjectManager

Manages large numbers of similar objects using `THREE.InstancedMesh`:

**Key Features:**
- Single draw call for thousands of objects
- Automatic frustum culling per instance
- LOD management for instance types
- Built-in asteroid belt and debris field generators
- Animation support for expanding debris

**Usage:**
```typescript
// Create an asteroid belt
renderer.createAsteroidBelt(
  new THREE.Vector3(0, 0, 0), // center
  150, // inner radius
  250, // outer radius  
  5000, // count
  20 // vertical spread
);

// Create expanding debris field
renderer.createDebrisField(
  explosionPosition,
  50, // radius
  1000, // count
  10 // expansion velocity
);

// Register custom instance type
renderer.instancedObjectManager.registerInstanceType({
  geometry: new THREE.SphereGeometry(1),
  material: new THREE.MeshBasicMaterial({ color: 0xff0000 }),
  maxInstances: 10000,
  celestialType: CelestialType.COMET,
  enableCulling: true,
  lodDistance: 1000
});
```

## Performance Benefits

### 1. Hierarchical Culling
Instead of testing each object individually, entire solar systems or regions can be culled with a single check:

```typescript
// If Earth's solar system is outside the frustum, 
// Earth, Moon, and all satellites are culled together
renderer.hierarchicalLODManager.performGroupCulling();
```

### 2. Automatic Moon Visibility
Moons automatically appear/disappear based on distance to their parent planet:

```typescript
// Moons of Jupiter only visible when camera is within ~150 Jupiter radii
// Distance automatically calculated based on Jupiter's size and performance tier
```

### 3. Instanced Rendering Performance
Thousands of objects rendered in a single draw call:

```typescript
// 10,000 asteroids = 1 draw call instead of 10,000
// Automatic LOD culling reduces instances at distance
// Per-instance frustum culling hides objects outside view
```

## Integration with Existing Systems

### ObjectManager Integration
The existing `ObjectManager` works seamlessly with the new hierarchy:

```typescript
// Objects are automatically placed in the correct hierarchical position
// LOD meshes are created and managed by HierarchicalLODManager
// Instanced objects are handled by InstancedObjectManager
```

### State Management
The system automatically responds to state changes:

```typescript
// When objects update in state:
// 1. SceneGraphManager rebuilds hierarchy if needed
// 2. Orbital positions are updated
// 3. LOD thresholds are recalculated
// 4. Instanced objects are updated
```

## Usage Examples

### Creating a Complete Solar System

```typescript
// Initialize renderer with hierarchical capabilities
const renderer = new ModularSpaceRenderer(container);

// System automatically creates hierarchy when objects are loaded
// Sun at center, planets in orbit groups, moons as children of planets

// Add asteroid belt
renderer.createAsteroidBelt(
  new THREE.Vector3(0, 0, 0),
  280, // ~Mars orbit
  450, // ~Jupiter orbit  
  8000,
  15
);

// Query the system
const planetsNearCamera = renderer.findObjectsNear(camera.position, 1000);
const jupiterMoons = renderer.getMoonsOfPlanet("jupiter");

console.log("Scene structure:");
console.log(renderer.getHierarchicalStats().sceneHierarchy);
```

### Performance Optimization

```typescript
// Adjust LOD thresholds for specific objects
renderer.setChildrenVisibilityThreshold("saturn", 300); // Show rings from farther

// Force LOD refresh after performance setting changes
renderer.refreshLODSystem();

// Get performance stats
const stats = renderer.getHierarchicalStats();
console.log(`Rendering ${stats.instancedStats.visibleInstances} of ${stats.instancedStats.totalInstances} instanced objects`);
console.log(`LOD Objects: ${stats.lodStats.visibleLODObjects}/${stats.lodStats.totalLODObjects}`);
```

### Debugging and Visualization

```typescript
// Print complete scene hierarchy
console.log(renderer.sceneQuery.getSceneHierarchyString());

// Find all objects of a type
const allStars = renderer.sceneQuery.getObjectsByType('star');
const allPlanets = renderer.sceneQuery.getObjectsByType('planet');

// Get hierarchy information for an object
const earthHierarchy = renderer.sceneQuery.getObjectHierarchy('earth');
console.log('Earth parent:', earthHierarchy.parent?.name);
console.log('Earth children:', earthHierarchy.children.map(c => c.name));
```

## Best Practices

### 1. Scene Organization
- Let the `SceneGraphManager` handle hierarchy creation
- Use the query system instead of manual scene traversal
- Place meshes in body groups, handle orbits with orbit groups

### 2. LOD Management
- Use automatic LOD generation for standard objects
- Create custom LOD levels only when needed
- Adjust children visibility thresholds for important objects

### 3. Instanced Rendering
- Use instancing for any objects with count > 100
- Register instance types once, reuse for multiple configurations
- Enable culling for better performance
- Set appropriate LOD distances

### 4. Performance Monitoring
- Use the hierarchical stats for performance debugging
- Monitor triangle counts with instanced objects included
- Adjust performance tiers based on device capabilities

## Migration from Flat Scene Structure

If you're migrating from a flat scene structure:

1. **Remove manual Group creation** - let `SceneGraphManager` handle it
2. **Replace manual LOD logic** - use `HierarchicalLODManager`
3. **Convert repeated objects to instanced** - use `InstancedObjectManager`
4. **Replace scene.getObjectByName()** - use `SceneQuery` methods
5. **Update position handling** - use body groups for meshes, orbit groups for motion

The new system maintains backward compatibility while providing significant performance improvements and better organization.