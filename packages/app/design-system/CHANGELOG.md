# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- **Major Refactor**: The entire design system has been refactored for modularity. The monolithic `styles.css` has been broken down into a new directory structure:
  - `src/base/`: For resets and base HTML element styles.
  - `src/components/`: for component-specific styles (e.g., buttons).
  - `src/layout/`: For application layout and responsive styles.
  - `src/themes/`: For third-party theme overrides (e.g., Dockview).
- The main `styles.css` now serves as an entry point, importing all modules in the correct order.
- Base styles incorrectly located in `tokens.css` have been moved to `base/base.css`.

### Removed

- Removed the redundant `src/colors.css` file and its exports from `package.json`. The `src/tokens.css` file should be used directly for consumers who only need CSS variables.

### Fixed

- Corrected various documentation files (`README.md`, `ARCHITECTURE.md`) to reflect the new, modular structure.

## [0.1.0] - 2025-04-24

### Added

- Initial release of the `@teskooano/design-system` package.
- CSS Custom Properties (Tokens) for colors, typography, spacing, borders, shadows, etc. defined in `src/tokens.css`.
- Base HTML element styling (reset, typography, forms, buttons) in `src/styles.css`.
- Specific styles for application layout elements (`#toolbar`, `.composite-engine-panel`).
- Theming overrides for Dockview (`.dockview-theme-abyss`) integrated into `src/tokens.css` and `src/styles.css`.
- Responsive design adjustments using media queries in `src/styles.css`.
- Export configuration in `package.json` for `styles.css` and `colors.css`.
