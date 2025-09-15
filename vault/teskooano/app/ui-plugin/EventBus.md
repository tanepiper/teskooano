# EventBus

A singleton, type-light event bus for plugins and components. Supports namespacing via source/target, immediate replay of last event, trigger limits, history tracking, and debug logging for comprehensive event management.

## Class Definition

```typescript
export class EventBus {
  private static instance: EventBus;

  private listeners: Map<string, Map<string, EventSubscription>> = new Map();
  private globalListeners: Map<string, EventSubscription> = new Map();
  private lastEvents: Map<string, EventConfig> = new Map();
  private debugMode = false;
  private eventHistory: EventConfig[] = [];
  private maxHistorySize = 100;
  private subscriptionCounter = 0;
}
```

## Properties

### `listeners: Map<string, Map<string, EventSubscription>>`

Map of event types to subscription maps for targeted event handling.

### `globalListeners: Map<string, EventSubscription>`

Map of global listeners that receive all events.

### `lastEvents: Map<string, EventConfig>`

Map of the last emitted event for each event type (for immediate replay).

### `debugMode: boolean`

Whether debug logging is enabled.

### `eventHistory: EventConfig[]`

Array of recent events for debugging and analysis.

### `maxHistorySize: number`

Maximum number of events to keep in history.

## Methods

### `static getInstance(): EventBus`

Gets the singleton instance of the EventBus.

**Returns**: `EventBus` - The singleton instance

**Example**:

```typescript
const eventBus = EventBus.getInstance();
```

### `setDebugMode(enabled: boolean): void`

Enables or disables debug mode for detailed event logging.

**Parameters**:

- `enabled`: `boolean` - Whether to enable debug mode

**Example**:

```typescript
eventBus.setDebugMode(true);
// Now all events will be logged to console
```

### `emit(eventType: string, payload?: any, options?: Partial<EventConfig>): void`

Emits an event to all registered listeners.

**Parameters**:

- `eventType`: `string` - The type of event to emit
- `payload`: `any` - Optional payload data
- `options`: `Partial<EventConfig>` - Optional event configuration

**Example**:

```typescript
// Simple event emission
eventBus.emit("object:selected", { objectId: "earth" });

// Event with source and target
eventBus.emit(
  "camera:focused",
  { objectId: "mars" },
  {
    source: "celestial-info-panel",
    target: "camera-controller",
  },
);

// Event with bubbles
eventBus.emit(
  "system:error",
  { error: "Connection failed" },
  {
    source: "network-manager",
    bubbles: true,
  },
);
```

### `on(eventType: string, listener: EventListener, options?: SubscriptionOptions): () => void`

Registers a listener for a specific event type.

**Parameters**:

- `eventType`: `string` - The event type to listen for
- `listener`: `EventListener` - The callback function
- `options`: `SubscriptionOptions` - Optional subscription options

**Returns**: `() => void` - Unsubscribe function

**Example**:

```typescript
// Basic event listener
const unsubscribe = eventBus.on("object:selected", (event) => {
  console.log("Object selected:", event.payload);
});

// Listener with options
const unsubscribe = eventBus.on(
  "camera:moved",
  (event) => {
    console.log("Camera moved:", event.payload);
  },
  {
    source: "camera-controller",
    immediate: true,
    maxTriggers: 5,
  },
);

// Clean up
unsubscribe();
```

### `onAll(listener: EventListener, options?: SubscriptionOptions): () => void`

Registers a global listener that receives all events.

**Parameters**:

- `listener`: `EventListener` - The callback function
- `options`: `SubscriptionOptions` - Optional subscription options

**Returns**: `() => void` - Unsubscribe function

**Example**:

```typescript
// Global event monitor
const unsubscribe = eventBus.onAll((event) => {
  console.log(`Event: ${event.type}`, event.payload);
});

// Global listener with filtering
const unsubscribe = eventBus.onAll(
  (event) => {
    if (event.source === "error-handler") {
      logError(event.payload);
    }
  },
  {
    maxTriggers: 100,
  },
);
```

### `once(eventType: string, listener: EventListener, options?: SubscriptionOptions): void`

Registers a listener that will only be called once.

**Parameters**:

- `eventType`: `string` - The event type to listen for
- `listener`: `EventListener` - The callback function
- `options`: `SubscriptionOptions` - Optional subscription options

**Example**:

```typescript
// One-time listener
eventBus.once("app:ready", (event) => {
  console.log("Application is ready!");
});

// One-time listener with source filter
eventBus.once(
  "data:loaded",
  (event) => {
    console.log("Data loaded from:", event.source);
  },
  {
    source: "data-manager",
  },
);
```

### `off(eventType: string): void`

Removes all listeners for a specific event type.

**Parameters**:

- `eventType`: `string` - The event type to remove listeners for

**Example**:

```typescript
// Remove all listeners for an event type
eventBus.off("object:selected");
```

### `clear(): void`

Removes all listeners and clears the event history.

**Example**:

```typescript
// Clear all event listeners
eventBus.clear();
```

### `getEventHistory(limit?: number): EventConfig[]`

Gets the recent event history for debugging.

**Parameters**:

- `limit`: `number` - Optional limit on number of events to return

**Returns**: `EventConfig[]` - Array of recent events

**Example**:

```typescript
// Get last 10 events
const recentEvents = eventBus.getEventHistory(10);

// Get all events
const allEvents = eventBus.getEventHistory();
```

### `getStats(): EventBusStats`

Gets statistics about the event bus.

**Returns**: `EventBusStats` - Statistics object

