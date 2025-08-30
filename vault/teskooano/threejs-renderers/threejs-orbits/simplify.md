---
name: "simplify"
description: "Path simplification utility using Ramer-Douglas-Peucker algorithm for trail optimization"
package: "@teskooano/renderer-threejs-orbits"
dependencies: ["@teskooano/core-math"]
classes: ["OSVector3"]
functions: ["simplifyPath", "perpendicularDistance"]
constants: []
types: []
---

# simplify

Path simplification utility implementing the Ramer-Douglas-Peucker algorithm for optimizing trail visualization by reducing point density while preserving visual quality.

## 🎯 Purpose

The `simplify` utility provides efficient path simplification for orbital trails and predictions, reducing the number of points in a path while maintaining visual fidelity. This is crucial for performance optimization when rendering long trails with thousands of points.

## 🏗️ Architecture

### Algorithm Implementation

The utility implements the Ramer-Douglas-Peucker algorithm:

```typescript
export function simplifyPath(points: OSVector3[], epsilon: number): OSVector3[];
function perpendicularDistance(
  point: OSVector3,
  lineStart: OSVector3,
  lineEnd: OSVector3,
): number;
```

### Core Components

- **Main Function**: `simplifyPath` - Entry point for path simplification
- **Helper Function**: `perpendicularDistance` - Calculates perpendicular distance from point to line
- **OSVector3 Integration**: Uses the core math library for vector operations

## 🚀 Core Features

### Path Simplification

Reduces point density while preserving visual quality:

```typescript
simplifyPath(points: OSVector3[], epsilon: number): OSVector3[]
```

**Parameters:**

- `points`: Array of OSVector3 points representing the path
- `epsilon`: Tolerance value for simplification (higher = more aggressive)

**Returns:**

- Simplified array of OSVector3 points with reduced density

### Perpendicular Distance Calculation

Calculates the perpendicular distance from a point to a line segment:

```typescript
perpendicularDistance(point: OSVector3, lineStart: OSVector3, lineEnd: OSVector3): number
```

**Purpose:**

- Determines how far a point deviates from a line segment
- Used by the Ramer-Douglas-Peucker algorithm to decide which points to keep
- Ensures visual quality is maintained during simplification

## 🔧 Algorithm Details

### Ramer-Douglas-Peucker Algorithm

The algorithm works by recursively dividing the path:

1. **Find Farthest Point**: Find the point with maximum perpendicular distance from the line segment
2. **Distance Check**: If the distance exceeds epsilon, keep the point and recursively process sub-paths
3. **Simplify**: If the distance is within epsilon, remove intermediate points
4. **Recursion**: Apply the algorithm to the remaining sub-paths

### Mathematical Implementation

```typescript
function perpendicularDistance(
  point: OSVector3,
  lineStart: OSVector3,
  lineEnd: OSVector3,
): number {
  const lineVector = lineEnd.subtract(lineStart);
  const pointVector = point.subtract(lineStart);

  const lineLengthSq = lineVector.lengthSquared();
  if (lineLengthSq === 0) return pointVector.length();

  const t = Math.max(
    0,
    Math.min(1, pointVector.dot(lineVector) / lineLengthSq),
  );
  const projection = lineStart.add(lineVector.multiplyScalar(t));

  return point.subtract(projection).length();
}
```

## 🎨 Simplification Features

### Adaptive Tolerance

Different epsilon values for different use cases:

```typescript
// High quality trails
const highQualityEpsilon = 0.001;

// Medium quality trails
const mediumQualityEpsilon = 0.01;

// Low quality trails (performance optimization)
const lowQualityEpsilon = 0.1;
```

### Quality Preservation

Maintains visual fidelity while reducing point count:

```typescript
// Preserve important features
const simplifiedPoints = simplifyPath(originalPoints, epsilon);

// Verify quality preservation
const qualityRatio = simplifiedPoints.length / originalPoints.length;
const qualityMaintained = qualityRatio > 0.1; // At least 10% of points preserved
```

### Performance Optimization

Efficient implementation for real-time processing:

```typescript
// Early termination for small paths
if (points.length <= 2) return points;

// Optimize for common cases
if (points.length <= 10) return points; // No simplification needed
```

## 📊 Performance Considerations

### Algorithm Complexity

- **Time Complexity**: O(n log n) average case, O(n²) worst case
- **Space Complexity**: O(n) for recursion stack
- **Memory Usage**: Minimal additional memory allocation

### Optimization Strategies

- **Early Termination**: Skip simplification for small paths
- **Efficient Distance Calculation**: Optimized perpendicular distance computation
- **Memory Reuse**: Reuse vectors to minimize allocations

### Quality vs Performance Trade-offs

