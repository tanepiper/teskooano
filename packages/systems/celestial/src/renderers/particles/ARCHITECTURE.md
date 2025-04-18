## Particle System Renderers Analysis

This directory contains renderers that utilize Three.js particle systems (`THREE.Points`) to represent large collections of small objects, specifically Asteroid Fields and Oort Clouds.

**Core Components:**

1.  **`index.ts`**:
    *   Exports the `AsteroidFieldRenderer` and `OortCloudRenderer` classes.
    *   Does not define a base class or factory function; each renderer is self-contained.

2.  **`AsteroidFieldRenderer.ts` (`AsteroidFieldRenderer` class)**:
    *   Implements the `CelestialRenderer` interface.
    *   Designed to render a disk-shaped collection of particles representing an asteroid field.
    *   **`createMesh(object, options)`**: Creates the particle system.
        *   Reads `AsteroidFieldProperties` from the `object.properties` (handling potential nesting like `object.properties.asteroidFieldProperties`). Includes validation and default values if properties are missing or invalid.
        *   Creates a `THREE.BufferGeometry`.
        *   Generates particle positions within a ring defined by `innerRadius` and `outerRadius`, and with a thickness defined by `height`.
        *   Generates random color variations based on the provided `color` property.
        *   Generates random sizes for each particle.
        *   Sets `position`, `color`, and `size` attributes on the geometry.
        *   Loads a shared point sprite texture (a small blurry dot encoded as a base64 data URL) for the particle appearance.
        *   Creates a `THREE.PointsMaterial`:
            *   Uses `vertexColors: true`.
            *   Sets the loaded `sprite` texture as the `map`.
            *   Configured for transparency (`transparent: true`, `opacity: 1.0`, `alphaTest: 0.1`).
            *   Uses `AdditiveBlending`.
            *   Uses `depthWrite: false`.
            *   Uses `sizeAttenuation: true` (particles appear smaller further away).
        *   Creates the `THREE.Points` object using the geometry and material.
        *   Optionally offsets the particle system's position based on `properties.parentPosition`.
        *   Returns the `THREE.Points` object.
    *   **`update(time)`**: Updates the `time` property and applies a very slow rotation to the entire particle system around the Y-axis.
    *   **`dispose()`**: Disposes of the geometry and material.

3.  **`OortCloudRenderer.ts` (`OortCloudRenderer` class)**:
    *   Implements the `CelestialRenderer` interface.
    *   Designed to render a spherical shell of particles representing an Oort cloud.
    *   **`createMesh(object, options)`**: Creates the particle system.
        *   Reads `OortCloudProperties` from `object.properties` (handling nesting like `object.properties.oortCloudProperties`). Includes validation and default values.
        *   Creates a `THREE.BufferGeometry`.
        *   Determines the number of particles to actually render (`renderCount`) based on `properties.count`, the `options.detailLevel`, and a hard cap (e.g., 50,000).
        *   Generates particle positions within a spherical shell defined by `radius` and `thickness`, using spherical coordinates (`phi`, `theta`) for better distribution.
        *   Includes validation to skip particles with non-finite coordinates (NaN, Infinity) and logs a warning once per object ID.
        *   Generates random color variations based on the `color` property.
        *   Generates random sizes for each particle.
        *   Sets `position`, `color`, and `size` attributes on the geometry.
        *   Loads the *same* shared point sprite texture (base64 data URL) as the `AsteroidFieldRenderer`.
        *   Creates a `THREE.PointsMaterial`:
            *   Similar settings to `AsteroidFieldRenderer` (vertex colors, map, transparency, additive blending, depthWrite: false).
            *   Key Difference: Uses `sizeAttenuation: false` (particles maintain the same screen size regardless of distance, suitable for very distant objects like Oort clouds).
            *   Has a lower default `opacity` (e.g., 0.6).
        *   Creates the `THREE.Points` object.
        *   Optionally offsets the particle system based on `properties.parentPosition`.
        *   Returns the `THREE.Points` object (or an empty `THREE.Group` if initial validation fails).
    *   **`update(time)`**: Updates `time` and applies an extremely slow rotation to the entire particle system around the Y-axis.
    *   **`dispose()`**: Disposes of the geometry and material, and clears the `invalidParticleLogged` set.

**Key Characteristics & Design:**

*   **Particle System Focus**: Specifically uses `THREE.Points` for rendering large numbers of small, distant objects where individual geometry is impractical.
*   **Self-Contained Renderers**: Each renderer (`AsteroidFieldRenderer`, `OortCloudRenderer`) is independent, with no shared base class within this module.
*   **Procedural Placement**: Particle positions are generated procedurally within `createMesh` based on distribution parameters (ring vs. sphere).
*   **BufferGeometry**: Directly manipulates `THREE.BufferGeometry` and its attributes (`position`, `color`, `size`) for efficiency.
*   **PointsMaterial**: Uses `THREE.PointsMaterial` with point sprites (textures) for particle appearance.
*   **Performance/LOD**: `OortCloudRenderer` implements a simple form of LOD by adjusting the `renderCount` based on `detailLevel` options.
*   **Size Attenuation**: Key difference in `PointsMaterial` settings (`sizeAttenuation: true` for asteroids, `false` for Oort cloud) reflects the different visual requirements for varying distances.
*   **Shared Texture**: Both renderers use the exact same embedded base64 point sprite texture.
*   **Validation**: Includes checks for valid properties and particle coordinates to prevent errors. 