# Changelog

All notable changes to this project will be documented in this file.

## [0.1.0] - 2025-04-24

### Added

- Initial release of the core math package.
- `OSVector3`: Custom 3D vector class with common operations (add, sub, dot, cross, normalize, etc.) and Three.js interoperability (`toThreeJS`, `applyQuaternion`).
- `constants`: Essential mathematical constants (`PI`, `EPSILON`, `DEG_TO_RAD`, etc.).
- `utils`: Namespace containing various utility functions:
  - Mathematical helpers (`clamp`, `lerp`, `degToRad`, `equals`, power-of-two functions).
  - General utilities (`generateUUID`).
  - Function modifiers (`debounce`, `throttle`, `memoize`).
- Basic project setup (`package.json`, `tsconfig.json`, `moon.yml`).
- Initial `README.md`, `ARCHITECTURE.md`, `CHANGELOG.md`, and `TODO.md`.
