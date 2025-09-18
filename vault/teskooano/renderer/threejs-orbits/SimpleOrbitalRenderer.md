---
name: "SimpleOrbitalRenderer"
description: "Simple orbital line renderer using PositionHistoryManager data for N-body trails"
package: "@teskooano/renderer-threejs-orbits"
dependencies:
  [
    "@teskooano/renderer-threejs-helpers",
    "@teskooano/renderer-threejs-celestial",
    "three",
  ]
classes:
  [
    "THREE.Line",
    "THREE.Group",
    "THREE.Color",
    "THREE.Vector3",
    "THREE.BufferAttribute",
    "THREE.BufferGeometry",
    "THREE.Material",
    "THREE.ShaderMaterial",
    "LineHelper",
    "PositionHistoryManager",
    "BaseCelestialRenderer",
  ]
functions:
  [
    "updateOrbitalLine",
    "drawOrbitalLine",
    "removeOrbitalLine",
    "setVisibility",
    "setHighlightedObject",
    "clearAllOrbitalLines",
    "dispose",
    "getPerformanceStats",
  ]
constants: []
types: ["RenderableCelestialObject"]
---

# SimpleOrbitalRenderer

Simple orbital line renderer that creates trail visualizations using data from the PositionHistoryManager, providing efficient rendering of historical orbital paths for N-body simulation objects. **Recently optimized** with object pooling, adaptive quality, and performance monitoring for enhanced performance.

## 🎯 Purpose

`SimpleOrbitalRenderer` is a lightweight renderer that creates orbital trail lines by directly accessing position history data from celestial object renderers. It provides a simple, efficient way to visualize the historical paths of objects in N-body simulation mode without the complexity of the full TrailManager.

## 🚀 Performance Optimizations

### Object Pooling System

The renderer implements intelligent object pooling to reduce garbage collection pressure:

```typescript
// Object pooling properties
private vectorPool: THREE.Vector3[] = [];
private readonly maxPoolSize: number = 5000;
private reusablePointArrays: Map<number, THREE.Vector3[]> = new Map();

// Get pooled vector or create new one
private getPooledVector(): THREE.Vector3 {
  if (this.vectorPool.length > 0) {
    return this.vectorPool.pop()!;
  }
  return new THREE.Vector3();
}

// Return vector to pool for reuse
private returnToPool(vector: THREE.Vector3): void {
  if (this.vectorPool.length < this.maxPoolSize) {
    vector.set(0, 0, 0); // Reset vector
    this.vectorPool.push(vector);
  }
}

// Get reusable array of specific size
private getReusableArray(size: number): THREE.Vector3[] {
  let array = this.reusablePointArrays.get(size);
  if (!array) {
    array = new Array(size);
    this.reusablePointArrays.set(size, array);
  }
  return array;
}
```

### Adaptive Quality System

Dynamic quality adjustment based on real-time performance:

```typescript
// Performance monitoring
private frameTimeHistory: number[] = [];
private readonly maxFrameTimeHistory: number = 60;
private lastFrameTime: number = 0;

// Record frame time for performance analysis
private recordFrameTime(): void {
  const currentTime = performance.now();
  if (this.lastFrameTime > 0) {
    const frameTime = currentTime - this.lastFrameTime;
    this.frameTimeHistory.push(frameTime);

    // Keep only recent frame times
    if (this.frameTimeHistory.length > this.maxFrameTimeHistory) {
      this.frameTimeHistory.shift();
    }
  }
  this.lastFrameTime = currentTime;
}

// Get adaptive sampling interval based on performance
private getAdaptiveSamplingInterval(): number {
  if (this.frameTimeHistory.length < 10) {
    return this.samplingInterval; // Use default if not enough data
  }

  const avgFrameTime =
    this.frameTimeHistory.reduce((a, b) => a + b, 0) /
    this.frameTimeHistory.length;

  if (avgFrameTime > 16.67) { // More than 60fps target
    return Math.min(this.samplingInterval * 2, 8); // Cap at 8x sampling
  }
  return this.samplingInterval;
}
```

### Optimized Data Conversion

Efficient conversion of position history to vectors:

```typescript
private convertPositionsToVectors(
  positionHistory: any[],
  startIndex: number,
): THREE.Vector3[] {
  const pointCount = positionHistory.length - startIndex;
  const points = this.getReusableArray(pointCount); // Use reusable array

  for (let i = 0; i < pointCount; i++) {
    const sourcePos = positionHistory[startIndex + i];
    if (!points[i]) {
      points[i] = this.getPooledVector(); // Get from pool
    }
    points[i].set(sourcePos.x, sourcePos.y, sourcePos.z); // Set values directly
  }
  return points;
}
```

