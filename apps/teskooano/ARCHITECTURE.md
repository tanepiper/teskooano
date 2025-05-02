## Architecture Analysis (`apps/teskooano`)

**Purpose**: This is the main frontend application for the Teskooano N-Body Simulation. It orchestrates the user interface, manages different views of the simulation using `dockview-core`, integrates core engine packages, and provides user controls.

**Key Components:**

1.  **`main.ts`**: The application entry point.

    - Initializes core controllers (`DockviewController`, `ToolbarController`).
    - Sets up the initial `dockview` layout, typically creating an `EnginePanel` and its associated `UiPanel`.
    - Imports and ensures registration of necessary web components (e.g., `FocusControl`, `CelestialInfo`, custom buttons, panels like `SettingsPanel`, `ProgressPanel`).
    - Connects controllers (e.g., passes `DockviewController` to `ToolbarController`).

2.  **`controllers/dockviewController.ts`**: Manages the `dockview-core` instance.

    - Creates and configures the main `dockview` layout manager attached to the `#app` element.
    - Provides a `createComponent` factory function for `dockview` that maps panel names (e.g., `'engine_view'`, `'ui_view'`, `'settings_view'`) to corresponding component classes (`EnginePanel`, `UiPanel`, `SettingsPanel`, etc.). Uses a `Map` (`_registeredComponents`) to allow dynamic registration.
    - Listens for `dockview` events (e.g., `onDidActivePanelChange`) and updates the application state, specifically setting the `activePanelApi` store from `@teskooano/core-state` when an `EnginePanel` is focused.
    - Exposes the raw `dockview` API (`api`) for other parts of the application (like `ToolbarController`) to interact with.

3.  **`controllers/toolbarController.ts`**: Manages the top toolbar element (`#toolbar`).

    - Renders the toolbar content, including application icon, buttons (`Add Teskooano`, `Settings`), simulation controls (`toolbar-teskooano-simulation-controls`), and potentially a seed form (`toolbar-seed-form`).
    - Handles button actions:
      - `Add Teskooano`: Calls `addEnginePanels` to create a new `EnginePanel` and its associated `UiPanel` within the `dockview` layout, managed via the `DockviewController`.
      - `Settings`: Calls `toggleSettingsPanel` to add or remove a floating `SettingsPanel` using the `DockviewController`.
    - Uses a counter (`_enginePanelCounter`) to generate unique IDs for new engine/UI panels.

4.  **`components/engine/EnginePanel.ts`**: A `dockview` panel component responsible for displaying a single instance of the 3D simulation.

    - Likely instantiates or interfaces with `@teskooano/renderer-threejs` and `@teskooano/app-simulation` (or parts thereof) to render the 3D scene within its DOM element.
    - May expose its own API or interact with `core-state` to allow control and data display by associated `UiPanel`s.
    - Manages its own Three.js scene, camera, and renderer lifecycle tied to the panel's lifecycle.

5.  **`components/engine/ProgressPanel.ts`**: A `dockview` panel component, likely used to display loading progress or background task status related to the simulation (e.g., procedural generation).

6.  **`components/ui-controls/UiPanel.ts`**: A `dockview` panel designed to host various UI controls related to a _specific_ `EnginePanel`.

    - Takes an `engineViewId` parameter during creation to associate itself with a target `EnginePanel`.
    - Renders distinct sections (defined in `main.ts` or by `ToolbarController`) containing specific web components (e.g., `<focus-control>`, `<celestial-info>`, `<renderer-info-display>`, `<engine-ui-settings-panel>`).
    - These inner components likely interact with the associated `EnginePanel`'s API or filtered data from `core-state`.

7.  **`components/ui-controls/` (Specific Controls)**: Contains individual web components used within the `UiPanel` or potentially elsewhere.

    - `FocusControl`: Allows users to select/focus on celestial objects.
    - `RendererInfoDisplay`: Shows debugging or performance information about the `renderer-threejs` instance.
    - `CelestialInfo`: Displays data about the currently selected celestial object.

8.  **`components/toolbar/`**: Contains web components specifically designed for use within the main application toolbar.

    - `SimulationControls`: Provides play/pause, speed controls for the simulation (likely interacting with `core-state`).
    - `SeedForm`: Allows users to input parameters to seed or reset the simulation state.

9.  **`components/settings/SettingsPanel.ts`**: A `dockview` panel component providing global application settings, displayed in a floating window toggled by the `ToolbarController`.

10. **`components/shared/`**: Contains reusable base components, like `<teskooano-button>`.

11. **`styles.css`**: Global application styles and potentially theme overrides for `dockview`.

**Key Characteristics & Design:**

- **Multi-View Architecture**: Leverages `dockview-core` to enable multiple independent views (`EnginePanel`) of the simulation data, each potentially with its own set of UI controls (`UiPanel`).
- **Controller Pattern**: Uses `DockviewController` and `ToolbarController` to encapsulate interactions with major UI libraries/sections and manage application flow.
- **Component-Based UI**: Builds the interface from distinct web components (both `dockview` panels and smaller controls).
- **State Integration**: Interacts with `@teskooano/core-state` (e.g., `activePanelApi`) to share state between panels and controllers.
- **Engine Abstraction**: The core simulation and rendering logic are largely delegated to imported packages (`@teskooano/app-simulation`, `@teskooano/renderer-threejs`), with `EnginePanel` acting as the integration point within this application's UI.
- **Dynamic Layout**: The layout is not fixed; users can rearrange panels (within `dockview` constraints), and the `ToolbarController` can dynamically add new engine views.

**Dependencies**: `dockview-core`, `RxJS`, `three`, `@teskooano/app-simulation`, `@teskooano/core-state`, `@teskooano/renderer-threejs`, `@teskooano/procedural-generation`.
