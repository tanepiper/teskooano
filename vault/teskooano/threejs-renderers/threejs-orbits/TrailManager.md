---
name: "TrailManager"
description: "Manages historical trail visualization for N-body objects with Web Worker offloading"
package: "@teskooano/renderer-threejs-orbits"
dependencies:
  [
    "@teskooano/data-types",
    "@teskooano/renderer-threejs-objects",
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
    "THREE.BufferAttribute",
    "THREE.BufferGeometry",
    "THREE.Material",
    "THREE.ShaderMaterial",
    "THREE.Scene",
    "THREE.PerspectiveCamera",
    "THREE.WebGLRenderer",
    "THREE.Object3D",
    "THREE.Raycaster",
    "THREE.Box3",
    "THREE.Light",
    "THREE.PointLight",
    "THREE.CanvasTexture",
    "THREE.Sprite",
    "THREE.LOD",
    "THREE.GridHelper",
    "THREE.Clock",
    "THREE.CSS2DRenderer",
    "THREE.CSS2DObject",
    "HTMLElement",
    "ShadowRoot",
    "HTMLSpanElement",
    "CSS2DObject",
    "Worker",
    "ObjectManager",
    "RenderOrderManager",
    "SharedMaterials",
    "LineHelper",
    "TrailCurveInterpolator",
    "CircularBuffer",
    "TrailDataPool",
  ]
functions:
  [
    "simplifyTrail",
    "interpolateCurve",
    "updateTrailData",
    "processTrailBatch",
    "createTrailLine",
    "updateTrailLine",
    "setTrailQuality",
    "setVisibility",
    "setHighlight",
    "setCurveConfig",
    "setTension",
    "setSegments",
    "setSmoothing",
    "setAdaptiveThreshold",
    "setTrailType",
    "setLinearType",
    "setSmoothType",
    "setOrbitalType",
    "setAdaptiveType",
    "setTrailTension",
    "setTrailSegments",
    "setTrailSmoothing",
    "setTrailAdaptiveThreshold",
    "dispose",
    "initialize",
    "update",
    "addObject",
    "removeObject",
    "highlightObject",
  ]
constants:
  [
    "TrailCurveType",
    "MIN_SAMPLE_DISTANCE_SQ",
    "BATCH_INTERVAL",
    "MAX_BATCH_SIZE",
    "PERFORMANCE_CHECK_INTERVAL",
    "TRAIL_QUALITY_HIGH",
    "TRAIL_QUALITY_MEDIUM",
    "TRAIL_QUALITY_LOW",
    "CURVE_TENSION_DEFAULT",
    "CURVE_SEGMENTS_DEFAULT",
    "CURVE_SMOOTHING_DEFAULT",
    "CURVE_ADAPTIVE_THRESHOLD_DEFAULT",
    "TRAIL_TENSION",
    "TRAIL_SEGMENTS",
    "TRAIL_SMOOTHING",
    "TRAIL_ADAPTIVE_THRESHOLD",
  ]
types:
  [
    "TrailCurveType",
    "TrailCurveConfig",
    "TrailQuality",
    "RenderableCelestialObject",
    "CelestialType",
    "CelestialStatus",
    "LODLevel",
    "MemoryStats",
    "RendererStats",
    "Callback",
    "RenderLoopPayload",
    "MaterialAnalysisResult",
    "RenderOrderAnalysisResult",
    "GridLevel",
    "SceneManagerOptions",
    "PerformanceOptimization",
    "DeviceTier",
    "WebGLCapabilities",
    "ResizePayload",
    "LabelSystem",
    "LabelSystemOptions",
    "LabelVisibilityConfig",
    "OcclusionConfig",
    "UIRegistryComponent",
    "VisibilityLevel",
    "LightSourceOptions",
    "LightActionPlan",
    "LightManagerConfig",
    "StarProperties",
    "ObjectLifecycleManagerConfig",
    "MeshFactoryConfig",
    "RendererUpdaterConfig",
    "DebrisEffectManagerConfig",
    "AccelerationVisualizerConfig",
    "GravitationalLensingHandlerConfig",
    "RenderableCacheEntry",
    "DestructionPayload",
    "LabelVisibilityManager",
    "CSS2DLayerType",
    "PredictionConfig",
    "TrailConfig",
    "OrbitConfig",
    "CurveConfig",
    "InterpolationConfig",
    "SmoothingConfig",
    "AdaptiveConfig",
    "TensionConfig",
    "SegmentsConfig",
    "SmoothingFactor",
    "AdaptiveThreshold",
    "TensionFactor",
    "SegmentCount",
    "InterpolationType",
    "SmoothingType",
    "AdaptiveType",
    "TensionType",
    "SegmentType",
    "OrbitalType",
    "TrailType",
    "PredictionType",
    "LinearType",
    "SmoothType",
    "AdaptiveType",
    "OrbitalTension",
    "OrbitalSegments",
    "OrbitalSmoothing",
    "OrbitalAdaptiveThreshold",
    "TrailTension",
    "TrailSegments",
    "TrailSmoothing",
    "TrailAdaptiveThreshold",
    "PredictionTension",
    "PredictionSegments",
    "PredictionSmoothing",
    "PredictionAdaptiveThreshold",
  ]
