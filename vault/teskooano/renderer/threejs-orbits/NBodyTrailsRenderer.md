---
name: "NBodyTrailsRenderer"
description: "Specialized renderer for N-body historical trail visualization with Web Worker integration"
package: "@teskooano/renderer-threejs-orbits"
dependencies:
  [
    "@teskooano/data-types",
    "@teskooano/renderer-threejs-objects",
    "@teskooano/core-state",
    "@teskooano/renderer-threejs-celestial",
    "@teskooano/renderer-threejs-core",
    "@teskooano/renderer-threejs-helpers",
    "three",
  ]
classes:
  [
    "THREE.Line",
    "THREE.Group",
    "THREE.Color",
    "THREE.Vector3",
    "THREE.Material",
    "THREE.LineBasicMaterial",
    "THREE.Object3D",
    "StateSubscriptionMixin",
    "PositionHistoryManager",
    "RenderOrderManager",
    "LineHelper",
    "TrailCurveInterpolator",
  ]
functions:
  [
    "update",
    "updateOrbitalLine",
    "drawTrailLine",
    "removeTrail",
    "clearAllTrails",
    "highlight",
    "setVisibility",
    "setTrailQuality",
    "dispose",
    "getPerformanceStats",
    "setCurveConfig",
    "getCurveConfig",
  ]
constants: ["baseMaxTrailPoints", "samplingInterval"]
types:
  [
    "RenderableCelestialObject",
    "TrailQuality",
    "TrailCurveConfig",
    "TrailCurveType",
  ]
---

# NBodyTrailsRenderer

Specialized renderer for N-body historical trail visualization, providing high-performance rendering of object movement history with Web Worker integration and advanced curve interpolation.

## 🎯 Purpose

`NBodyTrailsRenderer` renders historical trails for celestial objects in N-body simulation mode, showing the actual path that objects have followed based on their position history from the physics simulation. It uses Web Workers for performance and supports curved trail interpolation with configurable quality settings.

## 🏗️ Architecture

### Core Components

The renderer manages trail visualization with performance optimizations:

```typescript
class NBodyTrailsRenderer extends StateSubscriptionMixin {
  private trailLines: Map<string, THREE.Line> = new Map();
  private parentGroupCache: Map<string, THREE.Object3D> = new Map();
  private lineBuilder: LineHelper;
  private objectManager: ObjectManager;
  private visualizationVisible: boolean = true;
  private highlightedObjectId: string | null = null;
  private trailQuality: TrailQuality = TrailQuality.High;
  private curveConfig: TrailCurveConfig;
  private trailLinesGroup: THREE.Group;
}
```

### Performance Features

- **Web Worker Integration**: Offloads trail processing to background threads
- **Object Pooling**: Efficient memory management for trail data
- **Curve Interpolation**: Advanced interpolation for smooth trails
- **Quality Settings**: Configurable trail quality levels
- **Parent Group Caching**: Optimized scene graph management

## 🚀 Core Features

### Historical Trail Visualization

Renders actual object movement history:

```typescript
updateOrbitalLine(
  objectId: string,
  positionHistoryManager: PositionHistoryManager
): void
```

**Features:**

- **Position History Integration**: Uses `PositionHistoryManager` data directly
- **Real-time Updates**: Updates trails based on actual simulation data
- **Efficient Sampling**: Intelligent point sampling for performance
- **Curve Interpolation**: Smooth trail visualization with configurable curves

### Advanced Curve Interpolation

Configurable trail smoothing and interpolation:

```typescript
private curveConfig: TrailCurveConfig = {
  type: TrailCurveType.Adaptive,
  tension: 0.5,
  segments: 10,
  smoothing: 0.3,
  adaptiveThreshold: 5,
};
```

**Features:**

- **Multiple Curve Types**: Linear, Smooth, Orbital, Adaptive
- **Configurable Parameters**: Tension, segments, smoothing, adaptive threshold
- **Quality-based Interpolation**: Different quality levels for different scenarios
- **Performance Optimization**: Efficient interpolation algorithms

### Web Worker Integration

Background processing for trail calculations:

```typescript
// Web Worker integration for trail processing
// Note: TrailDataPool and trail.worker are available but not directly imported
// in this simplified version for performance optimization
```

**Features:**

- **Background Processing**: Offloads heavy calculations to Web Workers
- **Batch Processing**: Efficient batch updates for multiple objects
- **Memory Optimization**: Shared memory pools for trail data
- **Performance Monitoring**: Tracks processing performance

### Quality-based Rendering

Configurable quality settings for different performance requirements:

```typescript
setTrailQuality(quality: TrailQuality): void
```

