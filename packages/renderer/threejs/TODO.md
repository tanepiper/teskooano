# TODO - @teskooano/renderer-threejs

This list tracks planned improvements and tasks for the Three.js renderer package.

## Features

- [ ] Implement Level of Detail (LOD) for celestial bodies to improve performance with many objects or distant views.
- [ ] Add basic lighting (e.g., an ambient light and a directional light representing a star).
- [ ] Implement realistic star rendering (e.g., using point sprites or custom shaders).
- [ ] Add support for loading and displaying 3D models (FBX format specified) for ships or stations.
- [ ] Implement post-processing effects (e.g., bloom for stars/lights).
- [ ] Add skybox/environment map for space background instead of just a solid color/simple texture.
- [ ] Visualize gravitational fields or other physics data.

## Refactoring & Improvements

- [ ] Refine the `ObjectManager` logic within `RendererStateAdapter` - potentially extract it into its own class for clarity if `RendererStateAdapter` becomes too complex.
- [ ] Improve performance of orbit line updates (e.g., buffer geometry updates vs recreating lines).
- [ ] Optimize label rendering performance.
- [ ] Add more detailed error handling and logging.
- [ ] Review and potentially optimize raycasting for object picking (`objectClicked` event).
- [ ] Add configuration options for visual details (e.g., orbit line colors, label styles).

## Testing

- [ ] Add comprehensive unit tests (`vitest`) for `ModularSpaceRenderer` focusing on setup, teardown, and callback management.
- [ ] Add unit tests for `RendererStateAdapter` focusing on state subscription handling and correct object creation/update/deletion logic (may require mocking state and Three.js objects).
- [ ] Add unit tests for utility functions.
- [ ] Set up integration tests (potentially using Playwright if running in a browser context) to verify the renderer displays objects correctly based on mock state changes.

## Documentation

- [ ] Add more detailed API documentation using TSDoc comments in the source code.
- [ ] Expand the README with examples for more advanced features once implemented.
