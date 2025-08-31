---
aliases: [RenderableStore, renderable-store, renderable-objects, renderer-state]
tags: [core, state, store, singleton, reactive, renderable, threejs, objects]
type: Class
package: "@teskooano/core-state"
name: RenderableStore
dependencies: ["@teskooano/data-types", "rxjs"]
classes: ["BehaviorSubject", "Observable"]
functions: []
constants: []
types: ["RenderableCelestialObject"]
status: active
---

# RenderableStore

Singleton store managing the state of renderable celestial objects with reactive state management and comprehensive object lifecycle operations.

## 🎯 Purpose

The `RenderableStore` provides centralized renderable object management:

- **Renderable Objects**: Stores Three.js-compatible celestial objects
- **Reactive Updates**: Provides observable renderable state changes
- **Object Lifecycle**: Manages add, update, and remove operations
- **Renderer Integration**: Supports Three.js renderer data flow
- **State Synchronization**: Keeps renderable objects in sync with core state

## 🏗️ Architecture

### **Singleton Pattern**

- **Single Instance**: Global access to renderable state
- **Reactive Updates**: RxJS-based state management
- **Object Storage**: Efficient object storage by ID
- **Memory Management**: Optimized object lifecycle

### **Data Management Strategy**

1. **Object Storage**: Stores renderable objects by ID
2. **Lifecycle Operations**: Add, update, remove operations
3. **Bulk Operations**: Set all objects at once
4. **State Consistency**: Maintains data integrity

## 🔧 Core Components

### **addRenderableObject()**

```typescript
public addRenderableObject(object: RenderableCelestialObject): void
```

**Purpose**: Adds or replaces a renderable object in the store

**Features**:

- **Add/Replace**: Creates new or updates existing objects
- **Immutable Updates**: Creates new state object
- **Reactive Notifications**: Notifies all subscribers
- **ID-based Storage**: Uses object ID as key

### **updateRenderableObject()**

```typescript
public updateRenderableObject(
  celestialObjectId: string,
  updates: Partial<RenderableCelestialObject>,
): void
```

**Purpose**: Updates specific properties of a renderable object

**Features**:

- **Partial Updates**: Updates only specified properties
- **Object Merging**: Merges updates with existing object
- **Error Handling**: Warns if object not found
- **State Consistency**: Maintains object integrity

### **removeRenderableObject()**

```typescript
public removeRenderableObject(celestialObjectId: string): void
```

**Purpose**: Removes a renderable object from the store

**Features**:

- **Safe Removal**: Handles missing objects gracefully
- **Memory Cleanup**: Frees object memory
- **State Consistency**: Maintains clean state
- **Reactive Updates**: Notifies subscribers

### **setAllRenderableObjects()**

```typescript
public setAllRenderableObjects(
  objects: Record<string, RenderableCelestialObject>,
): void
```

**Purpose**: Sets the entire renderable objects map

**Features**:

- **Bulk Operations**: Efficient bulk updates
- **Complete Replacement**: Replaces entire object set
- **Initialization Support**: Perfect for initialization
- **Adapter Integration**: Works with adapter patterns

### **getRenderableObjects()**

```typescript
public getRenderableObjects(): Record<string, RenderableCelestialObject>
```

**Purpose**: Gets the current snapshot of all renderable objects

**Features**:

- **Synchronous Access**: Immediate value retrieval
- **Complete Data**: Returns all stored objects
- **Object Mapping**: Maps object IDs to renderable objects

### **renderableObjects$**

```typescript
public readonly renderableObjects$: Observable<Record<string, RenderableCelestialObject>>
```

**Purpose**: Observable stream of renderable object changes

**Features**:

- **Reactive Updates**: Notifies on object changes
- **Initial Value**: Emits current objects immediately
- **Complete State**: Provides full object state

## 🎮 Usage Examples

### **Basic Object Management**

```typescript
import { renderableStore } from "@teskooano/core-state";

// Add renderable object
renderableStore.addRenderableObject({
  id: "earth",
  position: new Vector3(0, 0, 0),
  velocity: new Vector3(0, 0, 0),
  // ... other properties
});

// Subscribe to updates
renderableStore.renderableObjects$.subscribe((objects) => {
  console.log("Renderable objects updated:", objects);
});
```

### **Object Updates**

```typescript
// Update specific properties
renderableStore.updateRenderableObject("earth", {
  position: new Vector3(100, 0, 0),
  isVisible: false,
});

// Remove object
renderableStore.removeRenderableObject("earth");
```

### **Bulk Operations**

```typescript
// Set all objects at once
const allObjects = {
  earth: {
    /* earth object */
  },
  mars: {
    /* mars object */
  },
};

renderableStore.setAllRenderableObjects(allObjects);
```

### **Renderer Integration**

```typescript
// Subscribe to renderable objects for Three.js
renderableStore.renderableObjects$.subscribe((objects) => {
  // Update Three.js scene
  Object.values(objects).forEach((object) => {
    if (object.mesh) {
      scene.add(object.mesh);
    }
  });
});
```

## 🔄 Integration Points

### **Three.js Renderer Integration**

- **Object Provision**: Provides objects for Three.js rendering
- **Reactive Updates**: Notifies renderer of changes
- **Property Access**: Provides position, velocity, and render properties
- **Memory Management**: Efficient object lifecycle

### **Core State Integration**

- **State Synchronization**: Keeps pace with core celestial state
- **Object Mapping**: Maps celestial objects to renderable objects
- **Lifecycle Management**: Handles object creation and destruction
- **Data Consistency**: Maintains consistency with core state

### **Adapter Integration**

- **Factory Support**: Works with object factories
- **Bulk Updates**: Supports adapter bulk operations
- **State Initialization**: Perfect for system initialization
- **Performance Optimization**: Efficient bulk operations

## 🎯 Key Features

### **Object Lifecycle Management**

- **Add Operations**: Efficient object addition
- **Update Operations**: Partial property updates
- **Remove Operations**: Safe object removal
- **Bulk Operations**: Complete state replacement

### **Reactive State Management**

- **Observable Stream**: RxJS-based state updates
- **Immediate Access**: Synchronous getter for current state
- **Change Notifications**: Notifies all subscribers
- **State Consistency**: Maintains data integrity

### **Performance Optimization**

- **Efficient Storage**: Optimized object storage
- **Memory Management**: Automatic cleanup and optimization
- **Fast Access**: O(1) object retrieval
- **Bulk Operations**: Optimized bulk updates

### **Error Handling**

- **Safe Operations**: Handles missing objects gracefully
- **State Consistency**: Maintains clean state
- **Memory Safety**: Prevents memory leaks
- **Debug Support**: Easy state inspection

## 🔧 Configuration

### **Object Storage**

- **ID Mapping**: Maps object IDs to renderable objects
- **Record Format**: Uses Record<string, RenderableCelestialObject>
- **Memory Optimization**: Efficient storage strategy

### **Performance Characteristics**

- **Fast Retrieval**: O(1) access time
- **Efficient Updates**: Minimal object creation
- **Memory Cleanup**: Automatic object removal
- **Bulk Operations**: Optimized bulk updates

_The RenderableStore provides efficient, reactive renderable object management with comprehensive lifecycle operations and Three.js integration._
