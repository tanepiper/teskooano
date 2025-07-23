# OrbitalManager

The `OrbitalManager` is a specialized manager within the `BaseCelestialRenderer` that handles orbital data, position history, and LOD-based rendering control for celestial objects.

## Purpose

The OrbitalManager serves as the central hub for all orbital-related data for a celestial object:

- **Position History**: Efficiently stores and manages position history using circular buffers
- **LOD Control**: Determines visibility of orbit lines, trails, and predictions based on camera distance
- **Memory Management**: Uses pre-allocated buffers and efficient data structures to minimize memory usage
- **Performance Optimization**: Throttles updates and uses efficient data types for read/write operations

## Key Features

### Efficient Memory Management

- Uses `CircularBuffer` for position history to avoid memory leaks
- Pre-allocated `OSVector3` instances to avoid garbage collection
- Configurable history size with automatic cleanup

### LOD-Based Rendering Control

- Automatically determines when to show orbit lines based on camera distance
- Different LOD thresholds for different celestial types (stars vs moons)
- Configurable distance thresholds for orbit lines and trails

### Position History

- Stores position samples with timestamps and velocity data
- Efficient retrieval of recent positions for trail rendering
- Automatic sampling based on movement distance to avoid redundant data

### Highlighting and Prediction Control

- Tracks highlighting state for orbit line highlighting
- Controls prediction line visibility for selected objects
- Integrates with the overall selection system

## Usage in Renderers

### Basic Integration

```typescript
class MyCelestialRenderer extends BaseCelestialRenderer {
  constructor(
    object: RenderableCelestialObject,
    options: BaseCelestialRendererOptions = {},
  ) {
    super(object, {
      ...options,
      orbitalConfig: {
        maxHistoryPoints: 2000,
        minDistanceThreshold: 1e-5,
        showOrbitLines: true,
        showPredictionLines: false,
        orbitLineLODDistance: 1500,
        trailLODDistance: 800,
      },
    });
  }

  update(
    object: RenderableCelestialObject,
    time: number,
    timeScale: number,
    lightSources: LightSourcesMap,
    camera: THREE.Camera,
  ): void {
    // Call parent update to handle orbital data
    super.update(object, time, timeScale, lightSources, camera);

    // Access orbital data for rendering
    const currentPosition = this.getCurrentPosition();
    const positionHistory = this.getPositionHistory(500); // Last 500 points

    // Check LOD-based visibility
    const cameraDistance = camera.position.distanceTo(object.position);
    const shouldShowOrbitLines = this.shouldShowOrbitLines(
      cameraDistance,
      object.type,
    );
    const shouldShowTrailLines = this.shouldShowTrailLines(
      cameraDistance,
      object.type,
    );

    // Render based on visibility
    if (shouldShowTrailLines && positionHistory.length > 1) {
      this.renderTrail(positionHistory);
    }

    if (shouldShowOrbitLines) {
      this.renderOrbitLines();
    }
  }
}
```

### Trail Rendering

```typescript
private renderTrail(positionHistory: OSVector3[]): void {
  // Convert OSVector3 to THREE.Vector3 for rendering
  const threePoints = positionHistory.map(pos =>
    new THREE.Vector3(pos.x, pos.y, pos.z)
  );

  // Create or update trail line
  if (!this.trailLine) {
    this.trailLine = new THREE.Line(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 0.7 })
    );
    this.add(this.trailLine);
  }

  // Update geometry
  this.trailLine.geometry.setFromPoints(threePoints);
}
```

### Highlighting Integration

```typescript
// Called when object is selected
onObjectSelected(): void {
  this.setHighlighted(true);
  this.setShowPredictionLines(true);
}

// Called when object is deselected
onObjectDeselected(): void {
  this.setHighlighted(false);
  this.setShowPredictionLines(false);
}
```

## Configuration Options

### OrbitalConfig Interface

```typescript
interface OrbitalConfig {
  maxHistoryPoints: number; // Maximum position history points
  minDistanceThreshold: number; // Minimum movement before sampling
  showOrbitLines: boolean; // Whether to show orbit lines
  showPredictionLines: boolean; // Whether to show prediction lines
  orbitLineLODDistance: number; // LOD distance for orbit lines
  trailLODDistance: number; // LOD distance for trails
}
```

### Default Values

- `maxHistoryPoints`: 1000
- `minDistanceThreshold`: 1e-6 (scene units)
- `showOrbitLines`: true
- `showPredictionLines`: false
- `orbitLineLODDistance`: 1000 (scene units)
- `trailLODDistance`: 500 (scene units)

## Performance Considerations

### Memory Usage

- Each position sample uses ~24 bytes (3 floats × 8 bytes)
- 1000 samples ≈ 24KB per object
- Automatic cleanup prevents memory leaks

### Update Frequency

- Updates are throttled to ~60fps (16ms intervals)
- Position sampling is distance-based to avoid redundant data
- LOD calculations are cached to avoid repeated computations

### LOD Optimization

- Stars have 2x higher LOD thresholds than moons
- Automatic visibility culling based on camera distance
- Configurable thresholds for different object types

## Integration with Physics Engine

The OrbitalManager is designed to work with the physics engine:

1. **Data Source**: Reads position and velocity from `RenderableCelestialObject`
2. **Data Storage**: Efficiently stores historical data for rendering
3. **Data Access**: Provides clean API for rendering systems to access orbital data
4. **LOD Control**: Manages visibility based on camera distance and object type

This creates a clean separation where:

- Physics engine updates object positions
- OrbitalManager stores and manages the data
- Rendering systems read the data for visualization
