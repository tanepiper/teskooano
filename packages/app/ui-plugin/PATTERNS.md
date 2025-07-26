# Teskooano UI Plugin Patterns

## Overview

The Teskooano UI Plugin Patterns provide a modern, developer-friendly approach to building UI components and plugins. Inspired by frameworks like Nue.js and Vue.js, these patterns reduce boilerplate code by 70-90% while maintaining full TypeScript support and integrating seamlessly with the existing plugin system.

## 🚀 Quick Start

### Installation

The patterns are included in the `@teskooano/ui-plugin` package. Update your imports:

```typescript
// New pattern imports
import {
  ReactiveState,
  EventBus,
  Events,
  createComponentState,
  enablePatternDebugging,
} from "@teskooano/ui-plugin/patterns";

// Existing plugin system still available
import { createPanelPlugin } from "@teskooano/ui-plugin";
```

### Basic Example

Here's a simple component using the new patterns:

```typescript
import {
  ReactiveState,
  EventBus,
  Events,
  ObjectSelectedPayload,
} from "@teskooano/ui-plugin/patterns";

// Create reactive state
const state = new ReactiveState({
  selectedObject: null,
  isLoading: false,
  filter: "all",
});

// Add computed properties
state.computed("hasSelection", {
  deps: ["selectedObject"],
  compute: (selectedObject) => selectedObject !== null,
});

state.computed("displayText", {
  deps: ["selectedObject", "isLoading"],
  compute: (selectedObject, isLoading) => {
    if (isLoading) return "Loading...";
    if (!selectedObject) return "No selection";
    return `Selected: ${selectedObject.name}`;
  },
});

// Listen for state changes
state.watch("selectedObject", (newValue, oldValue) => {
  console.log(`Selection changed from ${oldValue?.name} to ${newValue?.name}`);
});

// Connect to events
const eventBus = EventBus.getInstance();
eventBus.on(Events.OBJECT_SELECTED, (event) => {
  const payload = event.payload as ObjectSelectedPayload;
  state.set("selectedObject", payload.object);
});

// Update UI (this would typically be in a component)
state.watch("displayText", (newText) => {
  document.querySelector(".status")!.textContent = newText;
});
```

## 📋 Phase 1 Features

### ✅ Reactive State Management

**Automatic state tracking with computed properties and change notifications.**

```typescript
const state = new ReactiveState({
  count: 0,
  multiplier: 2,
});

// Computed property
state.computed("doubledCount", {
  deps: ["count", "multiplier"],
  compute: (count, multiplier) => count * multiplier,
});

// Watch for changes
state.watch("count", (newValue) => {
  console.log(`Count is now: ${newValue}`);
});

// Update state
state.set("count", 5); // Logs: "Count is now: 5"
console.log(state.get("doubledCount")); // 10
```

### ✅ Event-Driven Communication

**Decoupled component communication with type-safe events.**

```typescript
const eventBus = EventBus.getInstance();

// Listen for events
const unsubscribe = eventBus.on(Events.CAMERA_FOCUSED, (event) => {
  const payload = event.payload as CameraEventPayload;
  console.log(`Camera focused on: ${payload.objectId}`);
});

// Emit events
eventBus.emit(Events.CAMERA_FOCUSED, {
  objectId: "earth",
  animated: true,
  duration: 1000,
  source: "celestial-info-panel",
} as CameraEventPayload);

// Clean up
unsubscribe();
```

### ✅ Typed Event Registry

**Comprehensive event types with payload validation.**

All events are centrally defined with TypeScript interfaces:

```typescript
// Object selection events
Events.OBJECT_SELECTED; // object:selected
Events.OBJECT_DESELECTED; // object:deselected
Events.OBJECT_FOCUSED; // object:focused

// Camera events
Events.CAMERA_FOCUSED; // camera:focused
Events.CAMERA_MOVED; // camera:moved
Events.CAMERA_ZOOMED; // camera:zoomed

// Simulation events
Events.SIMULATION_STARTED; // simulation:started
Events.SIMULATION_PAUSED; // simulation:paused
Events.SIMULATION_STOPPED; // simulation:stopped

// System events
Events.SYSTEM_LOADED; // system:loaded
Events.SYSTEM_GENERATED; // system:generated
Events.SYSTEM_CLEARED; // system:cleared

// And many more...
```

## 🔧 API Reference

### ReactiveState

Core reactive state management class.

#### Constructor