**Example**:

```typescript
const stats = eventBus.getStats();
console.log("Event bus stats:", stats);
```

## Interfaces

### `EventConfig`

Configuration object for events.

```typescript
interface EventConfig {
  type: string;
  payload?: any;
  source?: string;
  target?: string;
  bubbles?: boolean;
  cancelable?: boolean;
  timestamp?: number;
  id?: string;
}
```

### `EventListener`

Function type for event listeners.

```typescript
type EventListener = (event: EventConfig) => void | Promise<void>;
```

### `SubscriptionOptions`

Options for event subscriptions.

```typescript
interface SubscriptionOptions {
  source?: string;
  target?: string;
  immediate?: boolean;
  maxTriggers?: number;
}
```

### `EventSubscription`

Internal subscription object.

```typescript
interface EventSubscription {
  listener: EventListener;
  options: SubscriptionOptions;
  triggerCount: number;
  id: string;
}
```

## Usage Examples

### Basic Event Communication

```typescript
import { EventBus } from "@teskooano/ui-plugin/patterns";

const eventBus = EventBus.getInstance();

// Component A emits events
class CelestialInfoPanel {
  selectObject(objectId: string) {
    eventBus.emit(
      "object:selected",
      {
        objectId,
        timestamp: Date.now(),
      },
      {
        source: "celestial-info-panel",
      },
    );
  }
}

// Component B listens for events
class CameraController {
  constructor() {
    eventBus.on("object:selected", (event) => {
      this.focusOnObject(event.payload.objectId);
    });
  }

  focusOnObject(objectId: string) {
    // Focus camera on object
    eventBus.emit(
      "camera:focused",
      { objectId },
      {
        source: "camera-controller",
      },
    );
  }
}
```

### Event Filtering and Options

```typescript
// Listen only to events from specific source
eventBus.on(
  "data:updated",
  (event) => {
    console.log("Data updated by:", event.source);
  },
  {
    source: "data-manager",
  },
);

// Listen with trigger limit
eventBus.on(
  "error:occurred",
  (event) => {
    console.error("Error:", event.payload);
  },
  {
    maxTriggers: 10, // Only handle first 10 errors
  },
);

// Listen with immediate replay
eventBus.on(
  "app:state",
  (event) => {
    console.log("App state:", event.payload);
  },
  {
    immediate: true, // Get last emitted event immediately
  },
);
```

### Global Event Monitoring

```typescript
// Monitor all events for debugging
eventBus.onAll((event) => {
  console.log(`[${event.timestamp}] ${event.type}:`, {
    source: event.source,
    payload: event.payload,
  });
});

// Monitor specific event patterns
eventBus.onAll(
  (event) => {
    if (event.type.includes("error")) {
      logError(event);
    }
  },
  {
    maxTriggers: 50,
  },
);
```

### Event History and Debugging

```typescript
// Enable debug mode
eventBus.setDebugMode(true);

// Get event statistics
const stats = eventBus.getStats();
console.log("Event bus stats:", {
  totalListeners: stats.listenerCounts,
  globalListeners: stats.globalListeners,
  historySize: stats.eventHistory,
});

// Get recent events
const recentEvents = eventBus.getEventHistory(20);
recentEvents.forEach((event) => {
  console.log(`${event.type} from ${event.source}`);
});
```

### Component Lifecycle Integration

```typescript
class MyComponent {
  private unsubscribers: Array<() => void> = [];

  constructor() {
    // Set up event listeners
    this.unsubscribers.push(
      eventBus.on("object:selected", this.handleObjectSelected.bind(this)),
      eventBus.on("camera:moved", this.handleCameraMoved.bind(this)),
      eventBus.on("system:error", this.handleSystemError.bind(this)),
    );
  }

  private handleObjectSelected(event: EventConfig) {
    // Handle object selection
  }

  private handleCameraMoved(event: EventConfig) {
    // Handle camera movement
  }

  private handleSystemError(event: EventConfig) {
    // Handle system errors
  }

  disconnectedCallback() {
    // Clean up event listeners
    this.unsubscribers.forEach((unsubscribe) => unsubscribe());
  }
}
```

### Error Handling

```typescript
// Global error handling
eventBus.onAll((event) => {
  if (event.type === "error:occurred") {
    // Log error
    console.error("Application error:", event.payload);

    // Show user notification
    showErrorNotification(event.payload.message);

    // Report to error tracking service
    reportError(event.payload);
  }
});

// Component-specific error handling
eventBus.on(
  "data:error",
  (event) => {
    if (event.source === "data-loader") {
      // Handle data loading errors
      showDataError(event.payload);
    }
  },
  {
    maxTriggers: 5, // Limit error handling
  },
);
```

## Performance Characteristics

- **Efficient Lookups**: Uses Map data structures for O(1) event type lookups
- **Memory Management**: Automatic cleanup of expired subscriptions
- **History Limiting**: Configurable history size prevents memory leaks
- **Debug Mode**: Optional detailed logging for development

## Best Practices

1. **Use Source/Target**: Always specify source for events to enable filtering
2. **Clean Up Listeners**: Always unsubscribe from events in component cleanup
3. **Limit Triggers**: Use maxTriggers for error handlers and one-time operations
4. **Enable Debug Mode**: Use debug mode during development for event tracking
5. **Event Naming**: Use consistent naming conventions (domain:action)

## Related

- [[Events]] - Predefined event types and payloads
- [[ReactiveState]] - Integrates with EventBus for state management
- [[createComponentState]] - Uses EventBus for automatic event handling
