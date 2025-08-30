---
aliases:
  [
    RenderableObjectFactory,
    renderable-factory,
    data-transformation,
    state-conversion,
  ]
tags:
  [renderer, threejs, objects, factory, data, transformation, state, conversion]
type: Class
package: "@teskooano/renderer-threejs-objects"
name: RenderableObjectFactory
dependencies:
  [
    "@teskooano/core-math",
    "@teskooano/core-state",
    "@teskooano/data-types",
    "@teskooano/core-physics",
    "@teskooano/data-values",
    "@teskooano/renderer-threejs-lighting",
    "three",
  ]
classes:
  [
    "OSVector3",
    "OSQuaternion",
    "PhysicsStateProvider",
    "THREE.Vector3",
    "THREE.Quaternion",
  ]
functions: ["calculateLightSourceMaps", "scaleSize", "physicsToThreeJSPosition"]
constants: ["METERS_TO_SCENE_UNITS", "SCALE"]
types:
  [
    "RenderableCelestialObject",
    "CelestialObject",
    "CelestialType",
    "RenderableCacheEntry",
  ]
status: active
---

# RenderableObjectFactory

A factory responsible for creating and updating `RenderableCelestialObject` instances from core state data, handling coordinate system conversion, rotation calculations, and light source mapping.

## 🎯 Purpose

The `RenderableObjectFactory` transforms raw `CelestialObject` data from the core state into the format required by the rendering engine. It handles position scaling, rotation calculations, light source relationships, and property caching to optimize performance for real-time rendering.

## 🏗️ Architecture

### Core Components

- **Data Transformation**: Converts raw celestial object data to renderable format
- **Position Scaling**: Handles coordinate system conversion and scaling
- **Rotation Calculations**: Manages axial tilt and sidereal rotation
- **Light Source Mapping**: Integrates with lighting system for light source relationships
- **Property Caching**: Optimizes performance with static property caching

### Factory Structure

```typescript
export class RenderableObjectFactory {
  // Reusable scratch variables for performance
  private rotationAxis = new OSVector3().setFromArray([0, 1, 0]);
  private tiltQuaternion = new OSQuaternion();
  private spinQuaternion = new OSQuaternion();
  private finalRotation = new OSQuaternion();
  private zAxis = new OSVector3().setFromArray([0, 0, 1]);

  // Caching system
  private cache = new Map<string, RenderableCacheEntry>();
  private lastLightSourceMap: Record<string, string | undefined> = {};
  private lastObjectKeys: string[] = [];
}
```

## 🔧 Core Methods

### Main Factory Method

```typescript
public createRenderableObjects(
  objects: Record<string, CelestialObject>,
  simulationTime: number
): Record<string, RenderableCelestialObject>
```

- **Object Processing**: Processes all celestial objects in the state
- **Light Source Calculation**: Determines light source relationships
- **Caching Optimization**: Uses caching to avoid redundant calculations
- **Type Handling**: Handles different celestial object types appropriately

### Standard Object Processing

```typescript
private processStandardObject(
  obj: CelestialObject,
  lightSourceId: string | undefined,
  simulationTime: number
): RenderableCelestialObject | null
```

- **Physics State**: Retrieves physics state for position and velocity
- **Property Caching**: Uses cached properties for performance
- **Coordinate Conversion**: Converts physics coordinates to Three.js coordinates
- **Rotation Calculation**: Calculates final rotation including axial tilt and spin

### Ring System Processing

```typescript
private processRingSystem(
  obj: CelestialObject,
  objects: Record<string, CelestialObject>,
  lightSourceId: string | undefined
): RenderableCelestialObject | null
```

- **Parent Integration**: Uses parent object's physics state
- **Position Inheritance**: Inherits position from parent object
- **Rotation Handling**: Uses parent's axial tilt without sidereal rotation
- **Special Properties**: Handles ring-specific properties

## 🚀 Usage Example

```typescript
// Create factory instance
const renderableFactory = new RenderableObjectFactory();

// Create renderable objects from core state
const renderableObjects = renderableFactory.createRenderableObjects(
  celestialObjects,
  simulationTime,
);

// Factory automatically handles:
// - Position scaling and coordinate conversion
// - Rotation calculations with axial tilt and spin
// - Light source relationship mapping
// - Property caching for performance
// - Type-specific processing (standard vs ring systems)

// Clear cache when objects change significantly
renderableFactory.clearCache();
```

## 🎨 Data Transformation Process

### Position and Velocity Conversion

```typescript
// Get physics state
const physicsState = PhysicsStateProvider.getPhysicsState(obj);

// Convert position to Three.js coordinates
physicsToThreeJSPosition(target.position, physicsState.position_m);

// Convert velocity (scaled for scene consistency)
if (physicsState.velocity_mps) {
  physicsToThreeJSPosition(target.velocity, physicsState.velocity_mps);
  target.velocityMagnitude_mps = physicsState.velocity_mps.length();
} else {
  target.velocity.set(0, 0, 0);
}
```

### Rotation Calculation

```typescript
private calculateRotation(
  axialTilt: OSVector3 | number | undefined,
  siderealPeriod: number | undefined,
  simulationTime: number
): OSQuaternion
```

- **Axial Tilt**: Handles both vector and numeric tilt representations
- **Sidereal Rotation**: Calculates rotation based on simulation time
- **Quaternion Composition**: Combines tilt and spin rotations
- **Performance Optimization**: Uses reusable quaternion objects

### Light Source Mapping