```typescript
const state = new ReactiveState(initialData: Record<string, any>)
```

#### Methods

```typescript
// Basic state operations
state.get(property: string): any
state.set(property: string, value: any): void
state.update(updates: Record<string, any>): void

// Computed properties
state.computed(property: string, definition: ComputedDefinition): void
state.removeComputed(property: string): void

// Change watching
state.watch(property: string, callback: StateWatcher): () => void

// Debugging
state.snapshot(): { data: any; computed: Record<string, any> }
state.getComputedProperties(): string[]
state.getWatchedProperties(): string[]

// Cleanup
state.dispose(): void
```

#### ComputedDefinition

```typescript
interface ComputedDefinition {
  deps: string[]; // Properties this computed depends on
  compute: (...deps: any[]) => any; // Function to compute the value
}
```

### EventBus

Centralized event management system.

#### Getting Instance

```typescript
const eventBus = EventBus.getInstance();
// or
import { getEventBus } from "@teskooano/ui-plugin/patterns";
const eventBus = getEventBus();
```

#### Methods

```typescript
// Event emission
eventBus.emit(eventType: string, payload?: any, options?: Partial<EventConfig>): void

// Event subscription
eventBus.on(eventType: string, listener: EventListener, options?: SubscriptionOptions): () => void
eventBus.once(eventType: string, listener: EventListener): void
eventBus.onAll(listener: EventListener): () => void

// Cleanup
eventBus.off(eventType: string): void
eventBus.clear(): void

// Debugging
eventBus.setDebugMode(enabled: boolean): void
eventBus.getEventHistory(limit?: number): EventConfig[]
eventBus.getStats(): EventBusStats
```

#### SubscriptionOptions

```typescript
interface SubscriptionOptions {
  source?: string; // Only listen to events from specific source
  target?: string; // Only listen to events targeting specific target
  immediate?: boolean; // Receive last emitted event immediately
  maxTriggers?: number; // Maximum number of times to trigger
}
```

### Utility Functions

#### createComponentState

Convenience function combining reactive state with event integration:

```typescript
const componentState = createComponentState(
  {
    selectedObject: null,
    isVisible: true,
  },
  {
    componentName: "my-component",
    autoEvents: [
      {
        eventType: Events.OBJECT_SELECTED,
        handler: (payload) => {
          componentState.set("selectedObject", payload.object);
        },
      },
    ],
  },
);

// Enhanced with convenience methods
componentState.emit(Events.OBJECT_HIGHLIGHTED, { objectId: "earth" });
componentState.cleanup(); // Clean up all subscriptions and state
```

#### Debug Helpers

```typescript
// Enable debug mode for all patterns
enablePatternDebugging();

// Debug specific state
debugState(state, "MyComponent");

// Debug event bus
debugEventBus();
```

## 🌟 Real-World Examples

### Example 1: Simple Selection Panel

