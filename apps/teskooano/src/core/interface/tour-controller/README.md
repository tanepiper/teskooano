# Core Tour Controller Plugin

This plugin provides an interactive tour feature for the Teskooano application, guiding users through key interface elements using `driver.js`.

## Architecture

The `TourController` follows a lazy-initialized singleton pattern. It is not created automatically. Instead, the plugin exposes a `tour:initialize` function which acts as a factory.

1.  The main application **must** call `pluginManager.execute('tour:initialize')` during the startup sequence.
2.  On the first call, this function creates the singleton instance of the `TourController`, passing the application's `PluginExecutionContext` directly to its constructor.
3.  The controller is now fully initialized with all its dependencies (like the `DockviewController` for showing modals).
4.  The `initialize` function will then automatically prompt the user to start the tour if they haven't seen it before.
5.  All other functions provided by this plugin (`tour:start`, `tour:restart`, etc.) rely on this initialized instance.

This pattern ensures the controller has its dependencies injected correctly and remains a consistent, managed singleton.

## Features

- Uses `driver.js` to highlight elements and display descriptions.
- Provides functions to start, restart, and configure skipping the tour.
- Adds a "Restart Tour" button to the main toolbar.

## Registered Functions

- **`tour:initialize`**: Creates and initializes the `TourController` singleton instance. **This must be called once during app startup.**
- `tour:start`: Initiates the tour sequence.
- `tour:restart`: Resets and restarts the tour from the beginning.
- `tour:setSkip`: Configures whether the tour should be skipped on subsequent visits (expects `{ skip: boolean }` argument).

## Toolbar Items

- **Restart Tour**: A button (ID: `core-tour-restart-button`) added to the `main-toolbar` that triggers the `tour:restart` function.

## Usage

### Primary Usage: Initialization

The `tour:initialize` function must be called from your main application bootstrap logic.

```typescript
// In main application startup logic
import { pluginManager } from "@teskooano/ui-plugin";

async function startApp() {
  // ... after plugins are loaded and pluginManager has its dependencies ...
  try {
    await pluginManager.execute("tour:initialize");
  } catch (error) {
    console.error("Failed to initialize the tour controller:", error);
  }
  // ... continue app startup
}
```

### Manual Control

After initialization, you can still manually control the tour.

```typescript
import { pluginManager } from "@teskooano/ui-plugin";

// Restart the tour
pluginManager.execute("tour:restart");
```
