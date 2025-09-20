# AGENTS.md

A guide for AI coding agents working on the ThreeJS Core package for Teskooano.

## Package Overview

The **ThreeJS Core package** (`@teskooano/renderer-threejs-core`) provides the foundational components for the Teskooano engine's Three.js rendering pipeline. It manages the core scene setup, animation loop, and performance optimization, serving as a base for other renderer modules.

## Key Features

- **Core Scene Management**: Manages Three.js Scene, Camera, and WebGLRenderer instances
- **Animation Loop**: Handles requestAnimationFrame loop with callback-based architecture
- **Performance Optimization**: Automatic performance tuning based on device capabilities
- **Logarithmic Depth Buffer**: Superior depth precision for space-scale simulations
- **Render Order Management**: Centralized system for consistent depth sorting
- **Debug Tools**: Comprehensive depth buffer analysis and debugging utilities
- **Event System**: Type-safe RxJS-based event bus for internal communication

## Setup Commands

### Prerequisites

- Node.js 24.2.0
- TypeScript 5.9.2
- Three.js 0.180.0

### Development Commands

```bash
# Run tests
moon run threejs-core:test

# Run browser tests
moon run threejs-core:test:browser

# Run tests in watch mode
moon run threejs-core:test:watch

# Run tests with UI
moon run threejs-core:test:ui

# Build package
moon run threejs-core:build

# Lint code
moon run threejs-core:lint
```

## Package Architecture

### Directory Structure

```
src/
├── index.ts                           # Main entry point
├── AnimationLoop.ts                   # Core animation loop management
├── SceneManager.ts                    # Main scene, camera, and renderer management
├── RenderOrderManager.ts              # Centralized render order management
├── DepthBufferDebugger.ts             # Depth buffer analysis and debugging
├── LogarithmicDepthMaterial.ts        # Logarithmic depth buffer utilities
├── events.ts                          # Type-safe event bus
├── helpers/                           # Helper utilities
│   ├── GridManager.ts                 # Dynamic grid management
│   ├── DebugSphereManager.ts          # Debug sphere management
│   └── performance.ts                 # Performance optimization utilities
└── __tests__/                         # Test files
    ├── AnimationLoop.spec.ts
    ├── SceneManager.spec.ts
    └── test-utils.ts
```

### Data Flow

1. **Scene Creation**: SceneManager creates optimized Three.js scene components
2. **Animation Loop**: AnimationLoop manages requestAnimationFrame with callbacks
3. **Performance Optimization**: Automatic tuning based on device capabilities
4. **Depth Management**: Logarithmic depth buffer for space-scale precision
5. **Event Communication**: RxJS-based event bus for internal communication

## Code Style & Conventions

### TypeScript Standards

- **Strict Mode**: Always use strict TypeScript configuration
- **Type Safety**: Use proper typing for all Three.js objects and parameters
- **Interfaces**: Use dedicated interfaces for configuration objects
- **JSDoc**: Include comprehensive documentation for all functions

### Naming Conventions

- **Files**: Use PascalCase for class files (e.g., `SceneManager.ts`)
- **Constants**: Use UPPER_CASE for configuration constants
- **Functions**: Use camelCase for function names
- **Classes**: Use PascalCase for class names
- **Interfaces**: Use PascalCase with descriptive names

### Data Standards

- **Vector Math**: Use THREE.Vector3 for all position calculations
- **Performance**: Minimize object creation, use efficient algorithms
- **Memory Management**: Proper disposal of Three.js resources
- **Configuration**: Use options objects for complex parameters

## Key Components

### Scene Manager

```typescript
export class SceneManager {
  constructor(container: HTMLElement, options: SceneManagerOptions = {});
  onResize(width: number, height: number): void;
  render(): void;
  setFov(newFov: number): void;
  start(): void;
  stop(): void;
  dispose(): void;

  // Properties
  scene: Scene;
  camera: PerspectiveCamera;
  renderer: WebGLRenderer;
  animationLoop: AnimationLoop;
}
```

### Animation Loop

```typescript
export class AnimationLoop {
  constructor();
  setRenderer(renderer: THREE.WebGLRenderer): void;
  setCamera(camera: THREE.PerspectiveCamera): void;
  start(): void;
  stop(): void;
  onAnimate(callback: (time: number, delta: number) => void): void;
  onPhysics(callback: (time: number, delta: number) => void): void;
  onRender(callback: () => void): void;
  getCurrentStats(): RendererStats | null;
  getPerformanceStats(): PerformanceStats;
}
```

### Render Order Manager

```typescript
export class RenderOrderManager {
  static getRenderOrderForCelestialType(type: CelestialType): number;
  static getRenderOrderForEffect(effectType: string): number;
  static getRenderOrderForOrbit(orbitType: string): number;
  static applyRenderOrder(
    object: THREE.Object3D,
    type: CelestialType | string,
    subType?: string,
  ): void;
  static validateRenderOrder(object: THREE.Object3D): boolean;
  static debugRenderOrders(scene: THREE.Scene): void;
}
```

