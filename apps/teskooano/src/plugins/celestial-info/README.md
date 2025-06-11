# Celestial Info Plugin (`@teskooano/celestial-info`)

Provides a standard UI panel for displaying detailed, context-sensitive information about the currently focused celestial object.

## Architecture

This plugin follows the standard Model-View-Controller (MVC) pattern established in the project. This separates concerns, improves testability, and makes the system more maintainable.

- **View (`view/CelestialInfo.view.ts`):** A lightweight custom element (`<celestial-info>`) responsible only for creating its shadow DOM and instantiating its controller. It delegates all lifecycle methods and logic.

- **Controller (`controller/CelestialInfo.controller.ts`):** The core logic hub. It subscribes to global state (`celestialObjects$`) and listens for global UI events (`renderer-focus-changed`). It owns the `CelestialInfoViewManager` and passes it the necessary data when the selection changes.

- **View Manager (`controller/CelestialInfoViewManager.ts`):** A specialized class that handles the "routing" of views. It maintains a map of `CelestialType` to the appropriate component class (e.g., `StarInfoComponent`). It lazily instantiates these components on demand, caches them, and manages their visibility within the main view's container.

- **Body Components (`bodies/*.ts`):** A collection of "dumb" view components (e.g., `StarInfoComponent`, `PlanetInfoComponent`), each responsible for rendering the specific details of one type of celestial object.

### Body Component Refactoring (DRY)

To avoid code duplication, the body components have been refactored to follow the Don't Repeat Yourself (DRY) principle.

- **Base Class (`bodies/common/BaseCelestialInfoComponent.ts`):** An abstract base class handles all the common boilerplate, such as creating the shadow DOM, applying base styles, and providing a standardized `updateData` method. All specific info components extend this class.

- **Render Helpers (`bodies/common/render-helpers.ts`):** A set of pure functions that generate HTML strings for common data sections (e.g., orbital parameters, physical properties). This centralizes the HTML generation logic and ensures consistency across all components.

This approach makes the individual components much leaner, cleaner, and easier to maintain.

## Features

- **Dynamic Panel Content:** The panel dynamically renders information based on the type and properties of the focused object.
- **Toolbar Integration:** Registers an "info" icon on the `engine-toolbar` to toggle the panel.
- **Reactive State:**
  - Listens for global `renderer-focus-changed` and `focus-request-initiated` events to detect selection changes.
  - Subscribes to the `celestialObjects$` store to get live updates for the focused object.
- **Lazy-Loaded Views:** The specific info components for each celestial type are only created the first time they are needed, improving initial load performance.

## Dependencies

- `@teskooano/ui-plugin`: For plugin and component registration.
- `@teskooano/core-state`: For accessing `celestialObjects$`.
- `@teskooano/data-types`: For celestial object types and interfaces.
- `@fluentui/svg-icons`: For the toolbar icon.
