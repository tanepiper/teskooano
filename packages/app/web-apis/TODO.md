# TODO - @teskooano/app-web-apis

Items to address for future development:

- **Add Unit/Integration Tests**: Many modules lack tests. Add tests using Vitest, focusing on the wrapper logic rather than the browser APIs themselves. For APIs requiring interaction (like Fullscreen, Drag/Drop, Permissions), Playwright might be needed.
- **Browser Compatibility**: Systematically check and document browser support for each API, especially experimental ones (Idle Detection, Device Memory, Remote Playback, Popover, Invoker). Provide fallbacks or clear warnings where support is limited.
- **Error Handling**: Review and enhance error handling within observables and async functions.
- **Configuration Options**: Some utilities could benefit from more configuration options (e.g., debounce/throttle times for observer observables, default settings for helpers).
- **Higher-Level Abstractions**: Consider if any combinations of these APIs could form higher-level, reusable utilities specific to the Teskooano engine's needs.
- **Documentation**: Improve inline JSDoc comments for better type inference and developer experience.
- **Tree-shaking**: Verify that the modular export structure works well with bundlers like Vite to minimize final bundle size when only a few APIs are used.
