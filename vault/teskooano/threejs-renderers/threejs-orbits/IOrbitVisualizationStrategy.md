---
name: "IOrbitVisualizationStrategy"
description: "Interface defining the contract for orbit visualization strategies"
package: "@teskooano/renderer-threejs-orbits"
dependencies: ["@teskooano/data-types", "three"]
classes: ["THREE.Color"]
functions:
  [
    "update",
    "highlight",
    "setVisibility",
    "setPredictionVisibility",
    "highlightPrediction",
    "dispose",
  ]
constants: []
types: ["RenderableCelestialObject"]
---

# IOrbitVisualizationStrategy

Interface defining the contract for orbit visualization strategies, enabling the Strategy pattern implementation in the orbital visualization system.

## 🎯 Purpose

`IOrbitVisualizationStrategy` defines the common interface that all orbit visualization strategies must implement. This enables the `OrbitsManager` to switch between different visualization approaches (Ideal vs. N-Body) without changing its implementation, following the Strategy design pattern.

## 🏗️ Architecture

### Strategy Pattern Implementation

The interface enables seamless switching between visualization strategies:

```typescript
interface IOrbitVisualizationStrategy {
  update(objects, visualSettings, deltaTime): void;
  highlight(objectId, color): void;
  setVisibility(visible): void;
  setPredictionVisibility(visible): void;
  highlightPrediction?(objectId): void; // Optional method
  dispose(): void;
}
```

### Strategy Implementations

- **IdealStrategy**: Renders perfect Keplerian orbits using analytical calculations
- **NBodyStrategy**: Renders dynamic trails and predictions based on N-body physics

## 🚀 Core Methods

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

**Purpose:**

- Updates all visualizations based on current object state
- Handles object lifecycle (creation, updates, removal)
- Processes visual settings and time progression

**Parameters:**

- `objects`: Map of all renderable celestial objects by ID
- `visualSettings`: Current visual settings including time scale and prediction parameters
- `deltaTime`: Time elapsed since the last update in milliseconds

### Highlight Method

```typescript
highlight(objectId: string | null, color: THREE.Color): void
```

**Purpose:**

- Highlights a specific object's orbit visualization
- Applies color changes to the specified object's lines
- Clears highlighting when `objectId` is null

**Parameters:**

- `objectId`: ID of the object to highlight, or null to clear highlighting
- `color`: Color to use for highlighting

### Visibility Control Methods

```typescript
setVisibility(visible: boolean): void
setPredictionVisibility(visible: boolean): void
```

**Purpose:**

- Controls visibility of orbit and prediction visualizations
- Enables/disables rendering of specific visualization types
- Provides performance optimization when visualizations are hidden

### Optional Prediction Highlighting

```typescript
highlightPrediction?(objectId: string | null): void
```

**Purpose:**

- Optional method for prediction-specific highlighting
- Only implemented by strategies that support predictions (N-Body)
- Ideal strategies don't implement this method

### Resource Management

```typescript
dispose(): void
```

**Purpose:**

- Cleans up resources used by the strategy
- Called when switching to a different strategy
- Ensures proper memory management and cleanup

## 🔧 Strategy Implementations

### IdealStrategy

Implements the interface for perfect Keplerian orbit visualization:

```typescript
class IdealStrategy implements IOrbitVisualizationStrategy {
  update(objects, visualSettings, deltaTime) {
    // Renders static Keplerian orbits
    // Uses OrbitCalculator for analytical calculations
  }

  highlight(objectId, color) {
    // Highlights specific orbit lines
    // Applies color changes to Keplerian orbits
  }

  setVisibility(visible) {
    // Controls visibility of orbit lines
  }

  setPredictionVisibility(visible) {
    // No-op: Ideal strategy doesn't use predictions
  }

  // highlightPrediction is not implemented

  dispose() {
    // Cleans up Keplerian orbit lines
  }
}
```

### NBodyStrategy

Implements the interface for dynamic N-body visualization:

