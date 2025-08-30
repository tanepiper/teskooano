---
name: "OrbitsManager"
description: "Main orchestrator for orbital visualization system using Strategy pattern"
package: "@teskooano/renderer-threejs-orbits"
dependencies:
  [
    "@teskooano/core-state",
    "@teskooano/data-types",
    "@teskooano/renderer-threejs-objects",
    "@teskooano/renderer-threejs-labels",
    "@teskooano/renderer-threejs-celestial",
    "three",
    "rxjs",
  ]
classes:
  [
    "StateSubscriptionMixin",
    "THREE.Group",
    "THREE.Color",
    "ObjectManager",
    "Layer2DManager",
    "CelestialRenderer",
    "IdealStrategy",
    "NBodyStrategy",
    "IOrbitVisualizationStrategy",
    "PredictionManager",
    "TrailManager",
    "TrailCurveConfig",
  ]
functions:
  [
    "switchMode",
    "updateOrbitLines",
    "createOrbitLine",
    "updateTrailLine",
    "createTrailLine",
    "updatePredictionLine",
    "createPredictionLine",
    "dispose",
    "initialize",
    "update",
    "addObject",
    "removeObject",
    "setHighlight",
    "setVisibility",
    "highlightVisualization",
    "setPredictionDuration",
  ]
constants: ["OrbitDisplayMode"]
types:
  [
    "OrbitDisplayMode",
    "RenderableCelestialObject",
    "TrailCurveConfig",
    "IOrbitVisualizationStrategy",
    "RendererStateAdapter",
  ]
---

# OrbitsManager

The main orchestrator for the orbital visualization system, implementing the Strategy pattern to seamlessly switch between Ideal and N-Body visualization modes.

## 🎯 Purpose

`OrbitsManager` serves as the public-facing facade that coordinates the entire orbital visualization system. It uses the Strategy pattern to delegate visualization implementation to specialized classes while providing a unified API for controlling visualizations.

## 🏗️ Architecture

### Strategy Pattern Implementation

The manager automatically selects the appropriate strategy based on the current simulation configuration:

```typescript
enum OrbitDisplayMode {
  Ideal = "IDEAL", // Perfect Keplerian orbits
  NBody = "NBODY", // Real-time N-Body physics
}
```

**Strategy Delegation:**

- **IdealStrategy**: Renders perfect elliptical orbits using Keplerian parameters
- **NBodyStrategy**: Renders dynamic trails and predictions based on N-Body simulation

### Core Responsibilities

1. **Mode Switching**: Seamlessly transitions between visualization strategies
2. **Orchestration**: Holds instances of all sub-managers and delegates update calls
3. **Lifecycle Management**: Adds/removes visualizations as objects appear/disappear
4. **API Facade**: Provides clean public API for controlling visualizations

## 🔧 Key Components

### State Management

```typescript
private stateAdapter: RendererStateAdapter;
private currentMode: OrbitDisplayMode = OrbitDisplayMode.Ideal;
private activeStrategy?: IOrbitVisualizationStrategy;
```

### Visualization Groups

```typescript
private idealOrbitLinesGroup: THREE.Group;
private predictionLinesGroup: THREE.Group;
```

### Object Tracking

```typescript
private latestRenderableObjects: Record<string, RenderableCelestialObject> = {};
private celestialRenderers: Map<string, CelestialRenderer> = new Map();
```

## 🚀 Core Methods

### Constructor

```typescript
constructor(
  objectManager: ObjectManager,
  stateAdapter: RendererStateAdapter,
  renderableObjects$: Observable<Record<string, RenderableCelestialObject>>,
  layer2DManager?: Layer2DManager
)
```

**Parameters:**

- `objectManager`: The scene's ObjectManager for rendering operations
- `stateAdapter`: Adapter for accessing engine state and settings
- `renderableObjects$`: Observable stream of renderable object data
- `layer2DManager`: Optional manager for 2D labels

### Mode Switching

```typescript
private switchMode(mode: OrbitDisplayMode): void
```

**Behavior:**

- Detects changes in simulation configuration
- Switches between Ideal and N-Body strategies
- Handles cleanup and initialization of strategies
- Provides smooth transitions between modes

### Update Cycle

```typescript
update(): void
```

**Process:**

1. **State Synchronization**: Updates internal state from observables
2. **Strategy Delegation**: Delegates update to active strategy
3. **Object Lifecycle**: Handles object creation/removal
4. **Performance Monitoring**: Tracks update performance

