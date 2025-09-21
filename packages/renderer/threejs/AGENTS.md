# AGENTS.md

A guide for AI coding agents working on the ThreeJS package for Teskooano.

## Package Overview

The **ThreeJS package** (`@teskooano/renderer-threejs`) serves as the **integrator** for the modular Three.js rendering system used in the Teskooano engine. It brings together components from various sub-packages to provide a complete rendering solution, acting as a facade that orchestrates the entire rendering pipeline.

## Key Features

- **Modular Architecture**: Composes specialized managers from sub-packages into a cohesive system
- **Orchestrator Pattern**: Groups related managers into focused orchestrators (Rendering, Debug)
- **Constructor Injection**: Eliminates circular dependencies through proper dependency injection
- **Service Container**: Manages shared and panel-specific services with clear boundaries
- **Dual-Service Architecture**: Clear separation between singleton (shared) and instance (panel-specific) services
- **State Bridge**: Transforms core application state into renderable format through RendererStateAdapter
- **Render Pipeline**: Orchestrates frame-by-frame updates in the correct sequence
- **Unified API**: Provides a clean facade for controlling the entire rendering system
- **Performance Optimization**: Implements throttling and caching for expensive operations
- **Event-Driven Architecture**: Comprehensive RxJS-based event system with dual event bridges

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
├── events.ts                          # Type-safe event bus and pipeline events
├── types.ts                           # Type definitions and interfaces
├── services/                          # Service container and dependency injection
│   ├── index.ts                       # Service exports
│   ├── RendererServiceContainer.ts    # Manages shared and panel-specific services
│   ├── RendererContainer.ts           # Advanced DI container with scopes
│   ├── ServiceFactories.ts            # Factory methods for complex object creation
│   ├── SERVICE_BOUNDARIES.md          # Service architecture documentation
│   └── DI_CONTAINER.md                # Dependency injection container documentation
└── orchestrators/                     # Orchestrator pattern implementation
    ├── index.ts                       # Barrel exports
    ├── README.md                      # Orchestrator architecture documentation
    ├── RenderingOrchestrator.ts       # Groups rendering-related managers
    └── DebugOrchestrator.ts           # Groups debug and analysis tools
```

### Data Flow

1. **Service Creation**: RendererServiceContainer creates all services with proper dependencies
2. **Constructor Injection**: Orchestrators receive services via constructor injection
3. **State Subscription**: RendererStateAdapter subscribes to core state observables
4. **Data Transformation**: Raw celestial objects transformed into renderable format
5. **Manager Coordination**: Orchestrators coordinate specialized managers
6. **Render Pipeline**: Frame-by-frame updates in correct sequence
7. **Event Broadcasting**: Comprehensive event system with RxJS observables and dual event bridges

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

### RendererServiceContainer

```typescript
export class RendererServiceContainer {
  public static getInstance(): RendererServiceContainer;
  public getSharedServices(): SharedRendererServices;
  public createPanelServices(
    options: PanelServiceOptions,
  ): PanelRendererServices;
  public createRendererServices(container: HTMLElement): RendererServices;
  public disposeSharedServices(): void;
  public disposePanelServices(services: PanelRendererServices): void;
  public disposeAll(services?: PanelRendererServices): void;
}

export interface SharedRendererServices {
  readonly stateAdapter: RendererStateAdapter;
  readonly lodManager: LODManager;
}

export interface PanelRendererServices {
  readonly sceneManager: SceneManager;
  readonly lightingManager: LightingManager;
  readonly gridManager: GridManager;
  readonly backgroundManager: BackgroundManager;
  readonly objectManager: ObjectManager;
  readonly orbitManager: OrbitsManager;
  readonly controlsManager: ControlsManager;
  readonly css2DManager: Layer2DManager;
  readonly auMarkerManager: AuMarkerManager;
  readonly renderPipeline: RenderPipeline;
}
```

### Service Boundaries Architecture

The renderer system uses a **dual-service architecture** with clear separation between:

#### Shared Services (Singletons)

- **`RendererStateAdapter`**: Bridges core state to renderer format
- **`LODManager`**: Manages Level of Detail calculations globally

#### Panel Services (Instances)

- **`SceneManager`**: Three.js scene, camera, renderer per panel
- **`LightingManager`**: Panel-specific lighting setup
- **`ObjectManager`**: Celestial object rendering per panel
- **`OrbitsManager`**: Orbit visualization per panel
- **`ControlsManager`**: Camera controls per panel
- **`Layer2DManager`**: 2D labels per panel
- **`AuMarkerManager`**: Distance markers per panel
- **`RenderPipeline`**: Rendering orchestration per panel

**Key Benefits:**

- **Resource Efficiency**: Shared services avoid duplication
- **State Isolation**: Each panel maintains independent state
- **Clear Dependencies**: Explicit boundaries prevent coupling
- **Testability**: Services can be tested in isolation

See `services/SERVICE_BOUNDARIES.md` for comprehensive documentation.

### RendererContainer (Advanced DI Container)

```typescript
export class RendererContainer {
  public static getInstance(): RendererContainer;
  public register<T>(
    token: string | symbol | Function,
    factory: (...args: any[]) => T,
    scope: ServiceScope,
    dependencies: (string | symbol | Function)[],
  ): void;
  public resolve<T>(
    token: string | symbol | Function,
    context?: ServiceContext,
  ): T;
  public createPanelServices(
    container: HTMLElement,
    panelId: string,
  ): { shared: SharedServices; panel: PanelServices };
  public disposeScope(scopeId: string): void;
  public disposeSingletons(): void;
  public disposeAll(): void;
  public getServiceInfo(): ServiceInfo[];
}

