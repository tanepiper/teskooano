# TODO

- **Refactor `styles.css`**: Break down the large `styles.css` file into smaller, more manageable modules as originally planned in the `README.md`:
  - `src/base/`: For resets and base HTML element styles.
  - `src/components/`: For individual component styles (buttons, forms, panels, etc.).
  - `src/layout/`: For application layout styles (`#toolbar`, `.composite-engine-panel`, etc.).
  - `src/themes/`: For theme-specific overrides (like the Dockview theme).
  - `src/utilities/`: For utility classes (if any).
- **Consolidate/Remove `colors.css`**: Review `src/colors.css` and merge its definitions into `src/tokens.css` or remove it if redundant.
- **Web Components**: Consider creating actual reusable Web Components for common UI elements (e.g., `<teskooano-button>`, `<teskooano-panel>`) within this package, potentially using Lit or similar, styled by the existing CSS.
- **Linting/Formatting**: Set up Stylelint and Prettier for CSS to enforce consistency.
- **Testing**: Explore visual regression testing (e.g., using Playwright snapshots) to catch unintended style changes.
- **Documentation**: Improve documentation for tokens and potentially add a visual style guide (e.g., using Storybook or similar, though that might add unwanted complexity).
