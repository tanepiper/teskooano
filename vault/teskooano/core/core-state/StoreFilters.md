---
aliases: [StoreFilters, store-filters, filtering-utilities, rxjs-operators]
tags: [core, state, utilities, static, filtering, rxjs, operators]
type: Module
package: "@teskooano/core-state"
name: StoreFilters
dependencies: ["@teskooano/data-types", "rxjs"]
classes: []
functions:
  [
    "filterActiveCelestialObjects",
    "filterDestroyedCelestialObjects",
    "filterPhysicsActiveCelestialObjects",
    "filterVisibleCelestialObjects",
    "filterActiveRenderableObjects",
    "filterPhysicsActiveRenderableObjects",
    "filterVisibleRenderableObjects",
    "filterNonZeroAccelerationVectors",
    "filterActiveCelestialObjects$",
    "filterDestroyedCelestialObjects$",
    "filterPhysicsActiveCelestialObjects$",
    "filterVisibleCelestialObjects$",
    "filterActiveRenderableObjects$",
    "filterPhysicsActiveRenderableObjects$",
    "filterVisibleRenderableObjects$",
    "filterNonZeroAccelerationVectors$",
  ]
constants: []
types:
  [
    "CelestialObject",
    "RenderableCelestialObject",
    "OSVector3",
    "CelestialStatus",
  ]
status: active
---

# StoreFilters

Static utility functions and RxJS operators for filtering celestial objects, renderable objects, and physics vectors with comprehensive type safety and performance optimization.

**Location**: `src/utils/StoreFilters.ts`

## 🎯 Purpose

The `StoreFilters` provides centralized filtering logic:

- **Celestial Object Filtering**: Filter celestial objects by status and properties
- **Renderable Object Filtering**: Filter renderable objects by status and properties
- **Physics Vector Filtering**: Filter acceleration vectors by magnitude
- **RxJS Operators**: Pre-composed observable operators for reactive filtering
- **Code Reuse**: Eliminates duplicate filtering logic across stores
- **Type Safety**: Full TypeScript type safety for all filtering operations
- **Performance**: Optimized filtering with minimal object creation

## 🏗️ Architecture

### **Static Utility Pattern**

- **No Instance State**: All functions are static for utility access
- **Pure Functions**: Deterministic operations without side effects
- **Type Safety**: Full TypeScript type safety
- **Performance Optimization**: Efficient filtering algorithms

### **Dual Pattern Support**

Provides both imperative functions and reactive operators:

```typescript
// Imperative filtering
const activeObjects = filterActiveCelestialObjects(allObjects);

// Reactive filtering with RxJS operators
activeObjects$
  .pipe(filterActiveCelestialObjects$)
  .subscribe((activeObjects) => {
    // Handle active objects
  });
```

## 🔧 Core Components

### **Celestial Object Filters**

#### **filterActiveCelestialObjects()**

```typescript
export function filterActiveCelestialObjects(
  objects: Record<string, CelestialObject>,
): Record<string, CelestialObject>;
```

**Purpose**: Filters celestial objects to only include active (non-destroyed) objects

**Features**:

- **Status Filtering**: Excludes DESTROYED and ANNIHILATED objects
- **Type Safety**: Full TypeScript type safety
- **Performance**: Efficient object filtering
- **Consistency**: Consistent behavior across application

#### **filterDestroyedCelestialObjects()**

```typescript
export function filterDestroyedCelestialObjects(
  objects: Record<string, CelestialObject>,
): Record<string, CelestialObject>;
```

**Purpose**: Filters celestial objects to only include destroyed objects

**Features**:

- **Status Filtering**: Includes only DESTROYED and ANNIHILATED objects
- **Cleanup Support**: Useful for cleanup operations
- **Type Safety**: Full TypeScript type safety

#### **filterPhysicsActiveCelestialObjects()**

```typescript
export function filterPhysicsActiveCelestialObjects(
  objects: Record<string, CelestialObject>,
): Record<string, CelestialObject>;
```

**Purpose**: Filters celestial objects to only include physics-active objects

**Features**:

- **Status Filtering**: Excludes destroyed objects
- **Physics Filtering**: Excludes objects with `ignorePhysics` flag
- **Physics Engine**: Perfect for physics engine input
- **Performance**: Optimized for physics workloads

#### **filterVisibleCelestialObjects()**

```typescript
export function filterVisibleCelestialObjects(
  objects: Record<string, CelestialObject>,
): Record<string, CelestialObject>;
```

**Purpose**: Filters celestial objects to only include visible objects

**Features**:

- **Status Filtering**: Excludes destroyed objects
- **Visibility Filtering**: Excludes objects with `isVisible: false`
- **Renderer Support**: Perfect for rendering systems
- **Performance**: Optimized for rendering workloads

### **Renderable Object Filters**

#### **filterActiveRenderableObjects()**

```typescript
export function filterActiveRenderableObjects(
  objects: Record<string, RenderableCelestialObject>,
): Record<string, RenderableCelestialObject>;
```

