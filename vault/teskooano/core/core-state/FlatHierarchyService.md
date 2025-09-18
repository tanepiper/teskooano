---
aliases: [FlatHierarchyService, flat-hierarchy-service, hierarchy-service]
tags:
  [core, state, service, singleton, reactive, celestial, hierarchy, flat-state]
type: Class
package: "@teskooano/core-state"
name: FlatHierarchyService
dependencies: ["@teskooano/data-types", "rxjs"]
classes: ["BehaviorSubject", "Observable"]
functions: []
constants: []
types:
  [
    "CelestialObject",
    "FlatHierarchyState",
    "HierarchyEntry",
    "HierarchyOperationResult",
  ]
status: active
---

# FlatHierarchyService

Optimized flat state service for managing celestial object hierarchies with bidirectional parent-child relationships, cycle detection, and reactive updates.

**Location**: `src/services/FlatHierarchyService.ts`

## 🎯 Purpose

The `FlatHierarchyService` provides efficient hierarchy management for celestial objects:

- **Flat State Structure**: Stores hierarchy in a flat map for O(1) lookups
- **Bidirectional Relationships**: Maintains both parent→child and child→parent relationships
- **Atomic Operations**: All hierarchy changes are atomic and maintain consistency
- **Cycle Detection**: Prevents invalid hierarchy structures
- **Reactive Updates**: RxJS-based state management for reactive programming
- **Performance Optimized**: Pre-calculated paths, depths, and descendant counts
- **Migration from Legacy**: Replaces the old hierarchy system in CelestialStore

## 🏗️ Architecture

### Singleton Pattern

Uses singleton pattern for consistent access across the application:

```typescript
export class FlatHierarchyService {
  private static instance: FlatHierarchyService;

  public static getInstance(): FlatHierarchyService {
    if (!FlatHierarchyService.instance) {
      FlatHierarchyService.instance = new FlatHierarchyService();
    }
    return FlatHierarchyService.instance;
  }
}
```

### Flat State Structure

Uses a flat map structure for efficient hierarchy management:

```typescript
interface FlatHierarchyState {
  entries: Record<string, HierarchyEntry>; // All hierarchy entries
  roots: string[]; // Root object IDs
  totalObjects: number; // Total count
  maxDepth: number; // Maximum hierarchy depth
}

interface HierarchyEntry {
  id: string; // Object ID
  parentId?: string; // Parent ID (undefined for roots)
  children: string[]; // Direct child IDs
  depth: number; // Depth from root (0 for roots)
  path: string[]; // Path from root to this object
  isRoot: boolean; // Whether this is a root object
  hasChildren: boolean; // Whether this object has children
  descendantCount: number; // Total descendant count
}
```

### Reactive State Management

Uses RxJS `BehaviorSubject` for reactive state updates:

```typescript
private readonly _hierarchyState: BehaviorSubject<FlatHierarchyState>;
public readonly hierarchyState$: Observable<FlatHierarchyState>;
```

## 🔧 Core Methods

### Initialization

```typescript
// Initialize from existing celestial objects
initializeFromObjects(
  objects: Record<string, CelestialObject>,
  options?: HierarchyOperationOptions
): HierarchyOperationResult;

// Initialize empty hierarchy
initializeEmpty(): HierarchyOperationResult;
```

### Object Management

```typescript
// Add object to hierarchy
addObject(
  object: CelestialObject,
  options?: HierarchyOperationOptions
): HierarchyOperationResult;

// Update object in hierarchy
updateObject(
  objectId: string,
  updates: Partial<CelestialObject>,
  options?: HierarchyOperationOptions
): HierarchyOperationResult;

// Remove object from hierarchy
removeObject(
  objectId: string,
  options?: HierarchyOperationOptions
): HierarchyOperationResult;
```

### Parent-Child Relationships

```typescript
// Update parent relationship
updateParent(
  objectId: string,
  newParentId: string | undefined,
  options?: HierarchyOperationOptions
): HierarchyOperationResult;

// Get parent of object
getParent(objectId: string): string | undefined;

// Get children of object
getChildren(objectId: string): string[];

// Get all descendants of object
getDescendants(objectId: string): string[];

// Get all ancestors of object
getAncestors(objectId: string): string[];
```

### Query Operations

