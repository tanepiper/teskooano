# Changelog - @teskooano/systems-procedural-generation

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
