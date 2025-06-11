# Engine Info Plugin (`@teskooano/engine-info`)

Provides a standard UI panel (`RendererInfoDisplay`) for displaying real-time performance statistics of an engine view panel (like `CompositeEnginePanel`).

## Purpose

To give users visibility into the renderer's performance (FPS, draw calls, memory usage, etc.) for debugging or monitoring purposes.

## Architecture

This plugin follows the standard Model-View-Controller (MVC) pattern:

- **View (`RendererInfoDisplay.view.ts`):** A "dumb" custom element (`<renderer-info-display>`) responsible only for rendering the UI from its template.
- **Controller (`RendererInfoDisplay.controller.ts`):** Handles all business logic, including:
  - Connecting to the parent `CompositeEnginePanel`.
  - Listening for the `renderer-ready` event.
  - Periodically fetching stats from the renderer's `animationLoop`.
  - Managing connection state and attempts.
  - Updating the view with new data.

## Features

- **UI Panel:** Defines the `RendererInfoDisplay` panel which shows formatted statistics.
- **Toolbar Integration:** Registers a button on the `engine-toolbar` to open the info panel.
- **State Interaction:**
  - Finds its parent engine panel via Dockview's `init` parameters.
  - Retrieves the `ModularSpaceRenderer` instance from the parent panel.
  - Calls the renderer's `animationLoop.getCurrentStats()` method periodically to fetch the latest performance data.
  - Updates its display based on the received statistics.

## Usage

1.  **Registration:** The plugin is automatically registered by the `PluginManager` when loaded.
2.  **Toolbar Button:** A data usage icon will appear on toolbars with the `engine-toolbar` target. Clicking this button opens the `RendererInfoDisplay` panel as a floating panel.
3.  **Panel Functionality:** The panel automatically attempts to connect to its parent engine panel to retrieve the renderer and begins polling for stats.

## Implementation Details

- The `RendererInfoDisplay` panel uses `setInterval` to periodically fetch stats.
- It relies on being rendered within a Dockview context where it can access its parent panel's API (specifically `getRendererStats`).
- The component name (`renderer-info-display`) and toolbar button configuration are defined within `index.ts`.

## Dependencies

- `@teskooano/ui-plugin`: For plugin registration.
- Relies on the API provided by its parent panel (typically `CompositeEnginePanel`, specifically the `getRenderer()` method).
- `@fluentui/svg-icons`: For the toolbar icon.
