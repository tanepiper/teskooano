# Engine Panel Plugin (`@teskooano/engine-panel`)

This is a composite plugin that bundles all functionality related to the main 3D engine view. It acts as an aggregator for several more granular plugins.

## Architecture

The `engine-panel` plugin follows a modular, composite pattern. It doesn't contain much logic itself; instead, it imports and re-exports the capabilities of other, more focused plugins. This makes the system easier to maintain and extend.

### Core Sub-Plugins & Components

- **`engine-panel-views` (from `./panels`)**:

  - Registers the main `CompositeEnginePanel` (`teskooano-engine-view`). Each instance of this panel is a self-contained 3D view with its own renderer and view state, allowing for multiple independent viewpoints into the simulation. See the `panels/README.md` for a detailed architectural breakdown.

- **System Functions (from `./main-toolbar/system-controls`)**:

  - Registers several crucial functions for managing the simulation lifecycle. These are used by other components (like the `SystemControls` widget) to perform actions.
  - `view:addCompositeEnginePanel`: Adds a new, independent engine view panel.
  - `system:generate_random`, `system:create_blank`: Creates new celestial systems.
  - `system:clear`, `system:export`, `system:import_dialog`: Manages the current system's state.

- **Toolbar Widgets (from `./main-toolbar`)**:
  - Registers the primary toolbar components:
  - `teskooano-simulation-controls`: The play/pause, speed, and time display widget.
  - `teskooano-system-controls`: The widget for generating, loading, and saving systems.

## Usage

The entire suite of engine panel functionality is loaded by including the `teskooano-engine-panel` plugin in the main application's plugin registry. The `PluginManager` handles the registration of all the aggregated panels, functions, and widgets automatically.

## Dependencies

- `@teskooano/ui-plugin`: For plugin registration.
- `@teskooano/core-state`: Relied upon by panels/functions within.
- `@teskooano/renderer-threejs`: Used by `CompositeEnginePanel`.
- Other plugins providing components like `teskooano-simulation-controls` and `teskooano-system-controls`.