- **High Epsilon**: Faster processing, lower quality
- **Low Epsilon**: Slower processing, higher quality
- **Adaptive Epsilon**: Balance based on path characteristics

## 🔧 Integration Points

### Trail Manager Integration

```typescript
// In TrailManager for trail simplification
const simplifiedTrail = simplifyPath(
  rawTrailPoints,
  this.qualitySettings.epsilon,
);
```

### Prediction Manager Integration

```typescript
// In PredictionManager for prediction simplification
const simplifiedPrediction = simplifyPath(predictionPoints, predictionEpsilon);
```

### Web Worker Integration

```typescript
// In trail.worker.ts for background processing
self.onmessage = (event) => {
  const { points, epsilon } = event.data;
  const simplified = simplifyPath(points, epsilon);
  self.postMessage({ simplified });
};
```

## 🎯 Usage Examples

### Basic Simplification

```typescript
import { simplifyPath } from "@teskooano/renderer-threejs-orbits";

// Simplify a trail path
const originalPoints = trailManager.getTrailPoints("earth");
const simplifiedPoints = simplifyPath(originalPoints, 0.01);

console.log(
  `Reduced from ${originalPoints.length} to ${simplifiedPoints.length} points`,
);
```

### Quality-based Simplification

```typescript
// Different quality levels
const highQuality = simplifyPath(points, 0.001); // High quality
const mediumQuality = simplifyPath(points, 0.01); // Medium quality
const lowQuality = simplifyPath(points, 0.1); // Low quality (performance)

// Choose based on performance requirements
const finalPoints = performanceMode ? lowQuality : highQuality;
```

### Adaptive Simplification

```typescript
// Adapt epsilon based on path length
function adaptiveSimplify(points: OSVector3[]): OSVector3[] {
  const pathLength = points.length;

  if (pathLength < 100) return points; // No simplification needed
  if (pathLength < 500) return simplifyPath(points, 0.01);
  if (pathLength < 1000) return simplifyPath(points, 0.05);

  return simplifyPath(points, 0.1); // Aggressive simplification
}
```

### Performance Monitoring

```typescript
// Monitor simplification performance
const startTime = performance.now();
const simplified = simplifyPath(points, epsilon);
const endTime = performance.now();

console.log(`Simplification took ${endTime - startTime}ms`);
console.log(`Reduced ${points.length} to ${simplified.length} points`);
console.log(
  `Compression ratio: ${((simplified.length / points.length) * 100).toFixed(1)}%`,
);
```

## 🔍 Debug Features

### Quality Analysis

```typescript
// Analyze simplification quality
function analyzeSimplification(
  original: OSVector3[],
  simplified: OSVector3[],
  epsilon: number,
) {
  const compressionRatio = simplified.length / original.length;
  const maxDeviation = calculateMaxDeviation(original, simplified);

  console.log(`Compression: ${(compressionRatio * 100).toFixed(1)}%`);
  console.log(`Max deviation: ${maxDeviation.toFixed(6)}`);
  console.log(`Epsilon: ${epsilon}`);
  console.log(`Quality maintained: ${maxDeviation <= epsilon}`);
}
```

### Visual Verification

```typescript
// Visual comparison of original vs simplified
function comparePaths(original: OSVector3[], simplified: OSVector3[]) {
  // Render both paths with different colors
  const originalLine = createLine(original, 0xff0000); // Red
  const simplifiedLine = createLine(simplified, 0x00ff00); // Green

  scene.add(originalLine);
  scene.add(simplifiedLine);
}
```

### Performance Profiling

```typescript
// Profile simplification performance
function profileSimplification(points: OSVector3[], epsilons: number[]) {
  epsilons.forEach((epsilon) => {
    const startTime = performance.now();
    const simplified = simplifyPath(points, epsilon);
    const endTime = performance.now();

    console.log(
      `Epsilon ${epsilon}: ${endTime - startTime}ms, ${simplified.length} points`,
    );
  });
}
```

## 🚀 Future Enhancements

### Planned Features

- **GPU Acceleration**: Move simplification to GPU using compute shaders
- **Adaptive Algorithms**: Different algorithms for different path types
- **Real-time Quality Adjustment**: Dynamic epsilon adjustment based on performance

### Optimization Opportunities

- **Parallel Processing**: Multi-threaded simplification for large paths
- **Spatial Indexing**: Advanced spatial partitioning for complex paths
- **Predictive Simplification**: Pre-simplify paths based on expected usage

### Advanced Features

- **Curve-aware Simplification**: Preserve curve characteristics during simplification
- **Temporal Simplification**: Consider time information in simplification decisions
- **Interactive Simplification**: User-controlled simplification parameters