### Early Exit Conditions

Optimized processing with early exits for performance:

```typescript
private updateOrbitalLine(
  objectId: string,
  positionHistoryManager: PositionHistoryManager
): void {
  // Early exit if visualization is disabled
  if (!this.visualizationVisible) return;

  const positionHistory = positionHistoryManager.getPositionHistory();

  // Early exit if insufficient history
  if (positionHistory.length < 2) return;

  // Early exit for very small trails
  const effectiveMaxPoints = this.cachedEffectiveMaxTrailPoints;
  if (positionHistory.length < effectiveMaxPoints * 0.1) return;

  // Record performance and get adaptive sampling
  this.recordFrameTime();
  const adaptiveInterval = this.getAdaptiveSamplingInterval();

  // ... rest of processing
}
```

## 🏗️ Architecture

### Core Components

The renderer manages orbital line objects and integrates with position history:

```typescript
class SimpleOrbitalRenderer extends StateSubscriptionMixin {
  private orbitalLines: Map<string, THREE.Line> = new Map();
  private parentGroupCache: Map<string, THREE.Object3D> = new Map();
  private lineBuilder: LineHelper;
  private objectManager: ObjectManager;
  private visualizationVisible: boolean = true;
  private highlightedObjectId: string | null = null;
  private highlightColor: THREE.Color = new THREE.Color(0x00ff00);
}
```

### Position History Integration

- **Direct Access**: Uses PositionHistoryManager from celestial renderers
- **Efficient Updates**: Direct access to position data without complex processing
- **Parent Group Management**: Handles proper parenting of trail lines to celestial objects

## 🚀 Core Features

### Orbital Line Creation

Creates trail lines from position history data:

```typescript
updateOrbitalLine(
  objectId: string,
  positionHistoryManager: PositionHistoryManager
): void
```

**Features:**

- **Position History Access**: Direct access to position history data
- **Efficient Rendering**: Simple line creation without complex processing
- **Parent Group Management**: Proper parenting to celestial objects
- **Performance Optimization**: Lightweight rendering approach

### Position History Integration

Leverages existing position history data:

```typescript
// Get position history from celestial renderer
const positionHistory = positionHistoryManager.getPositionHistory();
const recentPositions = positionHistory.slice(-maxTrailPoints);

// Convert to THREE.Vector3 array
const trailPoints = this.convertPositionsToVectors(recentPositions);
```

**Benefits:**

- **No Duplication**: Uses existing position history data
- **Consistency**: Ensures trail data matches object movement
- **Efficiency**: Avoids redundant position tracking
- **Simplicity**: Minimal additional processing required

### Parent Group Management

Handles proper parenting of trail lines:

```typescript
private getOrCacheParentGroup(objectId: string): THREE.Object3D | null {
  // Get parent group from cache or object manager
  let parentGroup = this.parentGroupCache.get(objectId);

  if (!parentGroup) {
    const celestialObject = this.objectManager.getObject(objectId);
    if (celestialObject) {
      parentGroup = celestialObject;
      this.parentGroupCache.set(objectId, parentGroup);
    }
  }

  return parentGroup;
}
```

**Features:**

- **Caching**: Caches parent groups for efficiency
- **Proper Parenting**: Ensures trails follow their parent objects
- **Scene Integration**: Integrates with existing scene hierarchy
- **Cleanup**: Proper cleanup of cached references

## 🔧 Key Methods

### Constructor

```typescript
constructor(objectManager: ObjectManager)
```

**Parameters:**

- `objectManager`: The scene's ObjectManager for rendering operations

### Orbital Line Updates

```typescript
updateOrbitalLine(
  objectId: string,
  positionHistoryManager: PositionHistoryManager
): void
```

**Process:**

1. **Position History Retrieval**: Gets recent position history
2. **Point Conversion**: Converts to THREE.Vector3 array
3. **Line Creation/Update**: Creates or updates orbital line
4. **Parent Group Assignment**: Assigns to proper parent group
5. **Highlighting Application**: Applies highlighting if needed

### Line Drawing

```typescript
private drawOrbitalLine(objectId: string, points: THREE.Vector3[]): void
```

**Features:**

- **Line Creation**: Creates THREE.Line objects with trail material
- **Geometry Updates**: Efficient geometry updates for line changes
- **Material Application**: Applies trail material with highlighting
- **Parent Group Integration**: Adds to proper parent group