### Logarithmic Depth Material

```typescript
export class LogarithmicDepthMaterial {
  static enableLogDepth(material: THREE.Material): void;
  static enableLogDepthForScene(scene: THREE.Scene): void;
  static configureCameraForLogDepth(camera: THREE.PerspectiveCamera): void;
  static createTestMaterial(): THREE.MeshBasicMaterial;
}
```

### Depth Buffer Debugger

```typescript
export class DepthBufferDebugger {
  constructor(sceneManager: SceneManager);
  analyzeSceneMaterials(): MaterialAnalysis;
  analyzeRenderOrder(): RenderOrderAnalysis;
  runFullAnalysis(): void;
  createDepthVisualization(): THREE.Material;
}
```

## Testing Strategy

### Test Organization

- **File Convention**: Test files (`<filename>.spec.ts`) adjacent to source files
- **Test Types**: Unit tests for core components, integration tests for complex workflows
- **Test Data**: Use mock objects and helper functions for consistent testing

### Test Commands

```bash
# Run all tests
moon run threejs-core:test

# Run browser tests
moon run threejs-core:test:browser

# Run specific test file
moon run threejs-core:test -- AnimationLoop.spec.ts

# Run tests with UI
moon run threejs-core:test:ui
```

### Test Patterns

- **Component Testing**: Test core components with mocked Three.js objects
- **Animation Testing**: Test animation loop with mocked requestAnimationFrame
- **Performance Testing**: Test performance optimization and statistics
- **Integration Testing**: Test complete scene setup and rendering workflows

## Data Sources & Validation

### Primary Sources

- **Three.js Documentation**: Official Three.js API reference
- **WebGL Specifications**: WebGL capabilities and limitations
- **Performance Metrics**: Built-in statistics and monitoring
- **Device Capabilities**: Hardware detection and optimization

### Data Quality Standards

| Property                 | Accuracy        | Source                             |
| ------------------------ | --------------- | ---------------------------------- |
| Scene Creation           | High precision  | Three.js scene APIs                |
| Performance Optimization | Device-specific | WebGL capabilities detection       |
| Depth Buffer Precision   | Logarithmic     | Custom depth buffer implementation |
| Animation Performance    | 60 FPS target   | requestAnimationFrame optimization |

### Validation Process

1. **Component Validation**: Ensure proper Three.js object creation
2. **Performance Validation**: Verify optimization based on device capabilities
3. **Depth Validation**: Test logarithmic depth buffer functionality
4. **Animation Validation**: Test animation loop and callback execution

## Development Guidelines

### Adding New Components

1. **Follow Patterns**: Use established component patterns and naming conventions
2. **Add Documentation**: Include comprehensive JSDoc comments
3. **Include Tests**: Add unit tests for new functionality
4. **Update Exports**: Add new components to appropriate index files
5. **Performance Consider**: Optimize for high-frequency operations

### Performance Optimization

- **Device Detection**: Use WebGL capabilities for optimization decisions
- **Profile-Based Tuning**: Apply user performance profiles
- **Memory Management**: Proper cleanup of Three.js resources
- **Statistics Monitoring**: Use built-in statistics for performance analysis

### Depth Buffer Management

- **Logarithmic Depth**: Use logarithmic depth buffer for space-scale precision
- **Material Configuration**: Apply log depth to all materials
- **Camera Setup**: Configure cameras for optimal depth precision
- **Debug Tools**: Use depth buffer debugger for troubleshooting

## Common Patterns

### Scene Manager Pattern

```typescript
export class SceneManager {
  constructor(container: HTMLElement, options: SceneManagerOptions = {}) {
    this.options = options;

    // Get initial state for defaults
    const simState = StateAccessor.getSimulationState();
    this.fov = options.fov ?? 75;

    // Use SceneHelper to create optimized scene components
    const sceneSetup = this._createSceneWithHelper(container);
    this.scene = sceneSetup.scene;
    this.camera = sceneSetup.camera;
    this.renderer = sceneSetup.renderer;

    // Enable logarithmic depth buffer
    this.enableLogarithmicDepth();

    // Initialize animation loop
    this.animationLoop = new AnimationLoop();
    this.animationLoop.setRenderer(this.renderer);
    this.animationLoop.setCamera(this.camera);
  }
}
```

### Animation Loop Pattern

```typescript
export class AnimationLoop {
  private animate = (): void => {
    this.renderLoopId = requestAnimationFrame(this.animate);
    const deltaTime = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();

    rendererEvents.beforeRender$.next({ deltaTime, elapsedTime });

    this._updateStats();

    // Execute physics callbacks first
    for (const callback of this.onPhysicsCallbacks) {
      callback(elapsedTime, deltaTime);
    }

    // Execute animation callbacks
    for (const callback of this.onAnimateCallbacks) {
      callback(elapsedTime, deltaTime);
    }

    // Execute render callbacks last
    for (const callback of this.onRenderCallbacks) {
      callback();
    }

    rendererEvents.afterRender$.next({ deltaTime, elapsedTime });
  };
}
```

