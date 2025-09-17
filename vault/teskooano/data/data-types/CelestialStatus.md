---
aliases: [CelestialStatus]
tags: [data, types, celestial, status, enum]
type: Enum
package: "@teskooano/data-types"
file: "src/celestial/enums.ts"
status: active
---

# CelestialStatus

Enumeration defining the current status of celestial objects in the simulation lifecycle.

## Overview

The `CelestialStatus` enum provides a simple but essential classification system for tracking the lifecycle state of celestial objects within the simulation. It enables proper object lifecycle management and visual representation of object states.

## Enum Definition

```typescript
export enum CelestialStatus {
  ACTIVE = "active",
  DESTROYED = "destroyed",
  ANNIHILATED = "annihilated",
}
```

## Status Types

### ACTIVE

```typescript
ACTIVE = "active";
```

The object is currently active and functioning normally in the simulation.

**Characteristics:**

- **Physics**: Participates in all physics calculations
- **Rendering**: Fully rendered with all visual effects
- **Interactions**: Available for user interaction and selection
- **State**: Normal operational state

**Usage:**

- Default state for all objects
- Normal simulation operation
- Full functionality enabled

### DESTROYED

```typescript
DESTROYED = "destroyed";
```

The object has been destroyed but may still have debris or remnants.

**Characteristics:**

- **Physics**: May be excluded from major physics calculations
- **Rendering**: May show debris field or explosion effects
- **Interactions**: Limited or no user interaction
- **State**: Transitional destruction state

**Usage:**

- Collision aftermath
- Explosion events
- Debris field creation
- Gradual removal from simulation

### ANNIHILATED

```typescript
ANNIHILATED = "annihilated";
```

The object has been completely annihilated and removed from the simulation.

**Characteristics:**

- **Physics**: Completely excluded from physics calculations
- **Rendering**: Not rendered at all
- **Interactions**: No user interaction possible
- **State**: Final removal state

**Usage:**

- Complete object removal
- Memory cleanup
- Final destruction state
- Performance optimization

## Usage Examples

### Status Management

```typescript
import { CelestialStatus, CelestialObject } from "@teskooano/data-types";

function updateObjectStatus(
  object: CelestialObject,
  newStatus: CelestialStatus,
): CelestialObject {
  return {
    ...object,
    status: newStatus,
  };
}

function destroyObject(object: CelestialObject): CelestialObject {
  return updateObjectStatus(object, CelestialStatus.DESTROYED);
}

function annihilateObject(object: CelestialObject): CelestialObject {
  return updateObjectStatus(object, CelestialStatus.ANNIHILATED);
}
```

### Status-Based Filtering

```typescript
function getActiveObjects(objects: CelestialObject[]): CelestialObject[] {
  return objects.filter((obj) => obj.status === CelestialStatus.ACTIVE);
}

function getDestroyedObjects(objects: CelestialObject[]): CelestialObject[] {
  return objects.filter((obj) => obj.status === CelestialStatus.DESTROYED);
}

function removeAnnihilatedObjects(
  objects: CelestialObject[],
): CelestialObject[] {
  return objects.filter((obj) => obj.status !== CelestialStatus.ANNIHILATED);
}
```

### Physics Integration

```typescript
function shouldIncludeInPhysics(object: CelestialObject): boolean {
  switch (object.status) {
    case CelestialStatus.ACTIVE:
      return !object.ignorePhysics;

    case CelestialStatus.DESTROYED:
      return false; // Destroyed objects don't participate in physics

    case CelestialStatus.ANNIHILATED:
      return false; // Annihilated objects are completely removed

    default:
      return false;
  }
}
```

### Rendering Integration

```typescript
function shouldRenderObject(object: CelestialObject): boolean {
  switch (object.status) {
    case CelestialStatus.ACTIVE:
      return object.isVisible !== false;

    case CelestialStatus.DESTROYED:
      return true; // May render debris or explosion effects

    case CelestialStatus.ANNIHILATED:
      return false; // Completely invisible

    default:
      return false;
  }
}

function getObjectOpacity(object: CelestialObject): number {
  switch (object.status) {
    case CelestialStatus.ACTIVE:
      return 1.0; // Fully opaque

    case CelestialStatus.DESTROYED:
      return 0.3; // Semi-transparent for debris

    case CelestialStatus.ANNIHILATED:
      return 0.0; // Completely transparent

    default:
      return 1.0;
  }
}
```

