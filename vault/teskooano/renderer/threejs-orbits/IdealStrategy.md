---
aliases: [IdealStrategy]
tags: [renderer, threejs, orbits]
type: Class
package: "@teskooano/renderer-threejs-orbits"
name: IdealStrategy
dependencies:
  [
    "@teskooano/data-types",
    "@teskooano/renderer-threejs-objects",
    "three",
    "rxjs",
  ]
classes: ["KeplerianManager"]
types:
  ["IOrbitVisualizationStrategy", "RenderableCelestialObject", "TrailCurveType"]
functions:
  [
    "update",
    "highlight",
    "setVisibility",
    "clearAllTrails",
    "clearAllPredictions",
    "dispose",
    "setPredictionVisibility",
  ]
status: active
---

# IdealStrategy

Strategy for ideal Keplerian orbit visualization. Builds and updates perfect ellipse lines for bodies with orbital elements.

## Notes

- Uses [[KeplerianManager]] with `TrailCurveType.Orbital`
- Supports object highlighting; predictions are no-op in this mode

# IdealStrategy

Implementation of the orbit visualization strategy for Ideal (Keplerian) mode, rendering perfect elliptical orbits based on analytical orbital parameters for idealized gravitational systems.

## 🎯 Purpose

`IdealStrategy` renders perfect elliptical orbits based on analytical Keplerian orbital parameters. It creates static orbit lines that represent the perfect mathematical paths of celestial objects in an idealized gravitational system where only the primary gravitational influence is considered.

## 🏗️ Architecture

### Core Components

The strategy manages Keplerian orbit visualization:

```typescript
class IdealStrategy implements IOrbitVisualizationStrategy {
  private keplerianManager: KeplerianManager;
  private highlightedObjectId: string | null = null;
  private isVisible: boolean = true;
  private highlightColor: THREE.Color = new THREE.Color(0x00ff00);
}
```

### Mathematical Foundation

- **Keplerian Orbits**: Uses analytical orbital mechanics equations
- **Static Visualization**: Creates perfect elliptical orbit lines
- **Orbital Parameters**: Based on semi-major axis, eccentricity, inclination
- **No Physics Simulation**: Uses mathematical formulas instead of real-time physics

## 🚀 Core Features

### Perfect Elliptical Orbits

Creates mathematically perfect orbit visualizations:

```typescript
// Creates or updates perfect elliptical orbit lines
Object.values(objects).forEach((obj) => {
  if (obj.orbit && obj.parentId) {
    this.keplerianManager.createOrUpdate(
      obj.id,
      obj.orbit,
      obj.parentId,
      this.isVisible,
      this.highlightedObjectId,
      this.highlightColor,
    );
  }
});
```

**Features:**

- **Analytical Calculations**: Uses Kepler's laws for precise orbits
- **Perfect Ellipses**: Mathematically perfect orbital paths
- **Static Lines**: Orbit lines don't change during simulation
- **Parameter-based**: Based on orbital elements from object data

### Keplerian Manager Integration

Leverages KeplerianManager for orbit creation:

```typescript
this.keplerianManager = new KeplerianManager(
  objectManager,
  renderableObjects$,
  orbitLinesGroup,
  {
    type: TrailCurveType.Orbital,
    tension: 0.3,
    segments: 4,
    smoothing: 0.2,
    adaptiveThreshold: 5,
  },
);
```

**Features:**

- **Curve Interpolation**: Smooth orbital curve rendering
- **Performance Optimization**: Efficient curve generation
- **Observable Integration**: Reactive updates to object changes
- **Group Management**: Organized scene graph structure

### Highlighting System

Sophisticated highlighting for Keplerian orbits:

```typescript
highlight(objectId: string | null, color: THREE.Color): void {
  const previouslyHighlightedId = this.highlightedObjectId;
  this.highlightedObjectId = objectId;
  this.highlightColor = color;

  if (previouslyHighlightedId && previouslyHighlightedId !== objectId) {
    this.keplerianManager.resetPreviousHighlight(previouslyHighlightedId, objectId);
  }

  if (objectId) {
    this.keplerianManager.applyHighlightToObject(objectId, objectId, color);
  }
}
```

