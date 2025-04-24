# @teskooano/design-system

This package contains the shared CSS styles and design tokens for the Teskooano ecosystem.

## Purpose

- **Consistency:** Provides a single source of truth for styling across Teskooano applications.
- **Reusability:** Defines common styles and variables (CSS Custom Properties) to avoid duplication.
- **Maintainability:** Centralizes style updates and changes.

## Usage

Import the main stylesheet into your application's entry point:

```typescript
// Example in main.ts or similar
import "@teskooano/design-system/styles.css";
```

You can also optionally import `colors.css` if needed, although most colors are defined as tokens within `styles.css` via the imported `tokens.css`.

```typescript
import "@teskooano/design-system/colors.css";
```

## Current Structure

- `src/tokens.css`: Defines CSS Custom Properties (variables) for colors, typography, spacing, etc., including overrides for the Dockview theme.
- `src/styles.css`: The main stylesheet. Imports `tokens.css` and contains base styles, component styles (buttons, forms), layout styles (`#toolbar`, `.composite-engine-panel`), and responsive adjustments.
- `src/colors.css`: Contains a small number of color definitions (consider merging into `tokens.css`).

See `ARCHITECTURE.md` for more details.

## Future Plans

See `TODO.md` for planned refactoring (like splitting `styles.css`) and potential additions (like Web Components).
