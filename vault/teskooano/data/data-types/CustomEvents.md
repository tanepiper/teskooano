---
aliases: [CustomEvents]
tags: [data, types, events]
type: Constant
package: "@teskooano/data-types"
file: "src/events.ts"
status: active
---

# CustomEvents

Map of custom event names used throughout the application for type-safe event handling.

## Overview

The `CustomEvents` constant provides a centralized map of all custom event names used throughout the Teskooano application. Using constants helps prevent typos and ensures consistency across the entire event system.

## Constant Definition

```typescript
export const CustomEvents = {
  // Engine Events
  COMPOSITE_ENGINE_INITIALIZED: "composite-engine-initialized",
  RENDERER_READY: "renderer-ready",

  // System Generation Events
  SYSTEM_GENERATION_START: "system-generation-start",
  SYSTEM_GENERATION_COMPLETE: "system-generation-complete",

  // Simulation Events
  SIMULATION_RESET_TIME: "resetSimulationTime",
  ORBIT_UPDATE: "orbitUpdate",

  // Texture Events
  TEXTURE_PROGRESS: "texture-progress",
  TEXTURE_GENERATION_COMPLETE: "texture-generation-complete",

  // Camera Events
  START_TOUR_REQUEST: "start-tour-request",
  CAMERA_TRANSITION_COMPLETE: "camera-transition-complete",
  USER_CAMERA_MANIPULATION: "user-camera-manipulation",

  // Celestial Object Events
  CELESTIAL_OBJECTS_LOADED: "celestial-objects-loaded",
  CELESTIAL_OBJECT_DESTROYED: "celestial-object-destroyed",
  FOCUS_REQUEST: "focus-request",
  FOLLOW_REQUEST: "follow-request",
  TRANSITION_COMPLETE: "transitioncomplete",

  // UI Events
  TOGGLE: "toggle",
  CONTENT_CHANGE: "content-change",
  COPY: "copy",
  CLEAR: "clear",
  CHANGE: "change",
  SUBMIT_CUSTOM: "submit-custom",
  RESET_CUSTOM: "reset-custom",
  MODAL_CONFIRM: "modal-confirm",
  MODAL_CLOSE: "modal-close",
  MODAL_ADDITIONAL: "modal-additional",
  SELECT_CHANGE: "select:change",
  SLIDER_CHANGE: "slider:change",

  // Command Events
  COMMAND: "command",

  // UI System Events
  UI_PANEL_OPEN: "ui:panel:open",
  UI_PANEL_CLOSE: "ui:panel:close",
  UI_BUTTON_CLICK: "ui:button:click",
  UI_MODAL_SHOW: "ui:modal:show",
  UI_MODAL_HIDE: "ui:modal:hide",
  UI_NOTIFICATION_SHOW: "ui:notification:show",

  // Game Events
  GAME_STATE_UPDATE: "game:state:update",
  PLAYER_POSITION_UPDATE: "player:position:update",
  ENTITY_ADDED: "entity:added",
  ENTITY_REMOVED: "entity:removed",
} as const;
```

## Event Categories

### Engine Events

#### COMPOSITE_ENGINE_INITIALIZED

```typescript
COMPOSITE_ENGINE_INITIALIZED: "composite-engine-initialized";
```

Fired when the composite engine is fully initialized.

**Usage:** System startup synchronization

#### RENDERER_READY

```typescript
RENDERER_READY: "renderer-ready";
```

Fired when the renderer is ready for use.

**Usage:** Renderer initialization synchronization

### System Generation Events

#### SYSTEM_GENERATION_START

```typescript
SYSTEM_GENERATION_START: "system-generation-start";
```

Fired when procedural system generation begins.

**Usage:** Loading UI and progress tracking

#### SYSTEM_GENERATION_COMPLETE

```typescript
SYSTEM_GENERATION_COMPLETE: "system-generation-complete";
```

Fired when procedural system generation completes.

**Usage:** System loading completion and UI updates

### Simulation Events

#### SIMULATION_RESET_TIME

```typescript
SIMULATION_RESET_TIME: "resetSimulationTime";
```

Fired when simulation time is reset.

**Usage:** Time management and state synchronization

#### ORBIT_UPDATE

```typescript
ORBIT_UPDATE: "orbitUpdate";
```

Fired when orbital positions are updated.

**Usage:** Position synchronization and trail updates

### Texture Events

#### TEXTURE_PROGRESS

```typescript
TEXTURE_PROGRESS: "texture-progress";
```

Fired during texture generation progress.

**Usage:** Progress bars and loading indicators

#### TEXTURE_GENERATION_COMPLETE

```typescript
TEXTURE_GENERATION_COMPLETE: "texture-generation-complete";
```

Fired when texture generation completes.

**Usage:** Asset loading completion

### Camera Events

#### START_TOUR_REQUEST

```typescript
START_TOUR_REQUEST: "start-tour-request";
```

Fired when a camera tour is requested.

**Usage:** Automated camera movement and tours

#### CAMERA_TRANSITION_COMPLETE

```typescript
CAMERA_TRANSITION_COMPLETE: "camera-transition-complete";
```

Fired when camera transition animation completes.

**Usage:** Camera movement synchronization

#### USER_CAMERA_MANIPULATION

```typescript
USER_CAMERA_MANIPULATION: "user-camera-manipulation";
```

Fired when user manually controls the camera.

**Usage:** User interaction tracking

### Celestial Object Events

#### CELESTIAL_OBJECTS_LOADED

```typescript
CELESTIAL_OBJECTS_LOADED: "celestial-objects-loaded";
```

Fired when celestial objects are loaded into the simulation.

**Usage:** Object initialization and UI population

#### CELESTIAL_OBJECT_DESTROYED

