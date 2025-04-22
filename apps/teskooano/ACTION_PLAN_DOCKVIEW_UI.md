# Action Plan: Improving Teskooano UI with Dockview Groups

This document outlines potential improvements to the Teskooano application UI by leveraging Dockview groups more effectively. Currently, panels are often added directly to the grid, leading to potential clutter.

## Proposed Improvements:

1.  **Tabbed Engine Views:**
    *   **Problem:** Adding multiple engine views creates separate panels, cluttering the layout.
    *   **Solution:** Create a main "Engine Views" group. Modify `ToolbarController` to add new `composite_engine_view` panels as tabs within this group using the `referenceGroup` option in `addPanel`. This consolidates engine views into one tabbed area.

2.  **Dedicated Controls/Info Group:**
    *   **Problem:** Settings, celestial info, and other utility panels occupy separate grid cells.
    *   **Solution:** Create a dedicated "Controls" or "Info" group (e.g., positioned as a sidebar). Modify the relevant controllers or initialization logic to add panels like `SettingsPanel`, `CelestialInfoPanel`, `FocusControl`, etc., as tabs within this group using `referenceGroup`.

3.  **Contextual Panel Placement:**
    *   **Problem:** Temporary panels like `ProgressPanel` might appear in arbitrary locations.
    *   **Solution:** Define the logical placement for such panels. Determine if they belong as tabs in the "Engine Views" group, the "Controls/Info" group, or elsewhere. Update the code that adds these panels to specify the correct `referenceGroup`.

4.  **Preset Layouts with `fromJSON`:**
    *   **Problem:** The initial application layout might be empty or inconsistent.
    *   **Solution:** Define a default starting `SerializedDockview` layout in JSON format, specifying the initial groups ("Engine Views", "Controls"), their positions, and sizes. Load this layout on startup using `dockviewController.api.fromJSON()` for a consistent user experience. Consider offering multiple layout presets.

5.  **Maximize Engine View:**
    *   **Problem:** Control panels can distract from the main simulation view.
    *   **Solution:** Implement a mechanism (e.g., a button) to call `dockviewController.api.maximizeGroup(engineGroup)` on the main engine view group. Provide a corresponding way to call `exitMaximizedGroup()` to restore the layout.

6.  **Floating Palettes (Optional):**
    *   **Problem:** Infrequently used tools might not need permanent screen space.
    *   **Solution:** Consider using `dockviewController.api.addFloatingGroup()` for utility panels (like debug info) instead of adding them to the main grid. This creates detachable, floating palettes.

## Recommended Next Steps:

Focus on implementing **Tabbed Engine Views (1)** and a **Dedicated Controls/Info Group (2)** first, as these offer the most significant organizational benefits to the core UI. 