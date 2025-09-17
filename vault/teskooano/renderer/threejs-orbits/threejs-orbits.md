---
name: Three.js Orbits
description: Orbital visualization system for Teskooano renderer with Keplerian and N-body physics modes
package: "@teskooano/renderer-threejs-orbits"
version: 0.4.0-dev.0
dependencies:
  - "@teskooano/core-state"
  - "@teskooano/data-types"
  - "@teskooano/core-math"
  - "@teskooano/core-physics"
  - "@teskooano/renderer-threejs-core"
  - "@teskooano/renderer-threejs-helpers"
  - "@teskooano/renderer-threejs-objects"
  - "@teskooano/renderer-threejs-labels"
  - "@teskooano/renderer-threejs-celestial"
  - "@teskooano/data-values"
  - three
  - rxjs
  - eventemitter3
devDependencies:
  - "@types/three"
  - vitest
components:
  - OrbitsManager
  - IdealStrategy
  - NBodyStrategy
  - KeplerianManager
  - TrailManager
  - PredictionManager
  - PredictionCalculator
  - PredictionRenderer
  - TrailDataPool
  - SimpleOrbitalRenderer
  - OrbitCalculator
  - TrailCurveInterpolator
  - SharedMaterials
  - simplify
  - IOrbitVisualizationStrategy
classes:
  - OrbitsManager
  - IdealStrategy
  - NBodyStrategy
  - KeplerianManager
  - TrailManager
  - PredictionManager
  - PredictionCalculator
  - PredictionRenderer
  - PredictionLabels
  - PredictionAnimation
  - TrailCurveInterpolator
  - TrailDataPool
  - OrbitCalculator
  - SharedMaterials
  - LineHelper
  - ThreeVector3Converter
  - OSVector3
  - "THREE.Line"
  - "THREE.Group"
  - "THREE.Color"
  - "THREE.Vector3"
  - "THREE.Quaternion"
  - "THREE.Material"
  - "THREE.ShaderMaterial"
  - "THREE.BufferAttribute"
  - "THREE.BufferGeometry"
  - "THREE.Points"
  - "THREE.PointsMaterial"
  - "THREE.SphereGeometry"
  - "THREE.MeshBasicMaterial"
  - "THREE.Mesh"
  - "THREE.Scene"
  - "THREE.PerspectiveCamera"
  - "THREE.WebGLRenderer"
  - "THREE.Object3D"
  - "THREE.Raycaster"
  - "THREE.Box3"
  - "THREE.Light"
  - "THREE.PointLight"
  - "THREE.CanvasTexture"
  - "THREE.Sprite"
  - "THREE.LOD"
  - "THREE.GridHelper"
  - "THREE.Clock"
  - "THREE.CSS2DRenderer"
  - "THREE.CSS2DObject"
  - HTMLElement
  - ShadowRoot
  - HTMLSpanElement
  - CSS2DObject
  - Worker
  - Subject
  - Subscription
  - StateSubscriptionMixin
  - StateAccessor
  - PhysicsStateProvider
  - RendererStateAdapter
  - ObjectManager
  - Layer2DManager
  - CelestialRenderer
  - RenderOrderManager
  - StateSubscriptionMixin
functions:
  - simplifyPath
types:
  - OrbitDisplayMode
  - TrailCurveType
  - TrailCurveConfig
  - IOrbitVisualizationStrategy
---

# Three.js Orbits (`@teskooano/renderer-threejs-orbits`)

The orbital visualization system for the Teskooano renderer, providing trajectory visualization for both Keplerian and N-body physics modes with advanced performance optimizations and memory management.

## 🎯 Purpose

This package visualizes the orbital paths of celestial objects with two distinct modes:

- **Ideal Mode**: Perfect elliptical orbits based on Kepler's laws with static calculations
- **N-Body Mode**: Historical trails and predicted trajectories from real-time physics simulation
- **Performance Optimization**: Web Worker offloading for heavy calculations and buffer pooling
- **Memory Management**: Efficient circular buffers and object pooling to minimize garbage collection

## 🏗️ Architecture Overview

