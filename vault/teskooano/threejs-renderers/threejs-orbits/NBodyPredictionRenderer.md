---
name: "NBodyPredictionRenderer"
description: "Specialized renderer for N-body future trajectory prediction visualization with modular architecture"
package: "@teskooano/renderer-threejs-orbits"
dependencies:
  [
    "@teskooano/data-types",
    "@teskooano/renderer-threejs-objects",
    "@teskooano/core-state",
    "@teskooano/renderer-threejs-helpers",
    "@teskooano/renderer-threejs-labels",
    "three",
  ]
classes:
  [
    "THREE.Line",
    "THREE.Group",
    "THREE.Color",
    "THREE.Vector3",
    "THREE.Material",
    "THREE.LineDashedMaterial",
    "THREE.Object3D",
    "StateSubscriptionMixin",
    "LineHelper",
    "TrailCurveInterpolator",
    "PredictionCalculator",
    "PredictionAnimation",
    "PredictionLabels",
    "Layer2DManager",
  ]
functions:
  [
    "update",
    "updatePrediction",
    "startAnimation",
    "drawPredictionLine",
    "removePrediction",
    "clearAllPredictions",
    "highlight",
    "setVisibility",
    "setPredictionVisibility",
    "dispose",
    "getPerformanceStats",
    "setCurveConfig",
    "getCurveConfig",
    "setPredictionDuration",
    "setPredictionSteps",
  ]
constants: []
types: ["RenderableCelestialObject", "TrailCurveConfig", "TrailCurveType"]
---

# NBodyPredictionRenderer

Specialized renderer for N-body future trajectory prediction visualization, providing physics-based prediction rendering with modular architecture, animation support, and 2D label integration.

## 🎯 Purpose

`NBodyPredictionRenderer` renders future trajectory predictions for celestial objects in N-body simulation mode, showing the calculated future path of objects based on physics simulation. It uses a modular architecture with separate components for calculation, rendering, animation, and labeling.

## 🏗️ Architecture

### Core Components

The renderer uses a modular architecture with specialized components:

```typescript
class NBodyPredictionRenderer extends StateSubscriptionMixin {
  private predictionLines: Map<string, THREE.Line> = new Map();
  private isCalculating: boolean = false;
  private objectManager: ObjectManager;
  private layer2DManager: Layer2DManager | null = null;
  private predictionDuration: number = 0;
  private predictionSteps: number = 60;
  private visualizationVisible: boolean = true;
  private predictionLinesGroup: THREE.Group;
  private lineBuilder: LineHelper;
  private curveConfig: TrailCurveConfig;
  private highlightedObjectId: string | null = null;

  // Modular Components
  private calculator: PredictionCalculator;
  private animation: PredictionAnimation;
  private labels: PredictionLabels;
}
```

### Modular Architecture

- **PredictionCalculator**: Handles physics-based trajectory calculations
- **PredictionAnimation**: Manages smooth animation transitions
- **PredictionLabels**: Handles 2D label visualization
- **Main Renderer**: Orchestrates all components and manages 3D lines

## 🚀 Core Features

### Physics-based Prediction Visualization

Renders future trajectories using physics simulation:

```typescript
updatePrediction(
  objectId: string,
  options: {
    forceRecalculate: boolean;
    timeScale?: number;
    predictionSteps?: number;
  }
): boolean
```

**Features:**

- **Physics Integration**: Uses core physics engine for calculations
- **WASM Spatial Partitioning**: Efficient spatial calculations
- **Configurable Parameters**: Adjustable duration and step count
- **Relative Coordinates**: Support for relative positioning

### Modular Component Architecture

Separated concerns for better maintainability:

```typescript
// Initialize modular components
this.calculator = new PredictionCalculator();
this.animation = new PredictionAnimation();
this.labels = new PredictionLabels(objectManager, this.predictionLinesGroup);
```

**Components:**

- **Calculator**: Handles trajectory calculations using physics engine
- **Animation**: Manages smooth transitions between prediction states
- **Labels**: Handles 2D time markers and countdown labels

### Advanced Curve Interpolation

Configurable curve interpolation for smooth predictions:

```typescript
private curveConfig: TrailCurveConfig = {
  type: TrailCurveType.Orbital,
  tension: 0.5,
  segments: 6,
  smoothing: 0.4,
  adaptiveThreshold: 8,
};
```

**Features:**

- **Orbital-aware Interpolation**: Specialized for orbital motion
- **Configurable Parameters**: Tension, segments, smoothing, adaptive threshold
- **Quality Control**: Adjustable quality settings
- **Performance Optimization**: Efficient interpolation algorithms

