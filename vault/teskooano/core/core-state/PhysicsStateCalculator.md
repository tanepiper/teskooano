---
aliases:
  [
    PhysicsStateCalculator,
    physics-calculator,
    orbital-calculator,
    physics-computation,
  ]
tags: [core, state, service, static, physics, calculation, orbital]
type: Class
package: "@teskooano/core-state"
name: PhysicsStateCalculator
dependencies:
  [
    "@teskooano/data-types",
    "@teskooano/core-math",
    "@teskooano/core-physics",
    "@teskooano/data-values",
    "three",
  ]
classes: []
functions:
  [
    "calculateOrbitalPosition",
    "calculateOrbitalVelocity",
    "createSeededRandomSync",
  ]
constants: ["AU_METERS", "MIN_ROGUE_DISTANCE_AU"]
types:
  [
    "CelestialObject",
    "CelestialSpecificPropertiesUnion",
    "PhysicsStateReal",
    "RenderableCelestialObject",
    "CelestialType",
    "OSVector3",
  ]
status: active
---

# PhysicsStateCalculator

Static service responsible for calculating physics state from celestial objects and creating renderable celestial objects with comprehensive orbital mechanics support.

## 🎯 Purpose

The `PhysicsStateCalculator` provides physics computation services:

- **Physics State Calculation**: Converts celestial objects to physics state
- **Renderable Object Creation**: Creates renderable objects from base data
- **Orbital Mechanics**: Handles complex orbital calculations
- **Special Object Support**: Manages rings, clouds, and rogue objects
- **Multi-Star Systems**: Supports binary and multi-star configurations

## 🏗️ Architecture

### **Static Service Pattern**

- **No Instance State**: All methods are static for utility access
- **Pure Functions**: Deterministic calculations without side effects
- **Comprehensive Error Handling**: Graceful fallbacks for calculation failures

### **Calculation Pipeline**

1. **Object Classification**: Determines object type and calculation strategy
2. **Physics Computation**: Calculates position, velocity, and mass
3. **Renderable Conversion**: Converts to Three.js-compatible format
4. **Caching Integration**: Works with PhysicsStateProvider for performance

## 🔧 Core Components

### **calculatePhysicsState()**

```typescript
public static calculatePhysicsState<T extends CelestialSpecificPropertiesUnion>(
  data: CelestialObject<T>,
  allObjects: Record<string, CelestialObject>,
  visitedIds: Set<string> = new Set(),
): PhysicsStateReal | null
```

**Purpose**: Calculates physics state for any celestial object

**Features**:

- **Multi-Star Support**: Handles binary and multi-star systems
- **Rogue Object Detection**: Identifies and positions rogue planets
- **Circular Reference Prevention**: Prevents infinite recursion
- **Special Object Handling**: Manages rings, clouds, and fields

### **createRenderableObject()**

```typescript
public static async createRenderableObject<T extends CelestialSpecificPropertiesUnion>(
  data: CelestialObject<T>,
  allObjects: Record<string, CelestialObject>,
): Promise<RenderableCelestialObject<T> | null>
```

**Purpose**: Creates renderable objects from base celestial data

**Features**:

- **Three.js Integration**: Converts to Vector3/Quaternion format
- **Physics State Integration**: Includes calculated physics data
- **Render Properties**: Sets visibility, targeting, and selection flags
- **Uniform Preparation**: Initializes shader uniform containers

## 🎮 Usage Examples

### **Basic Physics State Calculation**

```typescript
import { PhysicsStateCalculator } from "@teskooano/core-state";

const physicsState = PhysicsStateCalculator.calculatePhysicsState(
  celestialObject,
  allObjects,
);

if (physicsState) {
  console.log("Position:", physicsState.position_m);
  console.log("Velocity:", physicsState.velocity_mps);
}
```

### **Creating Renderable Objects**

```typescript
const renderable = await PhysicsStateCalculator.createRenderableObject(
  celestialObject,
  allObjects,
);

if (renderable) {
  // Use with Three.js renderer
  scene.add(renderable.mesh);
}
```

### **Multi-Star System Handling**

```typescript
// Automatically detects multi-star systems
const starPhysics = PhysicsStateCalculator.calculatePhysicsState(
  binaryStar,
  allObjects,
);

// Handles barycenter calculations automatically
```

## 🔄 Integration Points

### **PhysicsStateProvider Integration**

- **Caching Support**: Results cached by PhysicsStateProvider
- **Performance Optimization**: Avoids redundant calculations
- **State Synchronization**: Maintains consistency with simulation

### **Core Physics Integration**

- **Orbital Calculations**: Uses core-physics orbital functions
- **Vector Math**: Leverages OSVector3 for calculations
- **Constants**: Uses data-values for astronomical constants

### **Renderer Integration**

- **Three.js Conversion**: Converts to renderer-compatible format
- **Uniform Preparation**: Sets up shader uniform containers
- **Property Mapping**: Maps celestial properties to render properties

## 🎯 Key Features

### **Comprehensive Object Support**

- **Stars**: Single, binary, and multi-star systems
- **Planets**: Terrestrial, gas giants, and rogue planets
- **Moons**: Natural satellites with orbital mechanics
- **Special Objects**: Rings, asteroid fields, Oort clouds

### **Robust Error Handling**

- **Calculation Failures**: Graceful fallbacks to safe defaults
- **Missing Data**: Handles incomplete orbital parameters
- **Circular References**: Prevents infinite recursion
- **Invalid States**: Validates object relationships

### **Performance Optimization**

- **Static Methods**: No instance overhead
- **Efficient Algorithms**: Optimized orbital calculations
- **Memory Management**: Minimal object creation
- **Caching Integration**: Works with provider caching

_The PhysicsStateCalculator provides comprehensive, reliable physics computation services with robust error handling and performance optimization._