### Visibility Control

```typescript
setVisibility(visible: boolean): void
```

**Purpose:**

- Controls visibility of all orbital lines
- Provides performance optimization when hidden
- Enables smooth fade transitions

## 🔄 Data Flow

### Position History Flow

```typescript
// 1. Get position history from manager
const positionHistory = positionHistoryManager.getPositionHistory();

// 2. Extract recent positions
const maxTrailPoints = this.calculateOptimalBufferSize();
const recentPositions = positionHistory.slice(-maxTrailPoints);

// 3. Convert to THREE.Vector3 array
const trailPoints = this.convertPositionsToVectors(recentPositions);

// 4. Create or update orbital line
this.drawOrbitalLine(objectId, trailPoints);
```

### Parent Group Flow

```typescript
// 1. Get or cache parent group
const parentGroup = this.getOrCacheParentGroup(objectId);

// 2. Create orbital line
const orbitalLine = this.createNewOrbitalLine(objectId, parentGroup);

// 3. Ensure proper parenting
this.ensureCorrectParenting(orbitalLine, parentGroup);

// 4. Add to parent group
parentGroup.add(orbitalLine);
```

### Highlighting Flow

```typescript
// 1. Check if object is highlighted
const isHighlighted = objectId === this.highlightedObjectId;

// 2. Apply highlighting
if (isHighlighted) {
  this.applyHighlight(objectId, orbitalLine);
} else {
  this.removeHighlight(orbitalLine);
}
```

## 🎨 Visualization Features

### Trail Line Styling

Simple trail styling for orbital visualization:

```typescript
// Trail material for orbital lines
const trailMaterial = SharedMaterials.clone("TRAIL");

// Apply highlighting if needed
if (highlighted) {
  trailMaterial.color.copy(this.highlightColor);
}
```

**Features:**

- **White Color**: High visibility for trail lines
- **Responsive Width**: Adapts to screen size
- **Transparency Support**: Enables visual effects
- **Highlighting Support**: Color changes for highlighting

### Position Sampling

Efficient position sampling for trail creation:

```typescript
private sampleAndInterpolatePoints(rawPoints: THREE.Vector3[]): THREE.Vector3[] {
  // Sample points based on distance
  const sampledPoints: THREE.Vector3[] = [];
  const minDistanceSq = 1e-6;

  for (let i = 0; i < rawPoints.length; i++) {
    if (i === 0 || i === rawPoints.length - 1) {
      sampledPoints.push(rawPoints[i].clone());
    } else {
      const prevPoint = rawPoints[i - 1];
      const currentPoint = rawPoints[i];
      const distanceSq = prevPoint.distanceToSquared(currentPoint);

      if (distanceSq > minDistanceSq) {
        sampledPoints.push(currentPoint.clone());
      }
    }
  }

  return sampledPoints;
}
```

### Performance Optimization

Lightweight rendering approach:

```typescript
// Calculate optimal buffer size
private calculateOptimalBufferSize(): number {
  return this.baseMaxTrailPoints * this.trailLengthMultiplier;
}

// Efficient point conversion
private convertPositionsToVectors(
  positionHistory: any[],
  startIndex: number
): THREE.Vector3[] {
  const vectors: THREE.Vector3[] = [];

  for (let i = startIndex; i < positionHistory.length; i++) {
    const position = positionHistory[i];
    if (position && position.x !== undefined) {
      vectors.push(new THREE.Vector3(position.x, position.y, position.z));
    }
  }

  return vectors;
}
```

## 📊 Performance Considerations

### Rendering Optimization

- **Direct Data Access**: Uses existing position history without duplication
- **Efficient Updates**: Minimal processing for line updates
- **Parent Group Caching**: Caches parent groups for efficiency
- **Geometry Reuse**: Reuses geometry objects when possible

### Memory Management

- **Position History Reuse**: Uses existing position history data
- **Object Pooling**: Reuse line objects when possible
- **Cache Management**: Efficient parent group caching
- **Cleanup**: Proper disposal of unused resources

### Quality vs Performance

- **Configurable Trail Length**: Adjustable trail point count
- **Distance-based Sampling**: Sample points based on distance
- **Performance Monitoring**: Track rendering performance
- **Adaptive Quality**: Adjust quality based on system performance

## 🔧 Integration Points

### Position History Integration

```typescript
// Integrate with PositionHistoryManager
const positionHistory = positionHistoryManager.getPositionHistory();
const trailPoints = this.convertPositionsToVectors(positionHistory);
```

