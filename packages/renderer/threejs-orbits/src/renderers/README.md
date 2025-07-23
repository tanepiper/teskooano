# Architecture: Orbit Visualization Renderers (`/renderers`)

This directory contains the core rendering components for orbit visualization, including trails, predictions, and the new curved trails interpolation system.

## Enhanced Curved Trails System

The entire orbits module now uses a unified curved trails system that provides smooth, realistic orbital visualization across all components:

### Core Components

#### `TrailCurveInterpolator.ts`

**Purpose**: Central utility for interpolating trail points into smooth curves.

**Features**:

- **Multiple Curve Types**: Linear, Smooth (Catmull-Rom), Orbital-aware, and Adaptive
- **Orbital Optimization**: Specialized curves that account for gravitational motion patterns
- **Performance Optimized**: Efficient interpolation with configurable quality settings
- **Type-Specific Curves**: Automatic curve selection based on celestial object type

**Curve Types**:

- `Linear`: Simple linear interpolation (no smoothing)
- `Smooth`: Catmull-Rom spline with configurable tension
- `Orbital`: Orbital-aware curves optimized for gravitational motion
- `Adaptive`: Automatically selects the best curve type based on object properties

#### `TrailManager.ts`

**Purpose**: Manages historical trail visualization with curved interpolation.

**Enhanced Features**:

- **Curved Trail Rendering**: All trails now use curve interpolation for smooth visualization
- **Adaptive Sampling**: Orbital-aware sampling that captures trajectory essence
- **Configurable Curves**: Full curve configuration support with real-time updates
- **Performance Optimized**: Web Worker-based processing with batched updates

#### `PredictionManager.ts`

**Purpose**: Manages future trajectory prediction with curved interpolation.

**Enhanced Features**:

- **Curved Predictions**: All prediction lines now use curve interpolation
- **Orbital-Aware Curves**: Predictions optimized for orbital motion patterns
- **Configurable Quality**: Adjustable curve parameters for different visualization needs
- **Smooth Animations**: Animated transitions when prediction data updates

#### `KeplerianManager.ts`

**Purpose**: Manages static Keplerian orbit lines with curved interpolation.

**Enhanced Features**:

- **Curved Orbit Lines**: Perfect elliptical orbits now rendered with smooth curves
- **Optimized for Static Orbits**: Lower curve complexity for better performance
- **Consistent Styling**: Maintains visual consistency with other orbit types

### Configuration System

All managers support configurable curve parameters:

```typescript
interface TrailCurveConfig {
  type: TrailCurveType; // Curve type to use
  tension?: number; // Catmull-Rom tension (0-1)
  segments?: number; // Curve segments per point pair
  smoothing?: number; // Smoothing factor (0-1)
  adaptiveThreshold?: number; // Minimum points for adaptive smoothing
}
```

### Default Configurations

**Trails (N-Body)**: Adaptive curves with high quality for dynamic motion

```typescript
{
  type: TrailCurveType.Adaptive,
  tension: 0.5,
  segments: 8,
  smoothing: 0.3,
  adaptiveThreshold: 10
}
```

**Predictions (N-Body)**: Orbital curves optimized for future trajectories

```typescript
{
  type: TrailCurveType.Orbital,
  tension: 0.5,
  segments: 6,
  smoothing: 0.4,
  adaptiveThreshold: 8
}
```

**Keplerian Orbits (Ideal)**: Orbital curves with lower complexity

```typescript
{
  type: TrailCurveType.Orbital,
  tension: 0.3,
  segments: 4,
  smoothing: 0.2,
  adaptiveThreshold: 5
}
```

### Integration Points

#### `OrbitsManager.ts`

The main entry point now provides curve configuration methods:

- `setTrailCurveConfig(config)`: Configure trail curves
- `getTrailCurveConfig()`: Get current trail configuration
- `setPredictionCurveConfig(config)`: Configure prediction curves
- `getPredictionCurveConfig()`: Get current prediction configuration

#### Strategy Pattern

Both `IdealStrategy` and `NBodyStrategy` now create their managers with optimized curve configurations:

- **IdealStrategy**: Uses orbital curves for static Keplerian orbits
- **NBodyStrategy**: Uses adaptive curves for trails and orbital curves for predictions

### Performance Considerations

1. **Curve Complexity**: Higher segment counts provide smoother curves but impact performance
2. **Adaptive Thresholds**: Objects with fewer points use simpler curves automatically
3. **Worker Processing**: Trail data processing remains in Web Workers to maintain performance
4. **Caching**: Interpolated curves are cached to avoid recalculation

### Usage Examples

**Basic Usage** (automatic curve configuration):

```typescript
// The system automatically uses optimized curves
const orbitsManager = new OrbitsManager(objectManager, stateAdapter, objects$);
```

**Custom Configuration**:

```typescript
// Configure custom curve settings
orbitsManager.setTrailCurveConfig({
  type: TrailCurveType.Smooth,
  tension: 0.7,
  segments: 12,
  smoothing: 0.5,
});
```

**Real-time Updates**:

```typescript
// Update curve configuration at runtime
orbitsManager.setPredictionCurveConfig({
  type: TrailCurveType.Orbital,
  tension: 0.4,
  segments: 8,
});
```

### Benefits

1. **Visual Quality**: All orbit lines now have smooth, realistic curves
2. **Consistency**: Unified curve system across all visualization types
3. **Flexibility**: Configurable curves for different use cases
4. **Performance**: Optimized curves that balance quality and performance
5. **Maintainability**: Centralized curve logic in `TrailCurveInterpolator`

This enhanced system ensures that all orbital visualizations in the Teskooano project provide smooth, realistic, and visually appealing representations of celestial motion.