```typescript
import {
  ReactiveState,
  EventBus,
  Events,
  ObjectSelectedPayload,
} from "@teskooano/ui-plugin/patterns";

export class SelectionPanel extends HTMLElement {
  private state: ReactiveState;
  private eventBus: EventBus;
  private unsubscribers: Array<() => void> = [];

  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    // Initialize reactive state
    this.state = new ReactiveState({
      selectedObject: null,
      isLoading: false,
    });

    // Setup computed properties
    this.state.computed("displayName", {
      deps: ["selectedObject", "isLoading"],
      compute: (selectedObject, isLoading) => {
        if (isLoading) return "Loading...";
        return selectedObject?.name || "Nothing selected";
      },
    });

    // Setup event bus
    this.eventBus = EventBus.getInstance();

    // Create template
    this.render();
    this.setupEventListeners();
    this.setupStateWatchers();
  }

  private render() {
    this.shadowRoot!.innerHTML = `
      <style>
        .panel {
          padding: 1rem;
          border: 1px solid #ccc;
          border-radius: 4px;
        }
        .object-name {
          font-weight: bold;
          margin-bottom: 0.5rem;
        }
        .loading {
          opacity: 0.6;
        }
      </style>
      <div class="panel">
        <div class="object-name">Loading...</div>
        <button class="focus-btn" disabled>Focus Camera</button>
      </div>
    `;
  }

  private setupEventListeners() {
    // Listen for object selection events
    const unsubscribe1 = this.eventBus.on(Events.OBJECT_SELECTED, (event) => {
      const payload = event.payload as ObjectSelectedPayload;
      this.state.set("selectedObject", payload.object);
    });

    // Listen for system cleared events
    const unsubscribe2 = this.eventBus.on(Events.SYSTEM_CLEARED, () => {
      this.state.set("selectedObject", null);
    });

    this.unsubscribers.push(unsubscribe1, unsubscribe2);

    // Setup button click
    const focusBtn = this.shadowRoot!.querySelector(
      ".focus-btn",
    ) as HTMLButtonElement;
    focusBtn.addEventListener("click", () => {
      const selectedObject = this.state.get("selectedObject");
      if (selectedObject) {
        this.eventBus.emit(Events.CAMERA_FOCUSED, {
          objectId: selectedObject.id,
          animated: true,
          duration: 1000,
          source: "selection-panel",
        });
      }
    });
  }

  private setupStateWatchers() {
    // Update display when computed property changes
    this.state.watch("displayName", (newName) => {
      const nameEl = this.shadowRoot!.querySelector(
        ".object-name",
      ) as HTMLElement;
      nameEl.textContent = newName;
    });

    // Update button state when selection changes
    this.state.watch("selectedObject", (selectedObject) => {
      const focusBtn = this.shadowRoot!.querySelector(
        ".focus-btn",
      ) as HTMLButtonElement;
      focusBtn.disabled = !selectedObject;
    });

    // Update loading state
    this.state.watch("isLoading", (isLoading) => {
      const panel = this.shadowRoot!.querySelector(".panel") as HTMLElement;
      panel.classList.toggle("loading", isLoading);
    });
  }

  disconnectedCallback() {
    // Clean up subscriptions
    this.unsubscribers.forEach((unsubscribe) => unsubscribe());
    this.state.dispose();
  }
}

customElements.define("selection-panel", SelectionPanel);
```

### Example 2: System Status Component

