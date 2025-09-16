---
aliases:
  [
    StateSubscriptionMixin,
    subscription-mixin,
    rxjs-mixin,
    subscription-management,
  ]
tags: [core, state, mixin, utility, rxjs, subscription, lifecycle]
type: Class
package: "@teskooano/core-state"
name: StateSubscriptionMixin
dependencies: ["rxjs"]
classes: ["Subscription", "Observable"]
functions: []
constants: []
types: []
status: active
---

# StateSubscriptionMixin

Mixin class providing standardized RxJS subscription management to eliminate boilerplate subscription patterns across packages and applications.

**Location**: `src/StateSubscriptionMixin.ts`

## 🎯 Purpose

The `StateSubscriptionMixin` provides comprehensive subscription management:

- **Automatic Cleanup**: Tracks and disposes subscriptions automatically
- **Error Handling**: Default error handling for subscriptions
- **Composition Support**: Can be used as inheritance or composition
- **Debugging Tools**: Subscription counting and leak detection
- **Standardized Patterns**: Consistent subscription management across components
- **Memory Leak Prevention**: Ensures proper cleanup of all subscriptions
- **Performance Optimization**: Optimized subscription tracking for better performance

## 🏗️ Architecture

### Mixin Pattern

Can be used as either inheritance or composition:

```typescript
// Inheritance pattern
export class MyComponent extends StateSubscriptionMixin {
  public init(): void {
    this.subscribeToState(someObservable$, (value) => {
      // Handle value update
    });
  }
}

// Composition pattern
export class MyComponent {
  private subscriptionManager = new StateSubscriptionMixin();

  public init(): void {
    this.subscriptionManager.subscribeToState(someObservable$, (value) => {
      // Handle value update
    });
  }

  public dispose(): void {
    this.subscriptionManager.dispose();
  }
}
```

### Subscription Tracking

Optimized subscription tracking for better performance:

```typescript
private subscription = new Subscription();

public subscribeToState<T>(
  observable$: Observable<T>,
  next: (value: T) => void
): void {
  this.subscription.add(
    observable$.subscribe(next)
  );
}
```

## 🔧 Core Methods

### Basic Subscription Management

```typescript
// Subscribe to observable with automatic tracking
subscribeToState<T>(
  observable$: Observable<T>,
  next: (value: T) => void
): void;

// Subscribe to multiple observables with single handler
subscribeToMultipleStates<T>(
  observables: Observable<T>[],
  handler: (value: T) => void
): void;

// Subscribe with value mapping
subscribeToStateWithMapping<T, R>(
  observable: Observable<T>,
  mapper: (value: T) => R,
  handler: (value: R) => void
): void;
```

### Composition Pattern Support

```typescript
// For composition pattern usage
subscribeToStateComposition<T>(
  observable: Observable<T>,
  handler: (value: T) => void,
  errorHandler?: (error: any) => void
): void;
```

### Lifecycle Management

```typescript
// Clean up all subscriptions
dispose(): void;

// Check for active subscriptions
hasActiveSubscriptions(): boolean;

// Get subscription count (for debugging)
getSubscriptionCount(): number;
```

### Error Handling

```typescript
// Default error handler (can be overridden)
protected defaultErrorHandler(error: any): void;
```

## 🚀 Usage Examples

### Inheritance Pattern

```typescript
import { StateSubscriptionMixin } from "@teskooano/core-state";

export class CelestialInfoPanel extends StateSubscriptionMixin {
  private infoElement: HTMLElement;

  constructor() {
    super();
    this.infoElement = document.getElementById("celestial-info");
  }

  public init(): void {
    // Subscribe to selected object changes
    this.subscribeToState(StateAccessor.simulation$(), (state) =>
      this.updateSelectedObjectInfo(state.selectedObject),
    );

    // Subscribe to celestial objects
    this.subscribeToState(StateAccessor.celestialObjects$(), (objects) =>
      this.updateObjectCount(objects),
    );

    // Subscribe to multiple observables with single handler
    this.subscribeToMultipleStates(
      [StateAccessor.simulation$(), StateAccessor.celestialObjects$()],
      () => this.updateDisplay(),
    );
  }

  private updateSelectedObjectInfo(objectId: string | null): void {
    if (!objectId) {
      this.infoElement.textContent = "No object selected";
      return;
    }

    const object = StateAccessor.getCelestialObject(objectId);
    if (object) {
      this.infoElement.textContent = `Selected: ${object.name}`;
    }
  }

  private updateObjectCount(objects: Record<string, CelestialObject>): void {
    const count = Object.keys(objects).length;
    console.log(`Total objects in system: ${count}`);
  }

  private updateDisplay(): void {
    // Update display when any state changes
    console.log("Display updated");
  }

  public dispose(): void {
    super.dispose(); // Clean up subscriptions
  }
}
```

### Composition Pattern

