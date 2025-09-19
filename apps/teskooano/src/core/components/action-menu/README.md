# Action Menu Component

A reusable, configurable action menu component that provides a collapsible menu for action buttons. This component is purely slot-based - buttons are provided via the default slot.

## Features

- **Slot-based**: Buttons are provided via the default slot
- **Configurable Direction**: Menu can appear from left, right, top, or bottom
- **Button Size Control**: Configurable button sizes (xs, sm, md, lg)
- **Close on Action**: Optional automatic menu closing when actions are triggered
- **Custom Icons**: Support for custom toggle button icons (defaults to more horizontal icon)
- **Instance IDs**: Each menu has a unique instance ID for identification

## Basic Usage

### As a Custom Element with Slot

```html
<teskooano-action-menu
  instance-id="my-menu-1"
  button-size="sm"
  direction="right"
  close-on-action="true"
  toggle-title="More Options"
  icon="<svg>...</svg>"
>
  <teskooano-button size="sm" title="Focus Camera">
    <span slot="icon">
      <svg>...</svg>
    </span>
  </teskooano-button>
  <teskooano-button size="sm" title="Follow Object">
    <span slot="icon">
      <svg>...</svg>
    </span>
  </teskooano-button>
</teskooano-action-menu>
```

### Programmatic Usage

```typescript
import { ActionMenuComponent } from "@teskooano/core/components/action-menu";

// Create the menu with instance ID
const menu = new ActionMenuComponent();
menu.setAttribute("instance-id", "my-menu-1");

// Configure the menu
menu.setConfig({
  buttonSize: "sm",
  direction: "right",
  closeOnAction: true,
  toggleTitle: "More Options",
  toggleIconSvg: "<svg>...</svg>",
});

// Add buttons to the default slot
const button1 = document.createElement("teskooano-button");
button1.setAttribute("size", "sm");
button1.setAttribute("title", "Focus Camera");

const button2 = document.createElement("teskooano-button");
button2.setAttribute("size", "sm");
button2.setAttribute("title", "Follow Object");

menu.appendChild(button1);
menu.appendChild(button2);

// Listen for menu toggle events
menu.addEventListener("menu-toggled", (event) => {
  const { isExpanded, instanceId } = event.detail;
  console.log("Menu toggled:", isExpanded, "from menu:", instanceId);
});

// Add to DOM
document.body.appendChild(menu);
```

## Icon Configuration

The Action Menu supports custom icons for the toggle button. You can specify an icon using either the `icon` attribute or the `toggleIconSvg` configuration property.

### Using the `icon` Attribute

```html
<teskooano-action-menu
  icon="<svg width='16' height='16' viewBox='0 0 24 24' fill='currentColor'>
    <path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z'/>
  </svg>"
>
  <!-- Your action buttons here -->
</teskooano-action-menu>
```

### Using the `toggleIconSvg` Configuration

```typescript
menu.setConfig({
  toggleIconSvg: "<svg width='16' height='16' viewBox='0 0 24 24' fill='currentColor'>
    <path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z'/>
  </svg>"
});
```

### Default Icon

If no custom icon is provided, the component uses the default "more horizontal" icon from Fluent UI.

## Configuration Options

### ActionMenuConfig

```typescript
interface ActionMenuConfig {
  buttonSize?: "xs" | "sm" | "md" | "lg"; // Default: "xs"
  direction?: "left" | "right" | "top" | "bottom"; // Default: "right"
  closeOnAction?: boolean; // Default: false
  toggleTitle?: string; // Default: "More Options"
  toggleIconSvg?: string; // Custom icon SVG
}
```

## Examples

### Celestial Row Integration

The Action Menu is used in celestial rows to provide context-specific actions:

```html
<teskooano-action-menu
  instance-id="celestial-earth"
  button-size="xs"
  direction="right"
  close-on-action="false"
  toggle-title="Object Actions"
>
  <teskooano-button size="xs" title="Focus Camera" data-action="focus">
    <span slot="icon">
      <svg>...</svg>
    </span>
  </teskooano-button>

  <teskooano-button size="xs" title="Follow Object" data-action="follow">
    <span slot="icon">
      <svg>...</svg>
    </span>
  </teskooano-button>

  <teskooano-button size="xs" title="Toggle Orbit" data-action="orbit">
    <span slot="icon">
      <svg>...</svg>
    </span>
  </teskooano-button>
</teskooano-action-menu>
```

### Hierarchy Menu Example

```html
<teskooano-action-menu
  instance-id="hierarchy-main"
  button-size="xs"
  direction="right"
  close-on-action="false"
>
  <teskooano-button size="xs" title="Expand All" data-action="expand-all">
    <span slot="icon">
      <svg>...</svg>
    </span>
  </teskooano-button>

  <teskooano-button size="xs" title="Collapse All" data-action="collapse-all">
    <span slot="icon">
      <svg>...</svg>
    </span>
  </teskooano-button>
</teskooano-action-menu>
```

## Styling

The Action Menu uses CSS custom properties for theming:

```css
:host {
  --color-text-primary: white;
  --color-text-secondary: #aaa;
  --color-surface-hover: rgba(255, 255, 255, 0.1);
  --color-primary-muted: #5551cc;
  --color-text-on-primary: white;
}
```

## API Reference

### ActionMenuComponent

#### Properties

- `instanceId: string` - The unique instance ID of this menu
- `isExpanded: boolean` - Current expanded state
- `controller: ActionMenuController` - Access to the controller

#### Methods

- `setConfig(config: Partial<ActionMenuConfig>): void`
- `openMenu(): void`
- `closeMenu(): void`
- `toggleMenu(): void`

#### Events

- `menu-toggled` - Dispatched when the menu is opened or closed

### ActionMenuController

#### Properties

- `instanceId: string` - The unique instance ID of this menu
- `isExpanded: boolean` - Current expanded state
- `menuToggled$: Subject<{ isExpanded: boolean; instanceId: string }>` - Observable for menu toggle events

#### Methods

- `setConfig(config: Partial<ActionMenuConfig>): void`
- `updateInstanceId(newInstanceId: string): void`
- `openMenu(): void`
- `closeMenu(): void`
- `toggleMenu(): void`
- `dispose(): void`

## Migration from Dynamic Actions

If you were previously using the dynamic action system, you'll need to migrate to the slot-based approach:

### Before (Dynamic Actions)

```typescript
const menu = new ActionMenuComponent();
menu.setActions([
  {
    id: "focus",
    title: "Focus Camera",
    iconSvg: "<svg>...</svg>",
    active: false,
  },
]);
```

### After (Slot-based)

```html
<teskooano-action-menu instance-id="my-menu">
  <teskooano-button size="xs" title="Focus Camera" data-action="focus">
    <span slot="icon">
      <svg>...</svg>
    </span>
  </teskooano-button>
</teskooano-action-menu>
```

The slot-based approach provides more flexibility and allows you to use any button component or custom elements within the default slot.