```typescript
// Get hierarchy state
getHierarchyState(): FlatHierarchyState;

// Get specific entry
getEntry(objectId: string): HierarchyEntry | undefined;

// Get root objects
getRoots(): string[];

// Get objects at specific depth
getObjectsAtDepth(depth: number): string[];

// Get leaf objects (no children)
getLeafObjects(): string[];

// Check if object is root
isRoot(objectId: string): boolean;

// Check if object has children
hasChildren(objectId: string): boolean;

// Get depth of object
getDepth(objectId: string): number;

// Get path to object
getPath(objectId: string): string[];
```

### Validation

```typescript
// Validate hierarchy consistency
validateHierarchy(): HierarchyOperationResult;

// Check for cycles
hasCycles(): boolean;

// Get validation errors
getValidationErrors(): string[];
```

## 📊 Data Structure Benefits

### Flat State Advantages

1. **Efficient Queries**: O(1) lookups for most operations
2. **Bidirectional Access**: Query both parent→children and child→parent efficiently
3. **Pre-calculated Metrics**: Depth, path, and descendant counts are maintained
4. **Atomic Updates**: All changes are consistent and validated
5. **Memory Efficient**: No nested structures or duplicate data

### Performance Comparison

| Operation     | Old Hierarchy    | Flat Hierarchy            |
| ------------- | ---------------- | ------------------------- |
| Get Children  | O(n) traversal   | O(1) direct access        |
| Get Parent    | O(n) search      | O(1) direct access        |
| Get Depth     | O(n) calculation | O(1) pre-calculated       |
| Get Path      | O(n) traversal   | O(1) pre-calculated       |
| Add Object    | O(1)             | O(1)                      |
| Update Parent | O(n) validation  | O(1) with cycle detection |

## 🚀 Usage Examples

### Basic Initialization

```typescript
import { FlatHierarchyService } from "@teskooano/core-state";

const hierarchyService = FlatHierarchyService.getInstance();

// Initialize from existing objects
const objects = {
  sun: { id: "sun", name: "Sun", parentId: undefined },
  earth: { id: "earth", name: "Earth", parentId: "sun" },
  moon: { id: "moon", name: "Moon", parentId: "earth" },
};

const result = hierarchyService.initializeFromObjects(objects, {
  validate: true,
  emitEvents: true,
});

if (result.success) {
  console.log("Hierarchy initialized successfully");
} else {
  console.error("Failed to initialize hierarchy:", result.error);
}
```

### Parent-Child Operations

```typescript
// Update parent relationship
const updateResult = hierarchyService.updateParent("moon", "mars", {
  validate: true,
  emitEvents: true,
});

if (updateResult.success) {
  console.log("Parent updated successfully");
} else {
  console.error("Failed to update parent:", updateResult.error);
}

// Get children
const earthChildren = hierarchyService.getChildren("earth");
console.log("Earth's children:", earthChildren); // ["moon"]

// Get parent
const moonParent = hierarchyService.getParent("moon");
console.log("Moon's parent:", moonParent); // "earth"
```

### Advanced Queries

```typescript
// Get hierarchy state
const state = hierarchyService.getHierarchyState();
console.log("Total objects:", state.totalObjects);
console.log("Max depth:", state.maxDepth);
console.log("Root objects:", state.roots);

// Get specific entry
const earthEntry = hierarchyService.getEntry("earth");
if (earthEntry) {
  console.log("Earth depth:", earthEntry.depth);
  console.log("Earth path:", earthEntry.path);
  console.log("Earth descendants:", earthEntry.descendantCount);
}

// Get objects at specific depth
const depth1Objects = hierarchyService.getObjectsAtDepth(1);
console.log("Objects at depth 1:", depth1Objects);

// Get leaf objects
const leafObjects = hierarchyService.getLeafObjects();
console.log("Leaf objects:", leafObjects);
```

### Reactive Subscriptions

```typescript
// Subscribe to hierarchy changes
hierarchyService.hierarchyState$.subscribe((state) => {
  console.log("Hierarchy updated:");
  console.log("- Total objects:", state.totalObjects);
  console.log("- Max depth:", state.maxDepth);
  console.log("- Root count:", state.roots.length);
});

// Subscribe to specific object changes
import { map, filter } from "rxjs/operators";

hierarchyService.hierarchyState$
  .pipe(
    map((state) => state.entries["earth"]),
    filter((entry) => entry !== undefined),
  )
  .subscribe((earthEntry) => {
    console.log("Earth hierarchy updated:", earthEntry);
  });
```

### Validation and Error Handling