```typescript
class NBodyStrategy implements IOrbitVisualizationStrategy {
  update(objects, visualSettings, deltaTime) {
    // Updates trails and predictions
    // Uses real-time physics simulation data
  }

  highlight(objectId, color) {
    // Highlights trail lines
    // Applies color changes to dynamic trails
  }

  setVisibility(visible) {
    // Controls visibility of trail lines
  }

  setPredictionVisibility(visible) {
    // Controls visibility of prediction lines
  }

  highlightPrediction(objectId) {
    // Highlights specific prediction lines
    // Shows only the highlighted object's prediction
  }

  dispose() {
    // Cleans up trail and prediction managers
  }
}
```

## 🔄 Data Flow

### Strategy Selection

```typescript
// OrbitsManager selects strategy based on simulation mode
if (mode === OrbitDisplayMode.Ideal) {
  this.activeStrategy = new IdealStrategy(...);
} else {
  this.activeStrategy = new NBodyStrategy(...);
}
```

### Method Delegation

```typescript
// OrbitsManager delegates to active strategy
this.activeStrategy.update(objects, visualSettings, deltaTime);
this.activeStrategy.highlight(objectId, color);
this.activeStrategy.setVisibility(visible);
```

### Optional Method Handling

```typescript
// Safe handling of optional methods
if (this.activeStrategy.highlightPrediction) {
  this.activeStrategy.highlightPrediction(objectId);
}
```

## 🎯 Usage Examples

### Strategy Creation

```typescript
import {
  IOrbitVisualizationStrategy,
  IdealStrategy,
  NBodyStrategy,
} from "@teskooano/renderer-threejs-orbits";

// Create strategy based on mode
let strategy: IOrbitVisualizationStrategy;

if (mode === "ideal") {
  strategy = new IdealStrategy(
    objectManager,
    renderableObjects$,
    orbitLinesGroup,
  );
} else {
  strategy = new NBodyStrategy(
    objectManager,
    layer2DManager,
    predictionLinesGroup,
    celestialRenderers,
  );
}
```

### Strategy Usage

```typescript
// Update visualizations
strategy.update(objects, visualSettings, deltaTime);

// Highlight specific object
strategy.highlight("earth", new THREE.Color(0xff0000));

// Control visibility
strategy.setVisibility(true);
strategy.setPredictionVisibility(false);

// Optional prediction highlighting
if (strategy.highlightPrediction) {
  strategy.highlightPrediction("earth");
}
```

### Strategy Switching

```typescript
// Dispose old strategy
if (this.activeStrategy) {
  this.activeStrategy.dispose();
}

// Create new strategy
this.activeStrategy = this.createStrategy(newMode);

// Initialize new strategy
this.activeStrategy.setVisibility(this.orbitLinesVisible);
this.activeStrategy.setPredictionVisibility(this.predictionLinesVisible);
```

## 🔍 Debug Features

### Strategy Inspection

```typescript
// Check strategy type
console.log("Active strategy:", this.activeStrategy.constructor.name);

// Check optional method availability
console.log(
  "Supports prediction highlighting:",
  !!this.activeStrategy.highlightPrediction,
);
```

### Performance Monitoring

```typescript
// Monitor strategy performance
const startTime = performance.now();
this.activeStrategy.update(objects, visualSettings, deltaTime);
const endTime = performance.now();
console.log(`Strategy update took ${endTime - startTime}ms`);
```

## 🚀 Future Enhancements

### Planned Features

- **Hybrid Strategies**: Strategies that combine multiple visualization approaches
- **Dynamic Strategy Switching**: Runtime strategy changes based on performance
- **Strategy Composition**: Combining multiple strategies for complex visualizations

### Optimization Opportunities

- **Strategy Pooling**: Pre-allocated strategy instances for rapid switching
- **Lazy Loading**: Load strategies on demand to reduce memory usage
- **Performance Profiling**: Built-in strategy performance analysis

### Advanced Features

- **Custom Strategies**: User-defined visualization strategies
- **Strategy Plugins**: Extensible strategy system for third-party visualizations
- **Adaptive Strategies**: Strategies that automatically adjust based on system performance
