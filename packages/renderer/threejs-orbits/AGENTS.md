# AGENTS.md

A guide for AI coding agents working on the ThreeJS Orbits package for Teskooano.

## Package Overview

The **ThreeJS Orbits package** (`@teskooano/renderer-threejs-orbits`) is a sophisticated orbit visualization system that provides real-time rendering of orbital paths and trajectories in 3D space. It supports both ideal (Keplerian) and N-body physics modes with high-performance rendering and real-time trajectory prediction.

## Key Features

- **Dual Visualization Modes**: Seamless switching between ideal and N-body orbit visualization
- **Real-time Trajectory Prediction**: Advanced physics-based prediction of future object paths
- **Historical Trail Visualization**: Dynamic trails showing recent object movement
- **Performance Optimized**: Web Worker offloading for heavy calculations
- **Memory Efficient**: Object pooling and buffer reuse to minimize garbage collection
- **Quality Control**: Configurable trail quality and prediction accuracy settings

## Setup Commands

### Prerequisites

- Node.js 24.2.0
- TypeScript 5.9.2
- Three.js for 3D rendering
- RxJS for reactive programming

### Development Commands

```bash
# Run tests
moon run threejs-orbits:test

# Run tests with UI
moon run threejs-orbits:test-ui

# Run tests with coverage
moon run threejs-orbits:test-coverage

# Run tests in watch mode
moon run threejs-orbits:test-watch

# Run browser tests
moon run threejs-orbits:test-browser

# Build package
moon run threejs-orbits:build

# Type checking
moon run threejs-orbits:typecheck
```

## Package Architecture

### Directory Structure

```
src/
├── index.ts                    # Main entry point
├── core/                       # Core management and strategy interfaces
│   ├── OrbitsManager.ts       # Main orchestrator and public facade
│   ├── SharedMaterials.ts     # Cached, reusable materials
│   └── modes/                 # Strategy pattern implementations
│       ├── IOrbitVisualizationStrategy.ts
│       ├── IdealStrategy.ts   # Keplerian orbit visualization
│       └── NBodyStrategy.ts   # N-body trail and prediction visualization
├── keplerian/                 # Ideal orbit visualization
│   ├── KeplerianManager.ts    # Manages static elliptical orbit lines
│   └── OrbitCalculator.ts     # Calculates Keplerian orbit points
├── renderers/                 # Trail and prediction managers
│   ├── TrailManager.ts        # Historical trajectory trails
│   ├── PredictionManager.ts   # Future trajectory predictions
│   ├── SimpleOrbitalRenderer.ts # N-body orbital line rendering
│   └── trail.worker.ts        # Web Worker for trail processing
└── utils/                     # Performance utilities and data structures
    └── simplify.ts            # Path simplification algorithms
```

### Data Flow

1. **Mode Detection**: OrbitsManager detects simulation mode from state
2. **Strategy Selection**: Switches between IdealStrategy and NBodyStrategy
3. **Data Processing**: Each strategy manages its own data sources
4. **Rendering**: Specialized renderers handle Three.js line creation
5. **Performance**: Web Workers offload heavy calculations

## Code Style & Conventions

### TypeScript Standards

- **Strict Mode**: Always use strict TypeScript configuration
- **Type Safety**: Use proper typing for all orbital data and Three.js objects
- **Interfaces**: Use dedicated interfaces for configuration objects
- **JSDoc**: Include comprehensive documentation for all functions

### Naming Conventions

- **Files**: Use kebab-case for file names (e.g., `trail-manager.ts`)
- **Constants**: Use UPPER_CASE for configuration constants
- **Functions**: Use camelCase for function names
- **Classes**: Use PascalCase for class names
- **Interfaces**: Use PascalCase with descriptive names

### Data Standards

- **Vector Math**: Use OSVector3 for physics calculations, convert to THREE.Vector3 for rendering
- **Performance**: Minimize object creation, use object pooling
- **Memory Management**: Proper disposal of Three.js resources
- **Worker Communication**: Efficient data serialization for Web Workers

