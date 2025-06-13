# TODO for @teskooano/renderer-threejs-background

This list tracks planned improvements and future tasks for the background rendering package.

## Features

- [x] Add procedural nebula/gas cloud generation to add more visual interest to the background.
- [ ] Implement a "galaxy plane" or "milky way" style band across the skybox.
- [ ] Add occasional "shimmering" or "twinkling" effects to stars (e.g., using a custom shader on the `StarField`).
- [ ] Consider adding very distant, slow-moving celestial bodies to the background layers.
- [ ] Create more `Field` types, like a procedural asteroid field or dust clouds.

## Refactoring & Improvements

- [x] Expose more configuration options in the `BackgroundManager` constructor (e.g., star counts, layer distances, animation speeds). The new Field-based architecture makes this highly configurable.
- [ ] Optimize star generation if performance becomes an issue with larger numbers of stars.
- [ ] Add unit tests for the manager and helper functions.
