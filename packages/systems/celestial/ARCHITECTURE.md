# Celestial System Architecture Analysis

This document provides a consolidated overview of the architecture within the `packages/systems/celestial` package. It describes the current state after the refactoring of the material and texture systems.

## I. Overview

The `@teskooano/systems-celestial` package is responsible for defining and creating the `THREE.js` visual representations for all celestial objects in the engine. It bridges the abstract data definitions in `@teskooano/data-types` with concrete, renderable `THREE.Object3D` instances.

Its core responsibilities include:

- **Rendering**: Containing various `CelestialRenderer` implementations responsible for creating and managing the visual representation (meshes, materials, shaders) of different celestial object types.
- **Procedural Generation**: Generating complex, procedural surfaces and effects primarily on the GPU using custom shaders, especially for planets, stars, and gas giants.
- **Shaders**: Housing the GLSL shader code that implements all visual effects, lighting models, and procedural patterns.
- **Common Utilities**: Providing shared, reusable components for complex effects like gravitational lensing.

## II. Core Sub-Systems Analysis

### A. Renderers (`src/renderers/`)

This is the heart of the package, containing the logic for instantiating different object categories. The system is a collection of specialized sub-systems rather than a single monolithic renderer.

- **Overall Structure**: Organized into subdirectories by celestial type (`stars`, `gas-giants`, `terrestrial`, `particles`, `rings`, `effects`, `base`). The `stars` directory is further subdivided by stellar evolution stage (`main-sequence`, `post-main-sequence`, `remnants`, `black-holes`).
- **Core Interface & Base Class**:
  - `CelestialRenderer` (`renderers/base/CelestialRenderer.ts`): A shared interface defining the public contract for all renderers. Its most critical method is `getLODLevels`, which returns an array of `LODLevel` objects that are consumed by the `@teskooano/renderer-threejs-lod` package's `LODManager`.
  - `BaseCelestialRenderer` (`renderers/base/BaseCelestialRenderer.ts`): An abstract base class providing common functionality like time tracking, resource management, and default `update` and `dispose` methods. Most specific renderers extend a more specialized base class (e.g., `BaseStarRenderer`, `BaseGasGiantRenderer`) rather than this one directly.
- **Level of Detail (LOD) Strategy**: LOD is a key concept, but it is implemented differently across the various sub-systems, representing a major inconsistency. The `getLODLevels` method is the unifying API, but its implementation varies:
  - **Terrestrial/Gas Giants**: The `getLODLevels` method returns multiple `LODLevel` objects, each with a completely different `THREE.Mesh` (using simpler geometry and materials for lower detail). For example, a high-detail gas giant uses a complex procedural shader, while its low-detail version is a simple `MeshBasicMaterial`.
  - **Stars**: The `BaseStarRenderer` now has an `abstract getLODLevels` method. Luminous stars (main-sequence, giants) use a shared helper method to create a high-detail body and a multi-layered corona. Non-luminous objects (neutron stars, black holes) provide their own implementations, which may not include a corona and instead focus on other effects like lensing.
  - **Particles (Asteroids/Oort Clouds)**: The `getLODLevels` method for asteroid fields returns multiple `THREE.Points` objects with progressively fewer particles. The Oort cloud renderer returns one high-detail particle system and then empty groups for lower LODs.
- **Factory Functions**: Instantiation patterns have been partially unified.
  - **Stars & Gas Giants**: Now use a factory pattern. Central functions (`createStarMesh`, `createGasGiantMesh`) inspect the object's properties and delegate to an internal `create...Renderer` function to instantiate the correct concrete renderer. This is the preferred pattern.
  - **Terrestrial**: Now uses a factory pattern. `createPlanetMesh` and `createMoonMesh` are the primary entry points.
  - **Particles & Others**: No factory exists yet for particle systems.
- **Inconsistent `update` Signatures**: Most renderers adhere to the `update(object, time, timeScale, lightSources, camera)` signature. However, renderers for exotic objects like black holes, which require multi-pass rendering for effects like gravitational lensing, have a custom signature: `update(object, time, timeScale, lightSources, camera, renderer, scene)`.

### B. Specialized Renderer Deep Dive

- **Stars**: The most architecturally complex sub-system, now heavily refactored for clarity and correctness. It handles main-sequence stars, post-main-sequence giants, exotic remnants, and black holes.
  - `BaseStarRenderer`: Refactored into a more generic base class. Key methods like `getLODLevels` are now `abstract`. It no longer assumes all stars are luminous.
  - `MainSequenceStarRenderer`: A new intermediate abstract class for all common luminous stars, providing a concrete `getLODLevels` implementation by calling a protected helper (`_createLuminousStarLODs`).
  - **Exotics**: `NeutronStarRenderer`, `SchwarzschildBlackHoleRenderer`, and `KerrBlackHoleRenderer` are highly specialized. They provide their own `getLODLevels` implementations and integrate the `GravitationalLensingHelper`, which requires the `renderer`, `scene`, and `camera` to be passed during the update cycle.