## Key Components

### Core Manager

```typescript
export class OrbitsManager extends StateSubscriptionMixin {
  // Main orchestrator that switches between visualization strategies
  setVisualizationMode(mode: OrbitDisplayMode): void;
  updateAllVisualizations(deltaTime: number): void;
  setOrbitTrailsVisibility(visible: boolean): void;
  setPredictionVisibility(visible: boolean): void;
}
```

### Strategy Pattern

```typescript
export interface IOrbitVisualizationStrategy {
  update(
    objects: Record<string, RenderableCelestialObject>,
    visualSettings: any,
    deltaTime: number,
  ): void;
  highlight(objectId: string | null, color: THREE.Color): void;
  setVisibility(visible: boolean): void;
  setPredictionVisibility(visible: boolean): void;
  dispose(): void;
}
```

### Visualization Modes

- **IDEAL**: Perfect elliptical orbits based on orbital parameters
- **NBODY**: Dynamic trails and predictions based on N-body physics

### Performance Features

- **Web Worker Offloading**: Heavy calculations run in background workers
- **Memory Pooling**: Efficient buffer and object reuse
- **Throttled Updates**: Configurable update frequencies
- **LOD Support**: Quality settings that adapt to system performance

## Testing Strategy

### Test Organization

- **File Convention**: Test files (`<filename>.spec.ts`) adjacent to source files
- **Test Types**: Unit tests for individual managers, integration tests for strategy switching
- **Test Data**: Use fixed random values for deterministic testing

### Test Commands

```bash
# Run all tests
moon run threejs-orbits:test

# Run specific test file
moon run threejs-orbits:test -- OrbitsManager.spec.ts

# Run tests with coverage
moon run threejs-orbits:test-coverage
```

### Test Patterns

- **Strategy Testing**: Test mode switching and strategy delegation
- **Performance Testing**: Verify Web Worker communication and memory usage
- **Rendering Testing**: Check Three.js line creation and updates
- **Integration Testing**: Test with ModularSpaceRenderer

## Data Sources & Validation

### Primary Sources

- **Orbital Parameters**: From celestial object definitions
- **Position History**: From N-body simulation state
- **Physics Calculations**: From core-physics package
- **State Management**: From core-state package

### Data Quality Standards

| Property          | Accuracy       | Source                  |
| ----------------- | -------------- | ----------------------- |
| Orbit Points      | High precision | Orbital parameters      |
| Trail Points      | Real-time      | Position history        |
| Prediction Points | Physics-based  | Trajectory calculations |
| Performance       | 60 FPS target  | Web Worker optimization |

### Validation Process

1. **Mode Validation**: Ensure correct strategy is active
2. **Data Validation**: Check orbital parameters and position data
3. **Performance Validation**: Monitor frame rates and memory usage
4. **Rendering Validation**: Verify Three.js object creation and updates

## Development Guidelines

### Adding New Visualization Modes

1. **Create Strategy**: Implement IOrbitVisualizationStrategy interface
2. **Add Manager**: Create specialized manager for the mode
3. **Update OrbitsManager**: Add mode detection and strategy switching
4. **Add Tests**: Include comprehensive test coverage
5. **Document Usage**: Update documentation and examples

### Performance Optimization

- **Web Workers**: Use for heavy calculations (trail processing, predictions)
- **Object Pooling**: Reuse Three.js objects to minimize allocations
- **Throttling**: Limit update frequencies to maintain performance
- **LOD Management**: Adjust quality based on system performance

### Memory Management

- **Disposal**: Properly dispose of Three.js resources
- **Buffer Management**: Use efficient buffer pools for data
- **Worker Cleanup**: Clean up Web Worker resources
- **Cache Management**: Limit cache sizes to prevent memory leaks

## Common Patterns

