# Action Menu Component

A reusable, configurable action menu component that provides a collapsible menu of action buttons. This component is designed to be used in various UI contexts and integrates with the Teskooano toolbar system.

## Features

- **Configurable Direction**: Menu can appear from left, right, top, or bottom
- **Button Size Control**: Configurable button sizes (xs, sm, md, lg)
- **Close on Action**: Optional automatic menu closing when actions are triggered
- **Custom Icons**: Support for custom toggle button icons (defaults to more horizontal icon)
- **Active States**: Support for active/disabled action states
- **Toolbar Integration**: Works with the plugin toolbar system
- **Instance IDs**: Each menu has a unique instance ID for identification
- **Factory Pattern**: Create multiple menu instances with shared configurations

## Basic Usage

### As a Custom Element

```html
<teskooano-action-menu
  instance-id="my-menu-1"
  button-size="sm"
  direction="right"
  close-on-action="true"
  toggle-title="More Options"
  toggle-icon-svg="<svg>...</svg>"
>
</teskooano-action-menu>
```

### Programmatic Usage

```typescript
import {
  ActionMenuComponent,
  type ActionMenuItem,
} from "@teskooano/core/components/action-menu";

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

// Add actions
menu.setActions([
  {
    id: "focus",
    title: "Focus Camera",
    iconSvg: "<svg>...</svg>",
    active: false,
  },
  {
    id: "follow",
    title: "Follow Object",
    iconSvg: "<svg>...</svg>",
    active: true,
  },
]);

// Listen for action events (now includes instanceId)
menu.addEventListener("action-triggered", (event) => {
  const { action, event: clickEvent, instanceId } = event.detail;
  console.log("Action triggered:", action.id, "from menu:", instanceId);
});

// Add to DOM
document.body.appendChild(menu);
```

## Icon Configuration

The Action Menu supports custom icons for the toggle button. You can specify an icon using either the `toggle-icon-svg` attribute or the `toggleIconSvg` configuration property.

### Using the `toggle-icon-svg` Attribute

```html
<teskooano-action-menu
  toggle-icon-svg="<svg width='16' height='16' viewBox='0 0 24 24' fill='currentColor'>
    <path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z'/>
  </svg>"
>
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

## Factory Pattern Usage

The Action Menu supports a factory pattern for creating multiple instances with shared configurations:

### Using ActionMenuFactory

```typescript
import {
  ActionMenuFactory,
  type ActionMenuConfig,
} from "@teskooano/core/components/action-menu";

// Create a factory with base configuration
const hierarchyFactory = new ActionMenuFactory({
  buttonSize: "xs",
  direction: "right",
  closeOnAction: false,
  toggleTitle: "More Options",
});

// Create specific instances
const earthMenu = hierarchyFactory.forCelestial("earth");
const marsMenu = hierarchyFactory.forCelestial("mars");
const jupiterMenu = hierarchyFactory.forCelestial("jupiter");

// Or create with custom instance IDs
const customMenu = hierarchyFactory.createInstance("custom-menu-1", {
  direction: "left",
  closeOnAction: true,
});
```

### Using ActionMenuManager

```typescript
import { ActionMenuManager } from "@teskooano/core/components/action-menu";

// Get the manager instance (after plugin initialization)
const manager = context.getManager("action-menu-manager");

// Create specialized factories
const hierarchyFactory = manager.createHierarchyFactory();
const celestialFactory = manager.createCelestialFactory();
const toolbarFactory = manager.createToolbarFactory();

// Use factories to create instances
const earthMenu = celestialFactory.forCelestial("earth");
const marsMenu = celestialFactory.forCelestial("mars");

// Configure actions for each instance
earthMenu.setActions([
  {
    id: "focus",
    title: "Focus Earth",
    iconSvg: EyeIcon,
    active: false,
  },
  {
    id: "info",
    title: "Earth Info",
    iconSvg: InfoIcon,
    active: false,
  },
]);

marsMenu.setActions([
  {
    id: "focus",
    title: "Focus Mars",
    iconSvg: EyeIcon,
    active: false,
  },
  {
    id: "info",
    title: "Mars Info",
    iconSvg: InfoIcon,
    active: false,
  },
]);

// Listen for actions from specific instances
earthMenu.addEventListener("action-triggered", (event) => {
  const { action, instanceId } = event.detail;
  console.log(`Action ${action.id} triggered from ${instanceId}`);
});
```

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

### ActionMenuItem

```typescript
interface ActionMenuItem {
  id: string; // Unique identifier
  title: string; // Display title/tooltip
  iconSvg: string; // SVG icon content
  active?: boolean; // Active state
  disabled?: boolean; // Disabled state
  data?: any; // Optional data
}
```

### ActionMenuEvent

```typescript
interface ActionMenuEvent {
  action: ActionMenuItem; // The action that was triggered
  event: MouseEvent; // The click event
  instanceId: string; // The instance ID of the menu
}
```

## Toolbar Integration

The Action Menu component integrates with the Teskooano toolbar system. Plugins can register actions for the `action-menu` target:

```typescript
// In a plugin definition
export const plugin: TeskooanoPlugin = {
  id: "my-plugin",
  name: "My Plugin",
  // ... other config
  toolbarRegistrations: [
    {
      target: "action-menu",
      items: [
        {
          id: "my-action",
          type: "function",
          title: "My Action",
          iconSvg: myIconSvg,
          functionId: "my-plugin:action",
          order: 10,
        },
      ],
    },
  ],
  functions: [
    {
      id: "my-plugin:action",
      execute: async (context) => {
        // Handle the action
        console.log("Action triggered");
      },
    },
  ],
};
```

## Manager Usage

For advanced usage, you can use the ActionMenuManager to create and manage multiple menu instances:

```typescript
import { ActionMenuManager } from "@teskooano/core/components/action-menu";

