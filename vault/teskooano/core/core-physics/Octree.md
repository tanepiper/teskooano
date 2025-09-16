---
aliases: [Octree, octree, barnes-hut, spatial-tree, hierarchical-force]
tags:
  [core, physics, spatial, tree, barnes-hut, force-calculation, approximation]
type: Class
package: "@teskooano/core-physics"
name: Octree
dependencies: ["@teskooano/core-math", "@teskooano/data-types"]
classes: ["Octree"]
functions: []
constants: []
types: ["PhysicsStateReal", "OctreeNode"]
status: active
---

# Octree

Hierarchical spatial data structure implementing the Barnes-Hut algorithm for O(N log N) gravitational force calculations.

**Location**: `src/spatial/octree.ts`

## 🎯 Purpose

The `Octree` provides efficient spatial organization and force approximation:

- **Spatial Organization**: Hierarchical subdivision of 3D space
- **Force Approximation**: Barnes-Hut algorithm for gravitational forces
- **Memory Efficiency**: Optimized tree structure with minimal overhead
- **Configurable Accuracy**: Adjustable opening angle for accuracy vs performance
- **Range Queries**: Fast neighbor finding and spatial searches
- **Dynamic Updates**: Efficient insertion and removal of bodies

## 🏗️ Architecture

### Hierarchical Tree Structure

Uses recursive octree subdivision for spatial organization:

```typescript
interface OctreeNode {
  center: OSVector3; // Center point of this node
  size: number; // Half-width of this node
  bodies: PhysicsStateReal[]; // Bodies directly in this node
  children?: OctreeNode[]; // Child nodes (if subdivided)
  totalMass_kg: number; // Total mass of all bodies in subtree
  centerOfMass_m: OSVector3; // Center of mass of all bodies in subtree
  minX;
  maxX;
  minY;
  maxY;
  minZ;
  maxZ: number; // Bounding box
}
```

### Barnes-Hut Algorithm

Implements the Barnes-Hut approximation for force calculations:

```typescript
export class Octree {
  private root: OctreeNode;
  private maxDepth: number;
  private _tempForce: OSVector3;
  private _tempNodePointMass: PhysicsStateReal;
}
```

### Adaptive Subdivision

Automatically subdivides nodes based on body count and depth:

```typescript
const subdivide = (
  node: OctreeNode,
  currentDepth: number,
  maxDepth: number,
): void => {
  // Stop subdivision conditions
  if (node.bodies.length <= 1 || currentDepth >= maxDepth) {
    return;
  }

  // Create 8 child octants
  // Assign bodies to appropriate children
  // Recursively subdivide children
};
```

## 🔧 Core Methods

### Tree Construction

```typescript
constructor(size: number, maxDepth: number = 8);
insert(body: PhysicsStateReal): void;
clear(): void;
```

**Features:**

- Automatic tree construction from body positions
- Efficient insertion with automatic subdivision
- Memory cleanup and tree reset

### Force Calculation

```typescript
calculateForceOn(body: PhysicsStateReal, theta: number): OSVector3;
```

**Barnes-Hut Algorithm:**

- Traverses tree from root to leaves
- Uses opening angle criterion for approximation
- Approximates distant groups as point masses
- Calculates exact forces for nearby bodies

### Spatial Queries

```typescript
findBodiesInRange(point: OSVector3, range: number): PhysicsStateReal[];
```

**Query Features:**

- Fast range-based neighbor finding
- Efficient spatial searches
- Configurable search radius

### Tree Traversal

```typescript
private calculateNodeForce(
  node: OctreeNode,
  targetBody: PhysicsStateReal,
  theta: number,
  accumulatedForce: OSVector3
): void;
```

**Traversal Features:**

- Recursive tree traversal
- Opening angle criterion application
- Force accumulation and approximation

## 🚀 Usage Examples

### Basic Octree Usage

