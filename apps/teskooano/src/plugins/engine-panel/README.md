# Engine Panel Plugin (`@teskooano/engine-panel`)

This is a composite plugin that bundles the core engine view panels and related system control functionality.

## Purpose

To provide the main 3D rendering view (`CompositeEnginePanel`), a progress indicator panel (`ProgressPanel`), and register associated functions and toolbar elements for managing the simulation and system data.

## Features

- **Engine View Panel:** Registers `CompositeEnginePanel` (`composite_engine_view`) which displays the 3D simulation.
- **Progress Panel:** Registers `ProgressPanel` (`progress_view`) used for displaying progress during texture generation.
- **System Functions:** Registers several functions (used by other components like `SystemControls`) for:
  - Adding new engine views (`engine:add_composite_panel`)
  - Generating random systems (`system:generate_random`)
  - Clearing the current system (`system:clear`)
  - Exporting system data (`system:export`)
  - Triggering the import dialog (`system:import_dialog`)
  - Creating a blank system (`system:create_blank`)
  - Copying the current seed (`system:copy_seed`)
- **Toolbar Widgets/Buttons:** Registers:
  - The simulation controls widget (`teskooano-simulation-controls`) onto the `main-toolbar`.
  - The system controls widget (`teskooano-system-controls`) onto the `main-toolbar`.
  - The "Add View" button onto the `main-toolbar` (which likely triggers `engine:add_composite_panel`).

## Usage

1.  **Registration:** The plugin is automatically registered when loaded via `loadAndRegisterPlugins` if `teskooano-engine-panel` is included in the `pluginConfig`.
2.  **Functionality:**
    - The registered panels can be added via Dockview API using their component names.
    - The registered functions can be called via `getFunctionConfig(id).execute()`.
    - The toolbar widgets and buttons appear automatically on the `main-toolbar`.

## Implementation Details

- This plugin primarily acts as an aggregator, importing and registering components, functions, and toolbar items defined in sub-directories.
- Panel, function, and toolbar configurations are defined within `index.ts`.

## Dependencies

- `@teskooano/ui-plugin`: For plugin registration.
- `@teskooano/core-state`: Relied upon by panels/functions within.
- `@teskooano/renderer-threejs`: Used by `CompositeEnginePanel`.
- Other plugins providing components like `teskooano-simulation-controls` and `teskooano-system-controls`.
