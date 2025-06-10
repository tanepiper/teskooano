# Dockview Plugin (`teskooano-dockview`)

This plugin provides the core integration for the Dockview library, which is responsible for the entire panel-based layout of the Teskooano application.

## Purpose

This plugin's primary role is to provide an initialization function that creates and returns a singleton instance of the `DockviewController`. This controller then serves as the central API for all other parts of the application to interact with the UI layout.

## Features

- **Initialization Function**: Exports a `dockview:initialize` function that sets up the Dockview instance within a given DOM element.
- **Core Controllers**: Internally uses `DockviewController`, `GroupManager`, and `OverlayManager` to provide a clean and powerful layout management API.
- **Component Registration**: The `DockviewController` allows other plugins to register panel components.
- **Fallback Panel**: Includes a default `fallback-panel` to gracefully handle rendering errors.

## Usage

This plugin is foundational and is loaded by the main application bootstrap process. Other plugins typically interact with the `DockviewController` instance that this plugin creates, rather than interacting with this plugin directly.

The initialization is handled by the `pluginManager`:

```typescript
import { pluginManager } from "@teskooano/ui-plugin";
import type { DockviewController } from "@teskooano/core"; // Assuming core barrel file

// In application setup code:
const appElement = document.getElementById("root");

// The plugin manager executes the initialize function
const { controller, api } = await pluginManager.execute("dockview:initialize", {
  appElement,
});

// The 'controller' (DockviewController instance) can now be used
// or injected into other services.
```