### Performance Optimization Pattern

```typescript
export function getPerformanceOptimization(
  capabilities: THREE.WebGLCapabilities,
  userProfile: DeviceTier,
): PerformanceOptimization {
  // Base optimization based on hardware capabilities
  const isHighEndGPU =
    capabilities.maxTextures >= 16 && capabilities.maxTextureSize >= 8192;

  // User profile multipliers
  const profileMultipliers = {
    low: 0.5,
    medium: 0.8,
    high: 1.2,
    cosmic: 2.0,
  };

  const multiplier = profileMultipliers[userProfile];

  // Determine settings based on capabilities and profile
  const antialias = isHighEndGPU || (isMidRangeGPU && userProfile !== "low");
  const shadows = isHighEndGPU || (isMidRangeGPU && userProfile !== "low");

  return {
    antialias,
    shadows,
    pixelRatio: Math.min(window.devicePixelRatio, basePixelRatio * multiplier),
    // ... other optimization settings
  };
}
```

## Performance Considerations

### Memory Optimization

- **Resource Disposal**: Proper cleanup of Three.js resources
- **Object Pooling**: Reuse objects where possible
- **Statistics Tracking**: Monitor memory usage and performance
- **Garbage Collection**: Minimize allocations in hot paths

### Animation Performance

- **Callback Management**: Efficient callback registration and execution
- **Frame Rate**: Target 60 FPS with proper delta time handling
- **Statistics Collection**: Periodic stats updates to avoid performance impact
- **Event System**: Efficient RxJS-based event communication

### Rendering Performance

- **Scene Optimization**: Efficient scene setup and management
- **Camera Management**: Optimized camera creation and updates
- **Depth Buffer**: Logarithmic depth for space-scale precision
- **Performance Profiles**: Device-specific optimization

## Troubleshooting

### Common Issues

- **Memory Leaks**: Ensure proper resource disposal in dispose methods
- **Performance Issues**: Monitor performance statistics and optimization settings
- **Depth Buffer Problems**: Use DepthBufferDebugger for analysis
- **Animation Issues**: Check callback registration and execution order

### Debug Tools

- **Depth Buffer Debugger**: Comprehensive depth buffer analysis
- **Performance Statistics**: Built-in performance monitoring
- **Render Order Debugging**: Debug render order distribution
- **WebGL State Analysis**: WebGL renderer state inspection

## Dependencies

### Core Dependencies

- `three`: 3D rendering library
- `rxjs`: Reactive programming for event system

### Development Dependencies

- `@types/three`: TypeScript definitions for Three.js
- `vitest`: Testing framework
- `@vitest/browser`: Browser testing support
- `@vitest/ui`: Test UI interface
- `typescript`: Type checking

## Contributing Guidelines

### Code Quality

1. **Follow Patterns**: Use established component patterns and naming conventions
2. **Write Tests**: Add comprehensive test coverage
3. **Document Changes**: Update documentation for new features
4. **Validate Performance**: Ensure no regression in performance

### Architecture Guidelines

1. **Modular Design**: Keep components focused and single-purpose
2. **Performance First**: Optimize for high-frequency operations
3. **Memory Efficiency**: Minimize allocations and garbage collection
4. **Type Safety**: Maintain strict TypeScript typing

### Review Process

1. **Architecture Review**: Check for proper pattern usage
2. **Performance Review**: Verify no performance regression
3. **Test Review**: Ensure adequate test coverage
4. **Integration Review**: Test with Three.js and other renderer packages

## Integration Points

### With Other Renderer Packages

- **Core Renderer**: Provides foundational scene and animation management
- **Object Renderer**: Uses scene manager for object lifecycle
- **Orbit Renderer**: Uses animation loop for trajectory updates
- **Lighting Renderer**: Uses scene manager for light management

### With Core Systems

- **State Management**: Integrates with application state for performance profiles
- **Physics System**: Uses animation loop for physics updates
- **Event System**: Provides renderer-specific event bus
- **Resource Management**: Integrates with engine resource management

## Architecture Documentation

For detailed technical documentation, see:

- [README.md](./README.md) - Package overview and quick start
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Detailed technical architecture
- [CHANGELOG.md](./CHANGELOG.md) - Version history and changes
- [TODO.md](./TODO.md) - Planned features and improvements

## Scientific References

- [Three.js Documentation](https://threejs.org/docs/)
- [WebGL Performance Best Practices](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices)
- [Logarithmic Depth Buffer](https://outerra.blogspot.com/2012/11/maximizing-depth-buffer-range-and.html)
- [Memory Management in JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Memory_Management)
