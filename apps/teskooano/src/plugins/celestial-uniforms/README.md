# Celestial Uniforms Editor Plugin (`@teskooano/celestial-uniforms`)

Provides a developer-focused UI panel, `CelestialUniformsEditor`, for dynamically editing the shader uniforms and other physical properties of a selected celestial object in real-time.

## Purpose

To provide a direct, low-level interface for developers and designers to experiment with the visual and physical properties of celestial objects without needing to recompile or restart the application. This is a powerful tool for visual development and debugging.

## Architecture

This plugin follows the standard Model-View-Controller (MVC) pattern:

- **View (`CelestialUniforms.view.ts`):** A "dumb" custom element (`<celestial-uniforms-editor>`) that renders the DOM and delegates all logic to the controller.
- **Controller (`CelestialUniforms.controller.ts`):** A "smart" class that handles all business logic. It subscribes to focus events, generates the appropriate UI controls (sliders, color pickers) for the selected object, and dispatches state update actions when a value is changed.

For more details, see the `ARCHITECTURE.md` file in this directory.

## Features

- **Dynamic UI Generation:** The panel inspects the properties of the focused object and automatically generates the relevant input controls.
- **Real-time Updates:** Changes made in the editor are immediately dispatched as actions to the core state, causing the 3D renderer to update the object's appearance instantly.
- **Toolbar Integration:** Registers a button on the `engine-toolbar` to toggle the editor panel.

## Usage

1.  **Registration:** The plugin is automatically registered by the `PluginManager`.
2.  **Toolbar Button:** An icon will appear on toolbars with the `engine-toolbar` target. Clicking this button opens the `CelestialUniformsEditor` panel.
3.  **Panel Functionality:** The panel automatically listens for focus changes. When an object is focused (e.g., by clicking on it in the main view or the focus list), the panel will populate with controls for its editable properties.

## Dependencies

- `@teskooano/ui-plugin`: For plugin registration and types.
- `@teskooano/core-state`: For accessing the `celestialObjects$` stream and dispatching update actions.
- `@teskooano/data-types`: For celestial object types and interfaces.
- `dockview-core`: For panel integration.
- `rxjs`: For reactive event and state handling.
