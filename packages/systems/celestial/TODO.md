# TODO - @teskooano/systems-celestial

This file tracks planned improvements and future work for the celestial rendering system.

## High Priority

- [ ] **Unify Renderer Structure**: Define and implement a formal `CelestialRenderer` interface or abstract base class. Enforce consistent methods (`createMesh`, `update`, `dispose`).
- [ ] **Decouple Concerns**:
  - [ ] Extract IndexedDB logic from `BaseTerrestrialRenderer` into a dedicated caching module/service.
  - [ ] Reduce direct dependency on `celestialObjectsStore` in renderer `update` methods (pass state as arguments or use subscriptions).
- [ ] **Standardize LOD**: Develop and implement a common Level of Detail strategy across all renderers.

## Medium Priority

- [ ] **Consolidate Texture Generation Strategies**: Ensure alignment between `TextureFactory`, `TextureGeneratorBase`, and specific implementations (e.g., how terrestrial generation integrates).
- [ ] **Refactor Shader Handling**: Modify the `Star` renderer to load shaders from external `.glsl` files like other renderers.
- [ ] **Refine Atmosphere Rendering**: Address transparency issues in terrestrial atmosphere shader (`shaders/terrestrial/atmosphere.fragment.glsl`).
- [ ] **Improve Procedural Normal Maps**: Investigate and fix flatness in terrestrial procedural normal maps.
- [ ] **Improve Test Coverage**: Increase Vitest unit test coverage, focusing on renderers and generation logic.

## Low Priority / Future Features

- [ ] **Add New Renderers**:
  - [ ] Comets
  - [ ] Stations
  - [ ] Ships
- [ ] **Review Static Class Usage**: Evaluate static vs. instance-based approaches for `TextureFactory` and generators.
- [ ] **Remove Legacy Code**: Delete unused `generation/diamond-square.ts` file.