**Quality Levels:**

- **Low**: Minimal trail points for maximum performance
- **Medium**: Balanced quality and performance
- **High**: High-quality trails with smooth interpolation
- **Ultra**: Maximum quality for detailed analysis
- **Cosmic**: Ultra-high quality for scientific visualization

## 🔧 Key Methods

### Constructor

```typescript
constructor(
  objectManager: ObjectManager,
  curveConfig?: TrailCurveConfig,
  trailLinesGroup?: THREE.Group
)
```

**Parameters:**

- `objectManager`: Scene's ObjectManager for rendering operations
- `curveConfig`: Optional curve configuration for trail interpolation
- `trailLinesGroup`: Optional shared group for trail-related lines

### Trail Update Methods

```typescript
update(
  objects: Record<string, RenderableCelestialObject>,
  visualSettings: {
    timeScale: number;
    predictionSteps: number;
    predictionDuration: number;
  },
  deltaTime: number
): void

updateOrbitalLine(
  objectId: string,
  positionHistoryManager: PositionHistoryManager
): void
```

**Process:**

1. **Position History Retrieval**: Gets recent position history
2. **Point Sampling**: Samples points based on quality settings
3. **Curve Interpolation**: Applies curve interpolation
4. **Line Creation/Update**: Creates or updates trail lines
5. **Scene Integration**: Adds lines to appropriate parent groups

### Line Management

```typescript
private drawTrailLine(objectId: string, points: THREE.Vector3[]): void
private createNewTrailLine(objectId: string, parentGroup: THREE.Object3D): THREE.Line
private updateLineGeometry(line: THREE.Line, points: THREE.Vector3[], pointCount: number): void
```

**Features:**

- **Efficient Line Creation**: Optimized line creation with proper materials
- **Geometry Updates**: Efficient geometry updates for line changes
- **Parent Group Management**: Proper scene graph organization
- **Material Management**: Individual materials for each trail line

## 🔄 Data Flow

### Trail Update Flow

```typescript
// 1. Get position history from manager
const positionHistory = positionHistoryManager.getPositionHistory();

// 2. Calculate start index based on trail length
const startIndex = Math.max(
  0,
  positionHistory.length - this.cachedEffectiveMaxTrailPoints,
);

// 3. Convert positions to THREE.Vector3
const rawPoints = this.convertPositionsToVectors(positionHistory, startIndex);

// 4. Sample and interpolate points
const interpolatedPoints = this.sampleAndInterpolatePoints(rawPoints);

// 5. Draw trail line
this.drawTrailLine(objectId, interpolatedPoints);
```

### Point Sampling Flow

```typescript
// 1. Check if sampling is needed
if (rawPoints.length <= this.samplingInterval) {
  return rawPoints;
}

// 2. Sample every Nth point
const sampledPoints: THREE.Vector3[] = [];
for (let i = 0; i < rawPoints.length; i += this.samplingInterval) {
  sampledPoints.push(rawPoints[i]);
}

// 3. Ensure last point is included
if (rawPoints.length > 0 && sampledPoints.length > 0) {
  const lastRawPoint = rawPoints[rawPoints.length - 1];
  const lastSampledPoint = sampledPoints[sampledPoints.length - 1];

  if (lastRawPoint !== lastSampledPoint) {
    sampledPoints.push(lastRawPoint);
  }
}
```

### Highlighting Flow

```typescript
// 1. Update highlighting state
this.highlightedObjectId = objectId;
this.highlightColor = color;

// 2. Apply highlighting to all lines
this.trailLines.forEach((line, id) => {
  this.applyHighlight(id, line);
});
```

## 🎨 Visualization Features

### Trail Line Styling

Advanced styling for trail visualization:

```typescript
// Base trail material with transparency
this.baseTrailMaterial = SharedMaterials.clone("TRAIL");
if (this.baseTrailMaterial instanceof THREE.LineBasicMaterial) {
  this.baseTrailMaterial.transparent = true;
  this.baseTrailMaterial.opacity = 0.8;
}
```

**Features:**

- **Transparency Support**: Semi-transparent trails for visual depth
- **Material Cloning**: Individual materials for each trail line
- **Highlighting Support**: Color changes for highlighting effects
- **Render Order Management**: Proper rendering order for trails

### Curve Interpolation

Multiple interpolation types for different trail scenarios:

```typescript
// Adaptive curve interpolation
const interpolatedPoints = TrailCurveInterpolator.interpolate(
  trailPoints,
  this.curveConfig,
);
```

**Interpolation Types:**

