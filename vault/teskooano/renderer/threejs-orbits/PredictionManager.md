---
name: "PredictionManager"
description: "Manages future trajectory prediction visualization with modular architecture"
package: "@teskooano/renderer-threejs-orbits"
dependencies:
  [
    "@teskooano/core-state",
    "@teskooano/renderer-threejs-objects",
    "@teskooano/renderer-threejs-labels",
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
    "Layer2DManager",
    "PredictionCalculator",
    "PredictionRenderer",
    "PredictionLabels",
    "PredictionAnimation",
    "Subscription",
    "StateAccessor",
    "PhysicsStateProvider",
  ]
functions:
  [
    "calculatePrediction",
    "renderPrediction",
    "animatePrediction",
    "updateLabels",
    "highlightObject",
    "setVisibility",
    "setPredictionDuration",
    "createPredictionLine",
    "updatePredictionLine",
    "setPredictionSteps",
    "setPredictionType",
    "setPredictionTension",
    "setPredictionSegments",
    "setPredictionSmoothing",
    "setPredictionAdaptiveThreshold",
    "dispose",
    "initialize",
    "update",
    "addObject",
    "removeObject",
    "setHighlight",
    "setCurveConfig",
    "setTension",
    "setSegments",
    "setSmoothing",
    "setAdaptiveThreshold",
    "setPredictionType",
    "setLinearType",
    "setSmoothType",
    "setOrbitalType",
    "setAdaptiveType",
    "setPredictionTension",
    "setPredictionSegments",
    "setPredictionSmoothing",
    "setPredictionAdaptiveThreshold",
  ]
constants:
  [
    "SECONDS_PER_YEAR",
    "PREDICTION_STEPS",
    "PREDICTION_DURATION",
    "PREDICTION_TENSION",
    "PREDICTION_SEGMENTS",
    "PREDICTION_SMOOTHING",
    "PREDICTION_ADAPTIVE_THRESHOLD",
  ]
