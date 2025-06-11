# Engine Settings Plugin (`@teskooano/engine-settings`)

Provides a standard UI panel (`EngineUISettingsPanel`) for controlling common settings within an engine view panel (like `CompositeEnginePanel`).

## Purpose

To offer a consistent interface for users to toggle visual elements and other options related to the 3D rendering and simulation display.

## Features

- **UI Panel:** Defines the `EngineUISettingsPanel` which renders controls for engine settings.
- **Toolbar Integration:** Registers a button on the `engine-toolbar` to open the settings panel.
- **State Interaction:** The controller interacts with the parent engine panel to read and modify settings like:
  - Grid visibility
  - Celestial label visibility
  - AU marker visibility
  - Field of View (FOV)
  - Debug mode
  - Debris effects
  - Orbit lines

## Usage

1.  **Registration:** The plugin is automatically registered when loaded if `teskooano-engine-settings` is included in the `pluginConfig`.
2.  **Toolbar Button:** A settings icon will appear on toolbars associated with engine panels. Clicking this opens the `EngineUISettingsPanel`.
3.  **Panel Functionality:** The panel, once opened, links to its parent engine panel to control settings.

## Architecture (MVC)

This plugin follows the project's standard Model-View-Controller pattern.

- **View (`view/EngineSettings.view.ts`):** This is a "dumb" custom element (`<engine-ui-settings-panel>`). Its responsibility is to create its Shadow DOM, query for all the interactive UI elements (toggles, sliders), and instantiate the `EngineSettingsController`. It passes the collection of elements to the controller.

- **Controller (`controller/EngineSettings.controller.ts`):** This class contains all the logic. It receives the UI elements from the view and is responsible for:
  - Adding and removing all event listeners.
  - Subscribing to the parent panel's state.
  - Updating the view's element states (e.g., checking a box, setting a slider value) when the parent's state changes.
  - Calling methods on the parent panel to update the application state when a user interacts with a control.

This structure ensures a clear separation of concerns, making the component easier to manage and debug.

## Dependencies

- `@teskooano/ui-plugin`: For plugin registration.
- Relies on the API provided by its parent panel (typically `CompositeEnginePanel`).
- Uses core UI components like `@teskooano/slider`.
- `@fluentui/svg-icons`: For the toolbar icon.