---

# TrailManager

Manages the creation and updating of trail lines showing an object's recent path with advanced performance optimizations and Web Worker offloading.

## 🎯 Purpose

`TrailManager` is responsible for visualizing the historical movement of celestial objects in N-Body simulation mode. It offloads the storage and management of position history to a Web Worker to keep the main render thread as light as possible, while providing smooth, curved trail visualization.

## 🏗️ Architecture

### Web Worker Integration

The manager uses a Web Worker for heavy calculations to maintain main thread responsiveness:

```typescript
private trailWorker: Worker | null = null;
```

**Worker Responsibilities:**

- **Position History Storage**: Efficient circular buffer implementation
- **Trail Simplification**: Ramer-Douglas-Peucker algorithm
- **Curve Interpolation**: Catmull-Rom spline smoothing
- **Memory Management**: Pre-allocated buffer management

### Core Components

#### Trail Lines Storage

```typescript
public trailLines: Map<string, THREE.Line> = new Map();
```

#### Performance Monitoring

```typescript
private messageCount: number = 0;
private lastPerformanceCheck: number = 0;
private readonly PERFORMANCE_CHECK_INTERVAL = 5000; // 5 seconds
```

#### Batch Processing

```typescript
private pendingUpdates: Array<{
  objectId: string;
  position: [number, number, number];
  maxHistoryLength: number;
  quality: string;
  curveConfig: TrailCurveConfig;
}> = [];
private lastBatchTime: number = 0;
private readonly BATCH_INTERVAL = 100; // 100ms
private readonly MAX_BATCH_SIZE = 20; // 20 updates per batch
```

## 🚀 Core Features

### Trail Curve Interpolation

Advanced curve interpolation for realistic orbital visualization:

```typescript
enum TrailCurveType {
  Linear = "linear", // Simple linear interpolation
  Smooth = "smooth", // Catmull-Rom spline smoothing
  Orbital = "orbital", // Orbital-aware curve fitting
  Adaptive = "adaptive", // Automatically choose based on object type
}
```

**Configuration Options:**

- **Tension**: Controls curve tightness (0-1)
- **Segments**: Number of curve segments per point pair
- **Smoothing**: Smoothing factor for curve interpolation
- **Adaptive Threshold**: Minimum points for adaptive smoothing

### Distance-Based Sampling

Prevents micro-wobbles and reduces unnecessary updates:

```typescript
private readonly MIN_SAMPLE_DISTANCE_SQ = 1e-6;
private lastSampledPositions: Map<string, THREE.Vector3> = new Map();
private lastSampledTimes: Map<string, number> = new Map();
```

### Quality Settings

Configurable trail quality levels:

```typescript
enum TrailQuality {
  LOW = "low", // Minimal trail points
  MEDIUM = "medium", // Balanced quality/performance
  HIGH = "high", // High-quality trails
  COSMIC = "cosmic", // Maximum quality
}
```

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

- `objectManager`: The scene's ObjectManager for adding/removing objects
- `curveConfig`: Optional curve configuration for trail interpolation
- `trailLinesGroup`: Optional shared group for all trail lines

### Update Cycle

```typescript
update(objects: RenderableCelestialObject[]): void
```

**Process:**

1. **Position Sampling**: Samples new positions based on distance threshold
2. **Batch Processing**: Groups updates for efficient worker communication
3. **Worker Communication**: Sends batched updates to worker
4. **Result Processing**: Updates trail lines with processed data

### Trail Creation

```typescript
private createTrailLine(objectId: string, positions: THREE.Vector3[]): THREE.Line
```

**Features:**

- Creates `THREE.Line` objects with proper materials
- Applies curve interpolation for smooth visualization
- Integrates with render order management
- Supports highlighting and visibility controls

### Quality Control

```typescript
setTrailQuality(quality: TrailQuality): void
```

**Behavior:**

- Updates trail quality for all managed objects
- Triggers recalculation of existing trails
- Adjusts worker processing parameters
- Maintains performance/quality balance

## 🔄 Data Flow

### Main Thread → Worker

```typescript
// Serialize position data for worker
const message = {
  objectId,
  position: [x, y, z],
  maxHistoryLength: this.getMaxHistoryLength(quality),
  quality,
  curveConfig: this.curveConfig,
};

this.trailWorker?.postMessage(message);
```

