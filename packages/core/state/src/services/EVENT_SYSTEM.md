# Event System Documentation

## Overview

The Teskooano event system uses a comprehensive event-driven architecture built on RxJS observables and DOM events. This system provides loose coupling between components, enables reactive programming patterns, and supports both system-level and celestial-specific operations through dedicated event bridges.

## Architecture

### Event Types

The system uses three types of events:

1. **RxJS Events** - Type-safe observables for internal communication
2. **DOM Events** - Custom events for cross-system communication
3. **Pipeline Events** - Stage-specific events for render pipeline coordination

### Event Flow

```
Core State (DOM Events) → SystemEventBridge → RxJS Events → Components
UI Components (DOM Events) → CelestialEventBridge → RxJS Events → Components
                    ↓
            Custom DOM Events ← UI Components
```

## Event Bridges

### SystemEventBridge

Located in `packages/core/state/src/services/SystemEventBridge.ts`

**Purpose**: Handles system-level operations and bridges DOM events to RxJS events.

**Handles**:

- Object lifecycle (add/remove/update at system level)
- Hierarchy changes (parent/child relationships)
- System state changes (time scale, pause, etc.)
- System-wide operations (clear state, load systems, etc.)

**Events**:

- `CELESTIAL_OBJECT_DESTROYED` → `celestialObjectDestroyed$`
- `CELESTIAL_OBJECTS_LOADED` → `celestialObjectsLoaded$`

**Usage**:

```typescript
import { SystemEventBridge } from "@teskooano/core-state";

// Subscribe to system events
SystemEventBridge.getInstance().celestialObjectDestroyed$.subscribe(
  (payload) => {
    console.log(`Object ${payload.objectId} was destroyed`);
    // Handle system-level destruction
  },
);

SystemEventBridge.getInstance().celestialObjectsLoaded$.subscribe((payload) => {
  console.log(`Loaded ${payload.count} objects`);
  // Handle system-level loading
});
```

### CelestialEventBridge

Located in `packages/core/state/src/services/CelestialEventBridge.ts`

**Purpose**: Handles celestial-specific operations and bridges DOM events to RxJS events.

**Handles**:

- Show/hide labels, orbits, predictions
- Focus/follow operations
- Camera transitions
- Celestial-specific UI interactions

**Events**:

- `teskooano-clear-orbit-trails` → `clearOrbitTrails$`
- `teskooano-clear-predictions` → `clearPredictions$`

**Usage**:

```typescript
import { CelestialEventBridge } from "@teskooano/core-state";

// Subscribe to celestial events
CelestialEventBridge.getInstance().clearOrbitTrails$.subscribe(() => {
  console.log("Clearing orbit trails");
  // Handle orbit trail clearing
});

CelestialEventBridge.getInstance().clearPredictions$.subscribe(() => {
  console.log("Clearing predictions");
  // Handle prediction clearing
});
```

## RxJS Events

### System Events

#### `celestialObjectDestroyed$: Subject<CelestialObjectDestroyedPayload>`

- **Purpose**: Emits when celestial objects are destroyed at the system level
- **Payload**: `{ objectId: string, object: CelestialObject | null }`
- **Usage**: Trigger system-level cleanup and notifications

#### `celestialObjectsLoaded$: Subject<CelestialObjectsLoadedPayload>`

- **Purpose**: Emits when celestial objects are loaded into the system
- **Payload**: `{ count: number, objects: CelestialObject[] }`
- **Usage**: Trigger system-level initialization and setup

### Celestial Events

#### `clearOrbitTrails$: Subject<void>`

- **Purpose**: Emits when orbit trails should be cleared
- **Usage**: Clear all orbit trail visualizations

#### `clearPredictions$: Subject<void>`

- **Purpose**: Emits when prediction lines should be cleared
- **Usage**: Clear all prediction line visualizations

## DOM Events

### Custom Events (`CustomEvents`)

Located in `packages/data/types/src/events.ts`

#### `CELESTIAL_OBJECT_DESTROYED`

- **Purpose**: Emitted when a celestial object is destroyed
- **Detail**: `{ objectId: string }`
- **Usage**: Cross-system communication for object destruction

#### `CELESTIAL_OBJECTS_LOADED`

- **Purpose**: Emitted when celestial objects are loaded
- **Detail**: `{ count: number, objects: CelestialObject[] }`
- **Usage**: Cross-system communication for object loading

#### `teskooano-clear-orbit-trails`

- **Purpose**: Clear all orbit trail visualizations
- **Usage**: Called during time jumps or system resets
- **Example**:
  ```typescript
  document.dispatchEvent(new CustomEvent("teskooano-clear-orbit-trails"));
  ```

#### `teskooano-clear-predictions`