```typescript
// Check if light source recalculation is needed
const needsLightRecalculation =
  objectKeys.length !== this.lastObjectKeys.length ||
  !objectKeys.every((key) => this.lastObjectKeys.includes(key)) ||
  objectKeys.some((key) => {
    const obj = objects[key];
    const lastObj = this.lastObjectKeys.includes(key) ? objects[key] : null;
    return (
      !lastObj || obj.type !== lastObj.type || obj.parentId !== lastObj.parentId
    );
  });

// Only recalculate when hierarchy changes
let lightSourceMap: Record<string, string | undefined>;
if (needsLightRecalculation) {
  lightSourceMap = calculateLightSourceMaps(objects);
  this.lastLightSourceMap = lightSourceMap;
  this.lastObjectKeys = objectKeys;
} else {
  lightSourceMap = this.lastLightSourceMap;
}
```

## 🎯 Performance Considerations

### Property Caching

```typescript
private getCachedProperties(obj: CelestialObject): RenderableCacheEntry {
  const cacheKey = `${obj.id}-${obj.type}-${obj.realRadius_m}-${obj.realMass_kg}-${obj.parentId || "none"}`;

  let cached = this.cache.get(cacheKey);
  if (!cached) {
    const realRadius = obj.realRadius_m ?? 0;
    cached = {
      radius: scaleSize(realRadius, obj.type),
      mass: (obj.realMass_kg ?? 0) * SCALE.MASS,
      primaryLightSourceId: undefined,
      axialTilt: obj.orbit.axialTilt,
      siderealPeriod: obj.orbit.siderealRotationPeriod_s,
      objectType: obj.type,
      parentId: obj.parentId,
    };
    this.cache.set(cacheKey, cached);
  }

  return cached;
}
```

- **Cache Key Generation**: Creates unique keys based on object properties
- **Static Properties**: Caches properties that don't change frequently
- **Memory Efficiency**: Reuses cached properties across frames

### Light Source Optimization

- **Hierarchy Change Detection**: Only recalculates when object hierarchy changes
- **Cached Results**: Stores light source maps for reuse
- **Efficient Comparison**: Uses efficient comparison algorithms

### Coordinate Conversion

- **Reusable Objects**: Uses reusable vector and quaternion objects
- **Efficient Math**: Optimized mathematical operations
- **Batch Processing**: Processes multiple objects efficiently

## 🔧 Integration Points

### Core State Integration

- **PhysicsStateProvider**: Retrieves physics state for objects
- **Celestial Objects**: Processes raw celestial object data
- **State Synchronization**: Keeps renderable objects synchronized with state

### Lighting System Integration

- **calculateLightSourceMaps**: Determines light source relationships
- **Primary Light Source**: Assigns primary light sources to objects
- **Hierarchy Analysis**: Analyzes object hierarchy for lighting

### Coordinate System Integration

- **Physics Coordinates**: Works with physics engine coordinate system
- **Three.js Coordinates**: Converts to Three.js coordinate system
- **Scaling**: Handles coordinate system scaling and conversion

## 📚 Related Components

- **[[calculateLightSourceMaps]]** - Determines light source relationships
- **[[physicsToThreeJSPosition]]** - Converts physics coordinates to Three.js
- **[[scaleSize]]** - Scales object sizes for rendering
- **[[PhysicsStateProvider]]** - Provides physics state data
- **[[OSVector3]]** - Vector math for coordinate operations
- **[[OSQuaternion]]** - Quaternion math for rotation calculations

## 🏛️ Architecture Patterns

- **Factory Pattern**: Creates renderable objects from raw data
- **Caching Pattern**: Caches static properties for performance
- **Transformation Pattern**: Transforms data between different formats
- **Optimization Pattern**: Optimizes calculations for real-time performance
- **Integration Pattern**: Integrates with multiple systems (physics, lighting, rendering)

## 🔍 Error Handling

### Physics State Failures

```typescript
const physicsState = PhysicsStateProvider.getPhysicsState(obj);
if (!physicsState) {
  console.warn(
    `[RenderableObjectFactory] Could not calculate physics state for ${obj.id}`,
  );
  return null;
}
```

- **State Validation**: Validates physics state before processing
- **Graceful Degradation**: Returns null for invalid objects
- **Error Logging**: Provides detailed error information

### Missing Properties

- **Default Values**: Provides sensible defaults for missing properties
- **Type Safety**: Ensures type safety with proper validation
- **Fallback Handling**: Handles missing or invalid data gracefully

### Cache Management

- **Cache Invalidation**: Clears cache when objects change significantly
- **Memory Management**: Prevents memory leaks through proper cache management
- **Performance Monitoring**: Tracks cache hit rates and performance

## 🎯 Specialized Processing

### Ring System Handling

```typescript
private processRingSystem(
  obj: CelestialObject,
  objects: Record<string, CelestialObject>,
  lightSourceId: string | undefined
): RenderableCelestialObject | null
```

- **Parent Integration**: Uses parent object's physics state
- **Position Inheritance**: Inherits position from parent object
- **Rotation Handling**: Uses parent's axial tilt without sidereal rotation
- **Special Properties**: Handles ring-specific properties

### Type-Specific Processing

- **Standard Objects**: Planets, stars, moons, asteroids, comets
- **Ring Systems**: Special handling for ring systems
- **Unsupported Types**: Graceful handling of unsupported types

---

_The RenderableObjectFactory provides the essential data transformation layer between the core physics state and the rendering system, ensuring optimal performance through caching and efficient coordinate conversions._
