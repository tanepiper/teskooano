---
name: "NBodyStrategy"
description: "N-Body orbit visualization strategy for real-time physics-based trails and predictions"
package: "@teskooano/renderer-threejs-orbits"
dependencies:
  [
    "@teskooano/data-types",
    "@teskooano/renderer-threejs-objects",
    "@teskooano/renderer-threejs-labels",
    "@teskooano/renderer-threejs-celestial",
    "three",
  ]
classes:
  [
    "SimpleOrbitalRenderer",
    "PredictionManager",
    "THREE.Color",
    "THREE.Group",
    "ObjectManager",
    "Layer2DManager",
    "CelestialRenderer",
    "BaseCelestialRenderer",
  ]
functions:
  [
    "update",
    "highlight",
    "highlightPrediction",
    "setVisibility",
    "setPredictionVisibility",
    "clearAllTrails",
    "clearAllPredictions",
    "dispose",
    "getPerformanceStats",
    "getRenderer",
  ]
constants: ["orbitalUpdateFrequency", "predictionUpdateFrequency"]
types:
  ["IOrbitVisualizationStrategy", "RenderableCelestialObject", "TrailCurveType"]
---

# NBodyStrategy

Implementation of the orbit visualization strategy for N-Body simulation modes, providing real-time physics-based trails and predictions that adapt to actual simulation results.

## 🎯 Purpose

`NBodyStrategy` handles visualization for all N-Body physics modes, regardless of the specific algorithm (direct, barnes-hut, fmm, etc.) or integrator (verlet, rk4, etc.) being used. It renders dynamic visualizations based on actual physics simulation results rather than static mathematical formulas.

## 🏗️ Architecture

### Core Components

The strategy manages two main visualization types:

```typescript
class NBodyStrategy implements IOrbitVisualizationStrategy {
  public orbitalRenderer: SimpleOrbitalRenderer;
  public predictionManager: PredictionManager;
  private highlightedObjectId: string | null = null;
  private orbitalUpdateCounter: number = 0;
  private predictionUpdateCounter: number = 0;
  private celestialRenderers: Map<string, CelestialRenderer>;
}
```

### Visualization Types

1. **Historical Trails**: Shows the actual path an object has followed using `SimpleOrbitalRenderer`
2. **Predictive Trajectories**: Shows calculated future paths using `PredictionManager`

### Performance Optimization

- **Throttled Updates**: Uses counters to limit update frequency
- **Direct Data Access**: Uses `PositionHistoryManager` data directly
- **Efficient Rendering**: Minimizes computational overhead

## 🚀 Core Features

### Real-time Trail Visualization

Creates trails from actual physics simulation data:

```typescript
// Updates orbital lines using PositionHistoryManager data
Object.values(objects).forEach((obj) => {
  const renderer = this.getRenderer(obj.id);
  if (renderer && renderer.positionHistoryManager) {
    this.orbitalRenderer.updateOrbitalLine(
      obj.id,
      renderer.positionHistoryManager,
    );
  }
});
```

**Features:**

- **Real Physics Data**: Uses actual position history from simulation
- **Dynamic Updates**: Adapts to changing physics conditions
- **Performance Throttling**: Updates every 10 frames by default
- **Direct Integration**: Accesses `PositionHistoryManager` directly

### Future Trajectory Prediction

Provides physics-based prediction visualization:

```typescript
// Update prediction for highlighted object
if (this.highlightedObjectId) {
  this.predictionManager.updatePrediction(this.highlightedObjectId, {
    forceRecalculate: true,
    timeScale: visualSettings.timeScale,
    predictionSteps: visualSettings.predictionSteps,
  });
}
```

**Features:**

- **Physics-based Predictions**: Uses core physics engine for calculations
- **Highlighting Support**: Shows predictions for specific objects
- **Configurable Parameters**: Adjustable time scale and prediction steps
- **Performance Optimization**: Updates every 90 frames by default

### Highlighting System

Advanced highlighting for both trails and predictions:

```typescript
highlight(objectId: string | null, color: THREE.Color): void {
  this.highlightedObjectId = objectId;
  this.orbitalRenderer.setHighlightedObject(objectId, color);
}

highlightPrediction(objectId: string | null): void {
  this.highlightedObjectId = objectId;
  this.predictionManager.highlightPrediction(objectId);
}
```

