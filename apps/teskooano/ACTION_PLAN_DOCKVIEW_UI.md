# Action Plan: Improving Teskooano UI with Dockview Groups

This document outlines potential improvements to the Teskooano application UI by leveraging Dockview groups more effectively. Currently, panels are often added directly to the grid, leading to potential clutter.

## Proposed Improvements:

1.  **Tabbed Engine Views:** ![Status](https://img.shields.io/badge/Status-Completed-brightgreen)

    - **Problem:** Adding multiple engine views creates separate panels, cluttering the layout.
    - **Solution:** Create a main "Engine Views" group. Modify `ToolbarController` to add new `composite_engine_view` panels as tabs within this group using the `referenceGroup` option in `addPanel`. This consolidates engine views into one tabbed area.
    - **Implementation Notes:** Done. `ToolbarController` now manages an engine group (`_engineGroupId`), creates it on demand using `api.addGroup()`, and adds all engine panels to it using `position: { referenceGroup: ... }`.

2.  **Dedicated Controls/Info Group:** ![Status](https://img.shields.io/badge/Status-Completed-brightgreen)

    - **Problem:** Settings, celestial info, and other utility panels occupy separate grid cells.
    - **Solution:** Create a dedicated "Controls" or "Info" group (e.g., positioned as a sidebar). Modify the relevant controllers or initialization logic to add panels like `SettingsPanel`, `CelestialInfoPanel`, `FocusControl`, etc., as tabs within this group.
    - **Implementation Notes:** Done. Enhanced `DockviewController` with new methods for creating and managing named groups, and for easily adding panels to these groups. Controllers can now use `dockviewController.addPanelToNamedGroup()` to add panels to logical groups.

3.  **Contextual Panel Placement:** ![Status](https://img.shields.io/badge/Status-Completed-brightgreen)

    - **Problem:** Temporary panels like `ProgressPanel` might appear in arbitrary locations.
    - **Solution:** Define the logical placement for such panels. Determine if they belong as tabs in the "Engine Views" group, the "Controls/Info" group, or elsewhere. Update the code that adds these panels to specify the correct `referenceGroup`.
    - **Implementation Notes:** Done. Controllers can now use `dockviewController.addPanelToNamedGroup("controls", panelOptions)` to add panels to logical groups like "controls" or "engine_views".

4.  **Preset Layouts with `fromJSON`:** ![Status](https://img.shields.io/badge/Status-To%20Do-blue)

    - **Problem:** The initial application layout might be empty or inconsistent.
    - **Solution:** Define a default starting `SerializedDockview` layout in JSON format, specifying the initial groups ("Engine Views", "Controls"), their positions, and sizes. Load this layout on startup using `dockviewController.api.fromJSON()` for a consistent user experience. Consider offering multiple layout presets.

5.  **Maximize Engine View:** ![Status](https://img.shields.io/badge/Status-Completed-brightgreen)

    - **Problem:** Control panels can distract from the main simulation view.
    - **Solution:** Implement a mechanism (e.g., a button) to call `dockviewController.api.maximizeGroup(engineGroup)` on the main engine view group. Provide a corresponding way to call `exitMaximizedGroup()` to restore the layout.
    - **Implementation Notes:** Done. `DockviewController` now provides `maximizeGroupByName("engine_views")` and `exitMaximizedGroup()` methods for easily toggling maximized view state.

6.  **Floating Palettes (Optional):** ![Status](https://img.shields.io/badge/Status-To%20Do-blue)
    - **Problem:** Infrequently used tools might not need permanent screen space.
    - **Solution:** Consider using `dockviewController.api.addFloatingGroup()` for utility panels (like debug info) instead of adding them to the main grid. This creates detachable, floating palettes.
    - **Implementation Notes:** Modals were refactored to use Overlays instead of floating groups.

## Usage Examples for Enhanced DockviewController

### 1. Creating a Named Group and Adding Panels

```typescript
// In your controller class:
constructor(dockviewController: DockviewController) {
  this._dockviewController = dockviewController;

  // Create a controls group if needed
  this._controlsGroup = this._dockviewController.createOrGetGroup("controls");

  // Add a settings panel to this group
  this._dockviewController.addPanelToGroup(this._controlsGroup, {
    id: "settings_panel",
    component: "settings",
    title: "Settings"
  });

  // Or more simply, use the addPanelToNamedGroup method:
  this._dockviewController.addPanelToNamedGroup("controls", {
    id: "celestial_info_panel",
    component: "celestial_info",
    title: "Celestial Info"
  });
}
```

### 2. Maximizing a Group and Exiting Maximized View

```typescript
// Add button to toolbar that maximizes the engine views group
const maximizeButton = document.createElement("button");
maximizeButton.textContent = "Maximize View";
maximizeButton.addEventListener("click", () => {
  this._dockviewController.maximizeGroupByName("engine_views");
});
toolbar.appendChild(maximizeButton);

// Add button to exit maximized view
const restoreButton = document.createElement("button");
restoreButton.textContent = "Restore View";
restoreButton.addEventListener("click", () => {
  this._dockviewController.exitMaximizedGroup();
});
toolbar.appendChild(restoreButton);
```

## Recommended Next Steps:

Focus on implementing **Preset Layouts with `fromJSON` (4)** next to provide a consistent starting layout for users. This would complete all the critical UI organization improvements.
