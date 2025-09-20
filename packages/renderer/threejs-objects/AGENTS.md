# AGENTS.md

A guide for AI coding agents working on the ThreeJS Objects package for Teskooano.

## Package Overview

The **ThreeJS Objects package** (`@teskooano/renderer-threejs-objects`) is a sophisticated object lifecycle management system that handles the creation, updating, and removal of Three.js scene objects representing celestial bodies. It acts as the bridge between the abstract `RenderableCelestialObject` data from the state and the concrete, visible meshes rendered by Three.js.

## Key Features

- **State-Driven Object Management**: Automatically syncs Three.js scene objects with application state
- **Modular Architecture**: Lean orchestrator that delegates to specialized sub-managers
- **Dynamic Renderer Selection**: Uses factory pattern to select appropriate celestial renderers
- **Performance Optimized**: Efficient object pooling, caching, and resource management
- **Special Effects**: Handles gravitational lensing, debris effects, and debug visualizations
- **Integration**: Works seamlessly with other renderer packages (LOD, lighting, labels)

## Setup Commands

### Prerequisites

- Node.js 24.2.0
- TypeScript 5.9.2
- Three.js for 3D rendering
- RxJS for reactive programming

### Development Commands

```bash
# Run tests
moon run threejs-objects:test

# Run tests in watch mode
moon run threejs-objects:test:watch

# Build package
moon run threejs-objects:build

# Lint code
moon run threejs-objects:lint
```

## Package Architecture

### Directory Structure

```
src/
├── index.ts                    # Main entry point
├── ObjectManager.ts           # Main orchestrator and public facade
├── factory/                   # Object creation and transformation
│   ├── RenderableObjectFactory.ts # Transforms CelestialObject to RenderableCelestialObject
│   └── index.ts
├── object-manager/            # Specialized sub-managers
│   ├── AccelerationVisualizer.ts    # Debug acceleration vector visualization
│   ├── DebrisEffectManager.ts       # Particle effects for object destruction
│   ├── GlobalLODManager.ts          # Global LOD object registry
│   ├── GravitationalLensing.ts      # Lensing effects for massive objects
│   ├── MeshFactory.ts               # Three.js mesh creation factory
│   ├── ObjectLifecycleManager.ts    # Object creation, update, removal
│   ├── RendererUpdater.ts           # Reactive renderer updates
│   └── index.ts
└── utils/                     # Utility functions
    ├── coordinateUtils.ts     # Physics/Three.js coordinate conversion
    └── index.ts
```

### Data Flow

1. **State Subscription**: ObjectManager subscribes to `renderableObjects$` stream
2. **Lifecycle Management**: ObjectLifecycleManager handles add/update/remove operations
3. **Mesh Creation**: MeshFactory creates appropriate Three.js meshes using celestial renderers
4. **Renderer Updates**: RendererUpdater handles per-frame visual updates
5. **Special Effects**: Specialized managers handle lensing, debris, and debug visuals

## Code Style & Conventions

### TypeScript Standards

- **Strict Mode**: Always use strict TypeScript configuration
- **Type Safety**: Use proper typing for all Three.js objects and celestial data
- **Interfaces**: Use dedicated interfaces for configuration objects
- **JSDoc**: Include comprehensive documentation for all functions

### Naming Conventions

- **Files**: Use kebab-case for file names (e.g., `object-lifecycle-manager.ts`)
- **Constants**: Use UPPER_CASE for configuration constants
- **Functions**: Use camelCase for function names
- **Classes**: Use PascalCase for class names
- **Interfaces**: Use PascalCase with descriptive names

### Data Standards

- **Vector Math**: Use OSVector3 for physics calculations, convert to THREE.Vector3 for rendering
- **Performance**: Minimize object creation, use object pooling and caching
- **Memory Management**: Proper disposal of Three.js resources
- **State Management**: Use reactive patterns with RxJS subscriptions

## Key Components

### Core Manager

```typescript
export class ObjectManager extends StateSubscriptionMixin {
  // Main orchestrator that coordinates all sub-managers
  constructor(
    scene,
    camera,
    renderableObjects$,
    renderer,
    css2DManager,
    acceleration$,
    lightingManager,
  );
  update(renderer, scene, camera): void;
  setDebugMode(enabled: boolean): void;
  getObject(id: string): THREE.Object3D | null;
  getCentralBody(): THREE.Object3D | undefined;
}
```

