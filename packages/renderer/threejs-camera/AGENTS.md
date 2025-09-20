# AGENTS.md

A guide for AI coding agents working on the ThreeJS Camera package for Teskooano.

## Package Overview

The **ThreeJS Camera package** (`@teskooano/renderer-threejs-camera`) provides high-level camera management functionality for the Teskooano Three.js scene. It orchestrates camera operations and integrates with the simulation system, working in conjunction with low-level controls and centralized state management.

## Key Features

- **High-Level Camera Management**: Object focusing with smooth transitions, camera positioning and targeting
- **Field of View (FOV) Management**: Dynamic FOV control and celestial type-specific camera settings
- **Observable Camera State**: Integration with core-state CameraStore for per-panel camera instances
- **Simulation Integration**: Pauses simulation during camera transitions to prevent fast-moving objects from moving too far
- **Event-Driven Architecture**: Listens for camera transition completion and user manipulation events
- **Interface-Based Design**: Uses ICameraRenderer interface to avoid circular dependencies
- **Per-Panel Support**: Each engine panel can have its own camera state instance

## Setup Commands

### Prerequisites

- Node.js 24.2.0
- TypeScript 5.9.2
- Three.js 0.180.0

### Development Commands

```bash
# Run tests
moon run threejs-camera:test

# Run browser tests
moon run threejs-camera:test:browser

# Run tests in watch mode
moon run threejs-camera:test:watch

# Run tests with UI
moon run threejs-camera:test:ui

# Build package
moon run threejs-camera:build

# Lint code
moon run threejs-camera:lint
```

## Package Architecture

### Directory Structure

```
src/
├── index.ts                           # Main entry point with exports
├── CameraManager.ts                   # Core camera management class
├── constants.ts                       # Default camera constants and offsets
└── types.ts                          # Type re-exports from data-types
```

### Data Flow

1. **Initialization**: CameraManager receives renderer instance and panel ID through setDependencies
2. **State Management**: Delegates to core-state CameraStore for per-panel camera state
3. **Camera Operations**: High-level operations (focus, move, FOV) delegate to low-level controls
4. **Event Handling**: Listens for transition completion and user manipulation events
5. **Simulation Integration**: Pauses/resumes simulation during transitions
6. **State Updates**: Updates camera state through CameraStore and triggers callbacks

## Code Style & Conventions

### TypeScript Standards

- **Strict Mode**: Always use strict TypeScript configuration
- **Type Safety**: Use proper typing for all Three.js objects and parameters
- **Interfaces**: Use dedicated interfaces for configuration objects
- **JSDoc**: Include comprehensive documentation for all functions

### Naming Conventions

- **Files**: Use PascalCase for class files (e.g., `CameraManager.ts`)
- **Constants**: Use UPPER_CASE for configuration constants
- **Functions**: Use camelCase for function names
- **Classes**: Use PascalCase for class names
- **Interfaces**: Use PascalCase with descriptive names

### Data Standards

- **Vector Math**: Use OSVector3 for calculations, convert to THREE.Vector3 for rendering
- **State Management**: Use core-state CameraStore for consistent state management
- **Event Handling**: Use custom events for communication between components
- **Configuration**: Use options objects for complex parameters

## Key Components

### Camera Manager

```typescript
export class CameraManager {
  constructor();
  setDependencies(options: CameraManagerOptions): void;
  initializeCameraPosition(): void;
  getCameraState$(): BehaviorSubject<CameraState>;
  followObject(objectId: string | null, distance?: number): void;
  pointCameraAt(targetPosition: THREE.Vector3): void;
  resetCameraView(): void;
  clearFocus(): void;
  setFov(fov: number): void;
  destroy(): void;

  // Private methods
  private _calculateLogarithmicViewingDistance(
    objectRadius: number,
    objectType?: string,
  ): number;
  private _updateDynamicCameraSettings(objectId: string | null): void;
  private pauseSimulationForTransition(): void;
  private resumeSimulationAfterTransition(): void;
  private handleCameraTransitionComplete(event: Event): void;
  private handleUserCameraManipulation(event: Event): void;
}
```

### Camera Constants

```typescript
export const CAMERA_OFFSET = new OSVector3()
  .setFromArray([0.8, 0.4, 1.0])
  .normalize();
export const DEFAULT_CAMERA_POSITION = new OSVector3().setFromArray([
  200, 200, 200,
]);
export const DEFAULT_CAMERA_TARGET = new OSVector3().setZero();
export const DEFAULT_CAMERA_DISTANCE = 1;
export const DEFAULT_FOV = 75;
```

### Camera Manager Options

```typescript
interface CameraManagerOptions {
  renderer: ICameraRenderer;
  panelId: string;
  initialFov?: number;
  initialFocusedObjectId?: string | null;
  initialCameraPosition?: OSVector3;
  initialCameraTarget?: OSVector3;
  onFocusChangeCallback?: (focusedObjectId: string | null) => void;
}
```

