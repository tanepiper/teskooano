---
aliases: [rendererEvents, events, event-bus, rxjs-events]
tags: [renderer, threejs, core, events, rxjs, communication]
type: Object
package: "@teskooano/renderer-threejs-core"
name: rendererEvents
dependencies: ["rxjs", "@teskooano/data-types"]
classes: ["Subject"]
functions: []
constants: []
types:
  [
    "RenderLoopPayload",
    "ResizePayload",
    "RendererStats",
    "PerformanceOptimization",
  ]
status: active
---

# rendererEvents

A centralized, type-safe event bus built with RxJS for internal renderer communication in the Teskooano system.

## 🎯 Purpose

The rendererEvents system provides:

- **Centralized Communication**: Single source of truth for renderer events
- **Type Safety**: Fully typed event payloads and subscriptions
- **Observable-Based**: RxJS Subject-based event streams
- **Loose Coupling**: Enables decoupled communication between renderer components
- **Consistent Patterns**: Aligns with application's state management patterns

## 🏗️ Architecture

### Event Structure

The system uses RxJS `Subject` instances for each event type:

```typescript
export const rendererEvents = {
  beforeRender$: new Subject<RenderLoopPayload>(),
  afterRender$: new Subject<RenderLoopPayload>(),
  resize$: new Subject<ResizePayload>(),
  dispose$: new Subject<void>(),
  statsUpdated$: new Subject<RendererStats>(),
  performanceOptimizationChanged$: new Subject<PerformanceOptimization>(),
};
```

### Event Payloads

Each event has a specific, typed payload:

```typescript
interface RenderLoopPayload {
  deltaTime: number; // Time elapsed since last frame (seconds)
  elapsedTime: number; // Total time elapsed since loop started (seconds)
}

interface ResizePayload {
  width: number; // New viewport width
  height: number; // New viewport height
}
```

## 🔧 Event Types

### Render Loop Events

#### beforeRender$

Fires at the beginning of each animation frame, before any updates.

**Payload**: `RenderLoopPayload`

- **deltaTime**: Time since last frame (for physics calculations)
- **elapsedTime**: Total elapsed time (for animations)

**Usage**: Physics updates, pre-render calculations

#### afterRender$

Fires at the end of each animation frame, after the scene has been rendered.

**Payload**: `RenderLoopPayload`

- **deltaTime**: Time since last frame
- **elapsedTime**: Total elapsed time

**Usage**: Post-processing, UI updates, cleanup operations

### System Events

#### resize$

Fires when the renderer viewport is resized.

**Payload**: `ResizePayload`

- **width**: New viewport width
- **height**: New viewport height

**Usage**: Camera aspect ratio updates, UI layout adjustments

#### dispose$

Fires when the renderer's main `dispose` method is called.

**Payload**: `void`

**Usage**: Global cleanup signal for all modules to release resources

### Performance Events

#### statsUpdated$

Fires when performance statistics are updated.

**Payload**: `RendererStats`

- **fps**: Current frames per second
- **drawCalls**: Number of draw calls in last frame
- **triangles**: Number of triangles in last frame
- **memory**: Browser memory usage statistics
- **camera**: Camera position and field of view

**Usage**: Performance monitoring, debug displays

#### performanceOptimizationChanged$

Fires when performance optimization settings change.

**Payload**: `PerformanceOptimization`

- **antialias**: Antialiasing enabled/disabled
- **shadows**: Shadow rendering enabled/disabled
- **hdr**: HDR rendering enabled/disabled
- **pixelRatio**: Optimized pixel ratio
- **shadowMapType**: Shadow map quality setting

**Usage**: Dynamic quality adjustments, performance monitoring

## 🚀 Usage Examples

### Subscribing to Events

