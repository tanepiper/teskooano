# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added

- **`CameraManager`**: High-level camera management class that provides:
  - Object focusing with smooth transitions
  - Camera positioning and targeting
  - Field of View (FOV) management
  - Observable camera state via core-state integration
  - Per-panel camera instance support
  - Integration with the simulation system
  - Event-driven state updates
- **Camera Constants**: Default camera position, target, FOV, and offset constants
- **Interface-Based Design**: Uses `ICameraRenderer` interface to avoid circular dependencies
- **Simulation Integration**: Pauses simulation during camera transitions
- **Event Handling**: Listens for camera transition completion and user manipulation events

### Changed

- **BREAKING**: `CameraManager` now requires `panelId` in `setDependencies` options
- **BREAKING**: State management delegated to `@teskooano/core-state` `CameraStore`
- **BREAKING**: `CameraManagerState` properties renamed for consistency:
  - `currentPosition` → `position`
  - `currentTarget` → `target`
  - Added `selectedObject` property
- **BREAKING**: `getCameraState$()` now returns `Observable<CameraState>` instead of `BehaviorSubject`
- Removed direct dependency on `@teskooano/renderer-threejs` to eliminate circular dependencies

### Architecture

- **Separation of Concerns**: Camera logic separated from controls logic
- **Interface Abstraction**: `ICameraRenderer` interface defined in `@teskooano/data-types`
- **Centralized State**: Uses `@teskooano/core-state` `CameraStore` for state management
- **Per-Panel Support**: Each engine panel can have its own camera state instance
- **Dependency Injection**: Flexible renderer integration through interface
- **Type Consistency**: Unified `CameraState` interface across all packages
