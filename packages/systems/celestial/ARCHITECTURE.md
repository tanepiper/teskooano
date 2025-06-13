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

- **Overall Structure**: Organized into subdirectories by celestial type (`stars`, `gas-giants`, `terrestrial`, `particles`, `rings`, `common`).
- **Core Interface & Base Class**:
  - `CelestialRenderer` (`renderers/common/CelestialRenderer.ts`): A shared interface defining the public contract for all renderers. Its most critical method is `getLODLevels`, which returns an array of `LODLevel` objects that are consumed by the `@teskooano/renderer-threejs-lod` package's `LODManager`.
  - `BaseCelestialRenderer` (`renderers/common/BaseCelestialRenderer.ts`): An abstract base class providing common functionality like time tracking and default `update` and `dispose` methods. Most specific renderers extend a more specialized base class (e.g., `BaseStarRenderer`) rather than this one directly.
- **Level of Detail (LOD) Strategy**: LOD is a key concept, but it is implemented differently across the various sub-systems, representing a major inconsistency. The `getLODLevels` method is the unifying API, but its implementation varies:
  - **Terrestrial/Gas Giants**: The `getLODLevels` method returns multiple `LODLevel` objects, each with a completely different `THREE.Mesh` (using simpler geometry and materials for lower detail). For example, a high-detail gas giant uses a complex procedural shader, while its low-detail version is a simple `MeshBasicMaterial`.
  - **Stars**: The `getLODLevels` method returns a single high-detail group and several low-detail billboards for the corona.
  - **Particles (Asteroids/Oort Clouds)**: The `getLODLevels` method for asteroid fields returns multiple `THREE.Points` objects with progressively fewer particles. The Oort cloud renderer returns one high-detail particle system and then empty groups for lower LODs.
- **Factory Functions**: Instantiation patterns are inconsistent.
  - **Stars**: A central factory function, `createStarRenderer`, exists in `renderers/stars/index.ts`. It inspects the star's `spectralClass` and `stellarType` to return the correct concrete `BaseStarRenderer` implementation (e.g., `ClassGStarRenderer`, `NeutronStarRenderer`, `KerrBlackHoleRenderer`).
  - **Gas Giants & Others**: No factory exists. The consuming code is responsible for selecting and instantiating the correct renderer class (e.g., `ClassIGasGiantRenderer`) based on the object's properties.
- **Inconsistent `update` Signatures**: Most renderers adhere to the `update(time, lightSources, camera)` signature. However, renderers for exotic objects like black holes, which require multi-pass rendering for effects like gravitational lensing, have a custom signature: `update(time, renderer, scene, camera)`.

### B. Materials & Shaders (`src/materials/`, `src/shaders/`)

This system was heavily refactored to favor GPU-based proceduralism.

- **Shader-First Approach**: The visual appearance of most objects is defined in GLSL shaders located in `src/shaders/`. These are organized by object type. They implement procedural noise (Simplex, FBM), various lighting models, and complex effects.
- **Inconsistent Shader Handling**: A significant inconsistency remains:
  - **External `.glsl` files**: Most renderers (Gas Giants, Terrestrial, Rings) load shaders from external `.glsl` files. This is the preferred approach for maintainability.
  - **Embedded GLSL strings**: The `BaseStarRenderer` and `GravitationalLensingMaterial` embed their GLSL shader code directly as template literals within their TypeScript files. This makes them difficult to edit and manage.
- **Procedural Planet Rendering**: The old CPU-based texture generation system has been entirely replaced. Terrestrial planets are now rendered using a single, powerful procedural shader.
  - `procedural-planet.material.ts`: A `ShaderMaterial` that takes a large `ProceduralPlanetUniforms` object.
  - `procedural.fragment.glsl`: A complex fragment shader that generates the entire planet surface on the fly using the provided uniforms.
  - `procedural.ts`: Defines the `ProceduralPlanetUniforms` type, which exposes dozens of parameters controlling every aspect of the planet's appearance (noise functions, terrain shape, color bands, height levels, shininess, etc.).
- **Material Services**: The `terrestrial` renderer uses service classes (`PlanetMaterialService`, `AtmosphereService`) to encapsulate the logic for creating and configuring materials, which is a good separation of concerns.

### C. Specialized Renderer Deep Dive