**Purpose**: Filters renderable objects to only include active objects

**Features**:

- **Status Filtering**: Excludes DESTROYED and ANNIHILATED objects
- **Renderer Support**: Perfect for Three.js rendering
- **Type Safety**: Full TypeScript type safety

#### **filterPhysicsActiveRenderableObjects()**

```typescript
export function filterPhysicsActiveRenderableObjects(
  objects: Record<string, RenderableCelestialObject>,
): Record<string, RenderableCelestialObject>;
```

**Purpose**: Filters renderable objects to only include physics-active objects

**Features**:

- **Status Filtering**: Excludes destroyed objects
- **Physics Filtering**: Excludes objects with `ignorePhysics` flag
- **Physics Integration**: Perfect for physics-renderer integration

#### **filterVisibleRenderableObjects()**

```typescript
export function filterVisibleRenderableObjects(
  objects: Record<string, RenderableCelestialObject>,
): Record<string, RenderableCelestialObject>;
```

**Purpose**: Filters renderable objects to only include visible objects

**Features**:

- **Visibility Filtering**: Excludes objects with `isVisible: false`
- **Renderer Optimization**: Perfect for rendering optimization
- **Performance**: Reduces render workload

### **Physics Vector Filters**

#### **filterNonZeroAccelerationVectors()**

```typescript
export function filterNonZeroAccelerationVectors(
  vectors: Record<string, OSVector3>,
): Record<string, OSVector3>;
```

**Purpose**: Filters acceleration vectors to only include non-zero vectors

**Features**:

- **Magnitude Filtering**: Excludes zero-magnitude vectors
- **Physics Optimization**: Reduces physics computation
- **Performance**: Optimized for physics workloads

### **RxJS Operators**

#### **filterActiveCelestialObjects$**

```typescript
export const filterActiveCelestialObjects$ = <
  T extends Record<string, CelestialObject>,
>() =>
  pipe(
    map((objects: T) => filterActiveCelestialObjects(objects)),
    shareReplay(1),
  );
```

**Purpose**: RxJS operator for reactive filtering of active celestial objects

**Features**:

- **Reactive Pattern**: Perfect for RxJS streams
- **Caching**: Uses `shareReplay(1)` for performance
- **Type Safety**: Full TypeScript type safety
- **Consistency**: Consistent with imperative version

#### **filterDestroyedCelestialObjects$**

```typescript
export const filterDestroyedCelestialObjects$ = <
  T extends Record<string, CelestialObject>,
>() =>
  pipe(
    map((objects: T) => filterDestroyedCelestialObjects(objects)),
    shareReplay(1),
  );
```

**Purpose**: RxJS operator for reactive filtering of destroyed celestial objects

#### **filterPhysicsActiveCelestialObjects$**

```typescript
export const filterPhysicsActiveCelestialObjects$ = <
  T extends Record<string, CelestialObject>,
>() =>
  pipe(
    map((objects: T) => filterPhysicsActiveCelestialObjects(objects)),
    shareReplay(1),
  );
```

**Purpose**: RxJS operator for reactive filtering of physics-active celestial objects

#### **filterVisibleCelestialObjects$**

```typescript
export const filterVisibleCelestialObjects$ = <
  T extends Record<string, CelestialObject>,
>() =>
  pipe(
    map((objects: T) => filterVisibleCelestialObjects(objects)),
    shareReplay(1),
  );
```

**Purpose**: RxJS operator for reactive filtering of visible celestial objects

#### **Renderable Object Operators**

Similar operators exist for renderable objects:

- `filterActiveRenderableObjects$`
- `filterPhysicsActiveRenderableObjects$`
- `filterVisibleRenderableObjects$`

#### **Physics Vector Operators**

```typescript
export const filterNonZeroAccelerationVectors$ = <
  T extends Record<string, OSVector3>,
>() =>
  pipe(
    map((vectors: T) => filterNonZeroAccelerationVectors(vectors)),
    shareReplay(1),
  );
```

**Purpose**: RxJS operator for reactive filtering of non-zero acceleration vectors

## 🎮 Usage Examples

### **Imperative Filtering**

```typescript
import { filterActiveCelestialObjects } from "@teskooano/core-state";

// Filter active objects
const allObjects = celestialStore.getObjects();
const activeObjects = filterActiveCelestialObjects(allObjects);

console.log(`Active objects: ${Object.keys(activeObjects).length}`);

// Filter physics-active objects
const physicsObjects = filterPhysicsActiveCelestialObjects(allObjects);
console.log(`Physics objects: ${Object.keys(physicsObjects).length}`);

// Filter visible objects
const visibleObjects = filterVisibleCelestialObjects(allObjects);
console.log(`Visible objects: ${Object.keys(visibleObjects).length}`);
```

### **Reactive Filtering**

