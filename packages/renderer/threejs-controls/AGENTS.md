# AGENTS.md

A guide for AI coding agents working on the ThreeJS Controls package for Teskooano.

## Package Overview

The **ThreeJS Controls package** (`@teskooano/renderer-threejs-controls`) provides low-level camera controls and interaction management for the Teskooano Three.js scene. It focuses on the mechanics of camera control rather than high-level camera operations, working in conjunction with the camera management system.

## Key Features

- **Low-Level Camera Controls**: Integration with `THREE.OrbitControls` for standard user navigation
- **GSAP-Based Transitions**: Smooth, animated camera movements for programmatic view changes
- **Object Following**: Camera tracking of moving `THREE.Object3D` instances while preserving user control
- **Event-Driven Architecture**: Custom event dispatching for user interaction and transition completion
- **Composable Design**: Specialized handlers for different control aspects
- **State Management Integration**: Clean subscription management with automatic cleanup

## Setup Commands

### Prerequisites

- Node.js 24.2.0
- TypeScript 5.9.2
- Three.js 0.180.0
- GSAP 3.13.0

### Development Commands

```bash
# Run tests
moon run threejs-controls:test

# Run browser tests
moon run threejs-controls:test:browser

# Run tests in watch mode
moon run threejs-controls:test:watch

# Run tests with UI
moon run threejs-controls:test:ui

# Build package
moon run threejs-controls:build

# Lint code
moon run threejs-controls:lint
```

## Package Architecture

### Directory Structure

```
src/
├── index.ts                           # Main entry point
├── ControlsManager.ts                 # Main orchestrator class
├── orbit/                             # Orbit controls management
│   └── OrbitControlsHandler.ts        # THREE.OrbitControls wrapper
├── transition/                        # Camera transition management
│   └── CameraTransitionManager.ts     # GSAP-based transitions
├── following/                         # Object following logic
│   └── ObjectFollower.ts              # Camera following system
├── __tests__/                         # Test files
│   ├── ControlsManager.spec.ts
│   └── test-utils.ts
└── setup.ts                           # Global type declarations
```

### Data Flow

1. **User Input**: Mouse/touch events captured by OrbitControls
2. **Control Processing**: OrbitControlsHandler processes user interactions
3. **Event Dispatching**: Custom events fired for user manipulation
4. **Transition Management**: GSAP animations for programmatic movements
5. **Object Following**: Delta-based tracking of moving objects
6. **State Integration**: Clean subscription management with automatic cleanup

## Code Style & Conventions

### TypeScript Standards

- **Strict Mode**: Always use strict TypeScript configuration
- **Type Safety**: Use proper typing for all Three.js objects and parameters
- **Interfaces**: Use dedicated interfaces for configuration objects
- **JSDoc**: Include comprehensive documentation for all functions

### Naming Conventions

- **Files**: Use PascalCase for class files (e.g., `ControlsManager.ts`)
- **Constants**: Use UPPER_CASE for configuration constants
- **Functions**: Use camelCase for function names
- **Classes**: Use PascalCase for class names
- **Interfaces**: Use PascalCase with descriptive names

### Data Standards

- **Vector Math**: Use OSVector3 for calculations, convert to THREE.Vector3 for rendering
- **Performance**: Minimize object creation, use efficient algorithms
- **Memory Management**: Proper disposal of Three.js resources
- **Configuration**: Use options objects for complex parameters

## Key Components

### Controls Manager

```typescript
export class ControlsManager extends StateSubscriptionMixin {
  constructor(camera: THREE.PerspectiveCamera, rendererElement: HTMLElement);
  moveToPosition(
    position: OSVector3,
    target: OSVector3,
    withTransition?: boolean,
    options?: object,
  ): void;
  transitionTargetTo(
    target: OSVector3,
    withTransition?: boolean,
    options?: object,
  ): void;
  transitionToWithLookAtFirst(
    position: OSVector3,
    target: OSVector3,
    options?: object,
  ): void;
  startFollowing(object: THREE.Object3D | null, offset?: THREE.Vector3): void;
  stopFollowing(): void;
  cancelTransition(): void;
  update(delta: number): void;
  setEnabled(enabled: boolean): void;
  updateMinDistance(minDistance: number): void;
  dispose(): void;

  // Properties
  controls: OrbitControls;
  getIsTransitioning: boolean;
}
```

### Orbit Controls Handler

```typescript
export class OrbitControlsHandler {
  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement);
  update(delta: number): void;
  setEnabled(enabled: boolean): void;
  updateMinDistance(minDistance: number): void;
  dispose(): void;

  // Properties
  controls: OrbitControls;
  onControlsStart$: Subject<void>;
  onControlsEnd$: Subject<ControlsChangeEvent>;
}
```

### Camera Transition Manager