- **Stars**: The most complex sub-system. It handles main-sequence stars, exotic remnants, and black holes.
  - `BaseStarRenderer`: Provides common logic for a star body and a billboarded corona.
  - **Exotics**: `NeutronStarRenderer`, `SchwarzschildBlackHoleRenderer`, and `KerrBlackHoleRenderer` are highly specialized. They create composite objects with multiple parts (jets, accretion disks, ergospheres) and integrate the `GravitationalLensingHelper` from `renderers/common/`.
- **Gas Giants**: Organized by the Sudarsky classification (Class I-V).
  - Each class has its own `...Renderer` and `...Material` class.
  - They feature material-level LOD, where the `updateLOD` method on the material changes shader uniforms (e.g., reducing noise octaves) to decrease complexity at a distance.
  - Seamlessly integrates the `RingSystemRenderer`.
- **Terrestrial**: The `BaseTerrestrialRenderer` uses a service-based approach to compose the final object, combining a procedurally rendered planet body with optional atmosphere and cloud layers. This is one of the cleanest architectures in the package.
- **Particles**: `AsteroidFieldRenderer` and `OortCloudRenderer` use `THREE.Points` with custom shaders. They are highly efficient but differ on a key `PointsMaterial` setting: `sizeAttenuation` is `true` for asteroid fields (particles shrink with distance) but `false` for Oort clouds (particles maintain screen size, for a distant-sky effect).
- **Rings**: `RingSystemRenderer` is a modular, data-driven renderer that creates planetary ring systems with lighting and shadow casting from the parent body.

## III. Strengths

1.  **Powerful Proceduralism**: The shift to GPU-based procedural rendering for terrestrial planets is a major strength, allowing for infinite variation and detail without texture assets. The procedural gas giant shaders are also highly effective.
2.  **Modularity (in places)**: The `RingSystemRenderer` and `GravitationalLensingHelper` are excellent examples of reusable, modular components that can be composed into more complex scenes. The service-based approach in the terrestrial renderer is also a strong pattern.
3.  **Advanced Effects**: The system successfully implements very complex visual effects, including gravitational lensing (via multi-pass render-to-texture), planetary shadows on rings, and dynamic surfaces on stars.
4.  **Specialization**: Separating renderers by celestial type (and sub-type) allows for highly specialized and optimized rendering for each category.

## IV. Weaknesses & Inconsistencies

1.  **Inconsistent Architecture**: This is the primary weakness. There is no single, unified pattern for creating or managing renderers. The use of factories (stars) vs. direct instantiation (gas giants), varying `update` signatures, and different LOD strategies makes the system hard to reason about as a whole.
2.  **Inconsistent Shader Handling**: The use of both external `.glsl` files and embedded GLSL strings is a significant inconsistency that impacts maintainability.
3.  **State Management Coupling**: Many renderers (e.g., `BaseGasGiantRenderer`) are tightly coupled to the global `renderableStore` from `@teskooano/core-state`, fetching object data directly within their `update` loops. This makes the renderers less pure and harder to test.
4.  **LOD Strategy**: The lack of a unified LOD strategy leads to different behaviors and performance characteristics across object types.
5.  **Code Duplication**: Some logic, especially around material setup and color handling, is duplicated across different renderer classes.

## V. Suggestions & Next Steps

This analysis aligns with the existing `TODO.md` and `MIGRATION_PLAN.md`. The highest-priority actions should be:

1.  **Unify Renderer Architecture**:
    - Create a single, standard factory function or class (`CelestialRendererFactory`?) that is the sole entry point for creating any celestial renderer. This factory would encapsulate the logic for choosing the correct renderer class.
    - Standardize the `update` method signature across all renderers. For special cases like lensing, the factory could return a "wrapper" renderer that handles the multi-pass logic internally.
2.  **Standardize Shader Handling**: Refactor all renderers that use embedded GLSL strings (primarily `BaseStarRenderer` and `GravitationalLensingMaterial`) to load their shaders from external `.glsl` files in the `src/shaders/` directory.
3.  **Decouple from Global State**: Refactor renderer `update` methods. Instead of pulling from a global store, the necessary data (`RenderableCelestialObject`) should be passed into the `update` method (or a new `updateObject(objectData, ...)` method) by the calling manager (e.g., `ObjectManager`).
4.  **Develop a Unified LOD Strategy**: Design a single, consistent approach to LOD. This could involve standardizing on the multi-geometry approach (returning multiple `LODLevel`s from `getLODLevels`) and ensuring all renderers conform to it.
5.  **Continue Refactoring into Services**: Extend the service pattern from the terrestrial renderer to other areas (e.g., a `StarEffectsService` for coronas/jets, a `GasGiantMaterialService`) to reduce code duplication in the renderer classes themselves.
