## Particle System Renderers Analysis

This directory contains renderers that create large collections of small objects, specifically Asteroid Fields and Oort Clouds. Both renderers have been significantly refactored to use custom shaders and materials instead of the basic `THREE.PointsMaterial`.

### 1. Core Architecture: Self-Contained, Shader-Driven Renderers

Unlike other rendering systems, this module does not have a shared base class. `AsteroidFieldRenderer` and `OortCloudRenderer` are two independent, self-contained classes that both implement the `CelestialRenderer` interface. Their primary similarity is the use of `THREE.Points` to render particles, but their implementations are highly specialized.

### 2. `AsteroidFieldRenderer.ts`

This renderer is responsible for creating disk-shaped asteroid belts. Its implementation is significantly more advanced than a standard particle system.

- **Custom Shaders**: It uses a custom vertex and fragment shader (`asteroidVertexShader`, `asteroidFragmentShader`) embedded as strings.
  - The vertex shader handles the rotation of the entire belt and calculates the screen-space size of each particle (`gl_PointSize`) to achieve proper size attenuation (particles get smaller with distance).
  - The fragment shader is particularly advanced. It implements a **texture atlas** system in the shader, using a `vTextureIndex` varying to select one of five different asteroid textures from a `sampler2D` array (`uniform sampler2D asteroidTextures[5]`). It also applies an individual rotation to each particle's UV coordinates, making each asteroid appear to tumble independently.
- **Asynchronous Texture Loading**: It asynchronously loads an array of 5 distinct asteroid `.png` textures. The `sharedMaterial` is created immediately, but the textures are populated in the material's uniforms as they finish loading.
- **LOD Strategy**: It implements a robust LOD system in its `getLODLevels` method. It creates **multiple, separate `THREE.BufferGeometry` instances**, one for each LOD level (`High`, `Medium`, `Low`). Each geometry has a progressively smaller number of particles, significantly reducing the data sent to the GPU at a distance. All these geometries share the same custom `ShaderMaterial`.
- **Mesh Creation**: The `getLODLevels` method returns an array of `LODLevel` objects, each containing a `THREE.Points` object with the appropriate geometry for that distance.

### 3. `OortCloudRenderer.ts`

This renderer creates a vast, spherical Oort cloud at the edge of a star system. While also using custom shaders, its implementation is simpler than the asteroid field's.

- **Custom Shaders**: It also uses custom, embedded GLSL shaders.
  - The vertex shader is simpler and notably **does not implement size attenuation**. It calculates `gl_PointSize` directly from a `size` attribute and a uniform scale, meaning particles appear as a consistent size on screen regardless of distance. This is a deliberate choice suitable for representing extremely distant objects.
  - The fragment shader is much simpler than the asteroid's. It uses a single texture (`uniform sampler2D cloudTexture`) and does not apply individual particle rotation.
- **Procedural Placement**: The `_createOortCloudGeometry` method generates particle positions procedurally within a spherical shell defined by an inner and outer radius. It uses spherical coordinates to ensure an even distribution.
- **LOD Strategy**: It implements a simpler form of LOD. Instead of creating multiple geometries, it generates a single `THREE.BufferGeometry` but adjusts the number of vertices written to it based on the `detailLevel` provided in the options.

### 4. Key Characteristics & Design Summary

- **Strengths**:

  - **Advanced Visuals**: The custom shader approach, especially in the `AsteroidFieldRenderer`, allows for sophisticated effects like individual particle rotation and texture variation that would be impossible with `THREE.PointsMaterial`.
  - **Performant LOD**: Both renderers have effective LOD strategies tailored to their needs. The multi-geometry approach for asteroids is excellent for distinct distance breaks, while the adjustable vertex count for the Oort cloud is efficient for a more uniform field.
  - **Procedural Generation**: Both renderers create their particle distributions procedurally, making them flexible and data-driven.

- **Weaknesses / Inconsistencies**:
  - **Embedded Shaders**: Like the star renderer, this system embeds its GLSL code in TypeScript files, which makes the shaders harder to develop and maintain compared to external `.glsl` files.
  - **No Shared Logic**: Despite their conceptual similarity, the two renderers share no code. Common functionalities (like procedural particle generation or the basic structure of a particle renderer) could potentially be abstracted into a shared base class or utility functions to reduce duplication.
  - **Asynchronous Complexity**: The async texture loading in `AsteroidFieldRenderer` adds complexity to its initialization sequence that must be carefully managed by the consuming code.