```typescript
import { rendererEvents } from "@teskooano/renderer-threejs-core";

// Subscribe to render loop events
const renderSubscription = rendererEvents.beforeRender$.subscribe(
  ({ deltaTime, elapsedTime }) => {
    console.log(
      `Frame: ${elapsedTime.toFixed(2)}s, Delta: ${deltaTime.toFixed(3)}s`,
    );
  },
);

// Subscribe to resize events
const resizeSubscription = rendererEvents.resize$.subscribe(
  ({ width, height }) => {
    console.log(`Resized to: ${width}x${height}`);
  },
);

// Subscribe to performance stats
const statsSubscription = rendererEvents.statsUpdated$.subscribe((stats) => {
  console.log(`FPS: ${stats.fps}, Draw Calls: ${stats.drawCalls}`);
});

// Subscribe to disposal events
const disposeSubscription = rendererEvents.dispose$.subscribe(() => {
  console.log("Renderer disposing, cleaning up...");
  // Clean up resources
});
```

### Emitting Events

```typescript
// AnimationLoop emits render events
rendererEvents.beforeRender$.next({ deltaTime: 0.016, elapsedTime: 1.5 });
rendererEvents.afterRender$.next({ deltaTime: 0.016, elapsedTime: 1.5 });

// SceneManager emits resize events
rendererEvents.resize$.next({ width: 1920, height: 1080 });

// Performance system emits stats
rendererEvents.statsUpdated$.next({
  fps: 60,
  drawCalls: 150,
  triangles: 50000,
  memory: { usedJSHeapSize: 100000000 },
});

// System emits disposal event
rendererEvents.dispose$.next();
```

### Advanced Usage with RxJS Operators

```typescript
import { filter, throttleTime, map } from "rxjs/operators";

// Filter events based on conditions
const highFpsEvents = rendererEvents.statsUpdated$.pipe(
  filter((stats) => stats.fps > 30),
);

// Throttle frequent events
const throttledResize = rendererEvents.resize$.pipe(
  throttleTime(100), // Only emit every 100ms
);

// Transform event data
const performanceAlerts = rendererEvents.statsUpdated$.pipe(
  filter((stats) => stats.fps < 30),
  map((stats) => `Low FPS detected: ${stats.fps}`),
);

// Subscribe to transformed events
performanceAlerts.subscribe((alert) => console.warn(alert));
```

## 🔗 Integration Points

### AnimationLoop Integration

- **Before Render**: Emits `beforeRender$` at start of each frame
- **After Render**: Emits `afterRender$` at end of each frame
- **Stats Updates**: Emits `statsUpdated$` when performance stats change

### SceneManager Integration

- **Resize Events**: Emits `resize$` when viewport changes
- **Disposal Events**: Emits `dispose$` when renderer is disposed
- **Performance Events**: Emits `performanceOptimizationChanged$` when settings change

### External System Integration

- **Performance Monitoring**: Systems can subscribe to performance events
- **UI Updates**: UI components can react to resize and performance events
- **Debug Systems**: Debug tools can monitor all renderer events

## 🎯 Performance Considerations

### Event Efficiency

- **RxJS Subjects**: Efficient event broadcasting with minimal overhead
- **Type Safety**: Compile-time checking prevents runtime errors
- **Memory Management**: Proper subscription cleanup prevents memory leaks

### Subscription Management

- **Unsubscribe Pattern**: Always unsubscribe to prevent memory leaks
- **Error Handling**: RxJS provides built-in error handling for subscriptions
- **Backpressure**: RxJS handles backpressure automatically

### Event Frequency

- **Render Events**: High frequency (60fps), minimal payload
- **Stats Events**: Lower frequency (every 500ms), larger payload
- **System Events**: Low frequency, triggered by user actions

## 🔍 Debug Features

### Event Monitoring

- **Event Logging**: Log all events for debugging
- **Performance Tracking**: Monitor event frequency and payload sizes
- **Subscription Tracking**: Track active subscriptions

### Error Handling

- **Subscription Errors**: RxJS error handling for failed subscriptions
- **Event Validation**: Type checking ensures valid event payloads
- **Graceful Degradation**: System continues working even if events fail

## 📚 Related Components

- [[AnimationLoop]] - Emits render loop events
- [[SceneManager]] - Emits resize and disposal events
- [[Performance Optimization]] - Emits performance optimization events
- [[Core State]] - Integrates with state management patterns

