# Teskooano Application (`apps/teskooano`)

## What is this?

This is the main frontend application for the Teskooano engine. It provides the user interface for interacting with the N-Body simulation, visualizing star systems, and controlling the simulation environment.

## Features

- **Multi-View Simulation:** Uses `dockview-core` to allow multiple, independent 3D views (`EnginePanel`) of the simulation.
- **Dockable UI Panels:** Provides associated UI control panels (`UiPanel`) for each simulation view, along with dedicated panels for settings, celestial info, etc.
- **Dynamic Layout:** Users can rearrange panels, and new simulation views can be added dynamically.
- **Toolbar Controls:** Offers main application controls via a top toolbar, including simulation start/stop, adding views, and accessing settings.
- **Component-Based:** Built using standard Web Components.
- **State Management:** Integrates with `@teskooano/core-state` via `RxJS` for shared application state.
- **Modular Integration:** Connects various backend packages for simulation logic (`@teskooano/app-simulation`), rendering (`@teskooano/renderer-threejs`), and data generation (`@teskooano/procedural-generation`).

## How to Run

1.  **Ensure Dependencies are Built:** Make sure all workspace packages (`../../packages/*`) have been built (e.g., via `moon run :build` from the repo root).
2.  **Install:** Navigate to the monorepo root and run `npm install` to link local packages.
3.  **Run Development Server:** From the `apps/teskooano` directory, run:
    ```bash
    npm run dev
    ```
4.  **Access:** Open the URL provided by Vite (usually `http://localhost:3000`).

## Architecture Overview

The application follows a Model-View-Controller pattern:

- **Models:** Primarily managed by imported packages like `@teskooano/core-state` (for UI state) and `@teskooano/app-simulation` (for simulation state).
- **Views:** Implemented as Web Components, categorized into:
  - `components/engine/`: Panels directly related to the 3D view (`EnginePanel`).
  - `components/ui-controls/`: Panels and smaller components for user interaction (`UiPanel`, `FocusControl`, `CelestialInfo`).
  - `components/toolbar/`: Components specific to the main toolbar.
  - `components/settings/`: Components for the settings panel.
  - `components/shared/`: Reusable base components.
- **Controllers:** Orchestrate the UI and application logic:
  - `controllers/dockviewController.ts`: Manages the `dockview-core` instance, panel creation, and layout.
  - `controllers/toolbarController.ts`: Manages the main toolbar and its actions.

For a more detailed breakdown, see [ARCHITECTURE.md](./ARCHITECTURE.md).

## Development

- **Build:** `npm run build`
- **Preview Production Build:** `npm run preview`
- **Testing:** `npm run test` (Vitest)
