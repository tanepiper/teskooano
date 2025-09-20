# AGENTS.md

A guide for AI coding agents working on the ThreeJS package for Teskooano.

## Package Overview

The **ThreeJS package** (`@teskooano/renderer-threejs`) serves as the **integrator** for the modular Three.js rendering system used in the Teskooano engine. It brings together components from various sub-packages to provide a complete rendering solution, acting as a facade that orchestrates the entire rendering pipeline.

## Key Features

- **Modular Architecture**: Composes specialized managers from sub-packages into a cohesive system
- **Orchestrator Pattern**: Groups related managers into focused orchestrators (Rendering, Interaction, Debug)
- **State Bridge**: Transforms core application state into renderable format through RendererStateAdapter
- **Render Pipeline**: Orchestrates frame-by-frame updates in the correct sequence
- **Unified API**: Provides a clean facade for controlling the entire rendering system
- **Performance Optimization**: Implements throttling and caching for expensive operations
- **Event-Driven Architecture**: Uses RxJS for type-safe internal communication

## Setup Commands

### Prerequisites

- Node.js 24.2.0
- TypeScript 5.9.2
- Three.js 0.180.0

### Development Commands

```bash
# Run tests
moon run threejs:test

# Run tests in watch mode
moon run threejs:test:watch

# Build package
moon run threejs:build

# Lint code
moon run threejs:lint
```

## Package Architecture

### Directory Structure

```
src/
├── index.ts                           # Main entry point with exports
├── ModularSpaceRenderer.ts            # Primary facade class
├── RenderPipeline.ts                  # Frame-by-frame orchestrator
├── RendererStateAdapter.ts            # State bridge and transformation
├── events.ts                          # Type-safe event bus
├── types.ts                           # Type definitions and interfaces
└── orchestrators/                     # Orchestrator pattern implementation
    ├── index.ts                       # Barrel exports
    ├── README.md                      # Orchestrator architecture documentation
    ├── RenderingOrchestrator.ts       # Groups rendering-related managers
    ├── InteractionOrchestrator.ts     # Groups interaction-related managers
    └── DebugOrchestrator.ts           # Groups debug and analysis tools
```

### Data Flow

1. **Initialization**: ModularSpaceRenderer creates orchestrators in dependency order
2. **State Subscription**: RendererStateAdapter subscribes to core state observables
3. **Data Transformation**: Raw celestial objects transformed into renderable format
4. **Manager Coordination**: Orchestrators coordinate specialized managers
5. **Render Pipeline**: Frame-by-frame updates in correct sequence
6. **Event Broadcasting**: Type-safe events for internal communication

## Code Style & Conventions

### TypeScript Standards

- **Strict Mode**: Always use strict TypeScript configuration
- **Type Safety**: Use proper typing for all Three.js objects and parameters
- **Interfaces**: Use dedicated interfaces for constructor options
- **JSDoc**: Include comprehensive documentation for all functions

### Naming Conventions

- **Files**: Use PascalCase for class files (e.g., `ModularSpaceRenderer.ts`)
- **Constants**: Use UPPER_CASE for configuration constants
- **Functions**: Use camelCase for function names
- **Classes**: Use PascalCase for class names
- **Interfaces**: Use PascalCase with descriptive names

### Data Standards

- **Vector Math**: Use THREE.Vector3 for calculations and positioning
- **Performance**: Optimize for high-frequency operations with caching
- **Memory Management**: Proper disposal of Three.js resources
- **Configuration**: Use options objects for complex parameters

## Key Components

### ModularSpaceRenderer

```typescript
export class ModularSpaceRenderer {
  public renderingOrchestrator: RenderingOrchestrator;
  public interactionOrchestrator: InteractionOrchestrator;
  public debugOrchestrator: DebugOrchestrator;

  constructor(container: HTMLElement);
  start(): void;
  stop(): void;
  onResize(width: number, height: number): void;
  dispose(): void;
  getTriangleCount(): number;
  setDebugMode(enabled: boolean): void;

  // Getters for core Three.js objects
  get scene(): THREE.Scene;
  get camera(): THREE.PerspectiveCamera;
  get renderer(): THREE.WebGLRenderer;
  get controls(): OrbitControls;
}
```

