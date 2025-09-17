---
aliases:
  [
    calculateLightSourceMaps,
    light-source-maps,
    hierarchy-calculation,
    stellar-lighting,
  ]
tags: [renderer, threejs, lighting, utility, hierarchy, stellar, calculation]
type: Function
package: "@teskooano/renderer-threejs-lighting"
name: calculateLightSourceMaps
dependencies: ["@teskooano/data-types"]
classes: []
functions: []
constants: []
types: ["CelestialObject", "CelestialType", "StellarType"]
status: active
---

# calculateLightSourceMaps

A utility function that traverses the celestial hierarchy to determine the primary light source for every object in a star system, providing the foundation for realistic multi-star lighting.

## 🎯 Purpose

The `calculateLightSourceMaps` function analyzes the celestial object hierarchy to build a comprehensive map of which star illuminates each object. This is a crucial pre-rendering step that determines the lighting relationships in complex multi-star systems, handling binary stars, multiple star systems, and hierarchical celestial relationships.

## 🏗️ Architecture

### Core Algorithm

- **Hierarchy Traversal**: Recursively walks up the parent chain from each object
- **Star Identification**: Identifies stars as light sources (excluding black holes)
- **Circular Dependency Detection**: Prevents infinite loops in complex systems
- **Memoization**: Caches results to avoid redundant calculations

### Function Signature

```typescript
function calculateLightSourceMaps(
  objects: Record<string, CelestialObject>,
): Record<string, string | undefined>;
```

## 🔧 Core Logic

### Star Identification

```typescript
if (obj.type === CelestialType.STAR) {
  const starProps = obj.properties as any;
  const isBlackHole = starProps?.stellarType === StellarType.BLACK_HOLE;

  if (!isBlackHole) {
    lightSourceMap[id] = id; // Star illuminates itself
    return id;
  } else {
    lightSourceMap[id] = undefined; // Black holes are not light sources
    return undefined;
  }
}
```

- **Star Detection**: Identifies objects of type `CelestialType.STAR`
- **Black Hole Exclusion**: Black holes are explicitly excluded as light sources
- **Self-Illumination**: Stars are their own primary light sources

### Hierarchy Traversal

```typescript
const determineLightSource = (
  id: string,
  visited: Set<string> = new Set(),
): string | undefined => {
  // Return from cache if already computed
  if (id in lightSourceMap) return lightSourceMap[id];

  // Detect circular dependency
  if (visited.has(id)) {
    console.warn(
      `[LightSourceMap] Circular dependency detected involving object ${id}`,
    );
    lightSourceMap[id] = undefined;
    return undefined;
  }

  const obj = objects[id];
  if (!obj) {
    lightSourceMap[id] = undefined;
    return undefined;
  }

  // No parent, so no light source in this hierarchy
  if (!obj.parentId) {
    lightSourceMap[id] = undefined;
    return undefined;
  }

  // Recursively find the parent's light source
  const newVisited = new Set(visited);
  newVisited.add(id);
  lightSourceMap[id] = determineLightSource(obj.parentId, newVisited);
  return lightSourceMap[id];
};
```

- **Recursive Search**: Walks up parent chain until finding a star
- **Circular Detection**: Prevents infinite loops with visited set
- **Caching**: Memoizes results for efficiency
- **Error Handling**: Graceful handling of missing objects

## 🚀 Usage Example

```typescript
// Calculate light source relationships for a star system
const celestialObjects = {
  sun: {
    id: "sun",
    type: CelestialType.STAR,
    parentId: null,
    properties: { stellarType: StellarType.MAIN_SEQUENCE },
  },
  earth: { id: "earth", type: CelestialType.PLANET, parentId: "sun" },
  moon: { id: "moon", type: CelestialType.MOON, parentId: "earth" },
  "binary-star": {
    id: "binary-star",
    type: CelestialType.STAR,
    parentId: null,
    properties: { stellarType: StellarType.MAIN_SEQUENCE },
  },
  "binary-planet": {
    id: "binary-planet",
    type: CelestialType.PLANET,
    parentId: "binary-star",
  },
};

const lightSourceMap = calculateLightSourceMaps(celestialObjects);

// Result:
// {
//   "sun": "sun",           // Sun illuminates itself
//   "earth": "sun",         // Earth is illuminated by the sun
//   "moon": "sun",          // Moon is illuminated by the sun (via earth's parent)
//   "binary-star": "binary-star",     // Binary star illuminates itself
//   "binary-planet": "binary-star"    // Binary planet is illuminated by binary star
// }
```