- **Gas Giants**: Organized by the Sudarsky classification (Class I-V).
  - **Factory Pattern**: A new factory function, `createGasGiantMesh`, now handles the selection and instantiation of the correct renderer class based on the object's `gasGiantClass` property.
  - Each class has its own `...Renderer` and `...Material` class.
  - They feature material-level LOD, where the `updateLOD` method on the material for Class I/II giants changes shader uniforms (e.g., reducing noise octaves) to decrease complexity at a distance.
  - Seamlessly integrates the `RingSystemRenderer`.
- **Terrestrial**: Follows the factory pattern, using `createPlanetMesh` and `createMoonMesh` as the public API. Internally, the `BaseTerrestrialRenderer` uses a service-based approach to compose the final object from a procedurally rendered planet body and an optional atmosphere. This is one of the cleanest architectures in the package.
- **Particles**: `AsteroidFieldRenderer` and `OortCloudRenderer` use `THREE.Points` with custom shaders. They are highly efficient but differ on a key `PointsMaterial` setting: `sizeAttenuation` is `true` for asteroid fields (particles shrink with distance) but `false` for Oort clouds (particles maintain screen size, for a distant-sky effect).
- **Rings**: `RingSystemRenderer` is a modular, data-driven renderer that creates planetary ring systems with lighting and shadow casting from the parent body. It is composed by other renderers (like `BaseGasGiantRenderer` and `BaseTerrestrialRenderer`) during their `initialize` phase.

## III. Strengths

1.  **Powerful Proceduralism**: The shift to GPU-based procedural rendering for terrestrial planets is a major strength, allowing for infinite variation and detail without texture assets. The procedural gas giant shaders are also highly effective.
2.  **Modularity & Composition**: The `RingSystemRenderer` and `GravitationalLensingHelper` are excellent examples of reusable, modular components that can be composed into more complex scenes. The service-based approach in the terrestrial renderer is also a strong pattern.
3.  **Architectural Unification (In Progress)**: The introduction of factory patterns for Stars and Gas Giants, and the refactoring of the `BaseStarRenderer`, represent a significant move towards a more consistent and maintainable architecture.
4.  **Advanced Effects**: The system successfully implements very complex visual effects, including gravitational lensing (via multi-pass render-to-texture), planetary shadows on rings, and dynamic surfaces on stars.

## IV. Weaknesses & Inconsistencies

1.  **Inconsistent Architecture (Partially Addressed)**: The factory pattern is now consistently applied to Stars, Gas Giants, and Terrestrial bodies. The main remaining inconsistency is the lack of a factory for Particle systems (`AsteroidField`, `OortCloud`).
2.  **Inconsistent Shader Handling**: The use of both external `.glsl` files and embedded GLSL strings is a significant inconsistency that impacts maintainability. The `BaseStarRenderer` and `GravitationalLensingMaterial` still embed their shader code.
3.  **State Management Coupling**: Many renderers are still coupled to the global `renderableStore` from `@teskooano/core-state`, fetching object data directly within their `update` loops. This makes the renderers less pure and harder to test.
4.  **Divergent LOD Strategies**: The lack of a unified LOD strategy leads to different behaviors and performance characteristics across object types.
5.  **Code Duplication**: Some logic, especially around material setup and color handling, is duplicated across different renderer classes, though the star refactoring has reduced this.

## V. Suggestions & Next Steps

This analysis aligns with the existing `TODO.md` and `MIGRATION_PLAN.md`. The highest-priority actions should be:

1.  **Complete Renderer Architecture Unification**:
    - **Create factories for Particle systems (`createAsteroidFieldMesh`)** to match the pattern used by other renderers. This will create a single, standard entry point for creating any celestial renderer.
    - Standardize the `update` method signature across all renderers. For special cases like lensing, the factory should return a "wrapper" renderer that handles the multi-pass logic internally.
2.  **Standardize Shader Handling**: Refactor all renderers that use embedded GLSL strings (primarily `BaseStarRenderer` and `GravitationalLensingMaterial`) to load their shaders from external `.glsl` files in the `src/shaders/` directory.
3.  **Decouple from Global State**: Refactor renderer `update` methods. Instead of pulling from a global store, the necessary data (`RenderableCelestialObject`) should be passed into the `update` method by the calling manager (e.g., `ObjectManager`).
4.  **Develop a Unified LOD Strategy**: Design a single, consistent approach to LOD. This could involve standardizing on the multi-geometry approach (returning multiple `LODLevel`s from `getLODLevels`) and ensuring all renderers conform to it.
5.  **Continue Refactoring into Services**: Extend the service pattern from the terrestrial renderer to other areas (e.g., a `StarEffectsService` for coronas/jets, a `GasGiantMaterialService`) to reduce code duplication in the renderer classes themselves.