export enum ServiceScope {
  SINGLETON = "singleton", // One instance shared across all panels
  TRANSIENT = "transient", // New instance for each request
  SCOPED = "scoped", // One instance per panel/scope
}
```

**Key Features:**

- **Service Registration**: Register services with different scopes and dependencies
- **Automatic Resolution**: Automatically resolve and inject dependencies
- **Service Factories**: Complex object creation with proper configuration
- **Lifecycle Management**: Proper service disposal and cleanup
- **Context Support**: Scoped services with panel-specific context

See `services/DI_CONTAINER.md` for comprehensive documentation.

### ServiceFactories

```typescript
export class ServiceFactories {
  static createSceneManager(container: HTMLElement): SceneManager;
  static createLightingManager(scene: THREE.Scene): LightingManager;
  static createGridManager(scene: THREE.Scene): GridManager;
  static createBackgroundManager(scene: THREE.Scene): BackgroundManager;
  static createControlsManager(
    camera: THREE.PerspectiveCamera,
    renderer: THREE.WebGLRenderer,
  ): ControlsManager;
  static createLayer2DManager(
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
  ): Layer2DManager;
  static createObjectManager(
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    renderer: THREE.WebGLRenderer,
    css2DManager: Layer2DManager,
    lightingManager: LightingManager,
  ): ObjectManager;
  static createOrbitsManager(
    objectManager: ObjectManager,
    stateAdapter: RendererStateAdapter,
    css2DManager: Layer2DManager,
  ): OrbitsManager;
  static createAuMarkerManager(
    scene: THREE.Scene,
    css2DManager: Layer2DManager,
  ): AuMarkerManager;
  static createRenderPipeline(options: RenderPipelineOptions): RenderPipeline;
  static createRendererStateAdapter(): RendererStateAdapter;
  static createLODManager(): LODManager;
  static createPanelServices(container: HTMLElement): PanelServices;
  static createSharedServices(): SharedServices;
}
```

**Key Features:**

- **Complex Initialization**: Encapsulates complex Three.js setup and configuration
- **Consistent Configuration**: Ensures all services are properly configured
- **Dependency Management**: Handles complex dependency relationships
- **Alternative to DI Container**: Provides simpler factory-based approach

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
  private readonly services: RendererServices;

  constructor(services: RendererServices);
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
- **Constructor Injection**: Use constructor injection for all dependencies
- **Service Boundaries**: Clear separation between shared and panel-specific services
- **Resource Management**: Proper cleanup of managed resources

### Service Container Development

- **Singleton Pattern**: Use singleton pattern for shared services (stateAdapter, lodManager)
- **Instance Pattern**: Create new instances for panel-specific services (scene, lighting, etc.)
- **Dependency Injection**: All services receive dependencies via constructor
- **Service Interfaces**: Define clear interfaces for service boundaries
- **Resource Disposal**: Proper cleanup through service container

### Pipeline Development

- **Maintain Update Order**: Ensure correct sequence of operations
- **Optimize Performance**: Use throttling and caching for expensive operations
- **Handle Errors**: Implement proper error handling and recovery
- **Document Timing**: Clearly document update frequencies and dependencies

## Common Patterns

### Constructor Injection Pattern

```typescript
export class CustomOrchestrator {
  private readonly services: CustomServices;

  constructor(services: CustomServices) {
    this.services = services;
  }

  public getManager1(): Manager1 {
    return this.services.manager1;
  }

  public setDebugMode(enabled: boolean): void {
    this.services.manager1.setDebugMode(enabled);
    this.services.manager2.setDebugMode(enabled);
  }

  public dispose(): void {
    // Disposal handled by service container
    console.log("[CustomOrchestrator] Disposal handled by service container");
  }
}
```

### Service Container Pattern

```typescript
export class CustomServiceContainer {
  private static instance: CustomServiceContainer;
  private _sharedServices: SharedServices | null = null;

  public static getInstance(): CustomServiceContainer {
    if (!CustomServiceContainer.instance) {
      CustomServiceContainer.instance = new CustomServiceContainer();
    }
    return CustomServiceContainer.instance;
  }

