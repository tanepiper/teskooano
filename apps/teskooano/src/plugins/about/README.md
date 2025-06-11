# Teskooano About Plugin (`@teskooano/about`)

This plugin provides an "About" panel accessible from the main application toolbar. It displays version information and credits for the application.

## Architecture

This plugin follows the standard Model-View-Controller (MVC) pattern established in the project:

- **View (`view/AboutPanel.view.ts`):** A lightweight custom element (`<teskooano-about-panel>`) that is responsible for rendering the panel's UI from its template.
- **Controller (`controller/AboutPanel.controller.ts`):** Handles the logic for the panel, such as retrieving environment variables (`PACKAGE_VERSION`, `GIT_COMMIT_HASH`) and updating the view.
- **Template (`view/AboutPanel.template.ts`):** Defines the static HTML and CSS for the panel.

## Features

- **UI Panel:** Registers the `teskooano-about-panel` as a Dockview panel.
- **Toolbar Integration:** Adds a "question mark" icon to the `main-toolbar` that toggles the visibility of the about panel.
- **Dynamic Content:** Displays the current application version and Git commit hash, read from Vite's environment variables.

## Dependencies

- `@teskooano/ui-plugin`: For core plugin registration functionality.
- `teskooano-card`: Relies on the `<teskooano-card>` component being registered by its plugin.
