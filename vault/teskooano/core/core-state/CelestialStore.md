---
aliases: [CelestialStore, celestial-store, object-store, hierarchy-store]
tags: [core, state, store, singleton, reactive, celestial, hierarchy]
type: Class
package: "@teskooano/core-state"
name: CelestialStore
dependencies: ["@teskooano/data-types", "rxjs"]
classes: ["BehaviorSubject", "Observable"]
functions: []
constants: []
types: ["CelestialObject", "CelestialSpecificPropertiesUnion"]
status: active
---

# CelestialStore

Pure data store for celestial objects and hierarchy relationships using RxJS for reactive state management.

**Location**: `src/stores/celestialStore.ts`

## 🎯 Purpose

The `CelestialStore` provides centralized storage for celestial object data:

- **Object Storage**: Manages map of celestial objects by ID
- **Hierarchy Management**: Tracks parent-child relationships between objects
- **Reactive Updates**: RxJS observables for real-time state synchronization
- **Immutable Operations**: All updates create new state objects
- **Efficient Queries**: Get children, parents, and object counts
- **Pure Data Store**: No business logic, only data storage

## 🏗️ Architecture

### Singleton Pattern

Uses singleton pattern for consistent access across the application:

```typescript
export class CelestialStore {
  private static instance: CelestialStore;

  public static getInstance(): CelestialStore {
    if (!CelestialStore.instance) {
      CelestialStore.instance = new CelestialStore();
    }
    return CelestialStore.instance;
  }
}
```

### Reactive State Management

Uses RxJS `BehaviorSubject` for reactive state updates:

```typescript
private readonly _objects: BehaviorSubject<Record<string, CelestialObject>>;
public readonly objects$: Observable<Record<string, CelestialObject>>;

private readonly _hierarchy: BehaviorSubject<Record<string, string[]>>;
public readonly hierarchy$: Observable<Record<string, string[]>>;
```

### Immutable Updates

All operations create new state objects to ensure reactive updates:

```typescript
public setObject(id: string, object: CelestialObject): void {
  const current = this._objects.getValue();
  this._objects.next({ ...current, [id]: object });
}
```

## 🔧 Core Methods

### Object Operations

```typescript
// Get all objects
getObjects(): Record<string, CelestialObject>;

// Get specific object
getObject(id: string): CelestialObject | undefined;

// Set/update object
setObject(id: string, object: CelestialObject): void;

// Remove object
removeObject(id: string): void;

// Set all objects (bulk update)
setAllObjects(objects: Record<string, CelestialObject>): void;
```

### Hierarchy Operations

```typescript
// Get hierarchy map
getHierarchy(): Record<string, string[]>;

// Set hierarchy map
setHierarchy(hierarchy: Record<string, string[]>): void;

// Add child to parent
addChild(parentId: string, childId: string): void;

// Remove child from parent
removeChild(parentId: string, childId: string): void;

// Remove hierarchy entry for object
removeHierarchyEntry(objectId: string): void;
```

### Utility Operations

```typescript
// Get children of parent
getChildren(parentId: string): CelestialObject[];

// Get parent of child
getParent(childId: string): CelestialObject | undefined;
```

## 📊 Data Structure

### Objects Map

```typescript
Record<string, CelestialObject>;
```

- **Key**: Object ID (string)
- **Value**: CelestialObject instance
- **Purpose**: Fast lookup by ID

### Hierarchy Map

```typescript
Record<string, string[]>;
```

- **Key**: Parent object ID (string)
- **Value**: Array of child object IDs (string[])
- **Purpose**: Track parent-child relationships

## 🔄 Update Patterns

### Single Object Update

```typescript
// Update single object
const current = this._objects.getValue();
this._objects.next({ ...current, [id]: object });
```

### Bulk Object Update

```typescript
// Update all objects at once
this._objects.next(newObjectsMap);
```

### Hierarchy Update

```typescript
// Add child to parent
const current = this._hierarchy.getValue();
const children = current[parentId] || [];
if (!children.includes(childId)) {
  this._hierarchy.next({
    ...current,
    [parentId]: [...children, childId],
  });
}
```

### Hierarchy Cleanup

