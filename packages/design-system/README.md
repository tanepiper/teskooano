# @teskooano/design-system

This package contains the shared CSS styles, design tokens, and potentially reusable web components for the Teskooano ecosystem.

## Purpose

- **Consistency:** Provides a single source of truth for styling across the Teskooano engine UI (`@teskooano/teskooano`) and the marketing website (`@teskooano/website`).
- **Reusability:** Defines common styles and variables (CSS Custom Properties) to avoid duplication.
- **Maintainability:** Centralizes style updates and changes.

## Usage

Import the main stylesheet into your application's entry point:

```typescript
// Example in main.ts or similar
import '@teskooano/design-system/styles.css';
```

## Structure (Planned)

- `src/styles.css`: The main aggregated stylesheet.
- `src/tokens/`: Directory for design tokens (colors, typography, spacing, etc.) defined as CSS Custom Properties.
- `src/base/`: Base element styling (resets, body defaults).
- `src/components/`: Styles for specific UI components (buttons, panels, etc.).

*Note: This structure is aspirational. Currently, all styles are in `styles.css` and need refactoring.* 