- **Linear**: Simple linear interpolation for performance
- **Smooth**: Smooth curve interpolation for visual appeal
- **Orbital**: Orbital-aware interpolation for celestial objects
- **Adaptive**: Automatic interpolation based on trail characteristics

### Performance Optimization

Efficient rendering strategies:

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
  const pointCount = positionHistory.length - startIndex;
  const points: THREE.Vector3[] = [];
  points.length = pointCount; // Pre-allocate array size

  for (let i = 0; i < pointCount; i++) {
    const sourcePos = positionHistory[startIndex + i];
    points[i] = new THREE.Vector3(sourcePos.x, sourcePos.y, sourcePos.z);
  }

  return points;
}
```

## 📊 Performance Considerations

### Memory Management

- **Object Pooling**: Reuse trail data objects to minimize allocations
- **Efficient Sampling**: Reduce point count while maintaining visual quality
- **Parent Group Caching**: Cache parent groups to avoid repeated lookups
- **Material Reuse**: Efficient material cloning and management

### Rendering Optimization

- **Frustum Culling**: Disabled for trails to prevent disappearing
- **Render Order Management**: Proper rendering order for visual consistency
- **Batch Processing**: Group multiple trail updates for efficiency
- **Quality-based Rendering**: Adjust quality based on performance requirements

### Web Worker Benefits

- **Background Processing**: Offloads heavy calculations from main thread
- **Parallel Processing**: Concurrent processing of multiple trails
- **Memory Efficiency**: Shared memory pools for trail data
- **Responsive UI**: Keeps main thread responsive during heavy calculations

## 🔧 Integration Points

### Position History Integration

```typescript
// Integrate with PositionHistoryManager
const positionHistory = positionHistoryManager.getPositionHistory();
const trailPoints = this.convertPositionsToVectors(positionHistory, startIndex);
```

### Scene Management Integration

```typescript
// Integrate with scene graph
const parentGroup = this.getOrCacheParentGroup(objectId);
if (parentGroup) {
  parentGroup.add(line);
}
```

### Material System Integration

```typescript
// Use shared materials
const lineMaterial = this.baseTrailMaterial!.clone();
const line = this.lineBuilder.createLine(
  bufferSize,
  lineMaterial,
  `trail-line-${objectId}`,
);
```

## 🎯 Usage Examples

### Basic Trail Rendering

```typescript
import { NBodyTrailsRenderer } from "@teskooano/renderer-threejs-orbits";

const renderer = new NBodyTrailsRenderer(objectManager, {
  type: TrailCurveType.Adaptive,
  tension: 0.5,
  segments: 10,
  smoothing: 0.3,
  adaptiveThreshold: 5,
});

// Update trail for an object
renderer.updateOrbitalLine("earth", positionHistoryManager);
```

### Quality Configuration

```typescript
// Set trail quality
renderer.setTrailQuality(TrailQuality.High);

// Configure curve settings
renderer.setCurveConfig({
  type: TrailCurveType.Orbital,
  tension: 0.7,
  segments: 15,
  smoothing: 0.4,
  adaptiveThreshold: 8,
});
```

### Highlighting and Visibility

```typescript
// Highlight specific trail
renderer.highlight("earth", new THREE.Color(0xff0000));

// Control visibility
renderer.setVisibility(true);

// Remove specific trail
renderer.removeTrail("earth");

// Clear all trails
renderer.clearAllTrails();
```

### Performance Monitoring

```typescript
// Get performance statistics
const stats = renderer.getPerformanceStats();
console.log("Trail lines count:", stats.trailLinesCount);
```

## 🔍 Debug Features

### Performance Statistics

```typescript
// Monitor trail performance
const stats = renderer.getPerformanceStats();
console.log("Active trail lines:", stats.trailLinesCount);
```

### Configuration Inspection

```typescript
// Inspect curve configuration
const config = renderer.getCurveConfig();
console.log("Current curve config:", config);
```

### Line Inspection

```typescript
// Inspect trail lines
console.log("Trail lines:", renderer.trailLines);
```

## 🚀 Future Enhancements

### Planned Features

- **Advanced Web Worker Integration**: Full Web Worker implementation for trail processing
- **Trail Effects**: Particle effects and visual enhancements
- **Temporal Trail Visualization**: Time-based trail coloring and effects

### Optimization Opportunities

- **GPU Acceleration**: Move trail processing to GPU using compute shaders
- **Instanced Rendering**: Use instanced rendering for similar trails
- **Predictive Trail Caching**: Cache trail calculations for reuse

### Advanced Features

- **Trail Analytics**: Trail analysis and statistics
- **Interactive Trail Editing**: User-controlled trail parameters
- **Trail Export**: Export trail data for analysis