The orbits system uses a **Strategy Pattern** to seamlessly switch between visualization modes:

```
[[OrbitsManager]] (Facade)
├── [[IdealStrategy]] (Keplerian orbits)
│   ├── [[KeplerianManager]]
│   ├── [[OrbitCalculator]]
│   └── [[SharedMaterials]]
└── [[NBodyStrategy]] (Dynamic trails & predictions)
    ├── [[TrailManager]] (Historical paths)
    ├── [[PredictionManager]] (Future trajectories)
    ├── [[TrailCurveInterpolator]] (Smooth curves)
    └── Web Workers (Background processing)
```

## 📋 Component Relationships

The following table shows how all components link together in the orbital visualization system:

| **Component**                   | **Type**   | **Dependencies**                                                              | **Used By**                                                   | **Purpose**                                           |
| ------------------------------- | ---------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------- | ----------------------------------------------------- |
| [[OrbitsManager]]               | Manager    | [[IOrbitVisualizationStrategy]], StateAdapter, ObjectManager                  | Renderer Core                                                 | Main orchestrator using Strategy pattern              |
| [[IdealStrategy]]               | Strategy   | [[KeplerianManager]], [[IOrbitVisualizationStrategy]]                         | [[OrbitsManager]]                                             | Implements perfect Keplerian orbit visualization      |
| [[NBodyStrategy]]               | Strategy   | [[TrailManager]], [[PredictionManager]], [[IOrbitVisualizationStrategy]]      | [[OrbitsManager]]                                             | Implements N-body physics visualization               |
| [[KeplerianManager]]            | Manager    | [[OrbitCalculator]], [[TrailCurveInterpolator]], [[SharedMaterials]]          | [[IdealStrategy]]                                             | Manages static Keplerian orbit lines                  |
| [[TrailManager]]                | Manager    | [[NBodyTrailsRenderer]], [[TrailCurveInterpolator]], [[TrailDataPool]]        | [[NBodyStrategy]]                                             | Manages historical trail visualization                |
| [[PredictionManager]]           | Manager    | [[PredictionCalculator]], [[PredictionRenderer]], [[NBodyPredictionRenderer]] | [[NBodyStrategy]]                                             | Manages future trajectory prediction                  |
| [[OrbitCalculator]]             | Utility    | Core Math Library                                                             | [[KeplerianManager]]                                          | Analytical orbit calculations                         |
| [[TrailCurveInterpolator]]      | Utility    | Three.js                                                                      | [[KeplerianManager]], [[TrailManager]], [[PredictionManager]] | Advanced curve interpolation                          |
| [[SharedMaterials]]             | Utility    | Three.js                                                                      | All Renderers                                                 | Centralized material management                       |
| [[PredictionCalculator]]        | Calculator | Core Physics, Core State                                                      | [[PredictionManager]], [[NBodyPredictionRenderer]]            | Physics-based trajectory calculation                  |
| [[PredictionRenderer]]          | Renderer   | [[SharedMaterials]], Three.js Helpers                                         | [[PredictionManager]]                                         | Prediction line rendering                             |
| [[NBodyTrailsRenderer]]         | Renderer   | [[TrailDataPool]], [[TrailCurveInterpolator]], Three.js Helpers               | [[TrailManager]]                                              | N-body historical trail rendering                     |
| [[NBodyPredictionRenderer]]     | Renderer   | [[PredictionCalculator]], [[PredictionRenderer]], Three.js Labels             | [[PredictionManager]]                                         | N-body prediction rendering with modular architecture |
| [[TrailDataPool]]               | Pool       | ArrayBuffer, Circular Buffer                                                  | [[NBodyTrailsRenderer]]                                       | Pre-allocated memory for trail data                   |
| [[SimpleOrbitalRenderer]]       | Renderer   | PositionHistoryManager, Three.js Helpers                                      | [[NBodyStrategy]]                                             | Simple orbital line rendering                         |
| [[simplify]]                    | Algorithm  | Core Math Library                                                             | Trail Processing Workers                                      | Path simplification using RDP algorithm               |
| [[IOrbitVisualizationStrategy]] | Interface  | Three.js, Data Types                                                          | [[IdealStrategy]], [[NBodyStrategy]]                          | Strategy pattern contract                             |

