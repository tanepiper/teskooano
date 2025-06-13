# TODO - @teskooano/core-debug

- [ ] **Standardize `three` Dependency Handling**:

  - This package correctly uses a local `ThreeVector3` interface to avoid a hard dependency on `three`, while `@teskooano/core-math` imports `three` directly.
  - The pattern used here should be the standard. `@teskooano/core-math` should be refactored to align with this approach for better decoupling.

- [ ] **Move Beyond `localStorage` for Debug State**:

  - `celestial-debug.ts` uses `localStorage`, which can be slow and is not ideal for complex state.
  - The long-term goal should be to create a dedicated in-memory Debug UI Panel that can read from the debug services, making `localStorage` unnecessary.

- [x] **Move Beyond `localStorage` for Debug State**:
  - `celestial-debug.ts` previously used `localStorage`, which was slow and not ideal for complex state.
  - This has been refactored to use a performant in-memory cache within the `celestialDebugger` service. The next step is building a UI to consume this data.

Items to address for future development:

- **Implement Celestial Debug**: Flesh out `celestial-debug.ts` with useful functions (e.g., `logCelestialState`, `visualizeOrbit`, `comparePhysicsStates`).
- **Visualization Helpers**: Add actual visualization functions (e.g., drawing lines/arrows for vectors in Three.js) triggered by `isVisualizationEnabled()` and using data from `vectorDebug`/`threeVectorDebug`.
- **Performance Timing Enhancements**: Make `logger.time` more robust (e.g., support async functions, allow specifying log level for timing results).
- **Browser DevTools Integration**: Explore integration with browser developer tools (e.g., custom formatters, performance markers).
- **Debug UI Panel**: Consider creating a simple UI panel (perhaps using Web Components) that can display data stored in `vectorDebug`, `threeVectorDebug`, or other debug states.
- **Add Tests**: Implement unit tests for the logger, config helpers, and vector storage utilities.
- **Log Formatting**: Allow customization of log message format.
- **Log Targets**: Add support for different log targets beyond the console (e.g., storing logs in memory, sending to a server).
