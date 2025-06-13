# Changelog - @teskooano/systems-procedural-generation

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- **Documentation Overhaul**:
  - Added comprehensive JSDoc comments to all functions across all files in `src/`.
  - Updated `README.md` to reflect the current reactive, `Observable`-based API, with a new usage example and updated component descriptions.
  - Updated `ARCHITECTURE.md` with a new data flow description and Mermaid diagram illustrating the RxJS pipeline.
  - Updated this `CHANGELOG.md`.

## [0.2.0] - 2025-05-01

### Added

- `generatePlanetObservable` function in `generators/planet.ts`: Returns an RxJS `Observable` to emit generated planet and associated ring system data reactively.

### Changed

- **Major Refactor (Planet Surface Properties)**:
  - Renamed `createDetailedSurfaceProperties` to `createProceduralSurfaceProperties` in `utils.ts`.
  - `createProceduralSurfaceProperties` now consistently returns a `ProceduralSurfaceProperties` object for all planet types.
  - This function now defines specific procedural parameters (noise settings, bump scale) and detailed color palettes (low, mid1, mid2, high) tailored for each `PlanetType` (TERRESTRIAL, ROCKY, BARREN, DESERT, ICE, LAVA, OCEAN).
  - Added `shininess` and `specularStrength` to the `ProceduralSurfaceProperties` output, supporting more unified shader-based rendering.
- `generators/planet.ts` now uses the new `generatePlanetObservable` and `createProceduralSurfaceProperties`.
- Extensive comment removal and minor code cleanup in `generators/star.ts`, `name-generator.ts`, `seeded-random.ts`, and `utils.ts`.

## [0.1.0] - 2025-04-24

### Added

- **Initial Release**
- Deterministic star system generation from a string seed (`generateSystem`).
- Support for single, binary, trinary, and quaternary star systems with barycentric orbit calculations (`core-physics`).
- Generation of Planets (Rocky, Terrestrial, Gas Giant, Ice, Desert, Lava, Barren) with physical properties, basic atmosphere, and color.
- Generation of Moons (0-4 per planet) with orbital parameters.
- Generation of Asteroid Belts.
- Generation of Planetary Rings.
- Placement logic using exponential distribution for realistic body spacing.
- Calculation of initial physics state (`position`, `velocity`) for all generated objects.
- Seeded PRNG implementation (`seeded-random.ts`).
- Modular generator structure (`generators/` directory).
- Utility functions and constants (`utils.ts`, `constants.ts`).
- Basic unit tests for the generator (`generator.spec.ts`).