## 🔗 Component Documentation Links

### **Core Management**

- **[[OrbitsManager]]** - Main orchestrator for orbital visualization system
- **[[IdealStrategy]]** - Implementation for perfect Keplerian orbits
- **[[NBodyStrategy]]** - Implementation for N-Body simulation visualization

### **Specialized Managers**

- **[[KeplerianManager]]** - Manages static Keplerian orbit lines
- **[[TrailManager]]** - Manages historical trail visualization
- **[[PredictionManager]]** - Manages future trajectory prediction

### **Calculation & Utilities**

- **[[OrbitCalculator]]** - Analytical orbit calculation for Keplerian orbits
- **[[PredictionCalculator]]** - Core prediction calculation logic
- **[[TrailCurveInterpolator]]** - Advanced curve interpolation
- **[[SharedMaterials]]** - Centralized material management
- **[[simplify]]** - Path simplification using Ramer-Douglas-Peucker algorithm

### **Specialized Renderers**

- **[[NBodyTrailsRenderer]]** - N-body historical trail visualization
- **[[NBodyPredictionRenderer]]** - N-body prediction visualization
- **[[PredictionRenderer]]** - Prediction line rendering component
- **[[SimpleOrbitalRenderer]]** - Simple orbital line renderer

### **Memory & Performance**

- **[[TrailDataPool]]** - Pre-allocated ArrayBuffer management

### **Interfaces & Patterns**

- **[[IOrbitVisualizationStrategy]]** - Strategy pattern interface

## 🚀 Core Components

### [[OrbitsManager]]

The public-facing facade that orchestrates the entire orbital visualization system.

**Key Responsibilities:**

- **Mode Switching**: Seamlessly transitions between [[IdealStrategy]] and [[NBodyStrategy]] visualization strategies
- **Orchestration**: Holds instances of all sub-managers and delegates update calls
- **Lifecycle Management**: Adds/removes visualizations as objects appear/disappear
- **API Facade**: Provides clean public API for controlling visualizations

**Strategy Pattern Implementation:**

- Subscribes to `$visualSettings` to detect physics engine changes
- Delegates to [[IdealStrategy]] or [[NBodyStrategy]] based on current mode
- Provides unified interface regardless of underlying strategy using [[IOrbitVisualizationStrategy]]

**Key Methods:**

```typescript
class OrbitsManager {
  constructor(rendererStateAdapter: RendererStateAdapter);

  update(): void;
  setVisibility(visible: boolean): void;
  highlightVisualization(objectId: string, highlighted: boolean): void;
  setPredictionDuration(duration: number): void;
  dispose(): void;
}
```

### [[IdealStrategy]]

Renders perfect elliptical orbits for objects with `OrbitalParameters`.

**Key Responsibilities:**

- Uses [[OrbitCalculator]] to generate elliptical vertices from orbital parameters
- Creates static `THREE.Line` objects for each orbit using [[SharedMaterials]]
- Minimal computational overhead with static calculations
- Handles all Keplerian orbital elements through [[KeplerianManager]]

**Workflow:**

1. **Parameter Extraction**: Extracts orbital parameters from celestial objects
2. **Ellipse Generation**: Uses [[OrbitCalculator]] to generate ellipse vertices
3. **Line Creation**: Creates or updates `THREE.Line` objects with [[TrailCurveInterpolator]]
4. **Scene Attachment**: Adds lines to the Three.js scene

### [[NBodyStrategy]]

Handles visualization for all N-Body physics modes with historical trails and predictions.

**Key Components:**

- **[[TrailManager]]**: Shows recent historical path of objects
- **[[PredictionManager]]**: Shows calculated future trajectory
- **[[SimpleOrbitalRenderer]]**: Simple orbital line rendering
- **Web Worker Integration**: Offloads heavy calculations to background threads

#### [[TrailManager]]

Manages historical trail visualization for N-body objects.

**Key Features:**

