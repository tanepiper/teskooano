## Terrestrial Renderer Architecture

This document provides a detailed breakdown of the rendering system for terrestrial planets and moons, located in `packages/systems/celestial/src/renderers/terrestrial/`.

### 1. Core Architecture: Service-Oriented Orchestration

The terrestrial renderer is the most modular and service-oriented of the celestial rendering systems. It is built around a central orchestrator class, `BaseTerrestrialRenderer`, which delegates specific creation tasks to specialized service classes.

- **`BaseTerrestrialRenderer`**: This is the primary and only renderer class in this module. It acts as an orchestrator, responsible for constructing the final `THREE.Object3D` for a planet. It does not contain material or atmosphere generation logic itself, but instead instantiates and uses services to do so.
- **No Factory Function**: Unlike the star renderer, this module does not provide a `createTerrestrialRenderer` factory function. The consuming code must directly instantiate `BaseTerrestrialRenderer`.

### 2. The Orchestrator (`base-terrestrial.ts`)

`BaseTerrestrialRenderer` implements the `CelestialRenderer` interface and manages the object's entire lifecycle.

- **Service Instantiation**: In its constructor, it creates instances of `PlanetMaterialService` and `AtmosphereService`.
- **LOD Strategy (`getLODLevels`)**: This is the main entry point for creating the visual representation. It generates a three-tiered `LODLevel` array:
  1.  **Level 0 (High Detail)**: Creates a `THREE.Group` containing the full-detail planet.
      - It calls `materialService.createMaterial()` to generate the planet body's complex `ProceduralPlanetMaterial`.
      - It calls `atmosphereCloudService.createAtmosphereMesh()` to generate the separate atmosphere mesh and material.
      - The body and atmosphere meshes are added to the group.
  2.  **Level 1 (Medium Detail)**: Creates a medium-resolution sphere with a simple `THREE.MeshStandardMaterial`. The color for this material is determined by calling `materialService.getBaseColor()`.
  3.  **Level 2 (Low Detail)**: For maximum performance at great distances, this level renders the planet as a simple, billboard-like sprite. It uses a tiny `SphereGeometry` with a basic, emissive `MeshBasicMaterial` that ignores depth testing, making it behave like a bright pixel.
- **Update Loop (`update`)**: Iterates through all managed materials (planet body and atmosphere) and calls their respective `update` methods, passing the current time and lighting information.

### 3. Service Layer (`utils/`)

The core logic is encapsulated in two service classes, promoting a clean separation of concerns.

- **`PlanetMaterialService` (`planet-material-utils.ts`)**:

  - **`createMaterial()`**: This is its primary method. It is responsible for creating a `ProceduralPlanetMaterial`. It reads the `ProceduralSurfaceProperties` from the celestial object's data.
  - **Fallback Logic**: If specific surface properties (like colors) are not defined on the object, this service contains crucial fallback logic. It uses the object's `PlanetType` (e.g., `LAVA`, `ICE`, `DESERT`) to generate a suitable default color palette and set of procedural parameters. This makes the procedural system robust even with incomplete input data.
  - **`getBaseColor()`**: A helper method that provides a single representative color for an object, used by the medium LOD level.

- **`AtmosphereService` (`atmosphere-cloud-utils.ts`)**:
  - **`createAtmosphereMesh()`**: Creates the visual effect for a planet's atmosphere. It returns both the `THREE.Mesh` and the `AtmosphereMaterial`.
  - The mesh is a `THREE.SphereGeometry` that is slightly larger than the planet body.
  - The material is a new `AtmosphereMaterial`.
  - **Note**: The documentation's mention of cloud-related logic is obsolete; this service now only handles atmospheres.

### 4. Materials (`materials/`)

The materials use external `.glsl` shaders, which is a significant improvement over the star renderer's embedded shader approach.

- **`ProceduralPlanetMaterial` (`procedural-planet.material.ts`)**:

  - The heart of the terrestrial renderer. It extends `THREE.ShaderMaterial` and uses the complex `procedural.vertex.glsl` and `procedural.fragment.glsl` shaders.
  - These shaders generate the planet's entire surface—including continents, oceans, mountains, and ice caps—procedurally using noise functions.
  - The material's constructor takes a `ProceduralSurfaceProperties` object, which is used to populate a large number of uniforms that control the noise, color ramps, terrain shape, and lighting.
  - Its `update` method is responsible for passing updated time, camera position, and multi-light source data (positions, colors, intensities) to the shader each frame.

- **`AtmosphereMaterial` (`atmosphere.material.ts`)**:
  - Also extends `THREE.ShaderMaterial` and uses the `atmosphere.vertex.glsl` and `atmosphere.fragment.glsl` shaders.
  - This material creates the characteristic atmospheric halo or glow effect.
  - **Rendering Technique**: The key to its effect is being rendered on the **back side** of the atmosphere sphere (`side: THREE.BackSide`). This means we only see the material on the edges of the sphere from the camera's perspective, creating a natural-looking limb brightening and scattering effect. It uses transparent, additive blending.

### 5. Obsolete / Removed Features

Analysis of the code reveals several features described in previous documentation that are no longer present:

- **Clouds**: There is no longer a `CloudMaterial` or any logic for creating a separate cloud layer. This has been removed from the `AtmosphereService`.
- **`TexturedPlanetMaterial`**: There is no evidence of a material for applying pre-baked textures. The system is currently focused exclusively on procedural generation for the planet body.