## 🎨 Multi-Star System Support

### Binary Star Systems

```typescript
// Binary star system example
const binarySystem = {
  "primary-star": {
    id: "primary-star",
    type: CelestialType.STAR,
    parentId: null,
  },
  "secondary-star": {
    id: "secondary-star",
    type: CelestialType.STAR,
    parentId: "primary-star",
  },
  "planet-a": {
    id: "planet-a",
    type: CelestialType.PLANET,
    parentId: "primary-star",
  },
  "planet-b": {
    id: "planet-b",
    type: CelestialType.PLANET,
    parentId: "secondary-star",
  },
};

// Result: Each planet is illuminated by its respective star
// {
//   "primary-star": "primary-star",
//   "secondary-star": "primary-star",  // Secondary star illuminated by primary
//   "planet-a": "primary-star",
//   "planet-b": "primary-star"         // Via secondary star's parent
// }
```

### Complex Hierarchies

- **Tertiary Stars**: Handles three or more star systems
- **Nested Systems**: Supports complex hierarchical relationships
- **Mixed Systems**: Combines stars, planets, moons, and other objects

## 🔍 Error Handling

### Circular Dependencies

```typescript
// Detects and handles circular references
if (visited.has(id)) {
  console.warn(
    `[LightSourceMap] Circular dependency detected involving object ${id}`,
  );
  lightSourceMap[id] = undefined;
  return undefined;
}
```

- **Detection**: Identifies circular parent-child relationships
- **Warning**: Logs circular dependency warnings
- **Recovery**: Sets undefined light source for problematic objects

### Missing Objects

```typescript
const obj = objects[id];
if (!obj) {
  lightSourceMap[id] = undefined;
  return undefined;
}
```

- **Graceful Handling**: Returns undefined for missing objects
- **Caching**: Caches undefined results to avoid repeated lookups
- **Robustness**: Continues processing other objects

## 🎯 Performance Considerations

### Memoization

- **Result Caching**: Stores computed light sources in map
- **Efficient Lookups**: O(1) access to previously computed results
- **Memory Efficiency**: Single map stores all relationships

### Recursion Optimization

- **Depth Limiting**: Visited set prevents infinite recursion
- **Early Termination**: Returns cached results when available
- **Efficient Traversal**: Minimal object lookups per calculation

### Algorithm Complexity

- **Time Complexity**: O(n) where n is number of objects
- **Space Complexity**: O(n) for result map and visited set
- **Cache Efficiency**: Each object computed exactly once

## 🔧 Integration Points

### Pre-Rendering Phase

- **State Analysis**: Operates on raw celestial object data
- **Hierarchy Processing**: Determines lighting relationships before rendering
- **Map Generation**: Provides light source map for renderer use

### Renderer Integration

- **Primary Light Source**: Each object gets its primary light source ID
- **Shader Data**: Light source information passed to shaders
- **Dynamic Updates**: Recalculated when system hierarchy changes

## 📚 Related Components

- **[[LightingManager]]** - Uses light source maps for scene lighting
- **[[LightSourceComponent]]** - Creates lights for identified light sources
- **[[threejs-objects]]** - Provides celestial object data
- **[[core/core-state/core-state|Core State]]** - Source of celestial object hierarchy

## 🏛️ Architecture Patterns

- **Utility Pattern**: Pure function with no side effects
- **Memoization Pattern**: Caches results for efficiency
- **Recursion Pattern**: Hierarchical traversal of object relationships
- **Map Pattern**: Returns structured mapping of relationships
- **Error Handling Pattern**: Graceful handling of edge cases

---

_The calculateLightSourceMaps function provides the essential foundation for realistic multi-star lighting by determining which star illuminates each celestial object in complex hierarchical systems._
