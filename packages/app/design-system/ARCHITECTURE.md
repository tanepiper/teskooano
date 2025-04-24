## Architecture (`packages/app/design-system`)

This package provides shared CSS for the Teskooano applications. Its current architecture is very simple:

1.  **`src/tokens.css`**: Defines all CSS Custom Properties (variables) used throughout the system. This includes:

    - Core color palette (neutrals, primary, secondary, semantic).
    - Typography scales (font families, weights, sizes, line heights).
    - Spacing units.
    - Border styles (widths, radii).
    - Shadow definitions.
    - Layout constants (e.g., `--toolbar-height`).
    - Transition timings.
    - Overrides for the Dockview `abyss` theme (`--dv-background-color`, `--dv-activegroup-visiblepanel-tab-background-color`, etc.).

2.  **`src/colors.css`**: Currently contains a small set of color definitions. (Note: Its utility is questionable given `tokens.css`).

3.  **`src/styles.css`**: The main stylesheet entry point.

    - Imports `tokens.css`.
    - Provides base styles for standard HTML elements (resets, `body`, headings, paragraphs, links, lists, forms, basic buttons).
    - Includes utility classes for button variants (`.button-primary`, `.button-secondary`, etc.).
    - Contains specific styles for application layout components (`#app`, `#toolbar`, `.composite-engine-panel`).
    - Includes styles related to Dockview integration (`.dockview-container`, `.dockview-theme-abyss` rules beyond the token overrides).
    - Implements responsive adjustments via `@media` queries.

4.  **`package.json`**: Configured to export `styles.css` and `colors.css` so they can be imported directly by consuming applications.

**Data Flow:**

- `tokens.css` defines the variables.
- `styles.css` imports and consumes these variables to apply styling.
- Applications import `styles.css` (and potentially `colors.css`) to apply the design system.

**Simplicity:** The current architecture prioritizes simplicity by consolidating most styles into `styles.css` and definitions into `tokens.css`. It avoids complex CSS pre-processing or build steps.
