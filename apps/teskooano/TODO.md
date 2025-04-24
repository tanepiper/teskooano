# TODO - @teskooano/teskooano

This file tracks planned improvements and future work for the main Teskooano application.

## High Priority / Next Steps

- [ ] **Implement Preset Layouts:** (From ACTION_PLAN_DOCKVIEW_UI.md #4)
  - Define a default starting `SerializedDockview` layout in JSON format.
  - Load this layout on startup using `dockviewController.api.fromJSON()`.
  - Consider offering multiple layout presets (e.g., 'Default', 'Minimal', 'Debug').

## Medium Priority

- [ ] **Implement Floating Palettes (Optional):** (From ACTION_PLAN_DOCKVIEW_UI.md #6)
  - Evaluate if infrequently used tools (e.g., debug info, performance monitors) should use `addFloatingGroup()` instead of being docked.
  - Refactor relevant panel creation logic if floating palettes are desired.
- [ ] **Refine UI Component Styling:** Ensure consistent application of the design system (`@teskooano/design-system`) across all components.
- [ ] **Error Handling:** Implement more robust error handling and display for issues during simulation loading, rendering, or user interaction.
- [ ] **State Persistence:** Consider persisting UI state (e.g., panel layout, settings) to `localStorage`.
- [ ] **Testing:**
  - Add Vitest unit tests for controllers and components.
  - Set up Playwright for end-to-end UI tests (e.g., adding panels, interacting with controls).

## Low Priority / Future Ideas

- [ ] **Theming:** Allow users to switch between light/dark themes.
- [ ] **Internationalization (i18n):** Add support for multiple languages.
- [ ] **Accessibility (a11y):** Review and improve accessibility across the application.
- [ ] **Performance Optimization:** Profile UI performance, especially with many panels or complex simulation views.
- [ ] **User Tour/Help:** Integrate `driver.js` or similar for a first-time user guide.