### RenderPipeline

```typescript
export class RenderPipeline {
  constructor(managers: RenderPipelineOptions);
  update(deltaTime: number, elapsedTime: number): void;
  stop(): void;

  // Private methods
  private getRendererHeight(): number;
}
```

### RendererStateAdapter

```typescript
export class RendererStateAdapter extends StateSubscriptionMixin {
  public $visualSettings: BehaviorSubject<RendererVisualSettings>;
  private currentSimulationTime: number;
  private factory: RenderableObjectFactory;
  private lastProcessedObjects?: Record<string, CelestialObject>;

  constructor();
  dispose(): void;

  // Private methods
  private processCelestialObjectsUpdateNow(
    objects: Record<string, CelestialObject>,
  ): void;
  private subscribeToCoreState(): void;
  private extractVisualSettings(
    simState: SimulationState,
  ): RendererVisualSettings;
  private compareVisualSettings(
    a: RendererVisualSettings,
    b: RendererVisualSettings,
  ): boolean;
}
```

### RenderingOrchestrator

```typescript
export class RenderingOrchestrator {
  private _sceneManager: SceneManager;
  private _objectManager: ObjectManager;
  private _orbitManager: OrbitsManager;
  private _backgroundManager: BackgroundManager;
  private _lightingManager: LightingManager;
  private _lodManager: LODManager;
  private _gridManager: GridManager;
  private _stateAdapter: RendererStateAdapter;
  private _renderPipeline: RenderPipeline;

  constructor(container: HTMLElement);
  initializeManagersWithCss2D(css2DManager: any): void;
  setControlsManager(controlsManager: any): void;
  setDebugMode(enabled: boolean): void;
  getTriangleCount(): number;
  dispose(): void;

  // Getters for manager access
  get sceneManager(): SceneManager;
  get objectManager(): ObjectManager;
  get orbitManager(): OrbitsManager;
  get renderPipeline(): RenderPipeline;
  get gridManager(): GridManager;
  get stateAdapter(): RendererStateAdapter;
  get backgroundManager(): BackgroundManager;
  get lightingManager(): LightingManager;
  get lodManager(): LODManager;
}
```

### InteractionOrchestrator

```typescript
export class InteractionOrchestrator {
  private controlsManager: ControlsManager;
  private css2DManager: Layer2DManager;
  private auMarkerManager: AuMarkerManager;

  constructor(container: HTMLElement, renderingOrchestrator: any);
  setDebugMode(enabled: boolean): void;
  onResize(width: number, height: number): void;
  dispose(): void;

  // Getters for manager access
  getControlsManager(): ControlsManager;
  getLayer2DManager(): Layer2DManager;
  getAuMarkerManager(): AuMarkerManager;
}
```

### DebugOrchestrator

```typescript
export class DebugOrchestrator {
  private depthDebugger: DepthBufferDebugger;

  constructor(sceneManager: any);
  runDepthAnalysis(): void;
  dispose(): void;

  // Getters for debug tools
  getDepthDebugger(): DepthBufferDebugger;
}
```

## Testing Strategy

### Test Organization

- **File Convention**: Test files (`<filename>.spec.ts`) adjacent to source files
- **Test Types**: Unit tests for orchestrators, integration tests for renderer coordination
- **Test Data**: Use mock objects and helper functions for consistent testing

### Test Commands

```bash
# Run all tests
moon run threejs:test

# Run tests in watch mode
moon run threejs:test:watch
```

### Test Patterns

- **Orchestrator Testing**: Test individual orchestrators with mocked dependencies
- **Pipeline Testing**: Test render pipeline update sequence and timing
- **State Adapter Testing**: Test state transformation and subscription handling
- **Integration Testing**: Test complete renderer initialization and disposal

