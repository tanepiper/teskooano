---
aliases: [PhysicsStateProvider, physics-provider, physics-cache, state-cache]
tags: [core, state, service, static, cache, physics, performance]
type: Class
package: "@teskooano/core-state"
name: PhysicsStateProvider
dependencies: ["@teskooano/data-types", "@teskooano/core-state"]
classes: ["PhysicsStateCalculator"]
functions: []
constants: []
types:
  ["CelestialObject", "CelestialSpecificPropertiesUnion", "PhysicsStateReal"]
status: active
---

# PhysicsStateProvider

Static service that provides physics state for any CelestialObject by calculating it on-demand with intelligent caching for performance optimization.

## 🎯 Purpose

The `PhysicsStateProvider` provides efficient physics state access:

- **On-Demand Calculation**: Calculates physics state when needed
- **Intelligent Caching**: Caches results to avoid redundant calculations
- **Performance Optimization**: Reduces computational overhead
- **State Synchronization**: Maintains consistency with simulation updates
- **Memory Management**: Efficient cache lifecycle management

## 🏗️ Architecture

### **Static Service Pattern**

- **No Instance State**: All methods are static for utility access
- **Global Cache**: Shared cache across all consumers
- **Lazy Calculation**: Only calculates when requested
- **Cache Invalidation**: Automatic cache management

### **Caching Strategy**

1. **Cache Lookup**: Check cache before calculation
2. **Calculation**: Use PhysicsStateCalculator if needed
3. **Cache Storage**: Store results for future use
4. **Cache Management**: Clear/update as objects change

## 🔧 Core Components

### **getPhysicsState()**

```typescript
public static getPhysicsState<T extends CelestialSpecificPropertiesUnion>(
  object: CelestialObject<T> | undefined,
): PhysicsStateReal | null
```

**Purpose**: Gets physics state for a celestial object

**Features**:

- **Null Safety**: Handles undefined/null objects gracefully
- **Cache First**: Checks cache before calculating
- **Lazy Calculation**: Only calculates when needed
- **Error Handling**: Returns null for invalid objects

### **clearCache()**

```typescript
public static clearCache(): void
```

**Purpose**: Clears the entire physics state cache

**Use Cases**:

- **System Reset**: When loading new systems
- **Memory Management**: To free memory
- **Debugging**: To force recalculation
- **Performance Tuning**: To reset cache state

### **removeFromCache()**

```typescript
public static removeFromCache(objectId: string): void
```

**Purpose**: Removes a specific object from cache

**Use Cases**:

- **Object Deletion**: When objects are removed
- **Selective Invalidation**: For specific object updates
- **Memory Optimization**: To free specific cache entries

### **updateCache()**

```typescript
public static updateCache<T extends CelestialSpecificPropertiesUnion>(
  object: CelestialObject<T>,
): void
```

**Purpose**: Updates cache when objects are modified

**Features**:

- **Automatic Invalidation**: Removes old cache entry
- **Recalculation**: Calculates new physics state
- **Cache Update**: Stores updated result
- **Consistency**: Maintains cache consistency

### **updateCacheWithSimulationResult()**

```typescript
public static updateCacheWithSimulationResult(
  objectId: string,
  physicsState: PhysicsStateReal,
): void
```

**Purpose**: Updates cache with simulation results

**Features**:

- **Direct Update**: Bypasses calculation for performance
- **Simulation Sync**: Keeps cache in sync with physics engine
- **Real-time Updates**: Supports dynamic simulation results

## 🎮 Usage Examples

### **Basic Physics State Access**

```typescript
import { PhysicsStateProvider } from "@teskooano/core-state";

const physicsState = PhysicsStateProvider.getPhysicsState(celestialObject);

if (physicsState) {
  console.log("Position:", physicsState.position_m);
  console.log("Velocity:", physicsState.velocity_mps);
}
```

### **Cache Management**

```typescript
// Clear entire cache
PhysicsStateProvider.clearCache();

// Remove specific object
PhysicsStateProvider.removeFromCache("earth-id");

// Update object cache
PhysicsStateProvider.updateCache(updatedObject);
```

### **Simulation Integration**

```typescript
// Update with simulation results
PhysicsStateProvider.updateCacheWithSimulationResult(
  objectId,
  simulationPhysicsState,
);
```

## 🔄 Integration Points

### **PhysicsStateCalculator Integration**

- **Calculation Delegation**: Delegates to calculator for computation
- **Error Propagation**: Handles calculation errors gracefully
- **Performance Optimization**: Avoids redundant calculations

### **StateAccessor Integration**

- **Object Access**: Uses StateAccessor to get all objects
- **Data Consistency**: Ensures consistent object data
- **Reactive Updates**: Supports reactive state changes

### **Simulation Integration**

- **Real-time Updates**: Receives simulation results
- **Cache Synchronization**: Keeps cache in sync
- **Performance Optimization**: Reduces calculation overhead

## 🎯 Key Features

### **Performance Optimization**

- **Intelligent Caching**: Avoids redundant calculations
- **Lazy Loading**: Only calculates when needed
- **Memory Efficiency**: Efficient cache management
- **Fast Access**: O(1) cache lookups

### **Robust Error Handling**

- **Null Safety**: Handles undefined objects
- **Calculation Failures**: Graceful error handling
- **Cache Consistency**: Maintains cache integrity
- **Fallback Behavior**: Safe defaults for failures

### **Cache Management**

- **Automatic Invalidation**: Clears stale cache entries
- **Selective Updates**: Updates only changed objects
- **Memory Management**: Efficient memory usage
- **Debug Support**: Cache inspection and control

### **Integration Support**

- **Universal Access**: Works with any CelestialObject
- **Simulation Sync**: Keeps pace with physics engine
- **State Consistency**: Maintains data consistency
- **Performance Monitoring**: Cache hit/miss tracking

_The PhysicsStateProvider provides efficient, reliable physics state access with intelligent caching and comprehensive performance optimization._