**Features:**

- **Trail Highlighting**: Highlights historical trails
- **Prediction Highlighting**: Shows predictions for specific objects
- **Color Customization**: Configurable highlight colors
- **State Management**: Tracks highlighted object state

## 🔧 Key Methods

### Constructor

```typescript
constructor(
  objectManager: ObjectManager,
  layer2DManager: Layer2DManager,
  predictionLinesGroup: THREE.Group,
  celestialRenderers: Map<string, CelestialRenderer>
)
```

**Parameters:**

- `objectManager`: Scene's ObjectManager for rendering operations
- `layer2DManager`: Manager for 2D labels (prediction markers)
- `predictionLinesGroup`: Shared group for orbit-related lines
- `celestialRenderers`: Map of renderers for accessing position history

### Update Method

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
```

**Process:**

1. **Performance Update**: Updates PredictionManager state
2. **Trail Updates**: Updates orbital lines using throttled counter
3. **Prediction Updates**: Updates predictions for highlighted objects
4. **Renderer Access**: Gets position history from celestial renderers

### Renderer Access

```typescript
private getRenderer(objectId: string): BaseCelestialRenderer | undefined
```

**Purpose:**

- Retrieves celestial renderer for specific object
- Provides access to `PositionHistoryManager`
- Casts to `BaseCelestialRenderer` for position history access

## 🔄 Data Flow

### Trail Visualization Flow

```typescript
// 1. Check update frequency
if (this.orbitalUpdateCounter >= this.orbitalUpdateFrequency) {
  // 2. Reset counter
  this.orbitalUpdateCounter = 0;

  // 3. Update all object trails
  Object.values(objects).forEach((obj) => {
    const renderer = this.getRenderer(obj.id);
    if (renderer && renderer.positionHistoryManager) {
      // 4. Update orbital line with position history
      this.orbitalRenderer.updateOrbitalLine(
        obj.id,
        renderer.positionHistoryManager,
      );
    }
  });
}
```

### Prediction Visualization Flow

```typescript
// 1. Check prediction update frequency
if (this.predictionUpdateCounter >= this.predictionUpdateFrequency) {
  // 2. Reset counter
  this.predictionUpdateCounter = 0;

  // 3. Update prediction for highlighted object
  if (this.highlightedObjectId) {
    this.predictionManager.updatePrediction(this.highlightedObjectId, {
      forceRecalculate: true,
      timeScale: visualSettings.timeScale,
      predictionSteps: visualSettings.predictionSteps,
    });
  }
}
```

### Highlighting Flow

```typescript
// 1. Set highlighted object ID
this.highlightedObjectId = objectId;

// 2. Apply trail highlighting
this.orbitalRenderer.setHighlightedObject(objectId, color);