```typescript
CELESTIAL_OBJECT_DESTROYED: "celestial-object-destroyed";
```

Fired when a celestial object is destroyed or removed.

**Usage:** Cleanup and UI updates

#### FOCUS_REQUEST

```typescript
FOCUS_REQUEST: "focus-request";
```

Fired when focusing on a celestial object is requested.

**Usage:** Camera control and object highlighting

#### FOLLOW_REQUEST

```typescript
FOLLOW_REQUEST: "follow-request";
```

Fired when following a celestial object is requested.

**Usage:** Camera tracking and movement

### UI Events

#### UI_PANEL_OPEN

```typescript
UI_PANEL_OPEN: "ui:panel:open";
```

Fired when a UI panel is opened.

**Usage:** Panel management and layout

#### UI_BUTTON_CLICK

```typescript
UI_BUTTON_CLICK: "ui:button:click";
```

Fired when a UI button is clicked.

**Usage:** User interaction handling

#### UI_MODAL_SHOW

```typescript
UI_MODAL_SHOW: "ui:modal:show";
```

Fired when a modal dialog is shown.

**Usage:** Modal management and focus control

## Usage Examples

### Event Listener Registration

```typescript
import { CustomEvents } from "@teskooano/data-types";

// Listen for system generation completion
document.addEventListener(CustomEvents.SYSTEM_GENERATION_COMPLETE, (event) => {
  console.log("System generation completed");
  // Update UI, hide loading indicators, etc.
});

// Listen for orbit updates
document.addEventListener(CustomEvents.ORBIT_UPDATE, (event) => {
  const payload = event.detail as OrbitUpdatePayload;
  // Update trail rendering, position displays, etc.
});
```

### Event Dispatching

```typescript
import { CustomEvents, OrbitUpdatePayload } from "@teskooano/data-types";

function dispatchOrbitUpdate(
  positions: Record<string, { x: number; y: number; z: number }>,
) {
  const payload: OrbitUpdatePayload = { positions };

  const event = new CustomEvent(CustomEvents.ORBIT_UPDATE, {
    detail: payload,
  });

  document.dispatchEvent(event);
}

function dispatchFocusRequest(objectId: string) {
  const event = new CustomEvent(CustomEvents.FOCUS_REQUEST, {
    detail: { objectId },
  });

  document.dispatchEvent(event);
}
```

### Event Bus Integration

```typescript
import { CustomEvents } from "@teskooano/data-types";

class EventBus {
  private listeners = new Map<string, Function[]>();

  on(eventName: keyof typeof CustomEvents, callback: Function): void {
    const eventString = CustomEvents[eventName];
    if (!this.listeners.has(eventString)) {
      this.listeners.set(eventString, []);
    }
    this.listeners.get(eventString)!.push(callback);
  }

  emit(eventName: keyof typeof CustomEvents, data?: any): void {
    const eventString = CustomEvents[eventName];
    const callbacks = this.listeners.get(eventString) || [];
    callbacks.forEach((callback) => callback(data));
  }

  off(eventName: keyof typeof CustomEvents, callback: Function): void {
    const eventString = CustomEvents[eventName];
    const callbacks = this.listeners.get(eventString) || [];
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }
}
```

### RxJS Integration

```typescript
import { fromEvent } from "rxjs";
import { map, filter } from "rxjs/operators";
import { CustomEvents } from "@teskooano/data-types";

// Create observables for specific events
const orbitUpdate$ = fromEvent(document, CustomEvents.ORBIT_UPDATE).pipe(
  map((event) => (event as CustomEvent).detail as OrbitUpdatePayload),
);

const focusRequest$ = fromEvent(document, CustomEvents.FOCUS_REQUEST).pipe(
  map((event) => (event as CustomEvent).detail),
  filter((detail) => detail && detail.objectId),
);

const cameraTransitionComplete$ = fromEvent(
  document,
  CustomEvents.CAMERA_TRANSITION_COMPLETE,
);

// Subscribe to events
orbitUpdate$.subscribe((payload) => {
  // Handle orbit updates
  updateTrailPositions(payload.positions);
});

focusRequest$.subscribe(({ objectId }) => {
  // Handle focus requests
  focusOnObject(objectId);
});
```

## Event Patterns

### Request-Response Pattern

```typescript
// Request focus on an object
document.dispatchEvent(
  new CustomEvent(CustomEvents.FOCUS_REQUEST, {
    detail: { objectId: "earth-001" },
  }),
);

// Listen for transition completion
document.addEventListener(CustomEvents.CAMERA_TRANSITION_COMPLETE, () => {
  console.log("Focus transition completed");
});
```

### State Synchronization Pattern

```typescript
// Update orbit positions
document.dispatchEvent(
  new CustomEvent(CustomEvents.ORBIT_UPDATE, {
    detail: { positions: newPositions },
  }),
);

// Multiple systems can listen and update accordingly
document.addEventListener(CustomEvents.ORBIT_UPDATE, updateTrails);
document.addEventListener(CustomEvents.ORBIT_UPDATE, updateUI);
document.addEventListener(CustomEvents.ORBIT_UPDATE, updatePredictions);
```

## Integration

### Event System

- Provides type-safe event names
- Prevents typos in event handling
- Enables IDE autocomplete for event names

### Component Communication

- Decouples components through events
- Enables reactive programming patterns
- Supports publish-subscribe architecture

### State Management

- Events trigger state updates
- Enables reactive state synchronization
- Supports undo/redo through event replay

## 🔗 Related

- [[OrbitUpdatePayload]] - Payload for orbit update events
- [[SliderValueChangePayload]] - Payload for slider change events
- [[@teskooano/core-state]] - State management system
- [[@teskooano/app-simulation]] - Simulation event handling
