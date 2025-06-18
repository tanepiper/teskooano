## Gas Giant Renderer System Analysis

This document provides a detailed breakdown of the gas giant rendering system in `packages/systems/celestial/src/renderers/gas-giants/`. This system renders gas giants based on the Sudarsky classification (Classes I-V).

### 1. Core Architecture

The system uses an abstract base class, `BaseGasGiantRenderer`, with concrete implementations for each of the five gas giant classes. A key improvement is the introduction of a factory function to standardize instantiation.

- **Factory Function (`createGasGiantMesh`)**: This function is the primary public API for this module. It inspects the object's `gasGiantClass` property and instantiates the correct concrete renderer (e.g., `ClassIGasGiantRenderer`). This aligns the gas giant system with the factory pattern used by other modern renderers in the package.

- **Inheritance Model**: All renderers extend `BaseGasGiantRenderer`, which provides common logic for mesh creation, Level of Detail (LOD) management, and the main update loop.
- **External Shaders**: This system correctly loads its GLSL shaders from external `.glsl` files located in `packages/systems/celestial/src/shaders/gas-giants/`, which is the preferred architectural pattern.

### 2. Base Components (`base/renderer.ts`, `base/material.ts`)

This file contains the foundational classes for all gas giant renderers.

#### a. `BaseGasGiantMaterial` (Abstract)

An abstract class extending `THREE.ShaderMaterial`. It provides a common interface and logic for all gas giant materials.

- **Directional Light Support**: The material and its corresponding shaders use a lighting model based on pre-calculated direction vectors, which is ideal for distant light sources like stars. This avoids floating-point precision issues at astronomical scales and ensures a clear light/dark terminator on the planet.
  - **`uniform Light uLights[MAX_LIGHTS]`**: An array of `Light` structs in the fragment shader, where `MAX_LIGHTS` is a preprocessor definition (typically 4). Each `Light` contains a `vec3 direction`, `vec3 color`, and `float intensity`.
  - **`uniform int uNumLights`**: An integer indicating how many lights in the `uLights` array are active.
  - The fragment shader iterates from `0` to `uNumLights`, using the provided `direction` vector directly to calculate lighting.
- **`update()`**: This method is simple, designed only to receive the pre-calculated light data from the renderer and pass it into the `uLights` and `uNumLights` uniforms. It does not perform any light-related calculations itself.
- **`updateLOD(lodLevel)`**: A key method for performance optimization. It is implemented by the more complex materials (Class I & II) to reduce shader octaves at a distance, lowering computational load.

#### b. `BaseGasGiantRenderer` (Abstract)

This class implements the `CelestialRenderer` interface and orchestrates the creation and management of gas giant objects. It is responsible for all lighting calculations.

- **LOD Strategy (`getLODLevels`)**: This is the public method for creating the object's visual representation. It implements a three-tiered LOD system for the planet body:

  1.  **Level 0 (High Detail)**: Creates a high-resolution `THREE.SphereGeometry`. It calls the abstract `getMaterial()` method, forcing subclasses to provide their unique, complex procedural material for this level.
  2.  **Level 1 (Medium Detail)**: Uses a `BasicGasGiantMaterial` (a simpler fallback shader) on a medium-resolution sphere.
  3.  **Level 2 (Low Detail)**: Uses a standard `THREE.MeshBasicMaterial` on a very low-resolution sphere.

- **Composition with Rings**: The renderer is designed to be composed with a ring system.

  - **`initialize(object)`**: This method must be called by the factory after the renderer is instantiated. It checks the object for `rings` data and, if present, creates an instance of the `RingSystemRenderer`.
  - **LOD Combination**: The `getLODLevels` method first creates the LODs for the planet body. Then, if a `ringSystemRenderer` exists, it calls its `getLODLevels` method, passing its own LOD distances to ensure the planet and rings change detail in perfect sync. The final returned object for each level is a `THREE.Group` containing both the planet and ring meshes.

- **Update & Lighting Loop (`update`)**: This method receives the latest object data, time, and the full `LightSourcesMap`. It is the central point for lighting logic:
  1. It sorts all available `lightSources` by their squared distance to the planet.
  2. It takes the closest `MAX_LIGHTS` sources.
  3. For each light, it calculates a **direction vector** from the planet's center to the light's position.
  4. It calculates a basic distance-based attenuation factor.
  5. It bundles this `direction`, `color`, and calculated `intensity` into a new array.
  6. It passes this final, pre-processed array of light data to the material's `update` method.
  7. It also updates the `ringSystemRenderer` if it exists.

### 3. Specific Gas Giant Renderers (`class-*.ts`)

Each file implements a renderer for a specific Sudarsky class. The pattern is consistent across all classes.

- **`Class*Material`**: Each renderer has a corresponding material class (e.g., `ClassIMaterial`).
  - **Complex Materials (I & II)**: Load complex procedural shaders that use multi-octave noise. They implement `updateLOD(lodLevel)` to modify shader uniforms and reduce computational load at a distance.
  - **Simple Materials (III, IV, V)**: Load much simpler shaders for less visually complex atmospheres. Their `updateLOD` method is empty, as performance is gained by the `BaseGasGiantRenderer` swapping to more basic materials at a distance.
- **`Class*GasGiantRenderer`**: The renderer's primary role is to implement the `getMaterial()` method. Inside this method, it extracts the necessary properties (colors, seed) from the celestial object data and uses them to instantiate its corresponding material.

### 4. Key Characteristics & Design Summary

- **Strengths**:

  - **Factory Pattern**: The `createGasGiantMesh` function provides a clean, unified entry point for consumers.
  - **Correct Directional Lighting**: The system now uses a lighting model appropriate for planetary scales. By calculating direction vectors on the CPU, it ensures sharp, correct terminators and avoids floating-point issues, while still supporting multiple light sources.
  - **Clean Composition**: The `initialize` pattern for adding the `RingSystemRenderer` is a great example of clean composition over inheritance. The parent renderer owns and manages its sub-renderer.
  - **Effective LOD Strategy**: The system combines material swapping with shader-level `updateLOD` optimizations, providing significant and scalable performance gains.
  - **Maintainable Shaders**: The use of external `.glsl` files is a good practice that improves maintainability.

- **Weaknesses / Inconsistencies**:
  - **Inconsistent LOD Implementation**: The `updateLOD` logic is only present in Classes I and II. While this is for performance reasons, it's an inconsistency in the pattern that must be understood by developers.
  - **Basic Attenuation**: The distance-based attenuation in the renderer is very basic and may need future refinement for more physically accurate results up close.
