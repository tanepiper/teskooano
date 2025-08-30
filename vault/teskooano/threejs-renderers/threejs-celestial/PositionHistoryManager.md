---
aliases:
  [PositionHistoryManager, orbital-manager, position-history, orbital-data]
tags: [renderer, threejs, celestial, manager, orbital, position, history, data]
type: Class
package: "@teskooano/renderer-threejs-celestial"
name: PositionHistoryManager
dependencies: ["@teskooano/data-types", "@teskooano/core-math", "three"]
classes: ["CircularBuffer", "OSVector3"]
functions: []
constants: []
types:
  [
    "TimePoint",
    "OrbitalConfig",
    "CelestialType",
    "MemoryStats",
    "RenderableCelestialObject",
  ]
status: active
---

# PositionHistoryManager

Centralized orbital data management for each celestial object, handling position history, LOD-based rendering control, and adaptive sampling.

## 🎯 Purpose

The `PositionHistoryManager` serves as the central hub for all orbital-related data for a celestial object:

- **Position History**: Efficiently stores and manages position history using circular buffers
- **LOD Control**: Determines visibility of orbit lines, trails, and predictions based on camera distance
- **Memory Management**: Uses pre-allocated buffers and efficient data structures to minimize memory usage
- **Performance Optimization**: Throttles updates and uses efficient data types for read/write operations
- **Adaptive Sampling**: Dynamic sampling rate based on time scale and object movement

## 🏗️ Architecture

### Circular Buffer Implementation

Uses efficient circular buffers for position history to prevent memory leaks and provide constant-time access to recent data.

### Adaptive Sampling

Implements intelligent sampling that adjusts based on:

- **Time Scale**: Higher time scales require more frequent sampling
- **Movement Distance**: Only samples when object moves beyond threshold
- **Performance**: Throttled updates to maintain 60fps

## 🔧 Core Methods

### Position Data Management

```typescript
// Current position and velocity
getCurrentPosition(): OSVector3;
getCurrentVelocity(): OSVector3;

// Position history retrieval
getPositionHistory(maxPoints?: number): OSVector3[];
getPositionHistoryWithTimestamps(maxPoints?: number): TimePoint[];

// History management
getHistorySize(): number;
clearHistory(): void;
```

### LOD-Based Visibility Control

```typescript
// Orbit line visibility
shouldShowOrbitLines(cameraDistance: number, objectType: CelestialType): boolean;

// Trail line visibility
shouldShowTrailLines(cameraDistance: number, objectType: CelestialType): boolean;

// Prediction line visibility
shouldShowPredictionLines(): boolean;
```

### State Management

```typescript
// Highlighting state
setHighlighted(highlighted: boolean): void;
isObjectHighlighted(): boolean;

// Prediction line control
setShowPredictionLines(show: boolean): void;
```

### Configuration and Monitoring

```typescript
// Configuration management
updateConfig(newConfig: Partial<OrbitalConfig>): void;
getConfig(): OrbitalConfig;

// Memory statistics
getMemoryStats(): MemoryStats;
getObjectId(): string;
```

## 📊 Configuration Options

### OrbitalConfig Interface

```typescript
interface OrbitalConfig {
  /** Maximum number of position history points to store */
  maxHistoryPoints: number;
  /** Minimum distance (in scene units) before adding a new position point */
  minDistanceThreshold: number;
  /** Whether this object should show orbit lines */
  showOrbitLines: boolean;
  /** Whether this object should show prediction lines */
  showPredictionLines: boolean;
  /** LOD distance threshold for orbit line visibility */
  orbitLineLODDistance: number;
  /** LOD distance threshold for trail visibility */
  trailLODDistance: number;
}
```

### Default Values

- `maxHistoryPoints`: 1,000,000
- `minDistanceThreshold`: 1e-6 (scene units)
- `showOrbitLines`: true
- `showPredictionLines`: false
- `orbitLineLODDistance`: 1000 (scene units)
- `trailLODDistance`: 500 (scene units)

## 🔄 Adaptive Sampling Algorithm

### Base Sampling Rate

- **Base Rate**: 0.2 samples per second (1 sample every 5 seconds at x1 time scale)
- **Assumed FPS**: 60fps for calculations

### Time Scale Adaptation

