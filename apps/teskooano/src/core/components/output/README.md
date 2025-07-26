# Core Output Components (`<teskooano-output-display>` & `<teskooano-labeled-value>`)

Provides components for displaying formatted output and simple label-value pairs with **reactive state management** using the new Teskooano UI patterns.

## Features

- **Reactive State Management**: Uses the new `createComponentState` pattern for automatic state tracking and UI updates
- **Type-Safe Events**: Fully typed event system with proper payload interfaces
- **Automatic Cleanup**: All subscriptions and event listeners are automatically cleaned up
- **Slot Synchronization**: Automatic synchronization between attributes and slot content
- **Copy Functionality**: Built-in clipboard integration with visual feedback
- **Accessibility**: Full ARIA support with proper semantic structure

## `teskooano-output-display`

A component for displaying read-only text, such as code snippets or formatted data, with an optional copy button.

### Usage

The content can be set either by populating the default slot or by setting the `value` attribute/property.

```html
<!-- Using the value attribute -->
<teskooano-output-display
  value="This is some text from an attribute."
  copy-enabled
></teskooano-output-display>

<!-- With monospace font for code -->
<teskooano-output-display monospace copy-enabled>
  { "key": "value", "isJSON": true }
</teskooano-output-display>
```

### Attributes

- `value`: The text content to display.
- `monospace`: Boolean attribute to apply a monospace font, ideal for code.
- `copy-enabled`: Boolean attribute to show a "Copy" button.

### Properties & Methods

- `.value` (string): Gets or sets the text content.
- `.copyToClipboard()` (Promise<boolean>): Programmatically copies the content to the clipboard.
- `.clear()`: Clears the content of the display.

## `teskooano-labeled-value`

Displays a simple, neatly aligned label and its corresponding value.

### Usage

```html
<!-- Using attributes -->
<teskooano-labeled-value
  label="Object Name"
  value="Planet X"
></teskooano-labeled-value>

<!-- Using slots -->
<teskooano-labeled-value>
  <span slot="label">Velocity</span>
  <span>15.3 km/s</span>
</teskooano-labeled-value>
```

### Attributes

- `label`: The text for the label portion.
- `value`: The text for the value portion.

### Slots

- `label`: Used to provide a node for the label. Overrides the `label` attribute.
- `(default)`: Used to provide a node for the value. Overrides the `value` attribute.

## Reactive State Management

Both output components use the new Teskooano UI patterns for reactive state management:

### OutputDisplay State

```typescript
interface OutputDisplayState {
  value: string;
  isMonospace: boolean;
  isCopyEnabled: boolean;
  hasSlotContent: boolean;
  copyFeedbackVisible: boolean;
}

// State is created using the new pattern
private state = createComponentState(
  {
    value: "",
    isMonospace: false,
    isCopyEnabled: false,
    hasSlotContent: false,
    copyFeedbackVisible: false,
  } as OutputDisplayState,
  {
    componentName: "teskooano-output-display",
  },
);
```

### LabeledValue State

```typescript
interface LabeledValueState {
  label: string;
  value: string;
  hasLabelSlot: boolean;
  hasValueSlot: boolean;
}

// State is created using the new pattern
private state = createComponentState(
  {
    label: "",
    value: "",
    hasLabelSlot: false,
    hasValueSlot: false,
  } as LabeledValueState,
  {
    componentName: "teskooano-labeled-value",
  },
);
```

### State Watchers

The components automatically set up watchers for all state changes:

#### OutputDisplay Watchers

- **Value changes**: Updates text content and ARIA labels
- **Monospace changes**: Updates font family and ARIA descriptions
- **Copy enabled changes**: Shows/hides the copy button
- **Slot content changes**: Synchronizes slot content with value state
- **Copy feedback changes**: Controls visibility of copy success message

#### LabeledValue Watchers

- **Label changes**: Updates label display based on slot availability
- **Value changes**: Updates value display based on slot availability
- **Slot availability changes**: Switches between attribute and slot content

### Automatic Cleanup

All state subscriptions and event listeners are automatically cleaned up when components are disconnected:

```typescript
disconnectedCallback() {
  this.clearCopyTimeout(); // Clear any pending timeouts
  this.state.cleanup(); // Automatic cleanup of all subscriptions
}
```

## Migration from v1.x

The output components have been refactored to use the new reactive patterns:

### Before (v1.x - Manual State Management)

```typescript
// Manual internal update flags
private _internalUpdate = false;
private _copyTimeout: number | null = null;

// Complex attribute update logic
private updateValueAttribute(value: string | null) {
  if (value !== null && this.slotElement.assignedNodes().length === 0) {
    this.textContent = value;
  } else if (value === null && this.slotElement.assignedNodes().length === 0) {
    this.textContent = "";
  }
  // ... more complex logic
}
```

### After (v2.0 - Simple Reactive State)

```typescript
// Simple reactive state with automatic tracking
private state = createComponentState(
  {
    value: "",
    isMonospace: false,
    isCopyEnabled: false,
    hasSlotContent: false,
    copyFeedbackVisible: false,
  },
  { componentName: "teskooano-output-display" }
);

// Simple watchers
this.state.watch("value", (value: string) => {
  this.updateValueDisplay(value);
});
```

### Benefits

- **30% less code**: Reduced from ~308 lines to ~220 lines for OutputDisplay
- **25% less code**: Reduced from ~104 lines to ~78 lines for LabeledValue
- **Automatic cleanup**: No manual subscription management
- **Type safety**: Full TypeScript support with proper interfaces
- **Better debugging**: Built-in debug tools for state inspection
- **Consistent patterns**: Uses the same patterns as other UI components
- **Simplified logic**: No more complex attribute management or internal update flags

## Technical Details

### Slot Synchronization

Both components automatically synchronize between attributes and slot content:

```typescript
// Watch for slot content changes
this.state.watch("hasSlotContent", (hasSlotContent: boolean) => {
  if (hasSlotContent && !this.state.get("value")) {
    const slottedText = this.getSlottedText();
    if (slottedText) {
      this.state.set("value", slottedText);
    }
  }
});
```

### Copy Functionality

The OutputDisplay component includes reactive copy feedback:

```typescript
private showCopyFeedback() {
  this.state.set("copyFeedbackVisible", true);

  this.clearCopyTimeout();
  this.copyTimeout = window.setTimeout(() => {
    this.state.set("copyFeedbackVisible", false);
    this.copyTimeout = null;
  }, 2000);
}
```

### Event Handling

Both components maintain their original event handling while using reactive state:

```typescript
// Custom events are still dispatched
this.dispatchEvent(
  new CustomEvent(CustomEvents.CONTENT_CHANGE, {
    bubbles: true,
    composed: true,
    detail: { content: this.value },
  }),
);
```

## Accessibility

Both components maintain full accessibility support:

- **Semantic structure**: Proper ARIA attributes and roles
- **Keyboard navigation**: Full keyboard accessibility
- **Screen reader support**: Proper labeling and descriptions
- **Focus management**: Proper focus handling for interactive elements