## Testing Strategy

### Test Organization

- **File Convention**: Test files (`<filename>.spec.ts`) adjacent to source files
- **Test Types**: Unit tests for camera operations, integration tests for state management
- **Test Data**: Use mock objects and helper functions for consistent testing

### Test Commands

```bash
# Run all tests
moon run threejs-camera:test

# Run browser tests
moon run threejs-camera:test:browser

# Run specific test file
moon run threejs-camera:test -- CameraManager.spec.ts

# Run tests with UI
moon run threejs-camera:test:ui
```

### Test Patterns

- **Manager Testing**: Test CameraManager with mocked renderer and state dependencies
- **State Testing**: Test camera state updates and observable streams
- **Integration Testing**: Test camera operations with simulation system
- **Event Testing**: Test event handling and callback execution

## Data Sources & Validation

### Primary Sources

- **Three.js Documentation**: Official Three.js API reference
- **Core State**: CameraStore for state management and validation
- **Renderer Interface**: ICameraRenderer for renderer abstraction
- **Simulation State**: Integration with simulation system for time scale management

### Data Quality Standards

| Property         | Accuracy       | Source                           |
| ---------------- | -------------- | -------------------------------- |
| Camera Position  | High precision | Three.js camera position         |
| Camera Target    | High precision | Three.js camera target           |
| FOV Settings     | Dynamic        | Celestial type-specific settings |
| State Management | Consistent     | Core-state CameraStore           |

### Validation Process

1. **State Validation**: Ensure proper camera state initialization and updates
2. **Renderer Validation**: Test interface compliance and method delegation
3. **Event Validation**: Test event handling and callback execution
4. **Integration Validation**: Test with simulation system and controls

## Development Guidelines

### Adding New Components

1. **Follow Patterns**: Use established camera management patterns and naming conventions
2. **Add Documentation**: Include comprehensive JSDoc comments
3. **Include Tests**: Add unit tests for new functionality
4. **Update Exports**: Add new components to appropriate index files
5. **State Integration**: Ensure proper integration with core-state system

### Camera Management Development

- **High-Level Operations**: Focus on high-level camera operations, delegate low-level to controls
- **State Consistency**: Use core-state CameraStore for all state management
- **Event Handling**: Use custom events for component communication
- **Simulation Awareness**: Consider simulation state during camera operations

### Interface Design

- **Abstraction**: Use ICameraRenderer interface to avoid circular dependencies
- **Flexibility**: Support multiple renderer implementations
- **Type Safety**: Maintain strict TypeScript typing
- **Consistency**: Use consistent interfaces across all packages

## Common Patterns

### Camera Manager Pattern

```typescript
export class CameraManager {
  constructor() {
    // No direct state management - delegated to CameraStore
  }

  public setDependencies(options: CameraManagerOptions): void {
    // Clean up existing renderer
    this._cleanupPriorRenderer();

    // Set new renderer and panel ID
    this.renderer = options.renderer;
    this.panelId = options.panelId;

    // Initialize camera store for this panel
    if (this.panelId) {
      this.cameraStore = StateAccessor.getCameraStore(
        this.panelId,
        initialState,
      );
    }

    // Set up event listeners
    this._setupEventListeners();

    // Initialize camera position
    this.initializeCameraPosition();
  }

  public followObject(objectId: string | null, distance?: number): void {
    // Update state
    this.cameraStore.updateCameraState({ focusedObjectId: objectId });

    // Pause simulation during transition
    this.pauseSimulationForTransition();

    // Delegate to controls manager
    if (objectId === null) {
      controlsManager.stopFollowing();
      controlsManager.moveToPosition(
        DEFAULT_CAMERA_POSITION,
        DEFAULT_CAMERA_TARGET,
      );
    } else {
      // Calculate camera position and start following
      const objectToFollow = this.renderer.getObject(objectId);
      controlsManager.startFollowing(objectToFollow, cameraOffset);
      controlsManager.transitionToWithLookAtFirst(
        cameraPosition,
        targetPosition,
      );
    }
  }
}
```

### State Management Pattern

```typescript
export class CameraManager {
  private cameraStore: CameraStore | null = null;

  public getCameraState$(): BehaviorSubject<CameraState> {
    if (!this.cameraStore) {
      throw new Error(
        "Camera store not initialized. Call setDependencies first.",
      );
    }
    return this.cameraStore["_cameraState"];
  }

  private handleCameraTransitionComplete = (event: Event): void => {
    const detail = (event as CustomEvent).detail;
    const newPosition = OSVector3.fromThreeJS(detail.position);
    const newTarget = OSVector3.fromThreeJS(detail.target);

    // Update state through CameraStore
    this.cameraStore.updateCameraState({
      position: newPosition,
      target: newTarget,
      focusedObjectId: this.intendedFocusIdForTransition,
    });

    // Resume simulation
    this.resumeSimulationAfterTransition();
  };
}
```