### Collision Handling

```typescript
function handleCollision(
  object1: CelestialObject,
  object2: CelestialObject,
  impactEnergy: number,
): [CelestialObject, CelestialObject] {
  const destructionThreshold = calculateDestructionThreshold(object1, object2);
  const annihilationThreshold = destructionThreshold * 10;

  if (impactEnergy > annihilationThreshold) {
    // Complete annihilation
    return [
      updateObjectStatus(object1, CelestialStatus.ANNIHILATED),
      updateObjectStatus(object2, CelestialStatus.ANNIHILATED),
    ];
  } else if (impactEnergy > destructionThreshold) {
    // Destruction with debris
    return [
      updateObjectStatus(object1, CelestialStatus.DESTROYED),
      updateObjectStatus(object2, CelestialStatus.DESTROYED),
    ];
  } else {
    // Objects survive collision
    return [object1, object2];
  }
}
```

### Lifecycle Management

```typescript
class ObjectLifecycleManager {
  private objects: Map<string, CelestialObject> = new Map();

  addObject(object: CelestialObject): void {
    this.objects.set(object.id, {
      ...object,
      status: CelestialStatus.ACTIVE,
    });
  }

  destroyObject(objectId: string): void {
    const object = this.objects.get(objectId);
    if (object && object.status === CelestialStatus.ACTIVE) {
      this.objects.set(objectId, {
        ...object,
        status: CelestialStatus.DESTROYED,
      });

      // Schedule annihilation after debris timeout
      setTimeout(() => {
        this.annihilateObject(objectId);
      }, 10000); // 10 seconds
    }
  }

  annihilateObject(objectId: string): void {
    const object = this.objects.get(objectId);
    if (object) {
      this.objects.set(objectId, {
        ...object,
        status: CelestialStatus.ANNIHILATED,
      });

      // Remove from memory after brief delay
      setTimeout(() => {
        this.objects.delete(objectId);
      }, 1000);
    }
  }

  getActiveObjects(): CelestialObject[] {
    return Array.from(this.objects.values()).filter(
      (obj) => obj.status === CelestialStatus.ACTIVE,
    );
  }

  cleanup(): void {
    // Remove all annihilated objects
    for (const [id, object] of this.objects.entries()) {
      if (object.status === CelestialStatus.ANNIHILATED) {
        this.objects.delete(id);
      }
    }
  }
}
```

### Event Integration

```typescript
function dispatchStatusChangeEvent(
  object: CelestialObject,
  oldStatus: CelestialStatus,
  newStatus: CelestialStatus,
): void {
  const event = new CustomEvent(CustomEvents.CELESTIAL_OBJECT_STATUS_CHANGE, {
    detail: {
      objectId: object.id,
      oldStatus,
      newStatus,
      object,
    },
  });

  document.dispatchEvent(event);

  // Dispatch specific events
  if (newStatus === CelestialStatus.DESTROYED) {
    document.dispatchEvent(
      new CustomEvent(CustomEvents.CELESTIAL_OBJECT_DESTROYED, {
        detail: { objectId: object.id, object },
      }),
    );
  }
}
```

## Integration

### Object Lifecycle

- Tracks object state throughout simulation
- Enables proper cleanup and memory management
- Supports destruction and removal workflows

### Physics System

- Determines physics participation
- Affects collision detection
- Controls gravitational interactions

### Rendering System

- Controls object visibility
- Affects rendering effects (debris, explosions)
- Determines opacity and visual state

### UI System

- Affects object availability in lists
- Controls interaction possibilities
- Provides status information display

## Performance Considerations

### Memory Management

- `ANNIHILATED` objects should be removed from memory
- `DESTROYED` objects may have temporary debris
- `ACTIVE` objects require full state management

### Update Frequency

- Status changes are typically infrequent events
- Can be handled reactively rather than polling
- Event-driven updates are more efficient

## 🔗 Related

- [[CelestialObject]] - Base celestial object interface that uses this status
- [[RenderableCelestialObject]] - Renderer-ready objects with status
- [[CustomEvents]] - Event system for status change notifications
- [[@teskooano/core-state]] - State management for object lifecycle
