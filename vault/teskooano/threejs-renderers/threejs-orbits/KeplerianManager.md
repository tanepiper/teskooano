---
name: "KeplerianManager"
description: "Manages static Keplerian orbit lines with curved trail interpolation"
package: "@teskooano/renderer-threejs-orbits"
dependencies:
  [
    "@teskooano/data-types",
    "@teskooano/renderer-threejs-objects",
    "@teskooano/renderer-threejs-helpers",
    "@teskooano/core-math",
    "@teskooano/data-values",
    "three",
    "rxjs",
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
    "ThreeVector3Converter",
    "OSVector3",
    "OrbitCalculator",
    "TrailCurveInterpolator",
  ]
functions:
  [
    "calculateOrbitalPosition",
    "createOrbitLine",
    "updateOrbitLine",
    "setVisibility",
    "setHighlight",
    "setCurveConfig",
    "setTension",
    "setSegments",
    "setSmoothing",
    "setAdaptiveThreshold",
    "setOrbitalType",
    "setLinearType",
    "setSmoothType",
    "setAdaptiveType",
    "setOrbitalTension",
    "setOrbitalSegments",
    "setOrbitalSmoothing",
    "setOrbitalAdaptiveThreshold",
    "dispose",
    "initialize",
    "update",
    "addObject",
    "removeObject",
    "highlightObject",
  ]
constants:
  [
    "AU_METERS",
    "METERS_TO_SCENE_UNITS",
    "ORBITAL_TENSION",
    "ORBITAL_SEGMENTS",
    "ORBITAL_SMOOTHING",
    "ORBITAL_ADAPTIVE_THRESHOLD",
  ]