### Sub-Managers

```typescript
// Object lifecycle management
export class ObjectLifecycleManager {
  syncObjectsWithState(
    newState: Record<string, RenderableCelestialObject>,
  ): void;
  addObject(object: RenderableCelestialObject): void;
  updateObject(object: RenderableCelestialObject): void;
  removeObject(objectId: string): void;
}

// Mesh creation factory
export class MeshFactory {
  createObjectMesh(object: RenderableCelestialObject): THREE.Object3D | null;
  setDebugMode(enabled: boolean): void;
}

// Reactive renderer updates
export class RendererUpdater extends StateSubscriptionMixin {
  updateRenderersReactive(
    allRenderableObjects: Record<string, RenderableCelestialObject>,
  ): void;
}
```

### Special Effects

- **GravitationalLensingHandler**: Manages lensing effects for black holes and neutron stars
- **DebrisEffectManager**: Creates particle effects for object destruction
- **AccelerationVisualizer**: Shows debug acceleration vectors as arrows

## Testing Strategy

### Test Organization

- **File Convention**: Test files (`<filename>.spec.ts`) adjacent to source files
- **Test Types**: Unit tests for individual managers, integration tests for object lifecycle
- **Test Data**: Use fixed random values for deterministic testing

### Test Commands

```bash
# Run all tests
moon run threejs-objects:test

# Run specific test file
moon run threejs-objects:test -- ObjectManager.spec.ts

# Run tests in watch mode
moon run threejs-objects:test:watch
```

### Test Patterns

- **Manager Testing**: Test individual sub-manager functionality
- **Integration Testing**: Test object lifecycle and state synchronization
- **Performance Testing**: Verify memory usage and object pooling
- **Effect Testing**: Test special effects like lensing and debris

## Data Sources & Validation

### Primary Sources

- **Renderable Objects**: From core state via `renderableObjects$` stream
- **Physics State**: From `PhysicsStateProvider` for position and velocity
- **Light Sources**: From `LightingManager` for illumination calculations
- **State Management**: From `StateAccessor` for simulation state

### Data Quality Standards

| Property         | Accuracy       | Source                             |
| ---------------- | -------------- | ---------------------------------- |
| Object Positions | High precision | Physics state provider             |
| Object Rotations | Real-time      | Calculated from orbital parameters |
| Light Sources    | Dynamic        | Lighting manager                   |
| Performance      | 60 FPS target  | Object pooling and caching         |

### Validation Process

1. **State Validation**: Ensure correct object state synchronization
2. **Mesh Validation**: Verify Three.js object creation and updates
3. **Performance Validation**: Monitor memory usage and frame rates
4. **Effect Validation**: Check special effects rendering

## Development Guidelines

### Adding New Object Types

1. **Update MeshFactory**: Add case for new celestial type
2. **Create Renderer**: Implement celestial renderer in appropriate package
3. **Update Lifecycle**: Ensure proper creation and disposal
4. **Add Tests**: Include comprehensive test coverage
5. **Document Usage**: Update documentation and examples

### Performance Optimization

- **Object Pooling**: Reuse Three.js objects to minimize allocations
- **Caching**: Cache expensive calculations and results
- **LOD Management**: Use appropriate level of detail for performance
- **Memory Management**: Proper disposal of resources

### Memory Management

- **Disposal**: Properly dispose of Three.js resources
- **Buffer Management**: Use efficient buffer pools for data
- **Cache Management**: Limit cache sizes to prevent memory leaks
- **Resource Cleanup**: Clean up all resources on disposal

## Common Patterns

### State Subscription Pattern

```typescript
export class ObjectManager extends StateSubscriptionMixin {
  private subscribeToStateChanges(): void {
    this.subscribeToState(
      this.renderableObjects$,
      (objects: Record<string, RenderableCelestialObject>) => {
        this.objectLifecycleManager.syncObjectsWithState(objects);
      },
    );
  }
}
```

### Factory Pattern

```typescript
export class MeshFactory {
  public createObjectMesh(
    object: RenderableCelestialObject,
  ): THREE.Object3D | null {
    switch (object.type) {
      case CelestialType.STAR:
        return createStarMesh(object, deps);
      case CelestialType.PLANET:
        return createPlanetMesh(object, deps);
      // ... other cases
    }
  }
}
```

### Lifecycle Pattern