- **Purpose**: Clear all prediction line visualizations
- **Usage**: Called during time jumps or system resets
- **Example**:
  ```typescript
  document.dispatchEvent(new CustomEvent("teskooano-clear-predictions"));
  ```

## Pipeline Events

Located in `packages/renderer/threejs/src/RenderPipeline.ts`

The render pipeline emits events at each stage of the rendering process:

#### `beforeUpdate$: Subject<RenderPipelineStagePayload>`

- **Purpose**: Fires before any updates begin
- **Payload**: `{ deltaTime: number, elapsedTime: number, frameCount: number }`

#### `afterControlsUpdate$: Subject<RenderPipelineStagePayload>`

- **Purpose**: Fires after controls and camera are updated
- **Usage**: React to camera position changes

#### `afterOrbitsUpdate$: Subject<RenderPipelineStagePayload>`

- **Purpose**: Fires after orbital paths are updated
- **Usage**: React to orbit visualization changes

#### `afterObjectsUpdate$: Subject<RenderPipelineStagePayload>`

- **Purpose**: Fires after 3D objects are updated
- **Usage**: React to object position/rotation changes

#### `afterBackgroundUpdate$: Subject<RenderPipelineStagePayload>`

- **Purpose**: Fires after background is updated
- **Usage**: React to background changes

#### `afterGridUpdate$: Subject<RenderPipelineStagePayload>`

- **Purpose**: Fires after grid is updated
- **Usage**: React to grid changes

#### `beforeRender$: Subject<RenderPipelineStagePayload>`

- **Purpose**: Fires before the main scene render
- **Usage**: Last chance to modify scene before rendering

#### `afterRender$: Subject<RenderPipelineStagePayload>`

- **Purpose**: Fires after the main scene render
- **Usage**: React to completed rendering

#### `afterOverlaysRender$: Subject<RenderPipelineStagePayload>`

- **Purpose**: Fires after 2D overlays are rendered
- **Usage**: React to completed overlay rendering

#### `afterUpdate$: Subject<RenderPipelineStagePayload>`

- **Purpose**: Fires after all updates and rendering are complete
- **Usage**: Cleanup or final processing

### Pipeline Event Usage Example

```typescript
import { renderPipelineEvents } from "@teskooano/renderer-threejs";

// React to camera updates
renderPipelineEvents.afterControlsUpdate$.subscribe((payload) => {
  console.log(`Camera updated at frame ${payload.frameCount}`);
  // Update UI elements that depend on camera position
  this.updateCameraUI();
});

// React to object updates
renderPipelineEvents.afterObjectsUpdate$.subscribe((payload) => {
  console.log(`Objects updated at frame ${payload.frameCount}`);
  // Update object-specific UI elements
  this.updateObjectUI();
});

// React to completed rendering
renderPipelineEvents.afterUpdate$.subscribe((payload) => {
  console.log(`Frame ${payload.frameCount} complete`);
  // Update performance metrics
  this.updatePerformanceMetrics(payload.deltaTime);
});
```

## Core State Events

Located in `packages/renderer/threejs-core/src/events.ts`

### Available Events

#### `statsUpdated$: Subject<RendererStats>`

- **Purpose**: Emits performance statistics updates
- **Payload**: `{ fps: number, drawCalls: number, triangles: number, memory: number }`
- **Usage**: Performance monitoring and debugging

#### `performanceOptimizationChanged$: Subject<PerformanceOptimization>`

- **Purpose**: Emits when performance optimization settings change
- **Payload**: Performance optimization configuration
- **Usage**: React to performance setting changes

### Usage Example

```typescript
import { rendererEvents } from "@teskooano/renderer-threejs-core";

// Monitor performance
rendererEvents.statsUpdated$.subscribe((stats) => {
  console.log(`FPS: ${stats.fps}, Draw Calls: ${stats.drawCalls}`);
  // Update performance UI
  this.updatePerformanceUI(stats);
});

// React to performance optimization changes
rendererEvents.performanceOptimizationChanged$.subscribe((optimization) => {
  console.log("Performance optimization changed:", optimization);
  // Adjust rendering quality
  this.adjustRenderingQuality(optimization);
});
```

## Best Practices

### 1. Event Subscription Management

Always use the `StateSubscriptionMixin` for automatic subscription cleanup:

```typescript
import { StateSubscriptionMixin } from "@teskooano/core-state";

export class MyComponent extends StateSubscriptionMixin {
  constructor() {
    super();

    // Subscribe to system events - automatically cleaned up
    this.subscribeToState(
      SystemEventBridge.getInstance().celestialObjectDestroyed$,
      (payload) => this.handleDestruction(payload),
    );

    // Subscribe to celestial events - automatically cleaned up
    this.subscribeToState(
      CelestialEventBridge.getInstance().clearOrbitTrails$,
      () => this.handleClearOrbitTrails(),
    );
  }
}
```