```typescript
export class CameraTransitionManager {
  constructor(
    camera: THREE.PerspectiveCamera,
    orbitControlsHandler: OrbitControlsHandler,
    objectFollower?: any,
  );
  transitionTo(endPos: OSVector3, endTarget: OSVector3, options?: object): void;
  transitionTargetTo(target: OSVector3, options?: object): void;
  transitionToWithLookAtFirst(
    endPos: OSVector3,
    endTarget: OSVector3,
    options?: object,
  ): void;
  cancelTransition(): void;
  calculateTransitionDuration(startPos: OSVector3, endPos: OSVector3): number;
  getIsAnimating(): boolean;
  dispose(): void;
}
```

### Object Follower

```typescript
export class ObjectFollower {
  constructor(
    camera: THREE.PerspectiveCamera,
    orbitControlsHandler: OrbitControlsHandler,
  );
  startFollowing(object: THREE.Object3D | null, offset?: THREE.Vector3): void;
  stopFollowing(): void;
  isFollowing(): boolean;
  getFollowOffset(): THREE.Vector3;
  getFollowedObjectWorldPosition(): THREE.Vector3;
  update(): void;
  updateFollowOffset(): void;
  syncPositionsAfterTransition(): void;
}
```

## Testing Strategy

### Test Organization

- **File Convention**: Test files (`<filename>.spec.ts`) adjacent to source files
- **Test Types**: Unit tests for control components, integration tests for complex workflows
- **Test Data**: Use mock objects and helper functions for consistent testing

### Test Commands

```bash
# Run all tests
moon run threejs-controls:test

# Run browser tests
moon run threejs-controls:test:browser

# Run specific test file
moon run threejs-controls:test -- ControlsManager.spec.ts

# Run tests with UI
moon run threejs-controls:test:ui
```

### Test Patterns

- **Component Testing**: Test control components with mocked Three.js objects
- **Animation Testing**: Test GSAP transitions and camera movements
- **Event Testing**: Test custom event dispatching and handling
- **Integration Testing**: Test complete control workflows

## Data Sources & Validation

### Primary Sources

- **Three.js Documentation**: Official Three.js OrbitControls API reference
- **GSAP Documentation**: GreenSock Animation Platform documentation
- **Performance Metrics**: Built-in transition duration calculations
- **User Input**: Mouse and touch event handling

### Data Quality Standards

| Property          | Accuracy            | Source                     |
| ----------------- | ------------------- | -------------------------- |
| Camera Control    | High precision      | Three.js OrbitControls     |
| Transition Timing | Dynamic calculation | Distance-based power curve |
| Object Following  | Frame-accurate      | Delta-based tracking       |
| Event Dispatching | Real-time           | Custom event system        |

### Validation Process

1. **Control Validation**: Ensure proper OrbitControls configuration
2. **Transition Validation**: Test GSAP animation lifecycle
3. **Following Validation**: Test object tracking accuracy
4. **Event Validation**: Test custom event dispatching

## Development Guidelines

### Adding New Components

1. **Follow Patterns**: Use established control patterns and naming conventions
2. **Add Documentation**: Include comprehensive JSDoc comments
3. **Include Tests**: Add unit tests for new functionality
4. **Update Exports**: Add new components to appropriate index files
5. **Performance Consider**: Optimize for high-frequency operations

### Control Management

- **State Subscription**: Use StateSubscriptionMixin for clean subscription management
- **Event Handling**: Use RxJS Subjects for internal communication
- **Resource Disposal**: Always dispose of Three.js resources and animations
- **Memory Management**: Minimize allocations in update loops

### Transition Management

- **GSAP Integration**: Use AnimationHelper for smooth transitions
- **Duration Calculation**: Use power curve for realistic travel times
- **Notification System**: Integrate with notification manager for user feedback
- **Cancellation**: Always support transition cancellation

## Common Patterns

### Controls Manager Pattern

```typescript
export class ControlsManager extends StateSubscriptionMixin {
  constructor(camera: THREE.PerspectiveCamera, rendererElement: HTMLElement) {
    super();
    this.camera = camera;
    this.rendererElement = rendererElement;

    // Initialize handlers
    this.orbitControlsHandler = new OrbitControlsHandler(
      camera,
      rendererElement,
    );
    this.objectFollower = new ObjectFollower(camera, this.orbitControlsHandler);
    this.transitionManager = new CameraTransitionManager(
      camera,
      this.orbitControlsHandler,
      this.objectFollower,
    );

    // Wire handlers together
    this.subscribeToState(
      this.orbitControlsHandler.onControlsStart$,
      this.handleControlsStart,
    );
  }
}
```

### Transition Pattern

