# Core Tooltip Component (`<teskooano-tooltip>`)

A flexible, low-level tooltip component with **reactive state management** using the new Teskooano UI patterns. Its visibility and positioning are controlled via attributes and JavaScript methods.

## Features

- **Reactive State Management**: Uses the new `createComponentState` pattern for automatic state tracking and UI updates
- **Type-Safe Events**: Fully typed event system with proper payload interfaces
- **Automatic Cleanup**: All subscriptions and event listeners are automatically cleaned up
- **Dynamic Positioning**: Automatically adjusts position to stay within viewport boundaries
- **Accessibility**: Full ARIA support with proper labeling and descriptions

This component is designed for two primary use cases:

1.  **Standalone**: Manually instantiated and controlled with JavaScript to provide a tooltip for any element.
2.  **Internal/Managed**: Used within the Shadow DOM of another component (like `<teskooano-button>`), where its lifecycle is managed automatically.

## Standalone Usage

This is the primary way to use the tooltip for custom scenarios. You must manage its visibility and positioning relative to a trigger element using JavaScript.

```html
<!-- Example Trigger Element -->
<button id="my-button">Hover Me</button>

<!-- Tooltip Definition -->
<teskooano-tooltip
  id="my-tooltip"
  vertical-align="below"
  horizontal-align="center"
>
  <svg slot="icon" width="16" height="16" viewBox="0 0 16 16">...</svg>
  <span slot="title">Info</span>
  This is the main tooltip text.
</teskooano-tooltip>

<script>
  const button = document.getElementById("my-button");
  const tooltip = document.getElementById("my-tooltip");

  button.addEventListener("mouseenter", () => {
    // Show the tooltip and anchor it to the button
    tooltip.show(button);
  });

  button.addEventListener("mouseleave", () => {
    tooltip.hide();
  });

  button.addEventListener("focus", () => tooltip.show(button));
  button.addEventListener("blur", () => tooltip.hide());
</script>
```

## Internal (Managed) Usage

Components like `<teskooano-button>` include a `<teskooano-tooltip>` in their Shadow DOM. In these cases, you do not need to manually control the tooltip. You can set its content via attributes on the parent component (e.g., `<teskooano-button tooltip-text="...">`).

## Attributes

- `visible`: (Read-only) Controls the visibility of the tooltip. Its presence makes the tooltip visible. This is managed primarily via the `show()`/`hide()` methods.
- `vertical-align`: Vertical alignment relative to the trigger.
  - **Values**: `above`, `below` (default)
- `horizontal-align`: Horizontal alignment relative to the trigger.
  - **Values**: `start`, `center` (default), `end`
- `timeout`: Auto-hide timeout in milliseconds. Set to 0 to disable auto-hide. Default: 5000ms.

## Slots

- `(default)`: The main text content of the tooltip.
- `icon`: An optional slot for an icon (e.g., an `<svg>` or `<img>` element).
- `title`: An optional slot for a title, displayed above the main text.

## Properties and Methods

### Methods

- `show(triggerElement: HTMLElement)`: Makes the tooltip visible and positions it relative to the provided `triggerElement`.
- `hide()`: Hides the tooltip.
- `setTriggerElement(triggerElement: HTMLElement)`: Sets the element the tooltip should be positioned against without showing it immediately.

### Properties

- `titleContent` (string): Programmatically sets the text of the `title` slot.
- `iconContent` (string): Programmatically sets the inner HTML of the `icon` slot. Useful for setting SVG content.
- `mainContent` (string): Programmatically sets the text of the default slot.
- `timeout` (number): Gets or sets the auto-hide timeout in milliseconds.

## Reactive State Management

The tooltip component uses the new Teskooano UI patterns for reactive state management:

```typescript
// Internal state structure
interface TooltipState {
  isVisible: boolean;
  verticalAlign: "above" | "below";
  horizontalAlign: "start" | "center" | "end";
  timeout: number;
  triggerElement: HTMLElement | null;
  position: {
    top: number;
    left: number;
  } | null;
}

// State is created using the new pattern
private state = createComponentState(
  {
    isVisible: false,
    verticalAlign: "below",
    horizontalAlign: "center",
    timeout: 5000,
    triggerElement: null,
    position: null,
  } as TooltipState,
  {
    componentName: "teskooano-tooltip",
  },
);
```

### State Watchers

The component automatically sets up watchers for all state changes:

- **Visibility changes**: Updates opacity and visibility styles, triggers positioning
- **Alignment changes**: Updates CSS classes for proper arrow positioning
- **Timeout changes**: Restarts auto-hide timer if tooltip is visible
- **Trigger element changes**: Recalculates position when trigger changes
- **Position changes**: Updates tooltip's fixed positioning on screen

### Automatic Cleanup

All state subscriptions and event listeners are automatically cleaned up when the component is disconnected:

```typescript
disconnectedCallback() {
  this.clearHideTimeout();
  this.state.cleanup(); // Automatic cleanup of all subscriptions
}
```

## Migration from v1.x

The tooltip component has been refactored to use the new reactive patterns:

### Before (v1.x - Manual State Management)

```typescript
// Manual state tracking with private properties
private _triggerElement: HTMLElement | null = null;
private _hideTimeout: number | null = null;

// Complex attribute update logic
private updateVisibility() {
  if (this.hasAttribute("visible")) {
    // ... complex logic
    this._startHideTimeout();
  } else {
    // ... more complex logic
    this._clearHideTimeout();
  }
}
```

### After (v2.0 - Simple Reactive State)

```typescript
// Simple reactive state with automatic tracking
private state = createComponentState(
  {
    isVisible: false,
    triggerElement: null,
    // ... all state in one place
  },
  { componentName: "teskooano-tooltip" }
);

// Simple watchers
this.state.watch("isVisible", (isVisible: boolean) => {
  this.updateVisibility(isVisible);
});
```

### Benefits

- **30% less code**: Reduced from ~384 lines to ~280 lines
- **Automatic cleanup**: No manual subscription management
- **Type safety**: Full TypeScript support with proper interfaces
- **Better debugging**: Built-in debug tools for state inspection
- **Consistent patterns**: Uses the same patterns as other UI components
- **Simplified logic**: No more complex attribute management or private state tracking

## Technical Details

### Positioning System

The component uses a reactive positioning system that automatically adjusts to viewport boundaries:

```typescript
private calculateAndAdjustPosition() {
  const trigger = this.state.get("triggerElement") ?? this.parentElement;
  const vAlign = this.state.get("verticalAlign");
  const hAlign = this.state.get("horizontalAlign");

  // Calculate initial position based on alignment
  // Adjust for viewport boundaries
  // Update state with final position
  this.state.set("position", { top, left });
}
```

### Timeout Management

Auto-hide functionality is managed through reactive state:

```typescript
private startHideTimeout() {
  this.clearHideTimeout();

  const timeoutMs = this.state.get("timeout");
  if (timeoutMs > 0) {
    this.hideTimeout = window.setTimeout(() => {
      this.hide();
      this.hideTimeout = null;
    }, timeoutMs);
  }
}
```

### CSS Parts

You can style the tooltip from outside its Shadow DOM using the `::part()` pseudo-element.

- `part="tooltip"`: The main tooltip container `div`.
- `part="content"`: The `div` wrapping all content (icon and text).
- `part="icon"`: The container for the `icon` slot.
- `part="text-content"`: The container for the title and main text.
- `part="title"`: The container for the `title` slot.
- `part="main"`: The container for the default (main text) slot.

Example:

```css
teskooano-tooltip::part(tooltip) {
  background-color: navy;
  max-width: 300px;
}
```

### Accessibility

Full ARIA support is maintained:

- Proper `role="tooltip"` attribute
- Keyboard navigation support
- Screen reader compatibility
- Focus management
