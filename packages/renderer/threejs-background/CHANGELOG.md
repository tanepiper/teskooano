# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.1] - 2025-05-09

### Fixed

- **Performance**: Drastically improved the performance of the `NebulaField` by reducing the default geometry subdivision level and lowering the number of octaves in the procedural noise shader. This makes the nebula usable by default without a significant framerate drop.

### Changed

- Re-enabled the `createDefaultNebula()` call in `BackgroundManager` as performance is now acceptable.
- Added extensive JSDoc comments and performed minor code cleanup across all `star-field` and `nebula-field` files for better maintainability.

## [0.3.0] - 2025-05-09

### Added

- `NebulaField`: A new field type for rendering complex, procedural gas clouds using a custom GLSL shader.
- `palettes.ts`: A collection of scientifically-inspired color palettes for the nebula, with random selection on initialization.

### Changed

- **Major Refactor**: The entire package was refactored from a monolithic manager into a modular, extensible `Field`-based architecture.
- `BackgroundManager` now orchestrates a collection of `Field` objects (`StarField`, `NebulaField`, etc.) instead of handling all logic internally.
- `StarField` is now its own class, encapsulating all star-related logic, including generation, animation, and parallax.
- The nebula shader was significantly improved with 3D Simplex Noise and domain warping to create more realistic, detailed, and "swirling" visuals inspired by the Carina Nebula.
- Replaced `SphereGeometry` with `IcosahedronGeometry` for the nebula to eliminate polar distortion artifacts.

### Removed

- `parallax-handler.ts`: Logic was absorbed into the `StarField` class.
- The old `star-field.ts` module was replaced by the `StarField` class and generator.

## [0.2.0] - 2025-05-08

### Added

- Initial release of the `@teskooano/renderer-threejs-background` package.
- `BackgroundManager`: Manages the lifecycle of the multi-layered starfield.
- Starfield generation with multiple layers for depth perception.
- Parallax effect that responds to camera movement.
- Subtle animation of star layers to create a dynamic background.
- Debug mode for visualizing layer boundaries and colors.