### Visibility Control

```typescript
setVisibility(visible: boolean): void
```

**Features:**

- Controls visibility of all orbit-related visualizations
- Propagates visibility changes to active strategy
- Handles both orbit lines and prediction lines

### Highlighting System

```typescript
highlightVisualization(objectId: string, highlighted: boolean): void
```

**Prediction Highlighting Delegation:**
This manager acts as a delegation point in the prediction highlighting system:

1. **Receives highlighting requests** from RenderingOrchestrator
2. **Delegates to appropriate strategy** based on simulation mode
3. **Uses optional interface methods** to avoid type casting
4. **Only NBodyStrategy supports prediction highlighting** (IdealStrategy does not)
5. **Provides unified interface** regardless of underlying strategy

## 🔄 Data Flow

### State Subscription

```typescript
// Subscribes to visual settings changes
this.stateSubscription = this.stateAdapter.$visualSettings
  .pipe(
    map((settings) => settings.orbitDisplayMode),
    distinctUntilChanged(),
  )
  .subscribe((mode) => this.switchMode(mode));
```

### Object Updates

```typescript
// Subscribes to renderable object changes
this.objectsSubscription = this.renderableObjects$.subscribe((objects) => {
  this.latestRenderableObjects = objects;
  this.updateObjectLifecycle(objects);
});
```

## 🎨 Configuration

### Transition Feedback

```typescript
private configurationFeedback: {
  lastConfig?: { mode: string; algorithm?: string; integrator?: string };
  transitionStartTime?: number;
  transitionDuration: number;
} = {
  transitionDuration: 300, // 300ms transition
};
```

### Highlighting Colors

```typescript
private highlightColor: THREE.Color = new THREE.Color(0x00ff00);
```

## 🔧 Integration Points

### Object Manager Integration

```typescript
// Adds/removes visualizations from scene
this.objectManager.addObject(orbitLine);
this.objectManager.removeObject(objectId);
```

### Label System Integration

```typescript
// Passes label manager to strategies
this.activeStrategy?.setLabelManager(this.layer2DManager);
```

### Celestial Renderer Integration

```typescript
// Tracks celestial renderers for position updates
this.celestialRenderers.set(objectId, celestialRenderer);
```

## 📊 Performance Considerations

### Update Optimization

- **Throttled Updates**: Reduces unnecessary processing
- **Strategy Delegation**: Only active strategy processes updates
- **Object Lifecycle**: Efficient object creation/removal

### Memory Management

- **Group Organization**: Uses shared groups for efficient rendering
- **Object Tracking**: Maintains minimal object references
- **Strategy Cleanup**: Proper disposal of inactive strategies

### State Synchronization

- **Observable Pattern**: Efficient state propagation
- **Change Detection**: Only processes relevant state changes
- **Batch Updates**: Groups multiple updates for efficiency

## 🎯 Usage Examples

### Basic Setup

```typescript
const orbitsManager = new OrbitsManager(
  objectManager,
  stateAdapter,
  renderableObjects$,
  layer2DManager,
);

// Enable orbit visualization
orbitsManager.setVisibility(true);
```

### Mode Control

```typescript
// Mode switching is automatic based on simulation configuration
// The manager handles all complexity internally

// Manual visibility control
orbitsManager.setVisibility(false);

// Highlight specific object
orbitsManager.highlightVisualization("earth", true);
```

### Configuration

```typescript
// Set prediction duration (N-Body mode only)
orbitsManager.setPredictionDuration(3600); // 1 hour

// Update is called automatically by the render loop
// The manager handles all the complexity internally
```

## 🔍 Debug Features

### Performance Monitoring

- **Update Timing**: Tracks update performance
- **Strategy Switching**: Monitors mode transition performance
- **Object Lifecycle**: Tracks object creation/removal performance

### Configuration Feedback

- **Transition Display**: Shows mode transition progress
- **Strategy Status**: Indicates active strategy
- **Object Count**: Tracks number of managed objects

## 🚀 Future Enhancements

### Planned Features

- **Advanced Transitions**: Smooth transitions between visualization modes
- **Performance Profiling**: Built-in performance analysis
- **Dynamic Configuration**: Runtime configuration changes

### Optimization Opportunities

- **Lazy Loading**: Load strategies on demand
- **Predictive Switching**: Anticipate mode changes
- **Memory Pooling**: Shared memory pools for strategies
