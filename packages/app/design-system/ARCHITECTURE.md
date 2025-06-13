## Architecture (`packages/app/design-system`)

This package provides shared CSS for the Teskooano applications. It has been refactored into a modular structure to improve maintainability and clarity.

The main entry point is `src/styles.css`, which imports all the necessary parts in the correct order. The structure is as follows:

1.  **`src/tokens.css`**: Defines all CSS Custom Properties (variables) used throughout the system. This is the single source of truth for all design decisions, including:

    - Core color palette (neutrals, primary, secondary, semantic).
    - A fluid typography system using `clamp()`.
    - Spacing units based on a linear scale.
    - Border styles (widths, radii).
    - Shadow definitions.
    - Layout constants (e.g., `--toolbar-height`).
    - A complete set of theme variables for the Dockview `abyss` theme.

2.  **`src/base/`**: Contains foundational styles.

    - `base.css`: A modern reset, box-sizing rules, and global styles applied to `:root` and `body`.
    - `forms.css`: Base styles for all form elements (`input`, `select`, `label`, etc.).
    - `lists.css`: Base styles for `ul` and `ol`.
    - `typography.css`: Styles for all standard text elements (`h1`-`h6`, `p`, `a`, `code`, etc.).

3.  **`src/components/`**: Contains styles for specific, reusable UI components.

    - `buttons.css`: Styling for the base `<button>` element and all its variants (`.button-primary`, `.button-ghost`, etc.).
    - `misc.css`: Styles for smaller components like `collapsible-section`, `internal-resizer`, and other legacy elements.

4.  **`src/layout/`**: Contains styles related to the application's overall structure.

    - `app.css`: Styles for the main application shell, including `#app` and the main `#toolbar`.
    - `composite-panel.css`: Complex layout styles for the `.composite-engine-panel`.
    - `responsive.css`: All `@media` queries for adjusting the layout at different screen sizes.

5.  **`src/themes/`**: Contains styles for theming third-party components.

    - `dockview.css`: All custom styles and structural overrides for the Dockview library.

6.  **`package.json`**: Configured to export `styles.css` (the main entry point) and `tokens.css` (for consumers who may only need the variables).

**Data Flow:**

- `tokens.css` defines the variables.
- The modules in `base/`, `components/`, `layout/`, and `themes/` consume these variables.
- `styles.css` imports `tokens.css` and all the other modules.
- Consuming applications import `styles.css` to apply the entire design system.