types:
  [
    "TrailCurveConfig",
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

# PredictionManager

Manages the creation and updating of prediction lines showing an object's future trajectory with a modular architecture that separates calculation, rendering, and animation concerns.

## 🎯 Purpose

`PredictionManager` is the main orchestrator for future trajectory prediction visualization. It delegates to specialized modules for calculation, rendering, and animation while providing a unified interface for prediction highlighting and configuration.

## 🏗️ Architecture

### Modular Design

The manager uses a modular architecture to separate concerns:

```typescript
// Modular Components
private calculator: PredictionCalculator;    // Core prediction calculation logic
private renderer: PredictionRenderer;        // Line rendering and visualization
private labels: PredictionLabels;           // Label management for prediction points
private animation: PredictionAnimation;     // Animation state management
```

### Core Components

#### Prediction Lines Storage

```typescript
public predictionLines: Map<string, THREE.Line> = new Map();
```

#### State Management

```typescript
private predictionDuration: number = 0;
private predictionSteps: number = 60;
private stateSubscription: Subscription | undefined;
```

#### Animation State

```typescript
private isCalculating: boolean = false;
private predictionLinesGroup: THREE.Group;
```

## 🚀 Core Features

### Prediction Highlighting System

This manager is part of a multi-level delegation system for highlighting predictions:

1. **CameraManager** (User Interaction) - Called when user focuses on an object
2. **RenderingOrchestrator** (Delegation) - Routes the request to the appropriate manager
3. **OrbitsManager** (Strategy Selection) - Delegates to the active visualization strategy
4. **PredictionManager** (Implementation) - Handles the actual highlighting logic

**Highlighting Behavior:**

- When an object is highlighted: Shows only that object's prediction line and labels
- When no object is highlighted: Hides all prediction lines and labels
- Only works in N-Body simulation mode (not available for ideal orbits)

### Animation Support

- Smooth transitions between prediction states using lerp interpolation
- Animation progress is tracked per-frame in the update() method
- Supports both instant and animated prediction line updates

### Real-time Updates

- Responds to physics state changes
- Configurable prediction duration and steps
- Efficient calculation caching

## 🔧 Key Methods

### Constructor

```typescript
constructor(
  objectManager: ObjectManager,
  curveConfig: TrailCurveConfig,
  predictionLinesGroup: THREE.Group
)
```

**Parameters:**

- `objectManager`: The scene's ObjectManager for adding/removing objects
- `curveConfig`: Curve configuration for prediction interpolation
- `predictionLinesGroup`: Shared group for all prediction lines

### State Initialization

```typescript
private initializeStateSubscriptions(): void
```

**Behavior:**

- Subscribes to global simulation state
- Syncs prediction settings from state
- Handles state change notifications
- Manages subscription lifecycle

### Update Cycle

```typescript
update(objects: RenderableCelestialObject[]): void
```

**Process:**

1. **State Synchronization**: Updates internal state from observables
2. **Calculation Delegation**: Delegates to PredictionCalculator
3. **Rendering Delegation**: Delegates to PredictionRenderer
4. **Animation Update**: Updates animation state
5. **Label Management**: Updates prediction labels

### Prediction Calculation

```typescript
private calculatePrediction(object: RenderableCelestialObject): THREE.Vector3[]
```

**Features:**

- Delegates to PredictionCalculator for core logic
- Handles calculation state management
- Provides progress feedback
- Supports cancellation of ongoing calculations

### Highlighting Control

```typescript
highlightObject(objectId: string, highlighted: boolean): void
```

**Behavior:**

- Shows/hides prediction lines for specific objects
- Updates label visibility
- Handles animation transitions
- Manages highlighting state

## 🔄 Data Flow

### State Subscription

```typescript
// Subscribes to prediction duration changes
this.stateSubscription = this.stateAccessor.$predictionSettings
  .pipe(
    map((settings) => settings.duration),
    distinctUntilChanged(),
  )
  .subscribe((duration) => this.setPredictionDuration(duration));
```

### Calculation Flow

```typescript
// Delegates calculation to specialized module
const positions = await this.calculator.calculateTrajectory(
  object,
  this.predictionDuration,
  this.predictionSteps,
);
```

### Rendering Flow

```typescript
// Delegates rendering to specialized module
this.renderer.renderPrediction(objectId, positions, highlighted);
```

### Animation Flow

```typescript
// Updates animation state
this.animation.update(deltaTime);
const progress = this.animation.getProgress();
```

## 🎨 Visualization Features

### Prediction Lines

Advanced line visualization for future trajectories:

```typescript
// Creates prediction line with proper materials
const predictionLine = this.renderer.createPredictionLine(
  objectId,
  positions,
  highlighted,
);
```

### Label Integration

```typescript
// Manages prediction point labels
this.labels.updateLabels(objectId, positions, highlighted);
```

### Animation Transitions

```typescript
// Smooth transitions between prediction states
const animatedPositions = this.animation.interpolatePositions(
  oldPositions,
  newPositions,
  progress,
);
```

## 📊 Performance Considerations

### Calculation Optimization

- **Async Processing**: Non-blocking calculation in background
- **Caching**: Caches calculation results to avoid recalculation
- **Throttling**: Limits calculation frequency to prevent overload

### Rendering Optimization

- **Batch Updates**: Groups multiple line updates
- **Material Sharing**: Reuses materials across prediction lines
- **Geometry Pooling**: Efficient geometry management

### Memory Management

- **Object Pooling**: Pre-allocated data structures
- **Buffer Reuse**: Reuses buffer attributes
- **Cleanup**: Proper disposal of unused resources

## 🔧 Integration Points

### Object Manager Integration

```typescript
// Adds/removes prediction lines from scene
this.objectManager.addObject(predictionLine);
this.objectManager.removeObject(objectId);
```

### Label System Integration

```typescript
// Integrates with 2D label system
this.layer2DManager.addLabel(predictionLabel, objectId);
```

### State System Integration

```typescript
// Accesses physics state for calculations
const physicsState = this.stateAccessor.getPhysicsState();
```

## 🎯 Usage Examples

### Basic Setup

```typescript
const predictionManager = new PredictionManager(
  objectManager,
  {
    type: TrailCurveType.Orbital,
    tension: 0.3,
    segments: 4,
    smoothing: 0.2,
  },
  predictionLinesGroup,
);

// Enable prediction visualization
predictionManager.setVisibility(true);
```

### Configuration

```typescript
// Set prediction duration
predictionManager.setPredictionDuration(3600); // 1 hour

// Set prediction steps
predictionManager.setPredictionSteps(120); // 120 steps

// Configure curve interpolation
predictionManager.setCurveConfig({
  type: TrailCurveType.Smooth,
  tension: 0.5,
  segments: 10,
  smoothing: 0.3,
});
```

### Highlighting

```typescript
// Highlight specific object's prediction
predictionManager.highlightObject("earth", true);

// Clear all highlights
predictionManager.highlightObject(null, false);
```

## 🔍 Debug Features

### Performance Monitoring

- **Calculation Time**: Tracks prediction calculation performance
- **Rendering Time**: Monitors rendering performance
- **Memory Usage**: Tracks prediction line memory usage

### Visual Debugging

- **Prediction Steps**: Adjustable prediction resolution
- **Animation Progress**: Visual feedback for animation state
- **Label Visibility**: Debug label positioning and visibility

### Configuration Debug

- **Duration Settings**: Adjustable prediction duration
- **Step Settings**: Configurable prediction steps
- **Curve Parameters**: Adjustable curve interpolation

## 🚀 Future Enhancements

### Planned Features

- **Multi-threaded Calculation**: Parallel prediction calculations
- **Advanced Interpolation**: Bézier and B-spline interpolation
- **Prediction Effects**: Visual effects for prediction lines
- **Performance Profiling**: Built-in performance analysis tools

### Optimization Opportunities

- **GPU Compute**: Move calculations to GPU using compute shaders
- **Spatial Indexing**: Advanced spatial partitioning for large scenes
- **Predictive Caching**: Cache prediction results for reuse
- **Adaptive Quality**: Dynamic quality adjustment based on performance

### Advanced Features

- **Multi-body Predictions**: Predictions considering gravitational interactions
- **Uncertainty Visualization**: Show prediction uncertainty ranges
- **Interactive Predictions**: User-controlled prediction parameters
- **Prediction Comparison**: Compare multiple prediction scenarios
