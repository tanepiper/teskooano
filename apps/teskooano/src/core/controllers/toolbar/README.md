# Toolbar Plugin (@teskooano/toolbar)

Provides the main application toolbar functionality, dynamically populated based on registered components and configurations.

## Purpose

To create and manage a configurable toolbar interface within the Teskooano application, allowing users to access tools and actions.

## Features

- Renders a main toolbar element.
- Dynamically adds buttons and other UI elements based on plugin configurations (e.g., `PanelToolbarItemConfig`).
- Handles user interactions with toolbar items, dispatching actions or events.
- Its logic is separated into a main controller class (`ToolbarController.ts`), a utility file for element creation (`ToolbarController.utils.ts`), and an HTML template with encapsulated styles (`ToolbarController.template.ts`).

## Usage

Import the plugin and initialize it with the target element and necessary configurations.

```typescript
import { toolbarPlugin } from "./index";

// During app initialization
const toolbarApi = toolbarPlugin.initialize({
  targetElement: document.getElementById("toolbar-container"),
  // other options...
});

// Use toolbarApi.controller, etc.
```

# Toolbar Controller

This directory contains the `ToolbarController`, which is responsible for building and managing the main application toolbar.

## Architecture

The `ToolbarController` is a lean orchestrator with a highly dynamic and extensible design.

- **Plugin-Driven Content**: The toolbar does not have hardcoded buttons or widgets. Instead, on initialization, it queries the `@teskooano/ui-plugin` manager for all registered `ToolbarItemConfig` and `ToolbarWidgetConfig` configurations that target the ID `"main-toolbar"`. This allows any other plugin in the application to add functionality to the main toolbar simply by providing a configuration object.

- **Utility Functions**: Complex logic, such as the creation of `teskooano-button` elements from a configuration, is handled in a separate `ToolbarController.utils.ts` file. This keeps the main controller class focused on high-level orchestration.

- **Reactive Layout**: The controller uses `RxJS` to monitor window resize events and automatically toggles a `mobile` attribute on designated buttons, allowing the UI to adapt to smaller screen sizes without a full re-render.

## Usage

The `ToolbarController` is initialized by the central application bootstrap process, which executes the `toolbar:initialize` function exported by this plugin.

### Adding Items to the Toolbar

To add an item (a button or a widget) to the toolbar from another plugin, you must provide a `ToolbarRegistration` object in that plugin's definition.

#### Example: Adding a Function Button

```typescript
// In another plugin's index.ts file

const myToolbarRegistration: ToolbarRegistration = {
  target: "main-toolbar", // This is the crucial ID
  items: [
    {
      id: "my-plugin-action-button",
      type: "function",
      title: "Perform Action",
      iconSvg: "<svg>...</svg>",
      functionId: "my-plugin:do-something", // The ID of a registered function
      order: 100,
    },
  ],
};

export const plugin: TeskooanoPlugin = {
  id: "my-plugin",
  // ... other properties
  functions: [
    {
      id: "my-plugin:do-something",
      execute: async () => console.log("Action performed!"),
    },
  ],
  toolbarRegistrations: [myToolbarRegistration],
};
```

This configuration will cause the `ToolbarController` to automatically render a new button on the main toolbar that, when clicked, executes the `my-plugin:do-something` function.