```typescript
export class CameraTransitionManager {
  public transitionTo(
    endPos: OSVector3,
    endTarget: OSVector3,
    options?: object,
  ): void {
    this.beginTransition();

    const startPos = OSVector3.fromThreeJS(this.camera.position);
    const totalDuration = this.calculateTransitionDuration(startPos, endPos);

    const onTimelineComplete = () => {
      this.endTransition(
        endPos,
        endTarget,
        "position-and-target",
        options?.focusedObjectId,
      );
    };

    this.activeAnimation = AnimationHelper.animateCamera(
      this.camera,
      new Vector3(endPos.x, endPos.y, endPos.z),
      {
        duration: totalDuration,
        ease: AnimationEase.Power3InOut,
        lookAt: new Vector3(endTarget.x, endTarget.y, endTarget.z),
        orbitControls: this.orbitControlsHandler.controls,
        onComplete: onTimelineComplete,
      },
    );
  }
}
```

### Object Following Pattern

```typescript
export class ObjectFollower {
  public update(): void {
    if (this.followingTargetObject && !this.isFollowingTransitioning) {
      this.followingTargetObject.getWorldPosition(this.tempTargetPosition);

      // Use OSVector3 for calculations to avoid allocations
      this.tempOSVector.copy(OSVector3.fromThreeJS(this.tempTargetPosition));
      const previousOSVector = OSVector3.fromThreeJS(
        this.previousFollowTargetPos,
      );
      const targetDelta = this.tempOSVector.clone().sub(previousOSVector);

      // Apply delta to camera and controls target
      this.camera.position.add(targetDelta.toThreeJS());
      this.orbitControlsHandler.controls.target.add(targetDelta.toThreeJS());

      this.previousFollowTargetPos.copy(this.tempTargetPosition);
    }
  }
}
```

## Performance Considerations

### Memory Optimization

- **Vector Reuse**: Use reusable OSVector3 instances for calculations
- **Object Pooling**: Minimize allocations in update loops
- **Resource Disposal**: Proper cleanup of Three.js resources and animations
- **Subscription Management**: Automatic cleanup with StateSubscriptionMixin

### Animation Performance

- **GSAP Integration**: Optimized animation engine
- **Transition Cancellation**: Support for interrupting long transitions
- **Duration Calculation**: Power curve for realistic travel times
- **Notification Updates**: Efficient progress reporting

### Control Performance

- **Update Order**: Critical order for follower, controls, and animations
- **Event Handling**: Efficient RxJS-based event system
- **State Management**: Clean subscription management
- **Memory Management**: Minimize allocations in hot paths

## Troubleshooting

### Common Issues

- **Memory Leaks**: Ensure proper disposal of animations and event listeners
- **Performance Issues**: Monitor transition durations and update frequencies
- **Control Conflicts**: Check for simultaneous user input and programmatic control
- **Following Issues**: Verify object tracking and delta calculations

### Debug Tools

- **Transition Notifications**: Built-in progress reporting
- **Event Dispatching**: Custom events for debugging
- **State Monitoring**: RxJS observables for state changes
- **Performance Profiling**: Built-in transition duration calculations

## Dependencies

### Core Dependencies

- `three`: 3D rendering library
- `gsap`: Animation platform
- `rxjs`: Reactive programming for event system

### Development Dependencies

- `@types/three`: TypeScript definitions for Three.js
- `vitest`: Testing framework
- `@vitest/browser`: Browser testing support
- `@vitest/ui`: Test UI interface
- `typescript`: Type checking

## Contributing Guidelines

### Code Quality

1. **Follow Patterns**: Use established control patterns and naming conventions
2. **Write Tests**: Add comprehensive test coverage
3. **Document Changes**: Update documentation for new features
4. **Validate Performance**: Ensure no regression in control responsiveness

### Architecture Guidelines

1. **Modular Design**: Keep components focused and single-purpose
2. **Performance First**: Optimize for high-frequency operations
3. **Memory Efficiency**: Minimize allocations and garbage collection
4. **Type Safety**: Maintain strict TypeScript typing

### Review Process

1. **Architecture Review**: Check for proper pattern usage
2. **Performance Review**: Verify no performance regression
3. **Test Review**: Ensure adequate test coverage
4. **Integration Review**: Test with Three.js and camera management

## Integration Points

### With Other Renderer Packages

- **Core Renderer**: Uses scene manager for camera and renderer access
- **Camera Renderer**: Provides low-level controls for high-level camera management
- **Animation Helpers**: Uses AnimationHelper for smooth transitions
- **Notification System**: Integrates with notification manager for user feedback

### With Core Systems

- **State Management**: Integrates with application state for subscription management
- **Event System**: Provides custom events for camera state changes
- **Math System**: Uses OSVector3 for calculations
- **Resource Management**: Integrates with engine resource management

## Architecture Documentation

For detailed technical documentation, see:

- [README.md](./README.md) - Package overview and quick start
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Detailed technical architecture
- [CHANGELOG.md](./CHANGELOG.md) - Version history and changes
- [TODO.md](./TODO.md) - Planned features and improvements

## Scientific References

- [Three.js OrbitControls Documentation](https://threejs.org/docs/#examples/en/controls/OrbitControls)
- [GSAP Documentation](https://greensock.com/docs/)
- [RxJS Documentation](https://rxjs.dev/)
- [WebGL Performance Best Practices](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices)