- **Circular Buffer**: Efficient storage using [[TrailDataPool]]
- **Web Worker Processing**: Trail simplification using [[simplify]] algorithm in background
- **Performance Optimization**: Throttled updates and distance-based sampling
- **Memory Management**: Pre-allocated buffers through [[NBodyTrailsRenderer]]

**Performance Optimizations:**

- **Distance-based Sampling**: Only samples positions when object moves significantly
- **Batch Processing**: Groups multiple updates to reduce worker communication
- **Buffer Pooling**: Reuses `THREE.BufferAttribute` objects to minimize GC
- **Circular Buffers**: Fixed-size buffers that overwrite oldest data

#### [[PredictionManager]]

Manages future trajectory prediction visualization.

**Key Features:**

- **Modular Architecture**: Separates calculation, rendering, and animation using [[NBodyPredictionRenderer]]
- **Real-time Updates**: Responds to physics state changes
- **Highlighting System**: Supports object-specific highlighting
- **Animation Support**: Smooth transitions between prediction states

**Components:**

- **[[PredictionCalculator]]**: Core prediction calculation logic
- **[[PredictionRenderer]]**: Line rendering and visualization
- **PredictionLabels**: Label management for prediction points
- **PredictionAnimation**: Animation state management

## 🎨 Visualization Features

### Trail Curves

Advanced curve interpolation for realistic orbital visualization using [[TrailCurveInterpolator]]:

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

### Performance Optimizations

#### Web Worker Integration

Heavy calculations are offloaded to background threads using [[TrailDataPool]]:

```typescript
// Trail processing in worker
self.onmessage = (event) => {
  const { positions, quality, curveConfig } = event.data;
  const simplified = simplifyTrail(positions, quality); // Uses [[simplify]] algorithm
  const interpolated = interpolateCurve(simplified, curveConfig); // Uses [[TrailCurveInterpolator]]
  self.postMessage({ simplified, interpolated });
};
```

#### Memory Management

- **Buffer Pooling**: Reuses `THREE.BufferAttribute` objects through [[TrailDataPool]]
- **Circular Buffers**: Fixed-size buffers for position history managed by [[TrailDataPool]]
- **Object Pooling**: Pre-allocated data structures
- **Garbage Collection**: Minimizes allocations during updates

#### Rendering Optimizations

- **Distance-based Sampling**: Reduces unnecessary position updates
- **Batch Processing**: Groups multiple updates for efficiency
- **LOD System**: Adjusts detail based on camera distance
- **Frustum Culling**: Only renders visible trails
- **Material Sharing**: Uses [[SharedMaterials]] for consistent styling

## 🔧 Integration Points

### State Management

Integrates with the core state system for configuration:

```typescript
// Subscribes to simulation configuration changes
this.stateSubscription = this.stateAdapter.$visualSettings
  .pipe(
    map((settings) => settings.orbitDisplayMode),
    distinctUntilChanged(),
  )
  .subscribe((mode) => this.switchMode(mode));
```

### Object Management

Works with the ObjectManager for scene integration:

```typescript
// Adds/removes visualizations as objects change
this.objectManager.addObject(orbitLine);
this.objectManager.removeObject(objectId);
```

### Label System

Integrates with the 2D label system for prediction labels:

```typescript
// Creates labels for prediction points
this.layer2DManager.addLabel(predictionLabel, objectId);
```

## 📊 Performance Considerations

### Memory Usage

- **Trail History**: Configurable history length per object
- **Buffer Reuse**: Shared materials and geometries
- **Worker Communication**: Efficient serialization of position data

### CPU Optimization

- **Throttled Updates**: Configurable update intervals
- **Distance Sampling**: Only updates when objects move significantly
- **Batch Processing**: Reduces worker communication overhead

### GPU Efficiency

- **Instanced Rendering**: For multiple similar trails
- **Geometry Merging**: Combines multiple trails into single draw calls
- **Material Sharing**: Reuses materials across similar visualizations

## 🎯 Usage Examples

### Basic Setup

