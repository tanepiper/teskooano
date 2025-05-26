# Focus Control Plugin (`@teskooano/focus-controls`)

Provides a standard UI panel (`FocusControl`) for listing celestial objects and allowing the user to select one to focus the camera on within an engine view panel (like `CompositeEnginePanel`).

## Purpose

To offer a discoverable list of objects within the simulated system and provide an easy way to navigate the camera to them.

## Features

- **UI Panel:** Defines the `FocusControl` panel which renders a searchable/scrollable list of celestial objects.
- **Toolbar Integration:** Registers a button on the `engine-toolbar` to open the focus control panel.
- **State Interaction:**
  - Subscribes to the global `celestialObjectsStore` to populate its list.
  - Subscribes to the parent engine panel's view state (`CompositeEnginePanel.subscribeToViewState`) to highlight the currently focused object.
  - Calls the parent engine panel's `focusOnObject` method when a user selects an object in the list.
- **Filtering/Searching:** Includes functionality to filter the list of objects.
- **Customizable Rows:** Uses a `CelestialRow` component to render each item in the list.
- **Smart Hierarchy Management:** Automatically updates hierarchy when parent stars are destroyed, using currentParentId or parentId for relationships.
- **Separated Object Lists:** 
  - Active objects displayed in a hierarchical tree structure
  - Destroyed objects shown in a separate chronological list with time since destruction
- **Visual Status Indicators:** Different visual states for active and destroyed/annihilated objects.
- **Root Star Reassignment:** When a root star is destroyed, automatically finds and focuses on the new root star.
- **Object Counters:** Shows count of active and destroyed objects in section headers.

## Usage

1.  **Registration:** The plugin is automatically registered when loaded via `loadAndRegisterPlugins` if `teskooano-focus-controls` is included in the `pluginConfig`.
2.  **Toolbar Button:** A target icon will appear on toolbars associated with engine panels (specifically those targeted by `engine-toolbar`). Clicking this button opens the `FocusControl` panel, typically as a floating panel.
3.  **Panel Functionality:** The panel lists objects from the current simulation. Clicking an object triggers the associated engine view to focus its camera on that object.

## Implementation Details

- The `FocusControl` panel manages its own internal state for filtering and list rendering.
- It relies on being rendered within a Dockview context where it can access its parent panel's API (especially `focusOnObject`).
- The component name (`focus-control`) and toolbar button configuration are defined within `index.ts`.

## Dependencies

- `@teskooano/ui-plugin`: For plugin registration.
- `@teskooano/core-state`: For accessing `celestialObjectsStore`.
- Relies on the API provided by its parent panel (typically `CompositeEnginePanel`) for state interaction and triggering focus.
- Uses core UI components (`@teskooano/button`, etc.) and potentially custom list elements.
- `@fluentui/svg-icons`: For the toolbar icon.
