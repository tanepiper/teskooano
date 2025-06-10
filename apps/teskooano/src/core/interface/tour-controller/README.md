# Core Tour Controller Plugin

This plugin provides a flexible, extensible tour feature for the Teskooano application, guiding users through key interface elements using `driver.js`.

## Architecture

The `TourController` follows a lazy-initialized singleton pattern and acts as a registry for various tours.

1.  **Initialization**: The plugin exposes a `tour:initialize` function. The main application **must** call this function once during startup.
2.  **Singleton Creation**: On the first call, `tour:initialize` creates the singleton instance of `TourController`, passing the `PluginExecutionContext` to its constructor.
3.  **Tour Registration**: Immediately after creation, the `initialize` function registers the default `intro` tour by providing a `TourFactory` function (`createIntroTour`) to the controller's `registerTour` method. Other plugins could also register their own tours.
4.  **Prompting**: The `initialize` function then automatically prompts the user to start the tour if they haven't seen it before.
5.  **Extensibility**: The `TourController` can manage multiple distinct tours, each identified by a unique ID. Other plugins can add new tours by registering their own `TourFactory`.

This pattern ensures the controller has its dependencies injected correctly and provides a scalable system for adding new guided experiences.

## Features

- **Extensible**: Supports registration of multiple, distinct tours.
- **Context-Driven**: Tour factories receive the `PluginExecutionContext`, allowing tour steps to safely interact with application state and functions (e.g., `pluginManager.execute(...)`).
- **Dynamic Content**: Tour steps can be updated dynamically based on application state (e.g., the currently selected celestial object).
- **Toolbar Integration**: Adds a "Restart Tour" button to the main toolbar.

## Registered Functions

- **`tour:initialize`**: Creates and initializes the `TourController` singleton and registers the default "intro" tour. **Must be called once during app startup.**
- `tour:start(tourId: string = 'intro')`: Initiates a tour sequence by its ID.
- `tour:restart(tourId?: string)`: Restarts the specified tour, or the last active tour, from the beginning.
- `tour:setSkip`: Configures whether the tour should be skipped on subsequent visits.

## Toolbar Items

- **Restart Tour**: A button on the `main-toolbar` that triggers the `tour:restart` function (for the default tour).

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

After initialization, you can manually start or restart any registered tour.

```typescript
import { pluginManager } from "@teskooano/ui-plugin";

// Restart the default intro tour
pluginManager.execute("tour:restart");

// Start a different, custom tour that was registered by another plugin
pluginManager.execute("tour:start", { tourId: "custom-feature-tour" });
```
