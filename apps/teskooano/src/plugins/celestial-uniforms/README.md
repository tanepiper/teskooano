# Celestial Info Plugin (`@teskooano/celestial-info`)

Provides a standard UI panel (`CelestialInfo`) for displaying detailed information about the currently focused celestial object within an engine view panel (like `CompositeEnginePanel`).

## Purpose

To show context-specific details (physical properties, orbital parameters, etc.) about the object the user is currently focused on.

## Features

- **UI Panel:** Defines the `CelestialInfo` panel, which dynamically renders information based on the type and properties of the focused object.
- **Toolbar Integration:** Registers a button on the `engine-toolbar` to open the info panel.
- **State Interaction:**
  - Subscribes to the parent engine panel's view state (`CompositeEnginePanel.subscribeToViewState`) to detect changes in the `focusedObjectId`.
  - Subscribes to the global `celestialObjectsStore` to retrieve the full data for the focused object.
  - Updates its display dynamically when the focus changes or the object data updates.
- **Type-Specific Views:** Uses different sub-components (`StarInfo`, `PlanetInfo`, `MoonInfo`, etc.) to render appropriate details for various celestial types.

## Usage

1.  **Registration:** The plugin is automatically registered when loaded via `loadAndRegisterPlugins` if `teskooano-celestial-info` is included in the `pluginConfig`.
2.  **Toolbar Button:** An info icon will appear on toolbars associated with engine panels (specifically those targeted by `engine-toolbar`). Clicking this button opens the `CelestialInfo` panel, typically as a floating panel.
3.  **Panel Functionality:** The panel automatically listens for focus changes in its parent engine panel. When an object is focused, it displays the relevant information.

## Implementation Details

- The `CelestialInfo` panel acts as a container and router, deciding which specific info component (`StarInfo`, `PlanetInfo`, etc.) to render based on the focused object's type.
- It relies on being rendered within a Dockview context where it can access its parent panel's API (specifically `subscribeToViewState`).
- The component name (`celestial-info`) and toolbar button configuration are defined within `index.ts`.

## Dependencies

- `@teskooano/ui-plugin`: For plugin registration.
- `@teskooano/core-state`: For accessing `celestialObjectsStore`.
- Relies on the API provided by its parent panel (typically `CompositeEnginePanel`) for state interaction (focus changes).
- `@teskooano/data-types`: For celestial object types and interfaces.
- `@fluentui/svg-icons`: For the toolbar icon.