**Features:**

- **Previous Highlight Reset**: Properly manages highlight transitions
- **Color Customization**: Configurable highlight colors
- **State Management**: Tracks highlighted object state
- **Smooth Transitions**: Handles highlight changes gracefully

## 🔧 Key Methods

### Constructor

```typescript
constructor(
  objectManager: ObjectManager,
  renderableObjects$: Observable<Record<string, RenderableCelestialObject>>,
  orbitLinesGroup: THREE.Group
)
```

**Parameters:**

- `objectManager`: Scene's ObjectManager for rendering operations
- `renderableObjects$`: Observable stream of renderable object data
- `orbitLinesGroup`: Shared group for orbit-related lines

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

1. **Visibility Check**: Early return if not visible
2. **Object Iteration**: Process each renderable object
3. **Orbit Creation**: Create/update orbits for objects with orbital parameters
4. **Cleanup**: Remove orbits for objects without parameters

### Highlighting Management

```typescript
highlight(objectId: string | null, color: THREE.Color): void
```

**Features:**

- **Previous State Management**: Handles transitions between highlighted objects
- **Color Application**: Applies highlight color to specific orbits
- **State Tracking**: Maintains highlighted object ID and color
- **Delegation**: Uses KeplerianManager for actual highlighting

## 🔄 Data Flow

### Orbit Creation Flow

```typescript
// 1. Check object has orbital parameters
if (obj.orbit && obj.parentId) {
  // 2. Create or update orbit line
  this.keplerianManager.createOrUpdate(
    obj.id,
    obj.orbit,
    obj.parentId,
    this.isVisible,
    this.highlightedObjectId,
    this.highlightColor,
  );
} else if (this.keplerianManager.hasLine(obj.id)) {
  // 3. Remove orbit if no longer has parameters
  this.keplerianManager.remove(obj.id);
}
```

### Highlighting Flow

```typescript
// 1. Store previous highlight state
const previouslyHighlightedId = this.highlightedObjectId;

// 2. Update current state
this.highlightedObjectId = objectId;
this.highlightColor = color;

// 3. Reset previous highlight if different
if (previouslyHighlightedId && previouslyHighlightedId !== objectId) {
  this.keplerianManager.resetPreviousHighlight(
    previouslyHighlightedId,
    objectId,
  );
}

// 4. Apply new highlight
if (objectId) {
  this.keplerianManager.applyHighlightToObject(objectId, objectId, color);
}
```

### Visibility Control Flow

```typescript
// 1. Update internal state
this.isVisible = visible;

// 2. Delegate to KeplerianManager
this.keplerianManager.setVisibility(visible);
```

## 🎨 Visualization Features

### Keplerian Curve Configuration

Optimized for perfect orbital visualization:

```typescript
{
  type: TrailCurveType.Orbital,
  tension: 0.3,
  segments: 4,
  smoothing: 0.2,
  adaptiveThreshold: 5,
}
```

**Features:**

- **Orbital Curve Type**: Specialized for orbital motion
- **Low Tension**: Preserves elliptical shape accuracy
- **Moderate Segments**: Balance between quality and performance
- **Light Smoothing**: Maintains mathematical precision
- **Conservative Threshold**: Preserves orbital details

### Static Orbit Lines

Mathematical precision for ideal orbits:

```typescript
// Perfect elliptical orbits based on orbital parameters
const orbitPoints = OrbitCalculator.calculateOrbitalPoints(
  obj.orbit,
  numberOfPoints,
);
```

**Features:**

- **Mathematical Precision**: Uses analytical orbital mechanics
- **Perfect Ellipses**: Mathematically accurate orbital paths
- **Parameter-based**: Derived from orbital elements
- **Static Nature**: Unchanging during simulation

### Highlighting Effects

Advanced highlighting for ideal orbits:

```typescript
// Apply highlighting with smooth transitions
this.keplerianManager.applyHighlightToObject(objectId, objectId, color);

// Reset previous highlights cleanly
this.keplerianManager.resetPreviousHighlight(previouslyHighlightedId, objectId);
```

**Features:**

- **Smooth Transitions**: Clean highlight changes
- **Color Customization**: Configurable highlight colors
- **State Management**: Proper highlight state tracking
- **Visual Feedback**: Clear visual indication of selection

## 📊 Performance Considerations

### Computational Efficiency

- **Analytical Calculations**: No real-time physics simulation needed
- **Static Orbits**: Orbit lines don't change during simulation
- **Efficient Updates**: Only update when objects change
- **Mathematical Precision**: Fast analytical orbit calculations

### Memory Management

- **Static Lines**: Orbit lines created once and reused
- **Efficient Storage**: Minimal memory footprint for orbit data
- **Group Management**: Organized scene graph structure
- **Resource Cleanup**: Proper disposal of unused orbits

### Rendering Optimization

- **Curve Interpolation**: Efficient curve generation
- **LOD Support**: Level-of-detail for distant orbits
- **Visibility Culling**: Hide non-visible orbits
- **Batch Processing**: Group orbit updates for efficiency

## 🔧 Integration Points

### Observable Integration

```typescript
// Reactive updates to object changes
this.keplerianManager = new KeplerianManager(
  objectManager,
  renderableObjects$,
  orbitLinesGroup,
  curveConfig,
);
```

### Orbital Parameters Integration

```typescript
// Use orbital parameters from celestial objects
if (obj.orbit && obj.parentId) {
  this.keplerianManager.createOrUpdate(obj.id, obj.orbit, obj.parentId, ...);
}
```

### Scene Management Integration

```typescript
// Integrate with scene graph
this.keplerianManager.setVisibility(visible);
this.keplerianManager.clearAll();
```

## 🎯 Usage Examples

### Basic Strategy Usage

```typescript
import { IdealStrategy } from "@teskooano/renderer-threejs-orbits";

const strategy = new IdealStrategy(
  objectManager,
  renderableObjects$,
  orbitLinesGroup,
);

// Update strategy
strategy.update(objects, visualSettings, deltaTime);
```

### Highlighting Objects

```typescript
// Highlight specific orbit
strategy.highlight("earth", new THREE.Color(0xff0000));

// Clear highlighting
strategy.highlight(null, new THREE.Color());
```

### Visibility Control

```typescript
// Control orbit visibility
strategy.setVisibility(true);

// Prediction visibility (no-op for ideal strategy)
strategy.setPredictionVisibility(false); // Does nothing
```

### Cleanup Operations

```typescript
// Clear all orbits
strategy.clearAllTrails();

// Clear predictions (no-op)
strategy.clearAllPredictions(); // Does nothing

// Dispose resources
strategy.dispose();
```

## 🔍 Debug Features

### Orbit Verification

```typescript
// Verify orbit creation
console.log("Has orbit line:", this.keplerianManager.hasLine("earth"));
```

### Highlighting State

```typescript
// Check highlighting state
console.log("Highlighted object:", this.highlightedObjectId);
console.log("Highlight color:", this.highlightColor);
```

### Visibility State

```typescript
// Monitor visibility state
console.log("Strategy visible:", this.isVisible);
```

## 🚀 Future Enhancements

### Planned Features

- **Animated Orbits**: Optional animation along orbital paths
- **Multi-body Systems**: Support for complex gravitational systems
- **Orbital Perturbations**: Minor perturbation effects

### Optimization Opportunities

- **GPU Calculations**: Move orbit calculations to GPU
- **Predictive Caching**: Cache orbit calculations for reuse
- **Instanced Rendering**: Use instanced rendering for similar orbits

### Advanced Features

- **Orbital Maneuvers**: Support for orbital transfer visualization
- **Time-dependent Orbits**: Orbits that evolve over time
- **Precision Control**: Configurable mathematical precision