### Strategy Pattern

```typescript
export class OrbitsManager {
  private activeStrategy?: IOrbitVisualizationStrategy;

  setVisualizationMode(mode: OrbitDisplayMode): void {
    // Switch between IdealStrategy and NBodyStrategy
  }
}
```

### Web Worker Pattern

```typescript
export class TrailManager {
  private trailWorker: Worker | null = null;

  private initializeWorker(): void {
    // Create and configure Web Worker for trail processing
  }
}
```

### Performance Pattern

```typescript
export class SimpleOrbitalRenderer {
  private vectorPool: THREE.Vector3[] = [];

  private getPooledVector(): THREE.Vector3 {
    // Reuse vector objects to minimize allocations
  }
}
```

## Performance Considerations

### Rendering Performance

- **Line Creation**: Efficient Three.js line geometry creation
- **Update Throttling**: Limit updates to maintain 60 FPS
- **Memory Usage**: Minimize object creation and garbage collection
- **Worker Communication**: Efficient data serialization

### Data Processing

- **Trail Processing**: Web Worker offloading for heavy calculations
- **Prediction Calculations**: Background processing for trajectory predictions
- **Path Simplification**: Reduce point count for performance
- **Buffer Management**: Efficient memory usage for large datasets

## Troubleshooting

### Common Issues

- **Strategy Switching**: Ensure proper cleanup when switching modes
- **Web Worker Errors**: Check worker initialization and message handling
- **Memory Leaks**: Verify proper disposal of Three.js resources
- **Performance Issues**: Monitor update frequencies and worker communication

### Debug Tools

- **Performance Stats**: Use getPerformanceStats() for monitoring
- **Worker Communication**: Check worker message handling
- **Memory Usage**: Monitor object pool sizes and cache usage
- **Rendering Issues**: Verify Three.js object creation and updates

## Dependencies

### Core Dependencies

- `@teskooano/core-math`: Mathematical utilities and vector operations
- `@teskooano/core-physics`: Physics calculations and trajectory prediction
- `@teskooano/data-types`: TypeScript interfaces and enums
- `@teskooano/core-state`: State management and subscriptions
- `@teskooano/renderer-threejs-objects`: Scene object management
- `@teskooano/renderer-threejs-labels`: 2D label management

### Development Dependencies

- `vitest`: Testing framework
- `typescript`: Type checking
- `@playwright/test`: Browser testing

## Contributing Guidelines

### Code Quality

1. **Follow Patterns**: Use established strategy and manager patterns
2. **Write Tests**: Add comprehensive test coverage
3. **Document Changes**: Update documentation for new features
4. **Validate Performance**: Ensure no regression in rendering performance

### Architecture Guidelines

1. **Separation of Concerns**: Keep calculations separate from rendering
2. **Strategy Pattern**: Use for different visualization modes
3. **Performance First**: Optimize for 60 FPS rendering
4. **Memory Efficiency**: Minimize allocations and garbage collection

### Review Process

1. **Architecture Review**: Check for proper pattern usage
2. **Performance Review**: Verify no performance regression
3. **Test Review**: Ensure adequate test coverage
4. **Integration Review**: Test with full rendering system

## Scientific References

- [Kepler's Laws](https://en.wikipedia.org/wiki/Kepler%27s_laws_of_planetary_motion)
- [N-Body Problem](https://en.wikipedia.org/wiki/N-body_problem)
- [Orbital Mechanics](https://en.wikipedia.org/wiki/Orbital_mechanics)
- [Three.js Documentation](https://threejs.org/docs/)
- [Web Workers API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)

## Architecture Documentation

For detailed technical documentation, see:

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Complete system architecture
- [README.md](./README.md) - Usage examples and overview
- [CHANGELOG.md](./CHANGELOG.md) - Version history and changes
- [REFACTORING_PLAN.md](./REFACTORING_PLAN.md) - Planned improvements and refactoring
