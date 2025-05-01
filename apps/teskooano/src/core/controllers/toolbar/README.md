# Toolbar Plugin (@teskooano/toolbar)

Provides the main application toolbar functionality, dynamically populated based on registered components and configurations.

## Purpose

To create and manage a configurable toolbar interface within the Teskooano application, allowing users to access tools and actions.

## Features

- Renders a main toolbar element.
- Dynamically adds buttons and other UI elements based on plugin configurations (e.g., `PanelToolbarItemConfig`).
- Handles user interactions with toolbar items, dispatching actions or events.
- Uses separate files for the controller logic (`ToolbarController.ts`), HTML template (`ToolbarController.template.ts`), event handlers (`ToolbarController.handlers.ts`), and styles (`ToolbarController.css`).

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
