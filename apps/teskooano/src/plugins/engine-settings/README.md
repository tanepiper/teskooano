# Engine Settings Plugin (`@teskooano/engine-settings`)

Provides a standard UI panel (`EngineUISettingsPanel`) for controlling common settings within an engine view panel (like `CompositeEnginePanel`).

## Purpose

To offer a consistent interface for users to toggle visual elements and other options related to the 3D rendering and simulation display. This plugin follows a Model-View-Controller (MVC) architecture.

## Architecture

- **View (`EngineSettings.view.ts`):** A "dumb" custom element (`engine-ui-settings-panel`) that is responsible only for rendering the UI from its template. It creates the controller and delegates all logic to it.
- **Controller (`EngineSettings.controller.ts`):** A dedicated `EngineSettingsController` class that encapsulates all business logic. It handles user interactions from the view's controls, subscribes to the parent engine panel's state, and updates the parent panel when a setting is changed.

## Features

- **UI Panel:** Defines the `EngineUISettingsPanel` which renders controls (toggles, sliders) for engine settings.
- **Toolbar Integration:** Registers a button on the `engine-toolbar` to open the settings panel.
- **State Interaction:** The controller interacts with the parent engine panel's view state (e.g., `CompositeEnginePanel.getViewState()`, `updateViewState()`) to read and modify settings like:
  - Grid visibility
  - Celestial label visibility
  - AU marker visibility
  - Field of View (FOV)
  - Debug mode
  - Debris effects (if implemented)
  - Orbit line visibility

## Usage

1.  **Registration:** The plugin is automatically registered when loaded via `loadAndRegisterPlugins` if `teskooano-engine-settings` is included in the `pluginConfig`.
2.  **Toolbar Button:** A settings icon will appear on toolbars associated with engine panels (specifically those targeted by `engine-toolbar`). Clicking this button opens the `EngineUISettingsPanel`.
3.  **Panel Functionality:** The panel, once opened, finds its parent engine panel and uses its API (`updateViewState`, `getViewState`, `subscribeToViewState`) to control settings.

## Implementation Details

- The `EngineUISettingsPanel` uses standard `@teskooano/button`, `@teskooano/slider`, etc., components for its UI.
- It relies on being rendered within a Dockview context where it can access its parent panel's API.
- The component name (`engine-settings-panel`) and toolbar button configuration are defined statically within `EngineUISettingsPanel.ts`.

## Dependencies

- `@teskooano/ui-plugin`: For plugin registration.
- Relies on the API provided by its parent panel (typically `CompositeEnginePanel`) for state interaction.
- Uses core UI components (`@teskooano/button`, etc.).
- `@fluentui/svg-icons`: For the toolbar icon.
