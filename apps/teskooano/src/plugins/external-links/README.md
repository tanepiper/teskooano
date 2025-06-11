# External Links Plugin (`@teskooano/external-links`)

Provides a custom element (`teskooano-external-links-component`) containing icon buttons that link to predefined external project resources.

## Purpose

To offer easy access to relevant external project links (like code repositories or social media) directly from a designated UI area, typically the main application toolbar.

## Features

- **Custom Element:** Defines `teskooano-external-links-component` which renders a set of link buttons.
- **Toolbar Widget Integration:** Registers the component as a widget (`main-toolbar-external-links`) intended for placement in the `main-toolbar`.
- **Predefined Links:** The list of links is defined in a dedicated data file.
- **Tooltip Integration:** Each button includes attributes (`tooltip-text`, `tooltip-title`, `tooltip-icon-svg`) to allow a tooltip system to display relevant information on hover.

## Usage

1.  **Plugin Registration:** Ensure this plugin (`teskooano-external-links`) is included in the application's `pluginConfig` and loaded via the plugin manager.
2.  **Toolbar Display:** Once registered, the `main-toolbar-external-links` widget configuration directs the UI Plugin system to instantiate the `teskooano-external-links-component` within the element designated as the `main-toolbar`.

## Architecture (MVC)

This plugin follows the project's standard Model-View-Controller pattern.

- **Model (`data/links.ts`):** The data is separated into a dedicated file that exports the array of `ExternalLink` objects. This cleanly separates the link data from the application logic.

- **View (`view/ExternalLinks.view.ts`):** This is a "dumb" custom element (`<teskooano-external-links-component>`). Its only job is to create its Shadow DOM from the template and instantiate the `ExternalLinksController`. It passes the DOM container element to the controller.

- **Controller (`controller/ExternalLinks.controller.ts`):** This class contains all the logic. It imports the link data from the model, iterates through it, and handles the entire process of creating, configuring, and appending the `teskooano-button` elements into the container provided by the View.

This structure ensures a clear separation of concerns, making the component easy to understand and maintain.

## Dependencies

- **`@teskooano/ui-plugin`:** For the plugin registration mechanism.
- **`teskooano-button` (Core Component):** Used to render the links.
- **Tooltip System (Implicit):** Relies on an external mechanism to interpret the `tooltip-*` attributes.
