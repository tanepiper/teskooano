# Settings Plugin (`@teskooano/settings`)

Provides the main application settings panel (`SettingsPanel`), typically accessed via a button on the main toolbar.

## Purpose

To offer a centralized place for users to configure application-wide settings, such as theme, performance options, or other global preferences (currently focused on theme and potentially clearing cache).

## Features

- **UI Panel:** Defines the `SettingsPanel` which renders various settings controls.
- **Toolbar Integration:** Registers a button on the `main-toolbar` (application-level toolbar) to open the settings panel.
- **Settings Storage:** Interacts with `localStorage` to persist theme settings.
- **Theme Switching:** Allows users to switch between light and dark themes, applying changes to the `document.body`.

## Usage

1.  **Registration:** The plugin is automatically registered when loaded via `loadAndRegisterPlugins` if `teskooano-settings` is included in the `pluginConfig`.
2.  **Toolbar Button:** A settings icon will appear on the main application toolbar. Clicking this button opens the `SettingsPanel`.
3.  **Panel Functionality:** Users can interact with the controls within the panel to change application settings.

## Implementation Details

- The `SettingsPanel` uses standard UI components.
- It directly manipulates `document.body.classList` and `localStorage` for theme management.
- The component name (`settings-panel`) and toolbar button configuration are defined within `index.ts`.

## Dependencies

- `@teskooano/ui-plugin`: For plugin registration.
- Uses core UI components (`@teskooano/button`, etc.).
- `@fluentui/svg-icons`: For the toolbar icon.
