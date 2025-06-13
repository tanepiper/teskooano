# @teskooano/design-system

This package contains the shared CSS styles and design tokens for the Teskooano ecosystem.

## Purpose

- **Consistency:** Provides a single source of truth for styling across Teskooano applications.
- **Reusability:** Defines common styles and variables (CSS Custom Properties) to avoid duplication.
- **Maintainability:** Centralizes style updates and changes in a modular structure.

## Usage

Import the main stylesheet into your application's entry point:

```typescript
// Example in main.ts or similar
import "@teskooano/design-system/styles.css";
```

If you only need the CSS variables (tokens) without the accompanying styles, you can import `tokens.css` directly:

```typescript
import "@teskooano/design-system/tokens.css";
```

## Architecture

The system is built with a modular approach. The main `src/styles.css` file acts as an entry point that imports all the necessary modules in order.

- `src/tokens.css`: Defines all CSS Custom Properties (variables).
- `src/base/`: Contains resets and base styles for standard HTML elements.
- `src/components/`: Contains styles for individual UI components like buttons.
- `src/layout/`: Contains styles for application layout, including responsive media queries.
- `src/themes/`: Contains theme overrides for third-party libraries like Dockview.

For a detailed breakdown, see `ARCHITECTURE.md`.

## Future Plans

See `TODO.md` for planned additions, such as creating Web Components or adding linting.
