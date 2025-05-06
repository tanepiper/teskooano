# Changelog - @teskooano/teskooano

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0] - 2025-05-01

### Added

- New core UI components: `Button`, `Card`, `Modal`, `OutputDisplay`, `Select`, `Slider`, `Tooltip`.
- New `ModalManager` for handling application modals.
- New `EngineToolbar` and `EngineToolbarManager` for contextual actions within engine panels.
- New `TourController` and `TourModal` for guided application tours (initial intro tour added).
- New `CameraManager` plugin for managing camera state and transitions.
- New `CelestialInfo` plugin with detailed displays for various celestial body types.
- New `EngineInfo` plugin for displaying renderer/simulation info.
- New `EngineSettings` plugin.
- New `ExternalLinks` plugin.
- Refined `FocusControl` plugin with improved list management and interactions.
- Enhanced `SettingsPanel` plugin.

### Changed

- Refactored `DockviewController` with `GroupManager` and `OverlayManager` for better layout control.
- Refactored `ToolbarController` with dedicated handler and template files.
- Updated `UiPanel` and associated controls (placeholder, celestial info, engine info).
- Updated `EnginePanel` plugin structure, separating simulation/system controls.
- Updated `CompositeEnginePanel` and `ProgressPanel` within engine panel plugin.
- Major refactor of core application structure, moving components and controllers into `core/` subdirectory.
- Integrated `@teskooano/ui-plugin` for plugin management.
- Updated dependencies.

### Removed

- Removed old component/controller locations now in `core/`.
- Removed redundant placeholder components.

### Fixed

- Various fixes related to component integration and state management after refactoring.

## [0.1.0] - 2025-04-24

### Added

- **Initial Release**
- Main application entry point (`main.ts`).
- Dockview-based UI layout management (`controllers/dockviewController.ts`).
  - Support for multiple tabbed engine views.
  - Support for dedicated controls/info group.
  - Factory for creating Dockview components (`EnginePanel`, `UiPanel`, `SettingsPanel`, `ProgressPanel`).
  - State integration for active panel (`core-state/activePanelApi`).
  - Ability to maximize/restore view groups.
- Toolbar controller (`controllers/toolbarController.ts`) with:
  - Button to add new engine/UI panel pairs.
  - Button to toggle floating settings panel.
  - Simulation controls component (`components/toolbar/SimulationControls`).
  - Seed form component (`components/toolbar/SeedForm`).
- Core UI Components:
  - `EnginePanel`: Displays a 3D simulation instance.
  - `UiPanel`: Hosts controls associated with an `EnginePanel`.
  - `SettingsPanel`: Floating panel for global settings.
  - `ProgressPanel`: Displays progress/status.
- Specific UI Control Components (`components/ui-controls/`):
  - `FocusControl`
  - `RendererInfoDisplay`
  - `CelestialInfo`
- Shared Components (`components/shared/`): e.g., `TeskooanoButton`.
- Integration with core packages: `@teskooano/app-simulation`, `@teskooano/core-state`, `@teskooano/renderer-threejs`, `@teskooano/procedural-generation`.
- Basic Vite build setup (`vite.config.ts`).