// 3. Apply prediction highlighting (separate method)
this.predictionManager.highlightPrediction(objectId);
```

## 🎨 Visualization Features

### Trail Configuration

Configured for N-body visualization:

```typescript
// SimpleOrbitalRenderer uses PositionHistoryManager directly
this.orbitalRenderer = new SimpleOrbitalRenderer(objectManager);
```

**Features:**

- **Direct Data Access**: Uses existing position history
- **No Shared Group**: Attaches lines to each celestial's group
- **Efficient Updates**: Minimal processing overhead
- **Real-time Adaptation**: Follows actual object movement

### Prediction Configuration

Advanced curve interpolation for predictions:

```typescript
this.predictionManager = new PredictionManager(
  objectManager,
  {
    type: TrailCurveType.Orbital,
    tension: 0.5,
    segments: 6,
    smoothing: 0.4,
    adaptiveThreshold: 8,
  },
  predictionLinesGroup,
);
```

**Features:**

- **Orbital Curve Type**: Optimized for orbital motion
- **Smooth Interpolation**: High-quality curve rendering
- **Adaptive Threshold**: Performance optimization
- **Label Integration**: 2D label support for predictions

### Performance Throttling

Configurable update frequencies:

```typescript
private readonly orbitalUpdateFrequency: number = 10;  // Every 10 frames
private readonly predictionUpdateFrequency: number = 90; // Every 90 frames
```

**Benefits:**

- **Orbital Updates**: Frequent enough for smooth trails
- **Prediction Updates**: Less frequent for complex calculations
- **Performance Balance**: Maintains smooth frame rates
- **Visual Quality**: Preserves visual fidelity

## 📊 Performance Considerations

### Update Optimization

- **Throttled Updates**: Separate frequencies for trails and predictions
- **Conditional Updates**: Only update when necessary
- **Direct Data Access**: Bypasses complex data processing
- **Efficient Rendering**: Reuses existing position data

### Memory Management

- **Renderer Reuse**: Shares celestial renderers with main system
- **Position History**: Uses existing position history data
- **Object Pooling**: Leverages renderer object pooling
- **Group Management**: Efficient scene graph organization

### Computational Efficiency

- **Physics Integration**: Uses core physics engine efficiently
- **Prediction Caching**: Caches prediction results
- **Highlighting Optimization**: Minimizes highlighting overhead
- **Counter Management**: Efficient update throttling

## 🔧 Integration Points

### Position History Integration

```typescript
// Access position history from celestial renderers
const renderer = this.getRenderer(obj.id);
if (renderer && renderer.positionHistoryManager) {
  this.orbitalRenderer.updateOrbitalLine(
    obj.id,
    renderer.positionHistoryManager,
  );
}
```

### Physics Engine Integration

```typescript
// Prediction updates use physics engine
this.predictionManager.updatePrediction(this.highlightedObjectId, {
  forceRecalculate: true,
  timeScale: visualSettings.timeScale,
  predictionSteps: visualSettings.predictionSteps,
});
```

### Label System Integration

```typescript
// 2D label integration for predictions
if (layer2DManager) {
  this.predictionManager.setLayer2DManager(layer2DManager);
}
```

## 🎯 Usage Examples

### Basic Strategy Usage

```typescript
import { NBodyStrategy } from "@teskooano/renderer-threejs-orbits";

const strategy = new NBodyStrategy(
  objectManager,
  layer2DManager,
  predictionLinesGroup,
  celestialRenderers,
);

// Update strategy
strategy.update(objects, visualSettings, deltaTime);
```

### Highlighting Objects

```typescript
// Highlight trail
strategy.highlight("earth", new THREE.Color(0xff0000));

// Highlight prediction
strategy.highlightPrediction("earth");

// Clear highlighting
strategy.highlight(null, new THREE.Color());
strategy.highlightPrediction(null);
```

### Visibility Control

```typescript
// Control overall visibility
strategy.setVisibility(true);

// Control prediction visibility separately
strategy.setPredictionVisibility(false);
```

### Performance Monitoring

```typescript
// Get performance statistics
const stats = strategy.getPerformanceStats();
console.log("Orbital lines:", stats.orbitalLinesCount);
console.log("Prediction lines:", stats.predictionLinesCount);
```

## 🔍 Debug Features

### Performance Statistics

```typescript
// Monitor strategy performance
const stats = strategy.getPerformanceStats();
console.log("Strategy performance:", stats);
```

### Update Frequency Monitoring

```typescript
// Monitor update frequencies
console.log("Orbital update frequency:", strategy.orbitalUpdateFrequency);
console.log("Prediction update frequency:", strategy.predictionUpdateFrequency);
```

### Renderer Access Verification

```typescript
// Verify renderer access
const renderer = strategy.getRenderer("earth");
console.log("Renderer found:", !!renderer);
console.log("Position history available:", !!renderer?.positionHistoryManager);
```

## 🚀 Future Enhancements

### Planned Features

- **Adaptive Update Frequencies**: Dynamic update frequency based on performance
- **Advanced Prediction Options**: Multiple prediction scenarios
- **Trail Quality Settings**: Configurable trail quality levels

### Optimization Opportunities

- **GPU Acceleration**: Move trail processing to GPU
- **Predictive Caching**: Cache prediction results for reuse
- **LOD System**: Level-of-detail for distant objects

### Advanced Features

- **Multi-object Predictions**: Simultaneous predictions for multiple objects
- **Uncertainty Visualization**: Show prediction uncertainty ranges
- **Interactive Controls**: User-controlled prediction parameters