// Get the manager instance (after plugin initialization)
const manager = context.getManager("action-menu-manager");

// Create specialized factories
const hierarchyFactory = manager.createHierarchyFactory();
const celestialFactory = manager.createCelestialFactory();

// Create a menu for a specific target
const menu = manager.createMenuForTarget("unique-menu-id", parentElement, {
  buttonSize: "sm",
  direction: "right",
  closeOnAction: true,
});

// Set actions
manager.setMenuActions("unique-menu-id", [
  {
    id: "action1",
    title: "Action 1",
    iconSvg: icon1Svg,
  },
  {
    id: "action2",
    title: "Action 2",
    iconSvg: icon2Svg,
  },
]);

// Update action states
manager.setActionActive("unique-menu-id", "action1", true);
manager.setActionDisabled("unique-menu-id", "action2", false);

// Clean up when done
manager.disposeMenuForTarget("unique-menu-id");
```

## Examples

### Celestial Row Integration

The Action Menu is used in celestial rows to provide context-specific actions:

```typescript
// In CelestialRow component
import { ActionMenuFactory } from "@teskooano/core/components/action-menu";

// Create a factory for celestial menus
const celestialFactory = new ActionMenuFactory({
  buttonSize: "xs",
  direction: "right",
  closeOnAction: false,
  toggleTitle: "Object Actions",
});

// Create menu for this specific celestial object
const actionMenu = celestialFactory.forCelestial(this._objectId);

actionMenu.setActions([
  {
    id: "focus",
    title: "Focus Camera",
    iconSvg: EyeIcon,
    active: false,
  },
  {
    id: "follow",
    title: "Follow Object",
    iconSvg: PersonRunningIcon,
    active: this.hasAttribute("following"),
  },
  {
    id: "orbit",
    title: "Toggle Orbit",
    iconSvg: OrbitIcon,
    active: this.hasAttribute("orbit-visible"),
  },
  {
    id: "info",
    title: "Show Info",
    iconSvg: InfoIcon,
    active: false,
  },
]);

// Listen for actions (now includes instanceId)
actionMenu.addEventListener("action-triggered", (event) => {
  const { action, instanceId } = event.detail;
  this.dispatchEvent(
    new CustomEvent(`celestial-${action.id}-request`, {
      bubbles: true,
      composed: true,
      detail: { objectId: this._objectId, menuInstanceId: instanceId },
    }),
  );
});

// Add to the row
this.appendChild(actionMenu);
```

### Hierarchy Menu Example

```typescript
// Create hierarchy factory
const hierarchyFactory = new ActionMenuFactory({
  buttonSize: "xs",
  direction: "right",
  closeOnAction: false,
});

// Create menu for hierarchy
const hierarchyMenu = hierarchyFactory.forHierarchy("main-hierarchy");

hierarchyMenu.setActions([
  {
    id: "expand-all",
    title: "Expand All",
    iconSvg: ExpandIcon,
  },
  {
    id: "collapse-all",
    title: "Collapse All",
    iconSvg: CollapseIcon,
  },
  {
    id: "sort-by-name",
    title: "Sort by Name",
    iconSvg: SortIcon,
  },
]);
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
- `setActions(actions: ActionMenuItem[]): void`
- `addAction(action: ActionMenuItem): void`
- `removeAction(actionId: string): void`
- `setActionActive(actionId: string, active: boolean): void`
- `setActionDisabled(actionId: string, disabled: boolean): void`
- `openMenu(): void`
- `closeMenu(): void`
- `toggleMenu(): void`

#### Events

- `action-triggered` - Dispatched when an action is clicked (includes instanceId)

### ActionMenuFactory

#### Methods

- `createInstance(instanceId: string, config?: Partial<ActionMenuConfig>): ActionMenuComponent`
- `forCelestial(celestialId: string, config?: Partial<ActionMenuConfig>): ActionMenuComponent`
- `forHierarchy(hierarchyId: string, config?: Partial<ActionMenuConfig>): ActionMenuComponent`
- `forToolbar(toolbarId: string, config?: Partial<ActionMenuConfig>): ActionMenuComponent`

### ActionMenuManager

#### Methods

- `createFactory(factoryId: string, baseConfig?: ActionMenuConfig): ActionMenuFactory`
- `getFactory(factoryId: string): ActionMenuFactory | undefined`
- `createHierarchyFactory(): ActionMenuFactory`
- `createCelestialFactory(): ActionMenuFactory`
- `createToolbarFactory(): ActionMenuFactory`
- `createMenuForTarget(menuId: string, parentElement: HTMLElement, config?: ActionMenuConfig): ActionMenuComponent`
- `disposeMenuForTarget(menuId: string): void`
- `getMenu(menuId: string): ActionMenuComponent | undefined`
- `updateMenuConfig(menuId: string, config: Partial<ActionMenuConfig>): void`
- `setMenuActions(menuId: string, actions: ActionMenuItem[]): void`
- `addMenuAction(menuId: string, action: ActionMenuItem): void`
- `removeMenuAction(menuId: string, actionId: string): void`
- `setActionActive(menuId: string, actionId: string, active: boolean): void`
- `setActionDisabled(menuId: string, actionId: string, disabled: boolean): void`
- `getActiveMenuIds(): string[]`
- `getActiveMenuCount(): number`
- `getFactoryIds(): string[]`
