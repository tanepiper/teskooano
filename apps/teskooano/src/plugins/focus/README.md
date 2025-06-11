# Focus Control Plugin (`@teskooano/focus-controls`)

Provides a standard UI panel (`FocusControl`) for listing celestial objects and allowing the user to select one to focus the camera on within an engine view panel (like `CompositeEnginePanel`).

## Purpose

To offer a discoverable list of objects within the simulated system and provide an easy way to navigate the camera to them.

## Features

- **UI Panel:** Defines the `FocusControl` panel which renders a searchable/scrollable list of celestial objects.
- **Toolbar Integration:** Registers a button on the `engine-toolbar` to open the focus control panel.
- **State Interaction:**
  - The controller subscribes to the global `celestialObjectsStore` to populate its list.
  - The controller subscribes to the parent engine panel's view state to highlight the currently focused object.
  - The controller calls the parent engine panel's `focusOnObject` method when a user selects an object in the list.
- **Filtering/Searching:** Includes functionality to filter the list of objects.
- **Customizable Rows:** Uses a `CelestialRowComponent` to render each item in the list.

## Usage

1.  **Registration:** The plugin is automatically registered when loaded via `loadAndRegisterPlugins` if `teskooano-focus-controls` is included in the `pluginConfig`.
2.  **Toolbar Button:** A target icon will appear on toolbars associated with engine panels (specifically those targeted by `engine-toolbar`). Clicking this button opens the `FocusControl` panel, typically as a floating panel.
3.  **Panel Functionality:** The panel lists objects from the current simulation. Clicking an object triggers the associated engine view to focus its camera on that object.

## Implementation Details (MVC Architecture)

The `focus-control` plugin follows the project's standard Model-View-Controller (MVC) architecture to ensure a clean separation of concerns.

- **View (`view/FocusControl.view.ts`):**

  - A "dumb" custom element (`<focus-control>`) that implements Dockview's `IContentRenderer`.
  - It is responsible only for creating its shadow DOM from an HTML template and querying for key element references (the list container, buttons).
  - On construction, it instantiates the `FocusControlController`.
  - It delegates all lifecycle methods (`connectedCallback`, `disconnectedCallback`, `init`) and user interactions to the controller.

- **Controller (`controller/FocusControl.controller.ts`):**

  - This class contains all the business logic for the feature.
  - It receives element references from the View in its constructor.
  - It manages all state, including subscriptions to RxJS stores (`celestialObjects$`, `cameraState$`).
  - It handles all events, from global state changes to user interactions within the view (like button clicks or custom events from child components).
  - It directly manipulates the view's DOM elements to update the list, highlight items, and respond to user actions.
  - It communicates with the parent `CompositeEnginePanel` to control the camera.

- **Component (`components/celestial-row/`):**
  - **`CelestialRow.component.ts`**: A reusable custom element (`<celestial-row>`) that displays a single celestial object in the list.
  - It receives object data via attributes (`object-id`, `object-name`, etc.).
  - It fires custom events (`focus-request`, `follow-request`) when its internal buttons are clicked, which are caught and handled by the `FocusControlController`.

This structure ensures that the view is simple and declarative, while all complex logic is encapsulated and managed within the dedicated controller, making the feature more robust and easier to maintain.

## Dependencies

- `@teskooano/ui-plugin`: For plugin registration.
- `@teskooano/core-state`: For accessing `celestialObjectsStore`.
- Relies on the API provided by its parent panel (typically `CompositeEnginePanel`) for state interaction and triggering focus.
- Uses the `<celestial-row>` component to render list items.
- `@fluentui/svg-icons`: For the toolbar icon.