### 2. Event Payload Validation

Always validate event payloads:

```typescript
SystemEventBridge.getInstance().celestialObjectDestroyed$.subscribe(
  (payload) => {
    if (!payload || !payload.objectId) {
      console.warn("Invalid destruction payload received");
      return;
    }

    // Process valid payload
    this.handleDestruction(payload);
  },
);
```

### 3. Performance Considerations

- **Throttle expensive operations**: Use RxJS operators like `throttleTime` for performance-critical subscriptions
- **Unsubscribe when not needed**: Use `StateSubscriptionMixin` or manual cleanup
- **Avoid deep object cloning**: Pass references when possible

```typescript
// Throttle expensive operations
renderPipelineEvents.afterObjectsUpdate$
  .pipe(
    throttleTime(100), // Only process every 100ms
  )
  .subscribe((payload) => {
    this.updateExpensiveUI(payload);
  });
```

### 4. Error Handling

Always handle potential errors in event subscriptions:

```typescript
SystemEventBridge.getInstance().celestialObjectDestroyed$.subscribe({
  next: (payload) => this.handleDestruction(payload),
  error: (error) => console.error("Destruction event error:", error),
  complete: () => console.log("Destruction event stream completed"),
});
```

## Migration Guide

### From Single EventBridge to Two Bridges

**Before (Single EventBridge)**:

```typescript
// All events handled by single bridge
EventBridge.getInstance().initialize();
```

**After (Two Bridges)**:

```typescript
// System and celestial events handled separately
SystemEventBridge.getInstance().initialize();
CelestialEventBridge.getInstance().initialize();
```

### Adding New Events

1. **Define the payload interface**:

   ```typescript
   export interface MyEventPayload {
     data: string;
     timestamp: number;
   }
   ```

2. **Add to the appropriate event bridge**:

   ```typescript
   // For system events
   export class SystemEventBridge {
     public mySystemEvent$ = new Subject<MyEventPayload>();
   }

   // For celestial events
   export class CelestialEventBridge {
     public myCelestialEvent$ = new Subject<MyEventPayload>();
   }
   ```

3. **Emit the event**:

   ```typescript
   // System event
   SystemEventBridge.getInstance().mySystemEvent$.next({
     data: "example",
     timestamp: Date.now(),
   });

   // Celestial event
   CelestialEventBridge.getInstance().myCelestialEvent$.next({
     data: "example",
     timestamp: Date.now(),
   });
   ```

4. **Subscribe to the event**:

   ```typescript
   // System event
   SystemEventBridge.getInstance().mySystemEvent$.subscribe((payload) => {
     console.log("My system event received:", payload);
   });

   // Celestial event
   CelestialEventBridge.getInstance().myCelestialEvent$.subscribe((payload) => {
     console.log("My celestial event received:", payload);
   });
   ```

## Troubleshooting

### Common Issues

1. **Events not firing**: Check that both event bridges are initialized
2. **Memory leaks**: Ensure proper subscription cleanup using `StateSubscriptionMixin`
3. **Type errors**: Verify payload interfaces match between emission and subscription
4. **Performance issues**: Use throttling for expensive event handlers
5. **Wrong event bridge**: Ensure you're using the correct bridge for system vs celestial events

### Debug Tools

Enable event debugging by subscribing to all events:

```typescript
// Debug all system events
const systemBridge = SystemEventBridge.getInstance();
Object.entries(systemBridge).forEach(([name, subject]) => {
  if (subject && typeof subject.subscribe === "function") {
    subject.subscribe((payload) => {
      console.log(`[System Event Debug] ${name}:`, payload);
    });
  }
});

// Debug all celestial events
const celestialBridge = CelestialEventBridge.getInstance();
Object.entries(celestialBridge).forEach(([name, subject]) => {
  if (subject && typeof subject.subscribe === "function") {
    subject.subscribe((payload) => {
      console.log(`[Celestial Event Debug] ${name}:`, payload);
    });
  }
});

// Debug all pipeline events
Object.entries(renderPipelineEvents).forEach(([name, subject]) => {
  subject.subscribe((payload) => {
    console.log(`[Pipeline Debug] ${name}:`, payload);
  });
});
```

## Future Enhancements

- **Event filtering**: Add filtering capabilities for specific object types
- **Event persistence**: Store event history for debugging
- **Event metrics**: Track event frequency and performance impact
- **Event validation**: Runtime validation of event payloads
- **Event replay**: Ability to replay event sequences for testing
- **Event batching**: Batch multiple events for performance optimization
- **Event prioritization**: Priority-based event processing
- **Event middleware**: Plugin system for event processing
