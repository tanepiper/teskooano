# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `CelestialObjectProperties` interface to `celestial.ts`.
- `SliderValueChangePayload` interface to `events.ts`.

### Changed

- Significantly reduced comments across most files for brevity (`celestial.ts`, `events.ts`, `globals.d.ts`, `index.spec.ts`, `main.ts`, `scaling.ts`, `ui.ts`).
- Reordered exports in `index.ts` and added `globals.d.ts` to the exports.

## [0.1.0] - 2025-04-24

### Added

- Initial release of the `@teskooano/data-types` package.
- Comprehensive TypeScript definitions for celestial objects (`CelestialObject`, `StarProperties`, `PlanetProperties`, `GasGiantProperties`, `CometProperties`, `AsteroidFieldProperties`, `OortCloudProperties`, `RingSystemProperties`).
- Detailed enumerations for classifying celestial types, planetary surfaces, stellar classes, atmospheres, etc.
- Definition of `OrbitalParameters` using real-world SI units.
- Discriminated unions for specific properties (`CelestialSpecificPropertiesUnion`) and surface types (`SurfacePropertiesUnion`).
- Core physics state definition (`PhysicsStateReal`) using real-world units.
- Scaling constants (`SCALE`, `RENDER_SCALE_AU`, etc.) and utility functions (`scaleSize`, `scaleDistance`, etc.) in `scaling.ts` for converting between real-world and visual units.
- Top-level simulation state (`SimulationState`) and physics function types (`PairForceCalculator`, `Integrator`) in `main.ts`.
- Extensive UI type definitions (`UIComponentType`, `BaseUIComponent`, `UIEventType`, etc.) in `ui.ts`.
- Basic physics type definitions (`PhysicsStateReal`) in `physics.ts`.
- Event type definitions (`events.ts`).
- Global type definitions (`globals.d.ts`).