```typescript
import { OrbitsManager } from "@teskooano/renderer-threejs-orbits";

// Create the main orbital visualization manager
const orbitsManager = new OrbitsManager(
  objectManager,
  stateAdapter,
  renderableObjects$,
  layer2DManager,
);

// Enable orbit visualization - automatically switches between [[IdealStrategy]] and [[NBodyStrategy]]
orbitsManager.setVisibility(true);
```

### Configuration

```typescript
// Configure trail quality (affects [[TrailManager]] and [[NBodyTrailsRenderer]])
orbitsManager.setTrailQuality(TrailQuality.High);

// Configure prediction duration (affects [[PredictionManager]] and [[PredictionCalculator]])
orbitsManager.setPredictionDuration(3600); // 1 hour

// Highlight specific object (uses [[IOrbitVisualizationStrategy]] interface)
orbitsManager.highlightVisualization("earth", true);
```

### Curve Configuration

```typescript
// Configure curve interpolation (used by [[TrailCurveInterpolator]])
const curveConfig: TrailCurveConfig = {
  type: TrailCurveType.Orbital, // Uses orbital-aware interpolation
  tension: 0.3, // Controls curve tightness
  segments: 4, // Number of curve segments
  smoothing: 0.2, // Smoothing factor
  adaptiveThreshold: 5, // Minimum points for adaptive smoothing
};

// Apply to all curve-based components ([[KeplerianManager]], [[TrailManager]], [[PredictionManager]])
orbitsManager.setCurveConfig(curveConfig);
```

### Advanced Configuration

```typescript
// Individual component access through strategies
const currentStrategy = orbitsManager.getActiveStrategy();

// For Keplerian orbits ([[IdealStrategy]])
if (currentStrategy instanceof IdealStrategy) {
  // Configure [[OrbitCalculator]] precision
  currentStrategy.setCalculationPrecision(1e-10);
}

// For N-body physics ([[NBodyStrategy]])
if (currentStrategy instanceof NBodyStrategy) {
  // Configure [[TrailDataPool]] size
  currentStrategy.trailManager.setPoolSize(200, 50000);

  // Configure [[PredictionCalculator]] steps
  currentStrategy.predictionManager.setPredictionSteps(120);
}
```

## Dependencies

### Core Dependencies

- **@teskooano/core-state** - Provides state management and physics state access
- **@teskooano/data-types** - Provides celestial object type definitions
- **@teskooano/core-math** - Provides mathematical utilities and vector operations
- **@teskooano/core-physics** - Provides physics engine integration
- **@teskooano/renderer-threejs-core** - Core Three.js renderer utilities
- **@teskooano/renderer-threejs-helpers** - Helper utilities for Three.js rendering
- **@teskooano/renderer-threejs-objects** - Object management and lifecycle
- **@teskooano/renderer-threejs-labels** - 2D label rendering system
- **@teskooano/renderer-threejs-celestial** - Celestial object rendering
- **@teskooano/data-values** - Provides constant values and configurations
- **three** - Three.js 3D graphics library
- **rxjs** - Reactive programming library for state management
- **eventemitter3** - Event handling utilities

### Development Dependencies

- **@types/three** - TypeScript definitions for Three.js
- **vitest** - Testing framework

## 🔍 Debug Features

### Performance Monitoring

- **Message Count**: Tracks worker communication frequency
- **Update Timing**: Monitors update performance
- **Memory Usage**: Tracks buffer allocations

### Visual Debugging

- **Trail Quality**: Adjustable trail detail levels
- **Prediction Steps**: Configurable prediction resolution
- **Highlight Colors**: Customizable highlighting

## 🚀 Future Enhancements

### Planned Features

- **Multi-threaded Prediction**: Parallel prediction calculations
- **Advanced Curves**: Bézier and B-spline interpolation
- **Trail Effects**: Particle effects for trail visualization
- **Performance Profiling**: Built-in performance analysis tools

### Optimization Opportunities

- **GPU Compute**: Move calculations to GPU using compute shaders
- **Spatial Indexing**: Advanced spatial partitioning for large scenes
- **Predictive Caching**: Cache prediction results for reuse
- **Adaptive Quality**: Dynamic quality adjustment based on performance