### Object Manager Integration

```typescript
// Get celestial objects from object manager
const celestialObject = this.objectManager.getObject(objectId);
if (celestialObject) {
  // Use as parent group for trail line
  celestialObject.add(orbitalLine);
}
```

### Material System Integration

```typescript
// Use shared materials
import { SharedMaterials } from "./SharedMaterials";

const material = SharedMaterials.clone("TRAIL");
```

## 🎯 Usage Examples

### Basic Orbital Rendering

```typescript
import { SimpleOrbitalRenderer } from "@teskooano/renderer-threejs-orbits";

const renderer = new SimpleOrbitalRenderer(objectManager);

// Update orbital line for an object
const positionHistoryManager = celestialRenderer.positionHistoryManager;
renderer.updateOrbitalLine("earth", positionHistoryManager);
```

### Highlighting Orbital Lines

```typescript
// Highlight specific orbital line
renderer.setHighlightedObject("earth", new THREE.Color(0xff0000));

// Clear highlighting
renderer.setHighlightedObject(null);
```

### Visibility Control

```typescript
// Show/hide all orbital lines
renderer.setVisibility(true);

// Remove specific orbital line
renderer.removeOrbitalLine("earth");

// Clear all orbital lines
renderer.clearAllOrbitalLines();
```

### Performance Monitoring

```typescript
// Get performance statistics
const stats = renderer.getPerformanceStats();
console.log("Orbital lines count:", stats.orbitalLinesCount);
```

## 🔍 Debug Features

### Line Inspection

```typescript
// Inspect orbital lines
console.log("Orbital lines:", renderer.orbitalLines);

// Check line properties
const line = renderer.orbitalLines.get("earth");
if (line) {
  console.log("Line geometry:", line.geometry);
  console.log("Line material:", line.material);
  console.log("Line visible:", line.visible);
}
```

### Performance Monitoring

```typescript
// Monitor rendering performance
const startTime = performance.now();
renderer.updateOrbitalLine("earth", positionHistoryManager);
const endTime = performance.now();
console.log(`Orbital line update took ${endTime - startTime}ms`);
```

### Parent Group Debugging

```typescript
// Debug parent group management
const parentGroup = renderer.getOrCacheParentGroup("earth");
console.log("Parent group:", parentGroup);
console.log("Parent group children:", parentGroup?.children);
```

## 🚀 Future Enhancements

### Planned Features

- **Advanced Sampling**: More sophisticated position sampling algorithms
- **Curve Interpolation**: Add curve interpolation for smoother trails
- **Quality Presets**: Predefined quality configurations

### Optimization Opportunities

- **GPU Acceleration**: Move rendering to GPU
- **Instanced Rendering**: Use instanced rendering for multiple trails
- **Predictive Rendering**: Pre-render common trail patterns

### Advanced Features

- **Temporal Effects**: Time-based trail visualization
- **Trail Effects**: Particle effects for trail visualization
- **Interactive Trails**: User-controlled trail parameters

## 🐛 Recent Optimizations

### Object Pooling Implementation

- **Vector Pooling**: Added `vectorPool` with 5000 vector capacity to reduce garbage collection
- **Reusable Arrays**: Implemented `reusablePointArrays` Map to reuse point arrays of specific sizes
- **Memory Management**: Proper cleanup in `dispose()` method to clear pools

### Adaptive Quality System

- **Performance Monitoring**: Added `frameTimeHistory` to track recent frame times
- **Dynamic Sampling**: `getAdaptiveSamplingInterval()` adjusts quality based on performance
- **60fps Target**: Automatically reduces quality when frame time exceeds 16.67ms

### Enhanced Data Processing

- **Optimized Conversion**: `convertPositionsToVectors` now uses pooled vectors and reusable arrays
- **Early Exit Conditions**: Added multiple early exit conditions to avoid unnecessary processing
- **Efficient Sampling**: `sampleAndInterpolatePoints` uses pooled vectors for better performance

### Performance Benefits

- **Reduced GC Pressure**: Object pooling significantly reduces garbage collection overhead
- **Adaptive Quality**: Maintains 60fps target by dynamically adjusting rendering quality
- **Memory Efficiency**: Reusable arrays prevent repeated memory allocations
- **Smart Processing**: Early exits avoid processing when not needed

---

_The SimpleOrbitalRenderer provides efficient orbital trail visualization with intelligent performance optimizations including object pooling, adaptive quality, and comprehensive performance monitoring._