```typescript
import { filterActiveCelestialObjects$ } from "@teskooano/core-state";

// Subscribe to active objects
celestialStore.objects$
  .pipe(filterActiveCelestialObjects$())
  .subscribe((activeObjects) => {
    console.log(`Active objects: ${Object.keys(activeObjects).length}`);
  });

// Subscribe to physics-active objects
celestialStore.objects$
  .pipe(filterPhysicsActiveCelestialObjects$())
  .subscribe((physicsObjects) => {
    console.log(`Physics objects: ${Object.keys(physicsObjects).length}`);
  });
```

### **Renderable Object Filtering**

```typescript
import { filterVisibleRenderableObjects } from "@teskooano/core-state";

// Filter visible renderable objects
const allRenderableObjects = renderableStore.getRenderableObjects();
const visibleRenderableObjects =
  filterVisibleRenderableObjects(allRenderableObjects);

console.log(
  `Visible renderable objects: ${Object.keys(visibleRenderableObjects).length}`,
);
```

### **Physics Vector Filtering**

```typescript
import { filterNonZeroAccelerationVectors } from "@teskooano/core-state";

// Filter non-zero acceleration vectors
const allVectors = physicsStore.getAccelerationVectors();
const nonZeroVectors = filterNonZeroAccelerationVectors(allVectors);

console.log(`Non-zero vectors: ${Object.keys(nonZeroVectors).length}`);
```

### **Combined Filtering**

```typescript
import {
  filterActiveCelestialObjects,
  filterVisibleCelestialObjects,
} from "@teskooano/core-state";

// Chain filters for complex filtering
const allObjects = celestialStore.getObjects();
const activeObjects = filterActiveCelestialObjects(allObjects);
const visibleActiveObjects = filterVisibleCelestialObjects(activeObjects);

console.log(
  `Visible active objects: ${Object.keys(visibleActiveObjects).length}`,
);
```

### **Store Integration**

```typescript
// In store implementations
export class CelestialStore {
  constructor() {
    // Use shared operators for filtered observables
    this.activeObjects$ = filterActiveCelestialObjects$(this.objects$);
    this.destroyedObjects$ = filterDestroyedCelestialObjects$(this.objects$);
    this.physicsActiveObjects$ = filterPhysicsActiveCelestialObjects$(
      this.objects$,
    );
    this.visibleObjects$ = filterVisibleCelestialObjects$(this.objects$);
  }

  // Use shared functions for imperative getters
  public getActiveObjects(): Record<string, CelestialObject> {
    return filterActiveCelestialObjects(this.getObjects());
  }

  public getPhysicsActiveObjects(): Record<string, CelestialObject> {
    return filterPhysicsActiveCelestialObjects(this.getObjects());
  }
}
```

## 🔄 Integration Points

### **Store Integration**

- **CelestialStore**: Uses for filtered observables and getters
- **RenderableStore**: Uses for renderable object filtering
- **PhysicsStore**: Uses for acceleration vector filtering
- **Consistency**: Ensures consistent filtering across all stores

### **Component Integration**

- **UI Components**: Use for displaying filtered data
- **Renderer Components**: Use for rendering optimization
- **Physics Components**: Use for physics engine input
- **Performance**: Optimizes component performance

### **Utility Integration**

- **StateAccessor**: Uses for unified state access
- **CelestialUtils**: Complements with processing utilities
- **Performance**: Optimizes utility performance

## 🎯 Key Features

### **Performance Optimization**

- **Efficient Algorithms**: Optimized filtering algorithms
- **Minimal Allocations**: Minimal object creation
- **Caching**: RxJS operators use `shareReplay(1)` for caching
- **Type Safety**: Compile-time type checking

### **Code Reuse**

- **Centralized Logic**: Single source for filtering logic
- **Consistency**: Consistent behavior across application
- **Maintainability**: Easy to maintain and update
- **Reduced Duplication**: Eliminates duplicate filtering code

### **Type Safety**

- **Full TypeScript**: Complete type safety throughout
- **Generic Support**: Generic type support for flexibility
- **Interface Compliance**: Ensures interface compliance
- **Compile-time Checking**: Compile-time type validation

### **Flexibility**

- **Dual Patterns**: Supports both imperative and reactive patterns
- **Composable**: Easy to compose with other utilities
- **Extensible**: Easy to extend with new filters
- **Backward Compatible**: Maintains compatibility

## 🔧 Configuration

### **Filtering Rules**

- **Active Objects**: Excludes DESTROYED and ANNIHILATED status
- **Physics Active**: Excludes destroyed objects and objects with `ignorePhysics: true`
- **Visible Objects**: Excludes destroyed objects and objects with `isVisible: false`
- **Non-zero Vectors**: Excludes vectors with zero magnitude

### **Performance Characteristics**

- **Fast Filtering**: O(n) filtering performance
- **Memory Efficient**: Minimal object creation
- **Cached Results**: RxJS operators cache results
- **Optimized**: Optimized for common use cases

_The StoreFilters provides comprehensive, efficient filtering utilities with full TypeScript type safety and performance optimization._