```typescript
// Validate hierarchy
const validationResult = hierarchyService.validateHierarchy();
if (!validationResult.success) {
  console.error("Hierarchy validation failed:", validationResult.error);
}

// Check for cycles
if (hierarchyService.hasCycles()) {
  console.warn("Hierarchy contains cycles!");
}

// Get validation errors
const errors = hierarchyService.getValidationErrors();
if (errors.length > 0) {
  console.error("Validation errors:", errors);
}
```

## 🔄 Migration from Legacy System

### Before (CelestialStore hierarchy)

```typescript
// Old inefficient approach
const hierarchy = celestialStore.getHierarchy();
const childIds = hierarchy[parentId] || [];
const objects = celestialStore.getObjects();
const children = childIds.map((id) => objects[id]).filter(Boolean);

// Manual depth calculation
function getDepth(objectId: string): number {
  const object = celestialStore.getObject(objectId);
  if (!object?.parentId) return 0;
  return 1 + getDepth(object.parentId);
}
```

### After (FlatHierarchyService)

```typescript
// New efficient approach
const hierarchyService = FlatHierarchyService.getInstance();
const children = hierarchyService.getChildren(parentId);
const depth = hierarchyService.getDepth(objectId);
const path = hierarchyService.getPath(objectId);
const descendants = hierarchyService.getDescendants(objectId);
```

## 🎯 Performance Optimizations

### Pre-calculated Metrics

- **Depth**: Calculated once and cached
- **Path**: Full path from root to object
- **Descendant Count**: Total number of descendants
- **Root Status**: Whether object is a root
- **Children Status**: Whether object has children

### Efficient Algorithms

- **Cycle Detection**: O(n) depth-first search with early termination
- **Path Calculation**: O(1) access to pre-calculated paths
- **Descendant Counting**: O(1) access to pre-calculated counts
- **Atomic Updates**: All changes are atomic and consistent

### Memory Management

- **Flat Structure**: No nested objects or circular references
- **Efficient Storage**: Only stores necessary data
- **Garbage Collection**: Clean object references for proper cleanup

## 🔗 Integration Points

### With CelestialStore

- Reads object data for hierarchy initialization
- Maintains parentId properties for consistency
- Provides hierarchy queries for object operations

### With HierarchyManager

- Provides hierarchy state for dynamic updates
- Handles parent changes from simulation rules
- Validates hierarchy changes before applying

### With UI Components

- Provides hierarchy data for tree views
- Supports reactive updates for UI synchronization
- Enables efficient hierarchy queries for rendering

### With Debug Tools

- Provides detailed hierarchy information
- Supports hierarchy validation and debugging
- Enables performance monitoring and analysis

## 🔗 Related Components

- [[core/core-state/CelestialStore|CelestialStore]] - Provides object data for hierarchy
- [[core/core-state/HierarchyManager|HierarchyManager]] - Uses this service for dynamic updates
- [[core/core-state/StateAccessor|StateAccessor]] - Provides unified access to hierarchy
- [[core/core-state/CelestialManager|CelestialManager]] - Coordinates with hierarchy updates
- [[core/core-debug/CelestialDebugger|CelestialDebugger]] - Uses hierarchy for debugging

## 📚 Architecture Patterns

- **Singleton Pattern**: Ensures single service instance
- **Flat State Pattern**: Efficient flat data structure
- **Reactive Pattern**: RxJS observables for state updates
- **Atomic Pattern**: All operations are atomic and consistent
- **Validation Pattern**: Built-in validation and error handling
- **Performance Pattern**: Pre-calculated metrics for efficiency

## 🔄 Operation Options

```typescript
interface HierarchyOperationOptions {
  validate?: boolean; // Validate hierarchy after operation
  emitEvents?: boolean; // Emit reactive events
  skipCycleCheck?: boolean; // Skip cycle detection (dangerous)
  dryRun?: boolean; // Perform operation without applying changes
}
```

## 🚨 Error Handling

The service provides comprehensive error handling:

```typescript
interface HierarchyOperationResult {
  success: boolean;
  error?: string;
  affectedObjects?: string[];
  newState?: FlatHierarchyState;
  validationErrors?: string[];
}
```

Common error scenarios:

- **Cycle Detection**: Prevents circular parent-child relationships
- **Object Not Found**: Handles missing objects gracefully
- **Validation Failures**: Provides detailed validation error messages
- **Inconsistent State**: Maintains hierarchy consistency at all times

---

_The FlatHierarchyService provides efficient, reactive hierarchy management for celestial objects with flat state structure, atomic operations, and comprehensive validation._