  public getSharedServices(): SharedServices {
    if (!this._sharedServices) {
      this._sharedServices = {
        stateManager: new StateManager(),
        eventBus: new EventBus(),
      };
    }
    return this._sharedServices;
  }

  public createPanelServices(options: PanelOptions): PanelServices {
    const sharedServices = this.getSharedServices();

    return {
      sceneManager: new SceneManager(options.container),
      controlsManager: new ControlsManager(options.camera),
      // ... other panel-specific services
    };
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

## Architectural Improvements

### Circular Dependencies Resolution

The renderer system has been refactored to eliminate circular dependencies:

**Before (Problematic):**

```typescript
// ❌ Circular dependency
RenderingOrchestrator -> needs css2DManager from InteractionOrchestrator
InteractionOrchestrator -> needs RenderingOrchestrator for scene/camera
```

**After (Fixed):**

```typescript
// ✅ Constructor injection + Direct service access
RendererServiceContainer -> creates all services upfront
RenderingOrchestrator -> receives services via constructor
ModularSpaceRenderer -> accesses interaction services directly
```

### Service Boundaries

Clear separation between shared and panel-specific services:

**Shared Services (Singletons):**

- `RendererStateAdapter`: State management across all panels
- `LODManager`: Level of detail management

**Panel-Specific Services (Instances):**

- `SceneManager`: Three.js scene for each panel
- `ControlsManager`: Camera controls for each panel
- `ObjectManager`: Object lifecycle for each panel

### Constructor Injection Benefits

- **No setDependencies() calls**: All dependencies injected at construction
- **Clear service boundaries**: Explicit interfaces for service contracts
- **Better testability**: Easy to mock dependencies for testing
- **Improved maintainability**: Clear dependency relationships

## Troubleshooting

### Common Issues

- **Service Creation**: Ensure services are created through RendererServiceContainer
- **Memory Leaks**: Ensure proper disposal through service container
- **Performance Issues**: Monitor frame rate and optimize LOD settings
- **State Synchronization**: Verify state adapter subscriptions

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
- **Event System**: Comprehensive RxJS-based event system with dual event bridges
- **Performance System**: Optimizes based on device capabilities

## Event System Architecture

The renderer uses a comprehensive event-driven architecture with three types of events:

### Event Types

1. **RxJS Events** (`rendererEvents`) - Type-safe observables for internal renderer communication
2. **Pipeline Events** (`renderPipelineEvents`) - Stage-specific events for render pipeline coordination
3. **DOM Events** - Custom events for cross-system communication via event bridges

### Key Components

#### Event Bridges (from `@teskooano/core-state`)

- **SystemEventBridge**: Handles system-level operations (object lifecycle, hierarchy changes)
- **CelestialEventBridge**: Handles celestial-specific operations (show/hide labels, orbits, predictions)
- **Features**: Automatic initialization, lifecycle management, error handling
- **Usage**: Automatically managed by ModularSpaceRenderer

#### Renderer Events (`events.ts`)

- **`destruction$`**: Emits when celestial objects are destroyed
- **Purpose**: Trigger visual effects like explosions or particle systems

#### Pipeline Events (`RenderPipeline.ts`)

- **10 stage-specific events**: beforeUpdate, afterControlsUpdate, afterOrbitsUpdate, etc.
- **Purpose**: Allow components to react to specific rendering stages
- **Payload**: `{ deltaTime, elapsedTime, frameCount }`

### Usage Patterns

```typescript
// Subscribe to system events
import { SystemEventBridge } from "@teskooano/core-state";
SystemEventBridge.getInstance().celestialObjectDestroyed$.subscribe(
  (payload) => {
    console.log(`Object ${payload.objectId} was destroyed`);
    this.createExplosionEffect(payload.object?.position);
  },
);

// Subscribe to celestial events
import { CelestialEventBridge } from "@teskooano/core-state";
CelestialEventBridge.getInstance().clearOrbitTrails$.subscribe(() => {
  console.log("Clearing orbit trails");
  this.clearAllOrbitTrails();
});

// Subscribe to pipeline events
import { renderPipelineEvents } from "@teskooano/renderer-threejs";
renderPipelineEvents.afterObjectsUpdate$.subscribe((payload) => {
  console.log(`Objects updated at frame ${payload.frameCount}`);
  this.updateObjectUI();
});
```

### Best Practices

- **Use StateSubscriptionMixin**: Automatic subscription cleanup
- **Validate payloads**: Always check event data validity
- **Throttle expensive operations**: Use RxJS operators for performance
- **Handle errors**: Implement proper error handling in subscriptions
- **Use appropriate bridge**: System events use SystemEventBridge, celestial events use CelestialEventBridge

### Documentation

See `@teskooano/core-state/services/EVENT_SYSTEM.md` for comprehensive documentation of the event system architecture, usage patterns, and best practices.

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