```typescript
export class PhysicsVisualizer {
  private subscriptionManager = new StateSubscriptionMixin();
  private canvas: HTMLCanvasElement;

  constructor() {
    this.canvas = document.getElementById(
      "physics-canvas",
    ) as HTMLCanvasElement;
  }

  public init(): void {
    // Subscribe with custom error handler
    this.subscriptionManager.subscribeToStateComposition(
      StateAccessor.accelerationVectors$(),
      (vectors) => this.updateAccelerationDisplay(vectors),
      (error) => console.error("Acceleration update failed:", error),
    );

    // Subscribe with value mapping
    this.subscriptionManager.subscribeToStateWithMapping(
      StateAccessor.simulation$(),
      (state) => state.time,
      (time) => this.updateTimeDisplay(time),
    );
  }

  private updateAccelerationDisplay(vectors: Record<string, OSVector3>): void {
    // Update acceleration visualization
    console.log("Updating acceleration display:", Object.keys(vectors).length);
  }

  private updateTimeDisplay(time: number): void {
    // Update time display
    console.log("Updating time display:", time);
  }

  public dispose(): void {
    this.subscriptionManager.dispose();
  }
}
```

### Advanced Subscription Patterns

```typescript
export class PerformanceMonitor extends StateSubscriptionMixin {
  public init(): void {
    // Subscribe to multiple observables with single handler
    this.subscribeToMultipleStates(
      [
        StateAccessor.simulation$(),
        StateAccessor.celestialObjects$(),
        StateAccessor.accelerationVectors$(),
      ],
      () => this.checkPerformance(),
    );

    // Subscribe with complex mapping
    this.subscribeToStateWithMapping(
      StateAccessor.simulation$(),
      (state) => ({
        time: state.time,
        objectCount: StateAccessor.getCelestialObjectCount(),
        isPaused: state.paused,
      }),
      (metrics) => this.logMetrics(metrics),
    );
  }

  private checkPerformance(): void {
    // Check performance when any state changes
    console.log("Performance check triggered");
  }

  private logMetrics(metrics: any): void {
    console.log("Performance metrics:", metrics);
  }
}
```

### Custom Error Handling

```typescript
export class RobustComponent extends StateSubscriptionMixin {
  protected defaultErrorHandler(error: any): void {
    // Custom error handling
    console.error("[RobustComponent] Subscription error:", error);

    // Send error to monitoring service
    this.reportError(error);

    // Attempt recovery
    this.attemptRecovery();
  }

  private reportError(error: any): void {
    // Report error to monitoring service
    console.log("Error reported to monitoring service");
  }

  private attemptRecovery(): void {
    // Attempt to recover from error
    console.log("Attempting recovery...");
  }
}
```

### Debugging and Monitoring

```typescript
export class DebugComponent extends StateSubscriptionMixin {
  public init(): void {
    this.subscribeToState(StateAccessor.celestialObjects$(), (objects) =>
      this.handleObjectsUpdate(objects),
    );

    // Monitor subscription count
    setInterval(() => {
      const count = this.getSubscriptionCount();
      const hasActive = this.hasActiveSubscriptions();

      console.log(`Subscriptions: ${count}, Active: ${hasActive}`);
    }, 5000);
  }

  private handleObjectsUpdate(objects: Record<string, CelestialObject>): void {
    console.log("Objects updated:", Object.keys(objects).length);
  }

  public dispose(): void {
    console.log(
      "Disposing component with",
      this.getSubscriptionCount(),
      "subscriptions",
    );
    super.dispose();
  }
}
```

## 🎯 Performance Considerations

### Memory Management

- **Automatic Cleanup**: All subscriptions disposed in `dispose()`
- **No Memory Leaks**: Proper subscription tracking prevents leaks
- **Efficient Tracking**: Minimal overhead for subscription management

### Error Handling

- **Default Handler**: Provides sensible default error handling
- **Custom Override**: Can be overridden for specific error handling
- **Error Recovery**: Supports error recovery patterns

### Subscription Efficiency

- **Batch Operations**: Multiple subscriptions with single handler
- **Value Mapping**: Efficient value transformation
- **Conditional Subscriptions**: Support for conditional subscription patterns

## 🔗 Integration Points

### With Components

- Provides subscription management for all components
- Ensures proper cleanup in component lifecycle
- Supports both inheritance and composition patterns

### With State Management

- Works with all state observables
- Integrates with StateAccessor patterns
- Supports complex state subscription scenarios

### With Utilities

- Works with RxJS operators
- Supports advanced subscription patterns
- Enables debugging and monitoring

## 🔗 Related Components

- [[core/core-state/StateAccessor|StateAccessor]] - Provides observables for subscription
- [[core/core-state/SimulationStateService|SimulationStateService]] - Source of simulation state
- [[core/core-state/CelestialStore|CelestialStore]] - Source of celestial object data
- [[core/core-state/PhysicsStore|PhysicsStore]] - Source of physics data

## 📚 Architecture Patterns

- **Mixin Pattern**: Can be used as inheritance or composition
- **Resource Management Pattern**: Automatic cleanup of resources
- **Error Handling Pattern**: Centralized error handling
- **Lifecycle Pattern**: Integration with component lifecycle

---

_The StateSubscriptionMixin provides standardized, robust subscription management with automatic cleanup and comprehensive error handling._