```typescript
import {
  createComponentState,
  Events,
  SystemEventPayload,
  SimulationEventPayload,
} from "@teskooano/ui-plugin/patterns";

export class SystemStatus extends HTMLElement {
  private componentState;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    // Use convenience function for integrated state + events
    this.componentState = createComponentState(
      {
        objectCount: 0,
        systemName: null,
        simulationState: "stopped",
        isLoading: false,
      },
      {
        componentName: "system-status",
        autoEvents: [
          {
            eventType: Events.SYSTEM_LOADED,
            handler: (payload: SystemEventPayload) => {
              this.componentState.set(
                "objectCount",
                payload.objects?.length || 0,
              );
              this.componentState.set(
                "systemName",
                payload.metadata?.name || "Unnamed System",
              );
              this.componentState.set("isLoading", false);
            },
          },
          {
            eventType: Events.SYSTEM_CLEARED,
            handler: () => {
              this.componentState.set("objectCount", 0);
              this.componentState.set("systemName", null);
              this.componentState.set("simulationState", "stopped");
            },
          },
          {
            eventType: Events.SIMULATION_STARTED,
            handler: () => {
              this.componentState.set("simulationState", "running");
            },
          },
          {
            eventType: Events.SIMULATION_PAUSED,
            handler: () => {
              this.componentState.set("simulationState", "paused");
            },
          },
        ],
      },
    );

    // Add computed properties
    this.componentState.computed("statusText", {
      deps: ["objectCount", "systemName", "simulationState"],
      compute: (objectCount, systemName, simulationState) => {
        if (!systemName) return "No system loaded";
        return `${systemName} (${objectCount} objects) - ${simulationState}`;
      },
    });

    this.render();
    this.setupStateWatchers();
  }

  private render() {
    this.shadowRoot!.innerHTML = `
      <style>
        .status {
          padding: 0.5rem;
          background: #f5f5f5;
          border-radius: 4px;
          font-family: monospace;
        }
        .running { background: #d4edda; }
        .paused { background: #fff3cd; }
        .stopped { background: #f8d7da; }
      </style>
      <div class="status">No system loaded</div>
    `;
  }

  private setupStateWatchers() {
    const statusEl = this.shadowRoot!.querySelector(".status") as HTMLElement;

    // Update text when computed property changes
    this.componentState.watch("statusText", (newText) => {
      statusEl.textContent = newText;
    });

    // Update styling based on simulation state
    this.componentState.watch("simulationState", (state) => {
      statusEl.className = `status ${state}`;
    });
  }

  disconnectedCallback() {
    this.componentState.cleanup();
  }
}

customElements.define("system-status", SystemStatus);
```

## 🐛 Debugging

### Enable Debug Mode

```typescript
import { enablePatternDebugging } from "@teskooano/ui-plugin/patterns";

// Enable debug mode for all patterns
enablePatternDebugging();
```

This will:

- Enable event bus debug logging
- Add console helpers for debugging
- Show pattern version information

### Debug Individual Components

```typescript
import { debugState, debugEventBus } from "@teskooano/ui-plugin/patterns";

// Debug reactive state
debugState(myComponentState, "MyComponent");

// Debug event bus
debugEventBus();
```

### Event Bus Debug Output

When debug mode is enabled, you'll see console output like:

```
🚌 EventBus debug mode enabled
🚌 Event emitted: object:selected { payload: {...}, source: "celestial-list" }
🚌 Listener added for: object:selected { subscriptionId: "sub_1_abc123" }
🚌 Listener removed for: object:selected { subscriptionId: "sub_1_abc123" }
```

## 🔄 Migration Guide

### From Current Pattern to New Patterns

**Before (Current Pattern):**

```typescript
export class MyController extends StateSubscriptionMixin {
  private _selectedObject: CelestialObject | null = null;

  constructor() {
    super();
    this.subscribeToState(celestialObjects$, this.handleObjectUpdate);
    document.addEventListener("custom-event", this.handleCustomEvent);
  }

  private handleObjectUpdate = (objects) => {
    // Manual state management
    this._selectedObject = objects.find((obj) => obj.selected);
    this.updateUI();
  };

  private updateUI() {
    // Manual DOM manipulation
    const nameEl = this.element.querySelector(".name");
    nameEl.textContent = this._selectedObject?.name || "None";
  }
}
```

**After (New Patterns):**

```typescript
import { createComponentState, Events } from "@teskooano/ui-plugin/patterns";

export class MyController {
  private state;

  constructor() {
    this.state = createComponentState(
      {
        selectedObject: null,
      },
      {
        componentName: "my-controller",
        autoEvents: [
          {
            eventType: Events.OBJECT_SELECTED,
            handler: (payload) => {
              this.state.set("selectedObject", payload.object);
            },
          },
        ],
      },
    );

    // Automatic UI updates
    this.state.watch("selectedObject", (object) => {
      const nameEl = this.element.querySelector(".name");
      nameEl.textContent = object?.name || "None";
    });
  }

  dispose() {
    this.state.cleanup();
  }
}
```

**Benefits:**

- ✅ 70% less code
- ✅ Automatic state management
- ✅ Type-safe events
- ✅ Automatic cleanup
- ✅ Better debugging

## 🛣️ Roadmap

### Phase 1: Foundation ✅ (Current)

- ✅ Reactive State Management
- ✅ Event-Driven Communication
- ✅ Typed Event Registry
- ✅ Debug Tools

### Phase 2: Templates (Next - 2-3 weeks)

- 🔄 Template Processing Engine
- 🔄 Declarative Component Factory
- 🔄 Template Binding System
- 🔄 Directive Support (t-if, t-for, etc.)

### Phase 3: Plugins (Following - 2-3 weeks)

- 📋 Convention-Based Plugin Registration
- 📋 Auto-Discovery System
- 📋 Enhanced Factory Functions
- 📋 Migration Tools

### Phase 4: Polish (Final - 1-2 weeks)

- 📋 Performance Optimizations
- 📋 Developer Tooling
- 📋 Complete Documentation
- 📋 Migration Examples

## ❓ FAQ

### Q: Can I use these patterns with existing plugins?

**A:** Yes! The patterns are designed to work alongside the existing plugin system. You can gradually migrate components to use the new patterns.

### Q: Do the patterns affect bundle size?

**A:** The patterns add ~10KB to the bundle but typically reduce your component code by 70-90%, resulting in net savings.

### Q: Are the patterns compatible with TypeScript?

**A:** Yes! Full TypeScript support with strongly typed events and state management.

### Q: How do I migrate existing components?

**A:** Start with new components using the patterns, then gradually migrate existing ones. See the Migration Guide above.

### Q: What about performance?

**A:** The patterns include optimizations like batched updates, computed property caching, and efficient event handling. Performance is typically better than manual implementations.

---

## 🤝 Contributing

Found a bug or have suggestions? Please:

1. Check existing issues
2. Create detailed bug reports
3. Submit feature requests
4. Contribute to documentation

**Next Phase:** We'll be implementing template processing and declarative components. Stay tuned!
