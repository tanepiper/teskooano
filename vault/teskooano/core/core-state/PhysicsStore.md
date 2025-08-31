---
aliases: [PhysicsStore, physics-store, acceleration-store, physics-data]
tags: [core, state, store, singleton, reactive, physics, acceleration, vectors]
type: Class
package: "@teskooano/core-state"
name: PhysicsStore
dependencies: ["@teskooano/core-math", "rxjs"]
classes: ["BehaviorSubject", "Observable"]
functions: []
constants: []
types: ["OSVector3"]
status: active
---

# PhysicsStore

Singleton store managing physics-related state like acceleration vectors with reactive state management and efficient vector operations.

## 🎯 Purpose

The `PhysicsStore` provides centralized physics data management:

- **Acceleration Vectors**: Stores acceleration data for all objects
- **Reactive Updates**: Provides observable physics state changes
- **Vector Operations**: Efficient OSVector3-based calculations
- **Memory Management**: Optimized storage and retrieval
- **Physics Integration**: Supports physics engine data flow

## 🏗️ Architecture

### **Singleton Pattern**

- **Single Instance**: Global access to physics state
- **Reactive Updates**: RxJS-based state management
- **Vector Storage**: Efficient OSVector3 storage
- **Memory Optimization**: Minimal object creation

### **Data Management Strategy**

1. **Vector Storage**: Stores acceleration vectors by object ID
2. **Batch Updates**: Supports bulk vector updates
3. **Individual Updates**: Single vector modifications
4. **Memory Cleanup**: Automatic vector removal

## 🔧 Core Components

### **getAccelerationVectors()**

```typescript
public getAccelerationVectors(): Record<string, OSVector3>
```

**Purpose**: Gets all acceleration vectors

**Features**:

- **Synchronous Access**: Immediate value retrieval
- **Complete Data**: Returns all stored vectors
- **Object Mapping**: Maps object IDs to vectors

### **updateAccelerationVectors()**

```typescript
public updateAccelerationVectors(vectors: Map<string, OSVector3>): void
```

**Purpose**: Updates multiple acceleration vectors at once

**Features**:

- **Batch Updates**: Efficient bulk operations
- **Map Conversion**: Converts Map to Record format
- **Reactive Updates**: Notifies all subscribers
- **Memory Efficiency**: Minimal object creation

### **setAccelerationVector()**

```typescript
public setAccelerationVector(id: string, vector: OSVector3): void
```

**Purpose**: Sets a single acceleration vector

**Features**:

- **Individual Updates**: Single vector modification
- **Immutable Updates**: Creates new state object
- **Reactive Notifications**: Notifies subscribers
- **Error Safety**: Handles invalid inputs gracefully

### **removeAccelerationVector()**

```typescript
public removeAccelerationVector(id: string): void
```

**Purpose**: Removes a specific acceleration vector

**Features**:

- **Memory Cleanup**: Frees vector memory
- **State Consistency**: Maintains clean state
- **Reactive Updates**: Notifies subscribers
- **Safe Removal**: Handles missing vectors

### **clearAccelerationVectors()**

```typescript
public clearAccelerationVectors(): void
```

**Purpose**: Clears all acceleration vectors

**Features**:

- **Complete Reset**: Removes all vectors
- **Memory Cleanup**: Frees all vector memory
- **State Reset**: Returns to initial state
- **Reactive Notifications**: Notifies all subscribers

### **accelerationVectors$**

```typescript
public readonly accelerationVectors$: Observable<Record<string, OSVector3>>
```

**Purpose**: Observable stream of acceleration vector changes

**Features**:

- **Reactive Updates**: Notifies on vector changes
- **Initial Value**: Emits current vectors immediately
- **Complete State**: Provides full vector state

## 🎮 Usage Examples

### **Basic Vector Access**

```typescript
import { physicsStore } from "@teskooano/core-state";

// Get all acceleration vectors
const vectors = physicsStore.getAccelerationVectors();
console.log("Acceleration vectors:", vectors);

// Subscribe to vector changes
physicsStore.accelerationVectors$.subscribe((vectors) => {
  console.log("Vectors updated:", vectors);
});
```

### **Setting Individual Vectors**

```typescript
import { OSVector3 } from "@teskooano/core-math";

// Set single vector
const acceleration = new OSVector3(1, 0, 0);
physicsStore.setAccelerationVector("earth-id", acceleration);

// Remove vector
physicsStore.removeAccelerationVector("earth-id");
```

### **Batch Vector Updates**

```typescript
import { OSVector3 } from "@teskooano/core-math";

// Create vector map
const vectorMap = new Map<string, OSVector3>();
vectorMap.set("earth-id", new OSVector3(1, 0, 0));
vectorMap.set("mars-id", new OSVector3(0.5, 0, 0));

// Update all vectors at once
physicsStore.updateAccelerationVectors(vectorMap);
```

### **Physics Integration**

```typescript
// Clear vectors for new simulation
physicsStore.clearAccelerationVectors();

// Update with physics results
physicsResults.forEach((result, objectId) => {
  physicsStore.setAccelerationVector(objectId, result.acceleration);
});
```

## 🔄 Integration Points

### **Physics Engine Integration**

- **Acceleration Storage**: Stores physics engine results
- **Real-time Updates**: Supports dynamic physics updates
- **Memory Management**: Efficient vector lifecycle
- **Performance Optimization**: Optimized for physics workloads

### **Renderer Integration**

- **Vector Access**: Provides vectors for rendering
- **Reactive Updates**: Notifies renderer of changes
- **Performance**: Fast vector retrieval for rendering
- **Memory Efficiency**: Minimal memory overhead

### **Simulation Integration**

- **State Synchronization**: Keeps pace with simulation
- **Batch Operations**: Supports simulation batch updates
- **Memory Cleanup**: Cleans up completed simulations
- **Performance Monitoring**: Tracks vector operations

## 🎯 Key Features

### **Vector Management**

- **OSVector3 Storage**: Uses core math vectors
- **Efficient Operations**: Optimized vector operations
- **Memory Management**: Automatic cleanup and optimization
- **Type Safety**: Full TypeScript type safety

### **Reactive State Management**

- **Observable Stream**: RxJS-based state updates
- **Immediate Access**: Synchronous getter for current state
- **Change Notifications**: Notifies all subscribers
- **State Consistency**: Maintains data integrity

### **Performance Optimization**

- **Batch Updates**: Efficient bulk operations
- **Memory Efficiency**: Minimal object creation
- **Fast Access**: O(1) vector retrieval
- **Cleanup Operations**: Automatic memory management

### **Error Handling**

- **Safe Operations**: Handles invalid inputs gracefully
- **State Consistency**: Maintains clean state
- **Memory Safety**: Prevents memory leaks
- **Debug Support**: Easy state inspection

## 🔧 Configuration

### **Vector Storage**

- **Object ID Mapping**: Maps object IDs to vectors
- **Record Format**: Uses Record<string, OSVector3>
- **Memory Optimization**: Efficient storage strategy

### **Performance Characteristics**

- **Fast Retrieval**: O(1) access time
- **Efficient Updates**: Minimal object creation
- **Memory Cleanup**: Automatic vector removal
- **Batch Operations**: Optimized bulk updates

_The PhysicsStore provides efficient, reactive physics data management with comprehensive vector operations and memory optimization._