### Animation Support

Smooth animation transitions for prediction updates:

```typescript
// Start animation for prediction line
private startAnimation(objectId: string, newPoints: THREE.Vector3[]): void {
  if (newPoints.length === 0) {
    this.removePrediction(objectId);
    return;
  }

  // Draw the prediction line
  this.drawPredictionLine(objectId, newPoints);

  // Get the line for animation
  const line = this.getPredictionLine(objectId);
  if (line) {
    this.animation.startAnimation(objectId, newPoints, line);
  }
}
```

**Features:**

- **Smooth Transitions**: Interpolated transitions between prediction states
- **Animation Control**: Configurable animation duration and easing
- **State Management**: Tracks animation state and progress
- **Performance Optimization**: Efficient animation updates

## 🔧 Key Methods

### Constructor

```typescript
constructor(
  objectManager: ObjectManager,
  curveConfig?: TrailCurveConfig,
  predictionLinesGroup?: THREE.Group
)
```

**Parameters:**

- `objectManager`: Scene's ObjectManager for rendering operations
- `curveConfig`: Optional curve configuration for prediction interpolation
- `predictionLinesGroup`: Optional shared group for prediction-related lines

### Prediction Update Methods

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

updatePrediction(
  objectId: string,
  options: {
    forceRecalculate: boolean;
    timeScale?: number;
    predictionSteps?: number;
  }
): boolean
```

**Process:**

1. **Animation Update**: Updates animation state
2. **Line Animation**: Updates line during animation if needed
3. **Prediction Calculation**: Triggers prediction calculation for highlighted object
4. **Component Coordination**: Coordinates all modular components

### Line Management

```typescript
private drawPredictionLine(objectId: string, predictionPoints: THREE.Vector3[]): void
private startAnimation(objectId: string, newPoints: THREE.Vector3[]): void
```

**Features:**

- **Curve Interpolation**: Applies curve interpolation to prediction points
- **Line Creation**: Creates or updates THREE.Line objects
- **Material Management**: Uses prediction materials with highlighting
- **Scene Integration**: Adds lines to prediction lines group

## 🔄 Data Flow

### Prediction Calculation Flow

```typescript
// 1. Calculate prediction trajectory using modular calculator
this.calculator
  .calculatePredictionTrajectory(objectId)
  .then((result: { points: any[]; timestamps: number[] }) => {
    this.isCalculating = false;

    if (result.points.length > 0) {
      // 2. Convert OSVector3 points to THREE.Vector3
      const threePoints = result.points.map((p) => p.toThreeJS());

      // 3. Start animation
      this.startAnimation(objectId, threePoints);

      // 4. Update labels
      this.labels.updatePredictionLabels(threePoints, result.timestamps);
    }
  });
```

### Animation Flow

```typescript
// 1. Update animation state
this.animation.update(deltaTime);

// 2. Update line during animation if needed
const highlightedObjectId = this.animation.getHighlightedObjectId();
if (highlightedObjectId && this.animation.isAnimationRunning()) {
  const line = this.getPredictionLine(highlightedObjectId);
  if (line) {
    this.animation.updateLineDuringAnimation(line);
  }
}
```

### Label Update Flow

```typescript
// 1. Update prediction labels with new trajectory data
this.labels.updatePredictionLabels(points, timestamps);

// 2. Configure labels for highlighted object
if (objectId) {
  this.labels.configurePredictionLabels(objectId);
}
```

## 🎨 Visualization Features

### Prediction Line Styling

Advanced styling for prediction visualization:

```typescript
// Dashed material for predictions
const material = SharedMaterials.clone("PREDICTION");
line = this.lineBuilder.createLine(
  predictionSteps,
  material,
  `prediction-line-${objectId}`,
);
line.frustumCulled = true;
```

**Features:**

- **Dashed Lines**: Distinct visual style for predictions
- **Yellow Color**: Clear distinction from trails
- **Transparency**: Subtle visualization with reduced opacity
- **Frustum Culling**: Performance optimization for distant predictions

### Curve Interpolation

Multiple interpolation types for different prediction scenarios:

```typescript
// Apply curve interpolation to prediction points
const interpolatedPoints = TrailCurveInterpolator.interpolate(
  predictionPoints,
  this.curveConfig,
);
```

**Interpolation Types:**

- **Orbital**: Orbital-aware interpolation for celestial objects
- **Smooth**: Smooth curve interpolation for visual appeal
- **Linear**: Simple linear interpolation for performance
- **Adaptive**: Automatic interpolation based on prediction characteristics

### 2D Label Integration

Time markers and countdown labels:

```typescript
// Update prediction labels with trajectory data
this.labels.updatePredictionLabels(threePoints, result.timestamps);