## Data Sources & Validation

### Primary Sources

- **Core State**: Application state from `@teskooano/core-state`
- **Sub-Package Managers**: Specialized managers from renderer sub-packages
- **Three.js Objects**: Core Three.js scene, camera, and renderer
- **Event System**: RxJS-based internal communication

### Data Quality Standards

| Property             | Accuracy          | Source                      |
| -------------------- | ----------------- | --------------------------- |
| State Transformation | Real-time sync    | RendererStateAdapter        |
| Manager Coordination | Proper sequencing | Orchestrators               |
| Performance          | 60+ FPS           | RenderPipeline optimization |
| Memory Usage         | Minimal           | Proper resource disposal    |

### Validation Process

1. **Orchestrator Validation**: Ensure proper manager initialization and coordination
2. **Pipeline Validation**: Test update sequence and timing
3. **State Validation**: Verify state transformation accuracy
4. **Performance Validation**: Monitor frame rate and memory usage

## Development Guidelines

### Adding New Components

1. **Follow Patterns**: Use established orchestrator patterns and naming conventions
2. **Add Documentation**: Include comprehensive JSDoc comments
3. **Include Tests**: Add unit tests for new functionality
4. **Update Exports**: Add new components to appropriate index files
5. **Performance Consider**: Optimize for high-frequency operations

### Orchestrator Development

- **Group Related Managers**: Organize managers by functional responsibility
- **Implement Standard Interface**: Follow established orchestrator patterns
- **Handle Dependencies**: Manage circular dependencies between orchestrators
- **Resource Management**: Proper cleanup of managed resources

### Pipeline Development

- **Maintain Update Order**: Ensure correct sequence of operations
- **Optimize Performance**: Use throttling and caching for expensive operations
- **Handle Errors**: Implement proper error handling and recovery
- **Document Timing**: Clearly document update frequencies and dependencies

## Common Patterns

### Orchestrator Pattern

```typescript
export class CustomOrchestrator {
  private _manager1: Manager1;
  private _manager2: Manager2;

  constructor(dependencies: CustomOrchestratorOptions) {
    this._manager1 = new Manager1(dependencies.param1);
    this._manager2 = new Manager2(dependencies.param2);
  }

  public getManager1(): Manager1 {
    return this._manager1;
  }

  public setDebugMode(enabled: boolean): void {
    this._manager1.setDebugMode(enabled);
    this._manager2.setDebugMode(enabled);
  }

  public dispose(): void {
    this._manager1.dispose();
    this._manager2.dispose();
  }
}
```

### State Adapter Pattern

```typescript
export class CustomStateAdapter extends StateSubscriptionMixin {
  private factory: CustomFactory;
  private lastProcessedData?: any;

  constructor() {
    super();
    this.factory = new CustomFactory();
    this.subscribeToCoreState();
  }

  private subscribeToCoreState(): void {
    this.subscribeToState(StateAccessor.data$(), (data) =>
      this.processDataUpdateNow(data),
    );
  }

  private processDataUpdateNow(data: any): void {
    // Transform and process data
    const processedData = this.factory.process(data);
    // Update stores or emit events
  }

  public dispose(): void {
    super.dispose();
  }
}
```

### Pipeline Pattern

```typescript
export class CustomPipeline {
  private managers: CustomPipelineOptions;
  private frameCount: number = 0;
  private readonly UPDATE_FREQUENCY = 10;

  constructor(managers: CustomPipelineOptions) {
    this.managers = managers;
  }

  public update = (deltaTime: number, elapsedTime: number): void => {
    this.frameCount++;

    // Update managers in correct order
    this.managers.manager1.update(deltaTime);
    this.managers.manager2.update(deltaTime);

    // Throttle expensive operations
    if (this.frameCount % this.UPDATE_FREQUENCY === 0) {
      this.managers.expensiveManager.update(deltaTime);
    }

    // Final render
    this.managers.sceneManager.render();
  };
}
```

