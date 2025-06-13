# TODO - @teskooano/systems-celestial

This file tracks planned improvements and future work for the celestial rendering system.

## High Priority

- [ ] **Unify Renderer Architecture**: Define and implement a formal `CelestialRenderer` interface or abstract base class. A primary goal should be to create a single factory entry point for all renderers and standardize `update` method signatures.
- [ ] **Decouple Concerns**:
  - [ ] Reduce direct dependency on `celestialObjectsStore` in renderer `update` methods (pass state as arguments or use subscriptions).
- [ ] **Standardize LOD**: Develop and implement a common Level of Detail strategy across all renderers.

## Medium Priority

- [ ] **Unify Procedural Material Systems**: Consolidate the procedural generation approaches for terrestrial planets, gas giants, and stars to reduce code duplication and create a more consistent workflow.
- [ ] **Refactor Shader Handling**: Modify the `Star` renderer and `GravitationalLensingHelper` to load shaders from external `.glsl` files like other renderers.
- [ ] **Refine Atmosphere Rendering**: Address transparency issues in terrestrial atmosphere shader (`shaders/terrestrial/atmosphere.fragment.glsl`).
- [ ] **Improve Procedural Normal Maps**: Investigate and fix flatness in terrestrial procedural normal maps.
- [ ] **Improve Test Coverage**: Increase Vitest unit test coverage, focusing on renderers and the new procedural material systems.

## Low Priority / Future Features

- [ ] **Add New Renderers**:
  - [ ] Comets
  - [ ] Stations
  - [ ] Ships
- [ ] **Review Static Class Usage**: Evaluate static vs. instance-based approaches for factories and services.
