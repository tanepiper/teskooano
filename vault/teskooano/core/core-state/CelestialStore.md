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

Pure data store for celestial objects and hierarchy relationships using RxJS for reactive state management with comprehensive destruction event processing.

**Location**: `src/stores/celestialStore.ts`

## 🎯 Purpose

The `CelestialStore` provides centralized storage for celestial object data:

- **Object Storage**: Manages map of celestial objects by ID
- **Hierarchy Management**: Tracks parent-child relationships between objects
- **Reactive Updates**: RxJS observables for real-time state synchronization
- **Immutable Operations**: All updates create new state objects
- **Efficient Queries**: Get children, parents, and object counts
- **Destruction Processing**: Handles object destruction events and cascade effects
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

### Shared Utilities Integration

Uses shared filtering and event dispatching utilities:

```typescript
// Filtered observables use shared operators
this.activeObjects$ = filterActiveCelestialObjects$(this.objects$);
this.destroyedObjects$ = filterDestroyedCelestialObjects$(this.objects$);
this.physicsActiveObjects$ = filterPhysicsActiveCelestialObjects$(
  this.objects$,
);
this.visibleObjects$ = filterVisibleCelestialObjects$(this.objects$);
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

### Filtered Object Access

```typescript
// Get active objects (not destroyed or annihilated)
getActiveObjects(): Record<string, CelestialObject>;

// Get destroyed objects
getDestroyedObjects(): Record<string, CelestialObject>;

// Get physics-active objects (active and not ignoring physics)
getPhysicsActiveObjects(): Record<string, CelestialObject>;

// Get visible objects (active and visible)
getVisibleObjects(): Record<string, CelestialObject>;
```

### Reactive Filtered Observables

```typescript
// Observable of active objects
activeObjects$: Observable<Record<string, CelestialObject>>;

// Observable of destroyed objects
destroyedObjects$: Observable<Record<string, CelestialObject>>;

// Observable of physics-active objects
physicsActiveObjects$: Observable<Record<string, CelestialObject>>;

// Observable of visible objects
visibleObjects$: Observable<Record<string, CelestialObject>>;
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

### Destruction Event Processing

```typescript
// Process destruction events and return updated objects map
processDestructionEvents(destroyedIds: string[]): Record<string, CelestialObject>;

// Mark objects as destroyed and update store
markObjectsDestroyed(destroyedIds: string[]): void;
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

### Destruction Event Processing

```typescript
// Process destruction events with cascade effects
public processDestructionEvents(destroyedIds: string[]): Record<string, CelestialObject> {
  const currentObjects = this.getObjects();
  const newObjectsMap: Record<string, CelestialObject> = { ...currentObjects };

  // Process direct destruction events first
  destroyedIds.forEach((idToDestroy) => {
    const existingObject = newObjectsMap[idToDestroy];
    if (
      existingObject &&
      existingObject.status !== CelestialStatus.DESTROYED &&
      existingObject.status !== CelestialStatus.ANNIHILATED
    ) {
      newObjectsMap[idToDestroy] = {
        ...existingObject,
        status: CelestialStatus.DESTROYED,
      };

      // Dispatch destruction event using shared utility
      dispatchObjectDestroyedEvent(idToDestroy);
    }
  });

  // Handle reactive ring system destruction
  Object.values(newObjectsMap).forEach((object) => {
    if (
      object.type === CelestialType.RING_SYSTEM &&
      object.parentId &&
      object.status !== CelestialStatus.DESTROYED &&
      object.status !== CelestialStatus.ANNIHILATED
    ) {
      const parent = newObjectsMap[object.parentId];
      if (
        parent &&
        (parent.status === CelestialStatus.DESTROYED ||
          parent.status === CelestialStatus.ANNIHILATED)
      ) {
        // Ring system automatically destroys itself when parent is destroyed
        newObjectsMap[object.id] = {
          ...object,
          status: parent.status, // Inherit parent's destruction status
        };

        // Dispatch destruction event using shared utility
        dispatchObjectDestroyedEvent(object.id);
      }
    }
  });

  return newObjectsMap;
}
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

### Filtered Object Access

```typescript
// Get filtered objects
const activeObjects = celestialStore.getActiveObjects();
const destroyedObjects = celestialStore.getDestroyedObjects();
const physicsObjects = celestialStore.getPhysicsActiveObjects();
const visibleObjects = celestialStore.getVisibleObjects();

// Subscribe to filtered observables
celestialStore.activeObjects$.subscribe((objects) => {
  console.log("Active objects:", Object.keys(objects).length);
});

celestialStore.physicsActiveObjects$.subscribe((objects) => {
  console.log("Physics objects:", Object.keys(objects).length);
});
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

### Destruction Event Processing

```typescript
// Process destruction events from physics simulation
const updatedObjects = celestialStore.processDestructionEvents([
  "asteroid-1",
  "asteroid-2",
]);
celestialStore.setAllObjects(updatedObjects);

// Or use the convenience method
celestialStore.markObjectsDestroyed(["asteroid-1", "asteroid-2"]);
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
- **Efficient Filtering**: Uses shared filtering utilities
- **Proper Cleanup**: Removes all references when deleting objects

### Query Optimization

- **Direct Access**: O(1) lookup by ID
- **Cached Results**: RxJS caches observable results
- **Efficient Filtering**: Uses shared filtering operators

### Shared Utilities

- **Code Reuse**: Uses shared filtering and event dispatching utilities
- **Consistency**: Consistent behavior across the application
- **Maintainability**: Centralized logic for common operations

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

### With Destruction Processing

- Handles destruction events from physics simulation
- Manages cascade effects (ring system destruction)
- Dispatches destruction events for UI updates

## 🔗 Related Components

- [[CelestialManager]] - Uses this store for object operations
- [[StateAccessor]] - Provides unified access to this store
- [[PhysicsSystemAdapter]] - Reads object data for physics
- [[RenderableStore]] - Stores derived renderable data
- [[StoreFilters]] - Shared filtering utilities
- [[CelestialUtils]] - Shared event dispatching utilities

## 📚 Architecture Patterns

- **Singleton Pattern**: Ensures single store instance
- **Reactive Pattern**: RxJS observables for state updates
- **Immutable Pattern**: New state objects for all changes
- **Pure Data Pattern**: No business logic, only data storage
- **Shared Utilities Pattern**: Uses shared filtering and event utilities

---

_The CelestialStore provides efficient, reactive storage for celestial objects with immutable updates, comprehensive hierarchy management, and advanced destruction event processing._
