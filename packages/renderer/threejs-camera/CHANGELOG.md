# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added

- **`CameraManager`**: High-level camera management class that provides:
  - Object focusing with smooth transitions
  - Camera positioning and targeting
  - Field of View (FOV) management
  - Observable camera state via BehaviorSubject
  - Integration with the simulation system
  - Event-driven state updates
- **Camera Constants**: Default camera position, target, FOV, and offset constants
- **Interface-Based Design**: Uses `ICameraRenderer` interface to avoid circular dependencies
- **Simulation Integration**: Pauses simulation during camera transitions
- **Event Handling**: Listens for camera transition completion and user manipulation events

### Architecture

- **Separation of Concerns**: Camera logic separated from controls logic
- **Interface Abstraction**: `ICameraRenderer` interface defined in `@teskooano/data-types`
- **Reactive State**: Uses RxJS BehaviorSubject for camera state management
- **Dependency Injection**: Flexible renderer integration through interface