types:
  [
    "OrbitalParameters",
    "CelestialType",
    "RenderableCelestialObject",
    "CelestialObject",
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
    "TrailCurveType",
    "TrailCurveConfig",
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

# KeplerianManager

Manages the creation, update, visibility, and highlighting of static Keplerian orbit lines with enhanced curved trail interpolation for more realistic orbital visualization.

## 🎯 Purpose

`KeplerianManager` is responsible for maintaining and rendering the classic elliptical orbit paths based on Keplerian orbital elements. It works with the ObjectManager to add/remove lines from the scene and handles visual properties like highlighting and visibility, enhanced with curved trail interpolation for more realistic orbital visualization.

## 🏗️ Architecture

### Core Components

#### Orbit Lines Storage

```typescript
private lines: Map<string, THREE.Line> = new Map();
```

#### Position Caching

```typescript
private positionCache: Map<string, THREE.Vector3[]> = new Map();
private orbitPointCache: Map<string, { version: number; points: OSVector3[] }> = new Map();
```

#### Utility Components

```typescript
private lineBuilder: LineHelper;
private threeVector3Converter: ThreeVector3Converter;
private orbitCalculator: OrbitCalculator;
```

### Curve Configuration

```typescript
private curveConfig: TrailCurveConfig = {
  type: TrailCurveType.Orbital,
  tension: 0.3,
  segments: 4,
  smoothing: 0.2,
  adaptiveThreshold: 5,
};
```

### Group Organization

```typescript
private orbitLinesGroup: THREE.Group;
private keplerianLinesGroup: THREE.Group;
```

## 🚀 Core Features

### Keplerian Orbit Calculation

Uses `OrbitCalculator` to generate elliptical vertices from orbital parameters:

```typescript
// Extract orbital parameters
const orbitalParams = object.orbitalParameters;
if (!orbitalParams) return;

// Calculate orbit points
const orbitPoints = this.orbitCalculator.calculateOrbitPoints(orbitalParams);
```

### Curved Trail Interpolation

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

### Caching System

Efficient caching to avoid recalculation:

```typescript
// Cache for THREE.Vector3 arrays to avoid reallocation
private positionCache: Map<string, THREE.Vector3[]> = new Map();

// Cache for raw calculated OSVector3 points
private orbitPointCache: Map<string, { version: number; points: OSVector3[] }> = new Map();
```

## 🔧 Key Methods

### Constructor

```typescript
constructor(
  objectManager: ObjectManager,
  renderableObjects$: Observable<Record<string, RenderableCelestialObject>>,
  orbitLinesGroup: THREE.Group,
  curveConfig?: TrailCurveConfig
)
```

**Parameters:**

- `objectManager`: The scene's ObjectManager instance
- `renderableObjects$`: Observable emitting RenderableCelestialObject data
- `orbitLinesGroup`: Shared group for all orbit-related lines
- `curveConfig`: Optional curve configuration for orbit interpolation

### Update Cycle

```typescript
update(): void
```

**Process:**

1. **Object Iteration**: Processes all renderable objects
2. **Parameter Extraction**: Extracts orbital parameters
3. **Cache Check**: Checks if orbit points need recalculation
4. **Line Creation/Update**: Creates or updates orbit lines
5. **Scene Management**: Adds/removes lines from scene

### Orbit Line Creation

```typescript
private createOrbitLine(objectId: string, positions: THREE.Vector3[]): THREE.Line
```

**Features:**

- Creates `THREE.Line` objects with proper materials
- Applies curve interpolation for smooth visualization
- Integrates with render order management
- Supports highlighting and visibility controls

### Caching Management

```typescript
private getOrbitPoints(object: RenderableCelestialObject): OSVector3[]
```

**Behavior:**

- Checks cache for existing orbit points
- Calculates new points if needed
- Updates cache with new results
- Uses version-based invalidation

## 🔄 Data Flow

### Parameter Extraction

```typescript
// Extract orbital parameters from celestial object
const orbitalParams = object.orbitalParameters;
if (!orbitalParams) return;

// Extract key parameters for cache versioning
const {
  semiMajorAxis,
  eccentricity,
  inclination,
  argumentOfPeriapsis,
  longitudeOfAscendingNode,
} = orbitalParams;
```

### Orbit Calculation

```typescript
// Calculate orbit points using OrbitCalculator
const orbitPoints = this.orbitCalculator.calculateOrbitPoints(orbitalParams);

// Apply curve interpolation
const interpolatedPoints = this.trailCurveInterpolator.interpolate(
  orbitPoints,
  this.curveConfig,
);
```

### Line Creation

```typescript
// Convert OSVector3 to THREE.Vector3
const threePositions =
  this.threeVector3Converter.convertArray(interpolatedPoints);

// Create line using LineHelper
const line = this.lineBuilder.createLine(threePositions, material);
```

## 🎨 Visualization Features

### Curve Interpolation

Advanced curve interpolation for realistic orbital visualization:

```typescript
// Orbital-aware curve interpolation
const interpolated = this.trailCurveInterpolator.interpolate(positions, {
  type: TrailCurveType.Orbital,
  tension: 0.3,
  segments: 4,
  smoothing: 0.2,
});
```

### Highlighting System

```typescript
private highlightedObjectId: string | null = null;
private highlightColor: THREE.Color = new THREE.Color(0x00ff00);
```

**Features:**

- Object-specific highlighting
- Color customization
- Smooth transitions
- Performance-optimized updates

### Visibility Control

```typescript
private orbitLinesVisible: boolean = true;
```

**Behavior:**

- Global visibility control
- Individual object visibility
- Smooth fade transitions
- Performance optimization when hidden

## 📊 Performance Optimizations

### Caching Benefits

- **Position Cache**: Reuses THREE.Vector3 arrays
- **Orbit Point Cache**: Avoids recalculation of orbit points
- **Version-based Invalidation**: Only recalculates when parameters change

### Memory Management

- **Buffer Pooling**: Reuses `THREE.BufferAttribute` objects
- **Array Reuse**: Minimizes array allocations
- **Object Pooling**: Pre-allocated data structures

### Update Optimization

- **Selective Updates**: Only updates changed orbits
- **Batch Processing**: Groups multiple line updates
- **LOD Integration**: Adjusts detail based on camera distance

## 🔧 Integration Points

### Object Manager Integration

```typescript
// Adds/removes orbit lines from scene
this.objectManager.addObject(orbitLine);
this.objectManager.removeObject(objectId);
```

### Render Order Management

```typescript
// Integrates with render order system
this.renderOrderManager.setRenderOrder(orbitLine, RENDER_ORDERS.ORBITS);
```

### Material System

```typescript
// Uses shared materials for consistency
const material = SharedMaterials.getOrbitMaterial(highlighted);
```

### Coordinate Conversion

```typescript
// Converts between coordinate systems
const threePositions = this.threeVector3Converter.convertArray(osPositions);
```

## 🎯 Usage Examples

### Basic Setup

```typescript
const keplerianManager = new KeplerianManager(
  objectManager,
  renderableObjects$,
  orbitLinesGroup,
  {
    type: TrailCurveType.Orbital,
    tension: 0.3,
    segments: 4,
    smoothing: 0.2,
  },
);

// Enable orbit visualization
keplerianManager.setVisibility(true);
```

### Configuration

```typescript
// Configure curve interpolation
keplerianManager.setCurveConfig({
  type: TrailCurveType.Smooth,
  tension: 0.5,
  segments: 10,
  smoothing: 0.3,
});

// Set specific orbital parameters
keplerianManager.setOrbitalTension(0.4);
keplerianManager.setOrbitalSegments(6);
```

### Highlighting

```typescript
// Highlight specific object's orbit
keplerianManager.highlightObject("earth", true);

// Set custom highlight color
keplerianManager.setHighlightColor(new THREE.Color(0xff0000));
```

## 🔍 Debug Features

### Performance Monitoring

- **Cache Hit Rate**: Tracks cache effectiveness
- **Update Timing**: Monitors update performance
- **Memory Usage**: Tracks buffer allocations

### Visual Debugging

- **Orbit Points**: Visualize individual orbit points
- **Curve Parameters**: Adjustable curve interpolation
- **Cache Status**: Monitor cache hit/miss rates

### Configuration Debug

- **Orbital Parameters**: Adjustable orbital elements
- **Curve Settings**: Configurable curve interpolation
- **Material Settings**: Adjustable line materials

## 🚀 Future Enhancements

### Planned Features

- **Advanced Curves**: Bézier and B-spline interpolation
- **Multi-body Orbits**: Orbits considering gravitational interactions
- **Orbit Effects**: Visual effects for orbit lines
- **Performance Profiling**: Built-in performance analysis tools

### Optimization Opportunities

- **GPU Compute**: Move calculations to GPU using compute shaders
- **Spatial Indexing**: Advanced spatial partitioning for large scenes
- **Predictive Caching**: Cache orbit results for reuse
- **Adaptive Quality**: Dynamic quality adjustment based on performance

### Advanced Features

- **Orbital Perturbations**: Account for gravitational perturbations
- **Uncertainty Visualization**: Show orbital uncertainty ranges
- **Interactive Orbits**: User-controlled orbital parameters
- **Orbit Comparison**: Compare multiple orbital scenarios
