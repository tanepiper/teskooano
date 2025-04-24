# TODO - @teskooano/core-debug

Items to address for future development:

- **Implement Celestial Debug**: Flesh out `celestial-debug.ts` with useful functions (e.g., `logCelestialState`, `visualizeOrbit`, `comparePhysicsStates`).
- **Visualization Helpers**: Add actual visualization functions (e.g., drawing lines/arrows for vectors in Three.js) triggered by `isVisualizationEnabled()` and using data from `vectorDebug`/`threeVectorDebug`.
- **Performance Timing Enhancements**: Make `logger.time` more robust (e.g., support async functions, allow specifying log level for timing results).
- **Browser DevTools Integration**: Explore integration with browser developer tools (e.g., custom formatters, performance markers).
- **Debug UI Panel**: Consider creating a simple UI panel (perhaps using Web Components) that can display data stored in `vectorDebug`, `threeVectorDebug`, or other debug states.
- **Add Tests**: Implement unit tests for the logger, config helpers, and vector storage utilities.
- **Log Formatting**: Allow customization of log message format.
- **Log Targets**: Add support for different log targets beyond the console (e.g., storing logs in memory, sending to a server).