// Configure labels for highlighted object
this.labels.configurePredictionLabels(objectId);
```

**Label Features:**

- **Time Markers**: Fixed time interval markers along trajectory
- **Countdown Labels**: Real-time countdown to reach marker positions
- **Moving Markers**: Markers that move with object position
- **Visibility Control**: Show/hide labels based on highlighting

## 📊 Performance Considerations

### Calculation Optimization

- **WASM Integration**: Uses WebAssembly for spatial calculations
- **Asynchronous Processing**: Non-blocking prediction calculations
- **Calculation Throttling**: Prevents excessive calculations
- **Result Caching**: Caches calculation results for reuse

### Rendering Optimization

- **Modular Architecture**: Separated concerns for better performance
- **Efficient Line Updates**: Optimized geometry updates
- **Material Reuse**: Efficient material cloning and management
- **Frustum Culling**: Performance optimization for distant predictions

### Animation Performance

- **Smooth Transitions**: Efficient interpolation for animations
- **State Management**: Optimized animation state tracking
- **Frame-based Updates**: Efficient animation frame updates
- **Memory Management**: Proper cleanup of animation resources

## 🔧 Integration Points

### Physics Engine Integration

```typescript
// Integrate with core physics engine
this.calculator.calculatePredictionTrajectory(objectId).then((result) => {
  // Process prediction results
});
```

### Label System Integration

```typescript
// Integrate with 2D label system
this.labels.setLayer2DManager(manager);
this.labels.updatePredictionLabels(points, timestamps);
```

### Scene Management Integration

```typescript
// Integrate with scene graph
this.predictionLinesGroup.add(line);
this.objectManager.addRawObjectToScene(this.predictionLinesGroup);
```

## 🎯 Usage Examples

### Basic Prediction Rendering

```typescript
import { NBodyPredictionRenderer } from "@teskooano/renderer-threejs-orbits";

const renderer = new NBodyPredictionRenderer(objectManager, {
  type: TrailCurveType.Orbital,
  tension: 0.5,
  segments: 6,
  smoothing: 0.4,
  adaptiveThreshold: 8,
});

// Update prediction for an object
renderer.updatePrediction("earth", { forceRecalculate: true });
```

### Configuration Management

```typescript
// Set prediction parameters
renderer.setPredictionDuration(3600); // 1 hour
renderer.setPredictionSteps(120); // 120 steps

// Configure curve settings
renderer.setCurveConfig({
  type: TrailCurveType.Smooth,
  tension: 0.7,
  segments: 10,
  smoothing: 0.3,
  adaptiveThreshold: 5,
});
```

### Highlighting and Visibility

```typescript
// Highlight specific prediction
renderer.highlight("earth", new THREE.Color(0x00ff00));

// Control visibility
renderer.setVisibility(true);
renderer.setPredictionVisibility(true);

// Remove specific prediction
renderer.removePrediction("earth");

// Clear all predictions
renderer.clearAllPredictions();
```

### Label Integration

```typescript
// Set up 2D label manager
renderer.setLayer2DManager(layer2DManager);

// Update with trajectory data
renderer.update(objects, visualSettings, deltaTime);
```

### Performance Monitoring

```typescript
// Get performance statistics
const stats = renderer.getPerformanceStats();
console.log("Prediction lines count:", stats.predictionLinesCount);
```

## 🔍 Debug Features

### Performance Statistics

```typescript
// Monitor prediction performance
const stats = renderer.getPerformanceStats();
console.log("Active prediction lines:", stats.predictionLinesCount);
```

### Configuration Inspection

```typescript
// Inspect curve configuration
const config = renderer.getCurveConfig();
console.log("Current curve config:", config);
```

### Component Inspection

```typescript
// Inspect modular components
console.log("Calculator:", renderer.calculator);
console.log("Animation:", renderer.animation);
console.log("Labels:", renderer.labels);
```

## 🚀 Future Enhancements

### Planned Features

- **Advanced Animation**: More sophisticated animation effects
- **Prediction Uncertainty**: Visualization of prediction uncertainty ranges
- **Multi-object Predictions**: Simultaneous predictions for multiple objects

### Optimization Opportunities

- **GPU Acceleration**: Move calculations to GPU using compute shaders
- **Predictive Caching**: Cache prediction results for reuse
- **LOD System**: Level-of-detail for distant predictions

### Advanced Features

- **Prediction Analytics**: Prediction analysis and statistics
- **Interactive Predictions**: User-controlled prediction parameters
- **Prediction Export**: Export prediction data for analysis