## 🏛️ Architecture Patterns

- **Event-Driven Architecture**: Decoupled communication between components
- **Observer Pattern**: RxJS Subject-based event broadcasting
- **Type Safety**: Fully typed event payloads and subscriptions
- **Centralized Communication**: Single event bus for all renderer events

## 🔧 Advanced Patterns

### Event Composition

```typescript
// Combine multiple events
import { merge } from "rxjs";

const allEvents = merge(
  rendererEvents.beforeRender$,
  rendererEvents.afterRender$,
  rendererEvents.resize$,
);

allEvents.subscribe((event) => {
  console.log("Any renderer event occurred:", event);
});
```

### Event Filtering

```typescript
// Filter events based on conditions
const significantResizes = rendererEvents.resize$.pipe(
  filter(({ width, height }) => Math.abs(width - height) > 100),
);
```

### Event Transformation

```typescript
// Transform events for specific use cases
const performanceWarnings = rendererEvents.statsUpdated$.pipe(
  filter((stats) => stats.fps < 30),
  map((stats) => ({
    type: "performance_warning",
    fps: stats.fps,
    timestamp: Date.now(),
  })),
);
```

## ⚡ Performance Considerations

### Efficiency

- **RxJS Subjects**: Efficient event broadcasting with minimal overhead
- **Type Safety**: Compile-time checking prevents runtime errors
- **Memory Management**: Proper subscription cleanup prevents memory leaks
- **Event Frequency**: Optimized for high-frequency render events

### Quality Metrics

- **Reliability**: Robust error handling and recovery
- **Consistency**: Stable event delivery across all components
- **Scalability**: Efficient handling of multiple subscribers
- **Performance**: Minimal impact on render loop performance

### Performance Monitoring

- **Event Frequency**: Monitor event emission rates
- **Subscription Count**: Track active subscriptions
- **Memory Usage**: Monitor subscription memory usage
- **Error Rates**: Track event handling errors

## 🔌 Integration Points

### Primary Integration

- **AnimationLoop**: Emits render loop events
- **SceneManager**: Emits resize and disposal events
- **Performance Systems**: Emits performance optimization events
- **State Management**: Integrates with global state patterns

### Secondary Integration

- **Debug Systems**: Provides debugging event streams
- **UI Components**: Reacts to renderer events
- **External Systems**: Enables external system integration
- **Monitoring Tools**: Provides monitoring event streams

## 🔍 Debug Features

### Event Monitoring

- **Event Logging**: Log all events for debugging
- **Performance Tracking**: Monitor event frequency and payload sizes
- **Subscription Tracking**: Track active subscriptions
- **Error Handling**: Comprehensive error reporting

### Validation

- **Type Checking**: Compile-time type validation
- **Payload Validation**: Runtime payload validation
- **Subscription Validation**: Validate subscription patterns
- **Error Recovery**: Graceful error handling and recovery

## 🔮 Future Enhancements

### Optimization Opportunities

- **Event Batching**: Batch similar events for better performance
- **Selective Broadcasting**: Only broadcast to relevant subscribers
- **Memory Optimization**: Reduce event object allocations
- **Performance Profiling**: Advanced event performance analysis

### Potential Improvements

- **Event Persistence**: Persist events for debugging and replay
- **Advanced Filtering**: More sophisticated event filtering
- **Event Replay**: Replay events for testing and debugging
- **Performance Analytics**: Advanced performance analytics

## 📚 Related Components

- [[AnimationLoop]] - Emits render loop events
- [[SceneManager]] - Emits resize and disposal events
- [[PerformanceOptimization]] - Emits performance optimization events
- [[core/core-state/core-state|Core State]] - Integrates with state management patterns

## 🏛️ Architecture Patterns

- **Event-Driven Architecture**: Decoupled communication between components
- **Observer Pattern**: RxJS Subject-based event broadcasting
- **Type Safety**: Fully typed event payloads and subscriptions
- **Centralized Communication**: Single event bus for all renderer events

---

_The rendererEvents system provides the communication backbone for the entire renderer, enabling loose coupling and type-safe event handling across all components._