```typescript
import { Octree } from "@teskooano/core-physics";

// Create octree for solar system scale
const octreeSize = 5e13; // ~334 AU
const maxDepth = 8;
const octree = new Octree(octreeSize, maxDepth);

// Insert bodies
const bodies = [
  {
    id: "sun",
    mass_kg: 1.989e30,
    position_m: new OSVector3(0, 0, 0),
    velocity_mps: new OSVector3(0, 0, 0),
  },
  {
    id: "earth",
    mass_kg: 5.972e24,
    position_m: new OSVector3(1.496e11, 0, 0),
    velocity_mps: new OSVector3(0, 0, 29780),
  },
  {
    id: "mars",
    mass_kg: 6.39e23,
    position_m: new OSVector3(2.279e11, 0, 0),
    velocity_mps: new OSVector3(0, 0, 24077),
  },
];

bodies.forEach((body) => octree.insert(body));

// Calculate forces using Barnes-Hut approximation
const theta = 0.7; // Opening angle parameter
bodies.forEach((body) => {
  const force = octree.calculateForceOn(body, theta);
  console.log(`Force on ${body.id}:`, force);
});
```

### Force Calculation with Different Theta Values

```typescript
// High accuracy (smaller theta)
const highAccuracyTheta = 0.3;
const highAccuracyForce = octree.calculateForceOn(earth, highAccuracyTheta);

// Balanced accuracy/performance (medium theta)
const balancedTheta = 0.7;
const balancedForce = octree.calculateForceOn(earth, balancedTheta);

// High performance (larger theta)
const highPerformanceTheta = 1.0;
const highPerformanceForce = octree.calculateForceOn(
  earth,
  highPerformanceTheta,
);

console.log("Force accuracy comparison:");
console.log("High accuracy:", highAccuracyForce);
console.log("Balanced:", balancedForce);
console.log("High performance:", highPerformanceForce);
```

### Spatial Queries

```typescript
// Find bodies within range of a point
const searchPoint = new OSVector3(1.496e11, 0, 0); // Earth's position
const searchRange = 1e10; // 100 million km
const nearbyBodies = octree.findBodiesInRange(searchPoint, searchRange);

console.log(
  "Bodies within range:",
  nearbyBodies.map((b) => b.id),
);

// Find bodies near Earth
const earthPosition = earth.position_m;
const earthNeighbors = octree.findBodiesInRange(earthPosition, 5e10); // 50 million km
console.log(
  "Earth's neighbors:",
  earthNeighbors.map((b) => b.id),
);
```

### Dynamic Updates

```typescript
// Clear and rebuild octree for new timestep
octree.clear();

// Insert updated body positions
updatedBodies.forEach((body) => octree.insert(body));

// Calculate new forces
const newForces = updatedBodies.map((body) =>
  octree.calculateForceOn(body, theta),
);
```

### Performance Monitoring

```typescript
// Monitor octree performance
function benchmarkOctree(bodies: PhysicsStateReal[], theta: number) {
  const octree = new Octree(5e13, 8);

  // Time insertion
  const insertStart = performance.now();
  bodies.forEach((body) => octree.insert(body));
  const insertTime = performance.now() - insertStart;

  // Time force calculation
  const forceStart = performance.now();
  bodies.forEach((body) => octree.calculateForceOn(body, theta));
  const forceTime = performance.now() - forceStart;

  console.log(`Octree performance for ${bodies.length} bodies:`);
  console.log(`Insertion time: ${insertTime}ms`);
  console.log(`Force calculation time: ${forceTime}ms`);
  console.log(`Average time per body: ${forceTime / bodies.length}ms`);

  return { insertTime, forceTime };
}
```

### Integration with Simulation