```typescript
// At x1 or slower: Fewer samples for smooth curves
if (timeScale <= 1) {
  adaptiveSamplesPerSecond = Math.max(0.1, baseSamplesPerSecond / timeScale);
}
// At x1-x10: Gradual increase
else if (timeScale <= 10) {
  adaptiveSamplesPerSecond = baseSamplesPerSecond * Math.sqrt(timeScale);
}
// At x10+: More samples to capture large movements AND maintain smooth curves
else {
  adaptiveSamplesPerSecond = Math.max(5.0, baseSamplesPerSecond * timeScale);
}
```

### Frame-Based Throttling

```typescript
const framesPerSample = Math.max(
  1,
  Math.floor(assumedFPS / adaptiveSamplesPerSecond),
);
if (this.lastUpdateIndex < framesPerSample) {
  this.lastUpdateIndex++;
  return;
}
```

## 🎯 LOD-Based Visibility Rules

### Orbit Lines

- **Stars**: Visible from 2x the configured distance (can show from further away)
- **Other Objects**: Visible only within the configured distance
- **Purpose**: Stars are more important for navigation and can be seen from greater distances

### Trail Lines

- **Stars**: Visible from 2x the configured distance
- **Other Objects**: Visible only within the configured distance
- **Purpose**: Provides visual feedback for object movement and trajectory

### Prediction Lines

- Only visible when explicitly enabled via `setShowPredictionLines(true)`
- Typically used for selected objects or objects with special significance

## 💾 Memory Management

### Memory Usage

- **Per Sample**: ~24 bytes (3 floats × 8 bytes)
- **1,000,000 samples**: ~24MB per object
- **Automatic Cleanup**: Circular buffer prevents memory leaks

### Performance Optimizations

- **Pre-allocated Buffers**: Minimizes garbage collection
- **Reusable Vectors**: Reduces allocations in update loops
- **Throttled Updates**: Prevents excessive processing
- **Distance-Based Sampling**: Avoids redundant position data

## 🚀 Usage Example

```typescript
// Create manager with custom configuration
const orbitalManager = new PositionHistoryManager(
  "star-001",
  {
    maxHistoryPoints: 2000,
    minDistanceThreshold: 1e-5,
    showOrbitLines: true,
    showPredictionLines: false,
    orbitLineLODDistance: 1500,
    trailLODDistance: 800,
  },
  renderer,
);

// Update with current object data
orbitalManager.update(celestialObject, currentTime);

// Access position data for rendering
const currentPosition = orbitalManager.getCurrentPosition();
const positionHistory = orbitalManager.getPositionHistory(500); // Last 500 points

// Check LOD-based visibility
const cameraDistance = camera.position.distanceTo(object.position);
const shouldShowOrbitLines = orbitalManager.shouldShowOrbitLines(
  cameraDistance,
  object.type,
);
const shouldShowTrailLines = orbitalManager.shouldShowTrailLines(
  cameraDistance,
  object.type,
);

// Render based on visibility
if (shouldShowTrailLines && positionHistory.length > 1) {
  renderTrail(positionHistory);
}

if (shouldShowOrbitLines) {
  renderOrbitLines();
}

// State management
orbitalManager.setHighlighted(isSelected);
orbitalManager.setShowPredictionLines(isSelected);
```

## 🔗 Integration with Physics Engine

### Data Flow

1. **Physics Engine**: Updates object positions and velocities
2. **PositionHistoryManager**: Stores and manages historical data
3. **Rendering Systems**: Read data for visualization
4. **LOD System**: Controls visibility based on camera distance

### Benefits

- **Centralized Data**: Each celestial object owns its orbital data
- **LOD Integration**: Automatic visibility control based on camera distance
- **Performance**: Efficient memory management and throttled updates
- **Clean API**: Simple delegation methods for renderers to access orbital data

## 🔗 Related Components

- [[BaseCelestialRenderer]] - Uses this manager for orbital data access
- [[CircularBuffer]] - Underlying data structure for position history
- [[LODManager]] - Integrates with LOD system for visibility control
- [[TimeManager]] - Provides time tracking for adaptive sampling

## 📚 Architecture Patterns

- **Manager Pattern**: Centralized management of orbital data
- **Resource Management Pattern**: Efficient memory usage and cleanup
- **Strategy Pattern**: Configurable sampling and visibility strategies
- **Observer Pattern**: Integrates with state management systems

---

_The PositionHistoryManager provides efficient, adaptive orbital data management with intelligent sampling and LOD-based visibility control for optimal performance._