```typescript
// Remove object from hierarchy
const current = this._hierarchy.getValue();
const newHierarchy = { ...current };

// Remove the object's own entry
delete newHierarchy[objectId];

// Remove from all parent lists
Object.keys(newHierarchy).forEach((parentId) => {
  newHierarchy[parentId] = newHierarchy[parentId].filter(
    (childId) => childId !== objectId,
  );
});

this._hierarchy.next(newHierarchy);
```

## 🚀 Usage Examples

### Basic Object Management

```typescript
import { celestialStore } from "@teskooano/core-state";

// Add object
celestialStore.setObject("earth", earthObject);

// Get object
const earth = celestialStore.getObject("earth");

// Update object
celestialStore.setObject("earth", { ...earth, name: "Terra" });

// Remove object
celestialStore.removeObject("asteroid-001");

// Get all objects
const allObjects = celestialStore.getObjects();
```

### Hierarchy Management

```typescript
// Add child to parent
celestialStore.addChild("sun", "earth");
celestialStore.addChild("earth", "moon");

// Get children
const earthChildren = celestialStore.getChildren("earth"); // [moonObject]

// Get parent
const moonParent = celestialStore.getParent("moon"); // earthObject

// Remove child
celestialStore.removeChild("earth", "moon");

// Remove object from hierarchy
celestialStore.removeHierarchyEntry("destroyed-satellite");
```

### Reactive Subscriptions

```typescript
// Subscribe to object changes
celestialStore.objects$.subscribe((objects) => {
  console.log("Objects updated:", Object.keys(objects).length);
});

// Subscribe to hierarchy changes
celestialStore.hierarchy$.subscribe((hierarchy) => {
  console.log("Hierarchy updated:", Object.keys(hierarchy).length);
});

// Subscribe to specific object changes
import { map, filter } from "rxjs/operators";

celestialStore.objects$
  .pipe(
    map((objects) => objects["earth"]),
    filter((earth) => earth !== undefined),
  )
  .subscribe((earth) => {
    console.log("Earth updated:", earth.name);
  });
```

### Bulk Operations

```typescript
// Set all objects at once
const allObjects = {
  sun: sunObject,
  earth: earthObject,
  mars: marsObject,
};
celestialStore.setAllObjects(allObjects);

// Set hierarchy for multiple objects
const hierarchy = {
  sun: ["earth", "mars"],
  earth: ["moon"],
};
celestialStore.setHierarchy(hierarchy);
```

### Utility Queries

```typescript
// Get all children of a parent
const solarSystemObjects = celestialStore.getChildren("sun");

// Get parent of an object
const earthParent = celestialStore.getParent("earth");

// Check if object exists
const hasEarth = celestialStore.getObject("earth") !== undefined;

// Get object count
const objectCount = Object.keys(celestialStore.getObjects()).length;
```

## 🎯 Performance Optimizations

### Immutable Updates

- **Shallow Copies**: Uses spread operator for efficient copying
- **Minimal Allocations**: Only creates new objects when necessary
- **Reactive Efficiency**: RxJS optimizes subscription updates

### Memory Management

- **No Circular References**: Clean object references
- **Efficient Filtering**: Uses native array methods
- **Proper Cleanup**: Removes all references when deleting objects

### Query Optimization

- **Direct Access**: O(1) lookup by ID
- **Cached Results**: RxJS caches observable results
- **Efficient Filtering**: Uses native JavaScript methods

## 🔗 Integration Points

### With CelestialManager

- Provides data storage for object lifecycle operations
- Receives updates from manager operations
- Maintains consistency with manager state

### With StateAccessor

- Provides data for unified state access
- Supports both reactive and imperative access patterns
- Enables convenience methods for common queries

### With Physics System

- Provides object data for physics calculations
- Maintains object state for physics integration
- Supports physics state updates

## 🔗 Related Components

- [[CelestialManager]] - Uses this store for object operations
- [[StateAccessor]] - Provides unified access to this store
- [[PhysicsSystemAdapter]] - Reads object data for physics
- [[RenderableStore]] - Stores derived renderable data

## 📚 Architecture Patterns

- **Singleton Pattern**: Ensures single store instance
- **Reactive Pattern**: RxJS observables for state updates
- **Immutable Pattern**: New state objects for all changes
- **Pure Data Pattern**: No business logic, only data storage

---

_The CelestialStore provides efficient, reactive storage for celestial objects with immutable updates and comprehensive hierarchy management._
