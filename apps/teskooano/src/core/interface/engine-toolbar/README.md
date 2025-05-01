# Core Engine Toolbar Plugin (`EngineToolbarManager`)

This plugin provides the `EngineToolbarManager` service, which is responsible for managing toolbar UI elements that overlay the main 3D engine view.

## Features

- Provides a central manager (`EngineToolbarManager`) for registering and controlling overlay toolbars.
- Allows other plugins or application code to add/remove toolbars and toolbar items dynamically.

## Registered Components

- **`EngineToolbarManager`**: A non-UI manager class (service) accessible via `pluginManager.getManager('engine-toolbar-manager')`.

## Usage

Typically, you don't interact with this plugin directly. Instead, you obtain the `EngineToolbarManager` instance and use its methods to manipulate the overlay UI.

```typescript
import { pluginManager } from "@teskooano/core"; // Adjust path

// Get the manager instance
const toolbarManager = pluginManager.getManager("engine-toolbar-manager");

// Example: Register a new toolbar section (details depend on manager implementation)
toolbarManager.registerToolbarSection("my-section", {
  // Configuration options...
});

// Example: Add an item to a toolbar section
toolbarManager.addToolbarItem("my-section", {
  id: "my-button",
  type: "button",
  // Other button properties...
});
```

Refer to the `EngineToolbarManager.ts` source for detailed API methods.