```typescript
export class ObjectLifecycleManager {
  syncObjectsWithState(
    newState: Record<string, RenderableCelestialObject>,
  ): void {
    // Remove objects not in new state
    // Add or update objects from new state
    // Handle destroyed objects
  }
}
```

## Performance Considerations

### Rendering Performance

- **Object Creation**: Efficient Three.js mesh creation
- **Update Throttling**: Limit updates to maintain 60 FPS
- **Memory Usage**: Minimize object creation and garbage collection
- **LOD Management**: Use appropriate level of detail

### Data Processing

- **State Synchronization**: Efficient state change detection
- **Mesh Updates**: Optimized position and rotation updates
- **Effect Management**: Efficient special effects rendering
- **Resource Management**: Proper cleanup and disposal

## Troubleshooting

### Common Issues

- **Object Not Appearing**: Check state synchronization and mesh creation
- **Memory Leaks**: Verify proper disposal of Three.js resources
- **Performance Issues**: Monitor object pooling and update frequencies
- **Effect Problems**: Check special effects initialization and updates

### Debug Tools

- **Debug Mode**: Use `setDebugMode(true)` for fallback meshes
- **Acceleration Visualization**: Use `setDebugVisualization(true)` for force vectors
- **State Inspection**: Check state synchronization and object lifecycle
- **Memory Monitoring**: Monitor object counts and memory usage

## Dependencies

### Core Dependencies

- `@teskooano/core-state`: State management and subscriptions
- `@teskooano/data-types`: TypeScript interfaces and enums
- `@teskooano/core-math`: Mathematical utilities and vector operations
- `@teskooano/renderer-threejs-lighting`: Lighting system integration
- `@teskooano/renderer-threejs-labels`: 2D label management
- `@teskooano/renderer-threejs-celestial`: Celestial renderer system

### Celestial Dependencies

- `@teskooano/celestials-stars`: Star rendering
- `@teskooano/celestials-terrestrial`: Terrestrial planet rendering
- `@teskooano/celestials-gas-giants`: Gas giant rendering
- `@teskooano/celestials-comet`: Comet rendering
- `@teskooano/celestials-asteroid`: Asteroid rendering
- `@teskooano/celestials-asteroid-field`: Asteroid field rendering
- `@teskooano/celestials-oort-cloud`: Oort cloud rendering
- `@teskooano/celestials-rings`: Ring system rendering
- `@teskooano/celestials-satellite`: Satellite rendering

### Development Dependencies

- `vitest`: Testing framework
- `typescript`: Type checking
- `three`: 3D rendering library

## Contributing Guidelines

### Code Quality

1. **Follow Patterns**: Use established manager and factory patterns
2. **Write Tests**: Add comprehensive test coverage
3. **Document Changes**: Update documentation for new features
4. **Validate Performance**: Ensure no regression in rendering performance

### Architecture Guidelines

1. **Separation of Concerns**: Keep object lifecycle separate from rendering
2. **Factory Pattern**: Use for object creation and mesh generation
3. **Performance First**: Optimize for 60 FPS rendering
4. **Memory Efficiency**: Minimize allocations and garbage collection

### Review Process

1. **Architecture Review**: Check for proper pattern usage
2. **Performance Review**: Verify no performance regression
3. **Test Review**: Ensure adequate test coverage
4. **Integration Review**: Test with full rendering system

## Integration Points

### With Other Renderer Packages

- **LOD Manager**: Integrates with global LOD management
- **Lighting Manager**: Registers light sources and shadow casters
- **Labels Manager**: Creates and manages 2D labels
- **Orbits Manager**: Provides object data for orbit visualization

### With Core Systems

- **State Management**: Subscribes to renderable objects stream
- **Physics System**: Uses physics state for object positioning
- **Debug System**: Integrates with debug visualization system
- **Event System**: Handles destruction events for debris effects

## Architecture Documentation

For detailed technical documentation, see:

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Complete system architecture
- [README.md](./README.md) - Usage examples and overview
- [CHANGELOG.md](./CHANGELOG.md) - Version history and changes

## Scientific References

- [Three.js Documentation](https://threejs.org/docs/)
- [WebGL Performance Best Practices](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices)
- [Object-Oriented Design Patterns](https://en.wikipedia.org/wiki/Design_Patterns)
- [Reactive Programming with RxJS](https://rxjs.dev/)
