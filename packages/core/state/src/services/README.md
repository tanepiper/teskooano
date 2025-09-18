# Flat Hierarchy Service

The `FlatHierarchyService` provides an optimized, flat state structure for managing celestial object hierarchies with bidirectional parent-child relationships. This service is designed to replace the traditional nested hierarchy approach with a more efficient, queryable flat structure.

## Key Features

- **Bidirectional Relationships**: Maintains both parent→child and child→parent relationships
- **Atomic Operations**: All hierarchy changes are atomic and maintain consistency
- **Efficient Queries**: Pre-calculated paths, depths, and descendant counts
- **Cycle Detection**: Prevents invalid hierarchy structures
- **Reactive Updates**: RxJS-based state management for reactive programming
- **Performance Optimized**: O(1) lookups for most operations

## Architecture

### Flat State Structure

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

### Benefits Over Traditional Approach

1. **Efficient Queries**: No need to traverse trees for common operations
2. **Bidirectional Access**: Query both parent→children and child→parent efficiently
3. **Pre-calculated Metrics**: Depth, path, and descendant counts are maintained
4. **Atomic Updates**: All changes are consistent and validated
5. **Memory Efficient**: Single flat structure vs. nested objects

## Usage Examples

### Basic Setup

```typescript
import { FlatHierarchyService } from "@teskooano/core-state";

const hierarchyService = FlatHierarchyService.getInstance();

// Initialize from existing objects
const objects = {
  sun: { id: "sun", parentId: undefined /* ... */ },
  earth: { id: "earth", parentId: "sun" /* ... */ },
  moon: { id: "moon", parentId: "earth" /* ... */ },
};

const result = hierarchyService.initializeFromObjects(objects);
if (result.success) {
  console.log("Hierarchy initialized successfully");
}
```

### Querying Hierarchy

```typescript
// Get all children of an object
const children = hierarchyService.getChildren("sun");
console.log(`Sun has ${children.count} children`);

// Get children with depth limit
const directChildren = hierarchyService.getChildren("sun", { maxDepth: 1 });

// Get parent of an object
const parent = hierarchyService.getParent("moon");
console.log(`Moon's parent: ${parent?.id}`);

// Get path from root
const path = hierarchyService.getPathToRoot("moon");
console.log(`Path to moon: ${path.join(" → ")}`); // "sun → earth → moon"

// Get all root objects
const roots = hierarchyService.getRoots();
console.log(`Found ${roots.length} root objects`);

// Get objects at specific depth
const depth1Objects = hierarchyService.getObjectsAtDepth(1);
```

### Modifying Hierarchy

```typescript
// Add a new object
const mars = { id: "mars", parentId: "sun" /* ... */ };
const addResult = hierarchyService.addObject(mars);

// Update parent relationship
const updateResult = hierarchyService.updateParent("moon", "mars");
if (updateResult.success) {
  console.log("Moon now orbits Mars");
}

// Remove an object
const removeResult = hierarchyService.removeObject("destroyed-asteroid");
```

### Reactive Updates

```typescript
// Subscribe to hierarchy changes
hierarchyService.hierarchyState$.subscribe((state) => {
  console.log(`Hierarchy updated: ${state.totalObjects} objects`);
  console.log(`Max depth: ${state.maxDepth}`);
  console.log(`Roots: ${state.roots.join(", ")}`);
});
```

## Integration with HierarchyManager

The `HierarchyManager` has been updated to use the `FlatHierarchyService` for more efficient hierarchy management:

```typescript
import { HierarchyManager } from "@teskooano/app-simulation";

const hierarchyManager = new HierarchyManager();

// Initialize the flat hierarchy
hierarchyManager.initializeHierarchy();

// Use optimized query methods
const children = hierarchyManager.getChildren("sun");
const parent = hierarchyManager.getParent("moon");
const path = hierarchyManager.getPathToRoot("moon");
const roots = hierarchyManager.getRootObjects();

// Check hierarchy properties
const isRoot = hierarchyManager.isRootObject("sun");
const hasChildren = hierarchyManager.hasChildren("earth");
const descendantCount = hierarchyManager.getDescendantCount("sun");
```

## Performance Characteristics

| Operation     | Time Complexity | Description                                   |
| ------------- | --------------- | --------------------------------------------- |
| Get Children  | O(1)            | Direct array access                           |
| Get Parent    | O(1)            | Direct property access                        |
| Get Path      | O(1)            | Pre-calculated path                           |
| Get Depth     | O(1)            | Pre-calculated depth                          |
| Add Object    | O(1)            | Direct insertion                              |
| Update Parent | O(k)            | Where k is the number of affected descendants |
| Remove Object | O(k)            | Where k is the number of affected descendants |
| Initialize    | O(n)            | Where n is the total number of objects        |

## Migration from Traditional Hierarchy

### Before (Traditional)

```typescript
// Old inefficient tree traversal (deprecated)
function getChildrenOld(parentId: string): CelestialObject[] {
  const hierarchy = celestialStore.getHierarchy(); // This method no longer exists
  const childIds = hierarchy[parentId] || [];
  const objects = celestialStore.getObjects();
  return childIds.map((id) => objects[id]).filter(Boolean);
}

// Manual depth calculation
function getDepth(objectId: string): number {
  let depth = 0;
  let current = celestialStore.getObject(objectId);
  while (current?.parentId) {
    depth++;
    current = celestialStore.getObject(current.parentId);
  }
  return depth;
}
```

### After (Flat Hierarchy)

```typescript
// Direct access
const children = hierarchyService.getChildren(parentId);
const depth = hierarchyService.getHierarchyState().entries[objectId].depth;
```

## Best Practices

1. **Initialize Once**: Call `initializeFromObjects()` when loading a new system
2. **Use Atomic Operations**: Always use the service methods rather than manual updates
3. **Validate Operations**: Enable validation for critical operations
4. **Subscribe to Changes**: Use the reactive stream for UI updates
5. **Handle Errors**: Always check operation results for success/failure

## Error Handling

All operations return a `HierarchyOperationResult` with success status and error details:

```typescript
const result = hierarchyService.updateParent("moon", "mars");
if (!result.success) {
  console.error("Operation failed:", result.error);
  // Handle error appropriately
}
```

Common error scenarios:

- Object not found
- Cycle detection
- Invalid parent relationships
- Concurrent modification conflicts

## Testing

The service includes comprehensive tests covering:

- Initialization from various object structures
- Adding, updating, and removing objects
- Query operations with different options
- Complex hierarchy scenarios
- Error conditions and edge cases

Run tests with:

```bash
moon run core-state:test
```
