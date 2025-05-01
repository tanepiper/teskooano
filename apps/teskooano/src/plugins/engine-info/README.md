# Engine Info Plugin (`@teskooano/engine-info`)

Provides a standard UI panel (`RendererInfoDisplay`) for displaying real-time performance statistics of an engine view panel (like `CompositeEnginePanel`).

## Purpose

To give users visibility into the renderer's performance (FPS, draw calls, memory usage, etc.) for debugging or monitoring purposes.

## Features

- **UI Panel:** Defines the `RendererInfoDisplay` panel which shows formatted statistics.
- **Toolbar Integration:** Registers a button on the `engine-toolbar` to open the info panel.
- **State Interaction:**
  - Finds its parent engine panel.
  - Calls the parent panel's `getRendererStats()` method periodically to fetch the latest performance data.
  - Updates its display based on the received statistics.

## Usage

1.  **Registration:** The plugin is automatically registered when loaded via `loadAndRegisterPlugins` if `teskooano-engine-info` is included in the `pluginConfig`.
2.  **Toolbar Button:** A data usage icon will appear on toolbars associated with engine panels (specifically those targeted by `engine-toolbar`). Clicking this button opens the `RendererInfoDisplay` panel, typically as a floating panel.
3.  **Panel Functionality:** The panel automatically starts polling its parent engine panel for stats and displays them.

## Implementation Details

- The `RendererInfoDisplay` panel uses `setInterval` to periodically fetch stats.
- It relies on being rendered within a Dockview context where it can access its parent panel's API (specifically `getRendererStats`).
- The component name (`renderer-info-display`) and toolbar button configuration are defined within `index.ts`.

## Dependencies

- `@teskooano/ui-plugin`: For plugin registration.
- Relies on the API provided by its parent panel (typically `CompositeEnginePanel`, specifically `getRendererStats`).
- `@fluentui/svg-icons`: For the toolbar icon.