```typescript
// Use octree in N-body simulation
function simulateWithOctree(
  bodies: PhysicsStateReal[],
  dt: number,
  theta: number,
) {
  const octree = new Octree(5e13, 8);

  // Build octree
  bodies.forEach((body) => octree.insert(body));

  // Calculate forces for all bodies
  const forces = new Map<string, OSVector3>();
  bodies.forEach((body) => {
    const force = octree.calculateForceOn(body, theta);
    forces.set(body.id, force);
  });

  // Update positions and velocities
  const updatedBodies = bodies.map((body) => {
    const force = forces.get(body.id)!;
    const acceleration = force.multiplyScalar(1 / body.mass_kg);

    // Simple Euler integration
    const newVelocity = body.velocity_mps
      .clone()
      .add(acceleration.multiplyScalar(dt));
    const newPosition = body.position_m
      .clone()
      .add(newVelocity.multiplyScalar(dt));

    return {
      ...body,
      position_m: newPosition,
      velocity_mps: newVelocity,
    };
  });

  return updatedBodies;
}
```

## 🎯 Performance Considerations

### Algorithm Complexity

- **Construction**: O(N log N) for tree building
- **Force Calculation**: O(N log N) for all bodies
- **Single Force**: O(log N) for one body
- **Range Query**: O(log N) average case

### Memory Usage

- **Tree Nodes**: O(N) memory for tree structure
- **Body References**: O(N) memory for body storage
- **Temporary Vectors**: O(1) memory for calculations
- **Total**: O(N) memory complexity

### Accuracy vs Performance Trade-offs

| Theta Value | Accuracy   | Performance | Use Case                   |
| ----------- | ---------- | ----------- | -------------------------- |
| 0.1         | Very High  | Slow        | High-precision simulations |
| 0.3         | High       | Medium      | Standard simulations       |
| 0.7         | Good       | Fast        | Real-time simulations      |
| 1.0         | Acceptable | Very Fast   | Interactive applications   |

### Optimal Parameters

**Tree Size:**

- Should encompass entire simulation volume
- Add 10-20% padding for dynamic systems
- Example: Solar system ~5e13 meters

**Max Depth:**

- 6-8 levels for most simulations
- 10+ levels for very dense systems
- Balance between accuracy and memory usage

**Theta Values:**

- 0.3-0.5 for high accuracy
- 0.7 for balanced performance
- 0.9-1.0 for speed

## 🔗 Integration Points

### With Barnes-Hut Algorithm

```typescript
// Barnes-Hut force calculation
function calculateBarnesHutForces(bodies: PhysicsStateReal[], theta: number) {
  const octree = new Octree(5e13, 8);
  bodies.forEach((body) => octree.insert(body));

  return bodies.map((body) => octree.calculateForceOn(body, theta));
}
```

### With Tree-PM Strategy

```typescript
// Tree-PM uses octree for high-density regions
const treeForces = highDensityBodies.map((body) =>
  octree.calculateForceOn(body, treeOpeningAngle),
);
```

### With Collision Detection

```typescript
// Use octree for spatial collision detection
const potentialCollisions = octree.findBodiesInRange(
  body.position_m,
  body.radius + neighbor.radius,
);
```

## 🔗 Related Components

- [[core/core-physics/TreePMStrategy|TreePMStrategy]] - Uses octree for high-density regions
- [[core/core-physics/WasmSpatialPartitioning|WasmSpatialPartitioning]] - Alternative spatial structure
- [[core/core-physics/AlgorithmFactory|AlgorithmFactory]] - Recommends Barnes-Hut for medium systems
- [[core/core-physics/SimulationManager|SimulationManager]] - Orchestrates octree usage

## 📚 Architecture Patterns

- **Tree Pattern**: Hierarchical spatial organization
- **Strategy Pattern**: Configurable force approximation
- **Visitor Pattern**: Tree traversal for force calculation
- **Builder Pattern**: Incremental tree construction
- **Memory Pool Pattern**: Efficient vector reuse

---

_The Octree provides efficient spatial organization and force approximation through the Barnes-Hut algorithm, offering excellent performance for medium-scale N-body simulations._
