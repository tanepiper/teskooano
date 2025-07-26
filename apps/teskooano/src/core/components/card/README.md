# Core Card Component (`<teskooano-card>`)

A container component with **reactive state management** using the new Teskooano UI patterns. It provides optional image, label, title, content, and call-to-action (CTA) slots for grouping related content.

## Features

- **Reactive State Management**: Uses the new `createComponentState` pattern for automatic state tracking and UI updates
- **Type-Safe Events**: Fully typed event system with proper payload interfaces
- **Automatic Cleanup**: All subscriptions and event listeners are automatically cleaned up
- **Slot Validation**: Automatic validation of required slots with helpful warnings
- **Flexible Layout**: Multiple width variants (fixed, fluid, full) with responsive design
- **Accessibility**: Full ARIA support with proper semantic structure

## Usage

```html
<teskooano-card variant="fluid">
  <img
    slot="image"
    src="/path/to/your/image.jpg"
    alt="A descriptive alt text"
  />
  <span slot="label">Category</span>
  <span slot="title">Card Title</span>
  <p>This is the main content of the card. It can contain any HTML.</p>
  <div slot="cta">
    <teskooano-button variant="primary">Action 1</teskooano-button>
    <teskooano-button>Action 2</teskooano-button>
  </div>
</teskooano-card>
```

## Attributes

- `variant`: `fixed` (default), `fluid`, `full`. Controls the width behavior of the card.
  - `fixed`: A fixed width set by the `--card-fixed-width` CSS variable (default: 300px).
  - `fluid`: Width is determined by the content and the container.
  - `full`: Takes up 100% of the container's width.

## Slots

- `image`: (Optional) For an image, typically displayed at the top.
- `label`: (Optional) For a small category label above the title.
- `title`: The main title for the card.
- `(default)`: The primary content/body of the card.
- `cta`: (Optional) For call-to-action elements like buttons, displayed at the bottom with a separator.

## Reactive State Management

The card component uses the new Teskooano UI patterns for reactive state management:

```typescript
// Internal state structure
interface CardState {
  variant: "fixed" | "fluid" | "full";
  hasTitleSlot: boolean;
  hasContentSlot: boolean;
  hasImageSlot: boolean;
  hasLabelSlot: boolean;
  hasCtaSlot: boolean;
}

// State is created using the new pattern
private state = createComponentState(
  {
    variant: "fixed",
    hasTitleSlot: false,
    hasContentSlot: false,
    hasImageSlot: false,
    hasLabelSlot: false,
    hasCtaSlot: false,
  } as CardState,
  {
    componentName: "teskooano-card",
  },
);
```

### State Watchers

The component automatically sets up watchers for all state changes:

- **Variant changes**: Updates the `variant` attribute on the host element
- **Slot validation**: Monitors required slots (`title` and `content`) and logs warnings if empty
- **Slot availability**: Tracks which optional slots are populated for potential future features

### Automatic Cleanup

All state subscriptions and event listeners are automatically cleaned up when the component is disconnected:

```typescript
disconnectedCallback() {
  this.state.cleanup(); // Automatic cleanup of all subscriptions
}
```

## Migration from v1.x

The card component has been refactored to use the new reactive patterns:

### Before (v1.x - Manual State Management)

```typescript
// Manual attribute management
connectedCallback() {
  if (!this.hasAttribute("variant")) {
    this.setAttribute("variant", "fixed");
  }
  this._validateSlots();
}

// Complex validation logic
private _validateSlots() {
  const titleSlot = this.shadowRoot?.querySelector('slot[name="title"]');
  if (!titleSlot || titleSlot.assignedNodes({ flatten: true }).length === 0) {
    console.warn(`TeskooanoCard: Required slot [title] is empty.`);
  }
  // ... more validation logic
}
```

### After (v2.0 - Simple Reactive State)

```typescript
// Simple reactive state with automatic tracking
private state = createComponentState(
  {
    variant: "fixed",
    hasTitleSlot: false,
    hasContentSlot: false,
    // ... all state in one place
  },
  { componentName: "teskooano-card" }
);

// Simple watchers
this.state.watch("hasTitleSlot", (hasTitleSlot: boolean) => {
  if (!hasTitleSlot) {
    console.warn(`TeskooanoCard: Required slot [title] is empty.`);
  }
});
```

### Benefits

- **25% less code**: Reduced from ~122 lines to ~90 lines
- **Automatic cleanup**: No manual subscription management
- **Type safety**: Full TypeScript support with proper interfaces
- **Better debugging**: Built-in debug tools for state inspection
- **Consistent patterns**: Uses the same patterns as other UI components
- **Simplified logic**: No more complex attribute management or manual validation

## Technical Details

### Slot Validation

The component automatically validates required slots and tracks optional slot availability:

```typescript
private validateSlots() {
  const titleSlot = this.shadowRoot?.querySelector('slot[name="title"]') as HTMLSlotElement;
  const contentSlot = this.shadowRoot?.querySelector("slot:not([name])") as HTMLSlotElement;

  // Update state with slot availability
  this.state.set("hasTitleSlot", !!(titleSlot && titleSlot.assignedNodes({ flatten: true }).length > 0));
  this.state.set("hasContentSlot", !!(contentSlot && contentSlot.assignedNodes({ flatten: true }).length > 0));
  // ... track other slots
}
```

### Variant Management

Width variants are managed through reactive state:

```typescript
// Watch for variant changes
this.state.watch("variant", (variant: "fixed" | "fluid" | "full") => {
  if (variant) {
    this.setAttribute("variant", variant);
  } else {
    this.removeAttribute("variant");
    this.setAttribute("variant", "fixed"); // Set back to default
  }
});
```

## CSS Parts

- `container`: The main internal `div` of the card.
- `content-area`: The `div` wrapping the label, title, and default content.
- `cta-area`: The `div` wrapping the `cta` slot.

## CSS Custom Properties

- `--card-fixed-width`: (Default: `300px`) Sets the width when `variant="fixed"`.

## Accessibility

The card component maintains full accessibility support:

- **Semantic structure**: Proper heading hierarchy with the title slot
- **ARIA support**: Built-in ARIA attributes for screen readers
- **Keyboard navigation**: Full keyboard accessibility
- **Focus management**: Proper focus handling for interactive elements
