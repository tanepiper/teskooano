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

## [2.0.0] - 2024-01-XX - Major Refactor: Enhanced Realism & Orbital Configurations

### 🚀 Major Features

- **Enhanced Multi-Star Systems**: Complete rewrite of stellar generation with hierarchical binary and multiple star configurations
- **Zone-Based Generation**: Sophisticated temperature and gravitational zone system for realistic planet placement
- **Special Orbital Configurations**: Support for binary planets, trojan arrangements, co-orbital bodies, and circumbinary objects
- **Rogue Objects**: Unbound planets in interstellar space and outer system regions
- **10,000 AU Playground**: Full utilization of available space with diverse stellar environments

### 🎯 Enhanced Realism

- **Temperature-Based Planet Types**: Realistic temperature gradients from stellar luminosity with proper physics
- **Sophisticated Zone Classification**: 10 distinct zones from scorched (0.01 AU) to Oort Cloud (10,000 AU)
- **Improved Orbital Mechanics**: Proper stability calculations for complex configurations
- **Hierarchical Star Systems**: Alpha Centauri-like systems with close binaries and distant companions

### 🔧 Technical Improvements

- **Modular Zone System**: Complete refactor of `CelestialZoneManager` with enhanced configuration options
- **Advanced Body Placement**: New `BodyPlacement` system supporting complex orbital arrangements
- **Enhanced Star Generation**: Sophisticated multi-star system creation with realistic separations
- **Improved Type Safety**: Better TypeScript definitions for orbital configurations

### 📊 New Orbital Configurations

| Configuration | Description | Frequency |
|---------------|-------------|-----------|
| Binary Pairs | Planets orbiting each other | ~15% |
| Trojan Groups | L4/L5 Lagrange point arrangements | ~8% |
| Co-Orbital | Bodies sharing same orbit | ~5% |
| Circumbinary | Planets orbiting both stars | ~3% |
| Rogue Objects | Unbound interstellar bodies | ~2% |

### 🌟 Generation Improvements

- **Better Binary Systems**: Realistic mass ratios and orbital separations
- **Asteroid Belt Enhancement**: Formation based on planetary migration patterns
- **Advanced Ring Systems**: Multiple components with shepherd moon dynamics
- **Enhanced Moon Generation**: Reduced moon counts for companion objects

### 🛠️ Breaking Changes

- `CelestialZone` interface updated with new properties for special configurations
- `BodyPlacement` interface completely redesigned with orbital configuration support
- Zone generation now requires stellar system configuration parameter
- Enhanced star generation may produce different results for existing seeds

### 🐛 Bug Fixes

- Fixed wildly random system generation by implementing proper zone-based constraints
- Improved stability calculations for multi-body systems
- Better handling of extreme orbital distances
- Fixed asteroid belt placement in inappropriate zones

### 📈 Performance

- Optimized zone calculation algorithms
- Improved memory usage for large system generation
- Better streaming performance for complex configurations
- Reduced computational overhead for standard single-body generation

### 🧪 Testing

- Added comprehensive tests for new orbital configurations
- Enhanced integration tests for multi-star systems
- Added performance benchmarks for large system generation
- Improved test coverage for edge cases

---

## [1.2.1] - Previous Version

### Added
- Basic zone system implementation
- Simple multi-star support
- Asteroid belt generation
- Ring system generation

### Fixed
- Orbital period calculations
- Temperature estimation accuracy
- Memory leaks in observable streams

---

## [1.2.0] - Previous Version

### Added
- Moon generation system
- Enhanced planet properties
- Spectral classification
- Visual luminosity calculations

### Changed
- Improved seeded random generation
- Better error handling
- Enhanced type definitions

---

## [1.1.0] - Previous Version

### Added
- Multi-star system support
- Gas giant classification
- Ring system generation
- Enhanced planet types

### Fixed
- Orbital mechanics calculations
- Star color generation
- Planet naming consistency

---

## [1.0.0] - Initial Release

### Added
- Basic procedural star system generation
- Single star systems
- Planet and moon generation
- Asteroid belt support
- Deterministic seeded generation
- RxJS observable streams