## Performance Considerations

### Memory Optimization

- **Resource Disposal**: Proper cleanup of all managed resources
- **Object Pooling**: Reuse Three.js objects where possible
- **Cache Management**: Efficient caching of expensive calculations
- **Subscription Management**: Automatic cleanup of RxJS subscriptions

### Rendering Performance

- **Update Throttling**: Limit frequency of expensive operations
- **Pipeline Optimization**: Efficient update sequence and timing
- **Manager Coordination**: Minimize redundant operations
- **State Caching**: Cache transformed state to avoid recalculation

### Animation Performance

- **Frame Rate Control**: Maintain consistent 60 FPS
- **Delta Time Usage**: Use deltaTime for smooth animation
- **Callback Optimization**: Efficient callback execution
- **Memory Allocation**: Minimize allocations in hot paths

## Troubleshooting

### Common Issues

- **Circular Dependencies**: Manage dependencies between orchestrators
- **State Synchronization**: Ensure proper state transformation
- **Performance Issues**: Monitor frame rate and optimize pipeline
- **Memory Leaks**: Check resource disposal and subscription cleanup

### Debug Tools

- **Debug Mode**: Toggle debug mode for all components
- **Triangle Count**: Monitor rendering complexity
- **Depth Analysis**: Analyze depth buffer issues
- **Performance Monitoring**: Track frame rate and memory usage

## Dependencies

### Core Dependencies

- `three`: 3D rendering library
- `@teskooano/core-state`: State management integration
- `@teskooano/data-types`: Shared data type definitions
- `@teskooano/renderer-threejs-*`: Specialized renderer sub-packages

### Development Dependencies

- `@types/three`: TypeScript definitions for Three.js
- `vitest`: Testing framework
- `typescript`: Type checking
- `rxjs`: Reactive programming for state management

## Contributing Guidelines

### Code Quality

1. **Follow Patterns**: Use established orchestrator patterns and naming conventions
2. **Write Tests**: Add comprehensive test coverage
3. **Document Changes**: Update documentation for new features
4. **Validate Performance**: Ensure no regression in performance

### Architecture Guidelines

1. **Orchestrator Design**: Group related managers into focused orchestrators
2. **Performance First**: Optimize for real-time rendering
3. **Memory Efficiency**: Minimize allocations and garbage collection
4. **State Management**: Use RxJS for reactive state handling

### Review Process

1. **Architecture Review**: Check for proper orchestrator pattern usage
2. **Performance Review**: Verify no performance regression
3. **Test Review**: Ensure adequate test coverage
4. **Integration Review**: Validate sub-package integration

## Integration Points

### With Sub-Packages

- **Core Renderer**: Integrates with main Three.js scene
- **Object Management**: Coordinates object lifecycle and rendering
- **Orbital Visualization**: Manages trajectory and path rendering
- **Background System**: Handles skybox and environmental effects
- **Lighting System**: Manages scene lighting and shadows
- **Controls System**: Handles user interaction and camera control
- **Label System**: Manages 2D overlays and distance markers

### With Core Systems

- **State Management**: Transforms core state into renderable format
- **Simulation System**: Integrates with physics simulation
- **Event System**: Uses RxJS for internal communication
- **Performance System**: Optimizes based on device capabilities

## Architecture Documentation

For detailed technical documentation, see:

- [README.md](./README.md) - Package overview and usage examples
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Detailed technical architecture
- [CHANGELOG.md](./CHANGELOG.md) - Version history and changes
- [TODO.md](./TODO.md) - Planned improvements and future tasks
- [orchestrators/README.md](./orchestrators/README.md) - Orchestrator architecture details

## Scientific References

- [Three.js Documentation](https://threejs.org/docs/)
- [RxJS Documentation](https://rxjs.dev/)
- [Orchestrator Pattern](https://en.wikipedia.org/wiki/Orchestrator_pattern)
- [Facade Pattern](https://en.wikipedia.org/wiki/Facade_pattern)