### Event Handling Pattern

```typescript
export class CameraManager {
  private _setupEventListeners(): void {
    document.addEventListener(
      "camera-transition-complete",
      this.handleCameraTransitionComplete,
    );
    document.addEventListener(
      "user-camera-manipulation",
      this.handleUserCameraManipulation,
    );
  }

  private _cleanupPriorRenderer(): void {
    // Remove event listeners
    document.removeEventListener(
      "camera-transition-complete",
      this.handleCameraTransitionComplete,
    );
    document.removeEventListener(
      "user-camera-manipulation",
      this.handleUserCameraManipulation,
    );

    // Clean up renderer resources
    this.renderer?.interactionOrchestrator.getControlsManager()?.dispose();
    this.renderer = null;
  }
}
```

## Performance Considerations

### Memory Optimization

- **State Delegation**: Use core-state CameraStore instead of internal state management
- **Event Cleanup**: Proper cleanup of event listeners and renderer resources
- **Object Pooling**: Reuse vector instances to minimize allocations
- **Resource Management**: Proper disposal of camera store references

### Rendering Performance

- **Smooth Transitions**: GSAP-based transitions for smooth camera movements
- **Simulation Integration**: Pause simulation during transitions to prevent object movement
- **Dynamic Settings**: Celestial type-specific camera settings for optimal viewing
- **Event Throttling**: Efficient event handling without performance impact

### State Management Performance

- **Per-Panel State**: Separate camera state instances for each panel
- **Observable Streams**: Efficient state updates through RxJS observables
- **State Validation**: Consistent state validation and error handling
- **Memory Efficiency**: Proper cleanup and resource management

## Troubleshooting

### Common Issues

- **State Not Initialized**: Ensure setDependencies is called before using camera operations
- **Renderer Not Available**: Check that renderer implements ICameraRenderer interface
- **Event Listeners**: Ensure proper cleanup of event listeners to prevent memory leaks
- **Simulation Issues**: Verify simulation state integration and time scale management

### Debug Tools

- **Camera State**: Monitor camera state through observable streams
- **Event Logging**: Log camera events and state changes for debugging
- **Renderer Validation**: Verify renderer interface compliance
- **State Inspection**: Inspect camera store state and updates

## Dependencies

### Core Dependencies

- `three`: 3D rendering library
- `rxjs`: Reactive programming with Observable
- `@teskooano/core-state`: CameraStore for state management
- `@teskooano/core-math`: Vector mathematics (OSVector3)
- `@teskooano/data-types`: Interface definitions (ICameraRenderer)
- `@teskooano/renderer-threejs-helpers`: Camera utility functions
- `@teskooano/notifications`: Transition progress notifications

### Development Dependencies

- `@types/three`: TypeScript definitions for Three.js
- `vitest`: Testing framework
- `@vitest/browser`: Browser testing support
- `@vitest/ui`: Test UI interface
- `typescript`: Type checking

## Contributing Guidelines

### Code Quality

1. **Follow Patterns**: Use established camera management patterns and naming conventions
2. **Write Tests**: Add comprehensive test coverage
3. **Document Changes**: Update documentation for new features
4. **Validate State**: Ensure proper state management integration

### Architecture Guidelines

1. **High-Level Focus**: Focus on high-level camera operations, delegate low-level to controls
2. **State Consistency**: Use core-state CameraStore for all state management
3. **Interface Compliance**: Ensure renderer implements ICameraRenderer interface
4. **Event Handling**: Use custom events for component communication

### Review Process

1. **Architecture Review**: Check for proper pattern usage and state management
2. **Interface Review**: Verify ICameraRenderer interface compliance
3. **Test Review**: Ensure adequate test coverage
4. **Integration Review**: Test with simulation system and controls

## Integration Points

### With Other Renderer Packages

- **Controls Package**: Integrates with low-level camera controls
- **Core Renderer**: Uses ICameraRenderer interface for renderer abstraction
- **Helpers Package**: Uses camera utility functions for celestial type-specific settings
- **State Management**: Integrates with core-state CameraStore

### With Core Systems

- **State Management**: Uses CameraStore for per-panel camera state
- **Simulation System**: Integrates with simulation state for time scale management
- **Math System**: Uses OSVector3 for calculations
- **Event System**: Uses custom events for component communication

## Architecture Documentation

For detailed technical documentation, see:

- [README.md](./README.md) - Package overview and usage examples
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Detailed technical architecture
- [CHANGELOG.md](./CHANGELOG.md) - Version history and changes

## Scientific References

- [Three.js Documentation](https://threejs.org/docs/)
- [Camera Controls Best Practices](https://threejs.org/docs/#examples/en/controls/OrbitControls)
- [State Management Patterns](https://rxjs.dev/guide/overview)
- [Event-Driven Architecture](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent)