### Worker → Main Thread

```typescript
// Worker processes and returns simplified/interpolated data
self.onmessage = (event) => {
  const { positions, quality, curveConfig } = event.data;
  const simplified = simplifyTrail(positions, quality);
  const interpolated = interpolateCurve(simplified, curveConfig);
  self.postMessage({ simplified, interpolated });
};
```

### Trail Line Updates

```typescript
// Update trail line geometry with new positions
const geometry = trailLine.geometry as THREE.BufferGeometry;
geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
geometry.computeBoundingSphere();
```

## 🎨 Visualization Features

### Curve Interpolation

Advanced curve interpolation for realistic orbital visualization:

```typescript
// Catmull-Rom spline interpolation
const interpolated = interpolateCurve(positions, {
  type: TrailCurveType.Smooth,
  tension: 0.5,
  segments: 10,
  smoothing: 0.3,
});
```

### Highlighting System

```typescript
private highlightedObjectId: string | null = null;
private highlightColor: THREE.Color = new THREE.Color(0xffff00);
```

**Features:**

- Object-specific highlighting
- Color customization
- Smooth transitions
- Performance-optimized updates

### Visibility Control

```typescript
private visualizationVisible: boolean = true;
```

**Behavior:**

- Global visibility control
- Individual object visibility
- Smooth fade transitions
- Performance optimization when hidden

## 📊 Performance Optimizations

### Web Worker Benefits

- **Main Thread Responsiveness**: Heavy calculations don't block rendering
- **Parallel Processing**: Multiple workers can process different objects
- **Zero-Copy Transfers**: Efficient data serialization using `Float32Array`

### Memory Management

- **Buffer Pooling**: Reuses `THREE.BufferAttribute` objects
- **Circular Buffers**: Fixed-size buffers prevent memory leaks
- **Object Pooling**: Pre-allocated data structures reduce garbage collection

### Update Optimization

- **Distance-based Sampling**: Only samples when objects move significantly
- **Batch Processing**: Groups multiple updates to reduce worker communication
- **Throttled Updates**: Configurable update intervals
- **LOD Integration**: Trail quality adjusts based on camera distance

## 🔧 Integration Points

### Object Manager Integration

```typescript
// Adds/removes trail lines from scene
this.objectManager.addObject(trailLine);
this.objectManager.removeObject(objectId);
```

### Render Order Management

```typescript
// Integrates with render order system
this.renderOrderManager.setRenderOrder(trailLine, RENDER_ORDERS.TRAILS);
```

### Material System

```typescript
// Uses shared materials for consistency
const material = SharedMaterials.getTrailMaterial(highlighted);
```

## 🎯 Usage Examples

### Basic Setup

```typescript
const trailManager = new TrailManager(objectManager, {
  type: TrailCurveType.Adaptive,
  tension: 0.5,
  segments: 10,
  smoothing: 0.3,
});

// Enable trail visualization
trailManager.setVisibility(true);
```

### Quality Configuration

```typescript
// Set trail quality
trailManager.setTrailQuality(TrailQuality.High);

// Configure curve interpolation
trailManager.setCurveConfig({
  type: TrailCurveType.Orbital,
  tension: 0.3,
  segments: 4,
  smoothing: 0.2,
});
```

### Highlighting

```typescript
// Highlight specific object's trail
trailManager.highlightObject("earth", true);

// Set custom highlight color
trailManager.setHighlightColor(new THREE.Color(0xff0000));
```

## 🔍 Debug Features

### Performance Monitoring

- **Message Count**: Tracks worker communication frequency
- **Update Timing**: Monitors update performance
- **Memory Usage**: Tracks buffer allocations

### Visual Debugging

- **Trail Points**: Visualize individual trail points
- **Quality Levels**: Adjustable trail detail
- **Worker Status**: Monitor worker communication

### Configuration Debug

- **Curve Parameters**: Adjustable curve interpolation
- **Sampling Distance**: Configurable sampling threshold
- **Batch Settings**: Adjustable batch processing parameters

## 🚀 Future Enhancements

### Planned Features

- **Multi-threaded Processing**: Multiple workers for parallel processing
- **Advanced Curves**: Bézier and B-spline interpolation
- **Trail Effects**: Particle effects for trail visualization
- **Performance Profiling**: Built-in performance analysis tools

### Optimization Opportunities

- **GPU Compute**: Move calculations to GPU using compute shaders
- **Spatial Indexing**: Advanced spatial partitioning for large scenes
- **Predictive Caching**: Cache trail results for reuse
- **Adaptive Quality**: Dynamic quality adjustment based on performance
