# External Links Plugin (`@teskooano/external-links`)

Provides a custom element (`ExternalLinksComponent`) containing buttons that link to external resources like GitHub, documentation, or social media.

## Purpose

To offer easy access to relevant external project links directly from the main application toolbar.

## Features

- **Custom Element:** Defines the `teskooano-external-links-component` which renders a set of predefined link buttons.
- **Toolbar Widget:** Registers this custom element as a widget to be placed directly into the `main-toolbar` widget area.

## Usage

1.  **Registration:** The plugin is automatically registered when loaded via `loadAndRegisterPlugins` if `teskooano-external-links` is included in the `pluginConfig`.
2.  **Toolbar Display:** The component containing the link buttons will appear in the widget area of the main application toolbar.

## Implementation Details

- The `ExternalLinksComponent` defines its own structure and styling (`external-links.css`).
- It uses core `@teskooano/button` components for the links.
- The custom element registration and toolbar widget configuration are defined within `index.ts`.

## Dependencies

- `@teskooano/ui-plugin`: For plugin registration.
- Uses core UI components (`@teskooano/button`).
- `@fluentui/svg-icons`: For link icons.
