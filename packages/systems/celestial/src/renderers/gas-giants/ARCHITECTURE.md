## Gas Giant Renderer Analysis

This directory contains the rendering logic for gas giant planets within the Open Space engine. It utilizes a class-based system (I-V Sudarsky classification) alongside a base renderer.

**Core Components:**

1.  **`index.ts`**:
    *   Exports the base classes (`BaseGasGiantMaterial`, `BasicGasGiantMaterial`, `BaseGasGiantRenderer`) and all specific class renderers (`ClassIGasGiantRenderer` through `ClassVGasGiantRenderer`).
    *   *Unlike the star renderer, it does not provide a central factory function.* Instantiation relies on external logic selecting the correct renderer class based on the gas giant's classification.

2.  **`base-gas-giant.ts`**:
    *   Defines the core rendering logic and base classes.
    *   **`BaseGasGiantMaterial` (Abstract Class)**: Extends `THREE.ShaderMaterial`.
        *   Provides a base structure for gas giant materials.
        *   Includes an `update(time, lightSourcePosition)` method to update common uniforms like `time` and `sunPosition` if they exist.
        *   Introduces an `updateLOD(lodLevel: number)` method, intended to be overridden by subclasses to adjust material properties (like shader complexity or texture resolution) based on distance. The base implementation does nothing.
    *   **`BasicGasGiantMaterial`**: Extends `BaseGasGiantMaterial`. A very simple fallback material.
        *   Uses basic shaders (`basic.vertex.glsl`, `basic.fragment.glsl`) which implement simple diffuse + ambient lighting with a base color.
        *   Defines uniforms `baseColor`, `sunPosition`, and `time`.
    *   **`BaseGasGiantRenderer` (Abstract Class)**: Implements `CelestialRenderer`.
        *   `materials`: Map to store the `BaseGasGiantMaterial` for each object.
        *   `ringMaterials`: Map to store arrays of `RingMaterial` instances (from `../rings/rings`) for planets with rings.
        *   `objects`: Map to store the `CelestialObject` data itself.
        *   `lodThresholds`: Defines distance thresholds (relative to object radius) for LOD switching (`high`, `medium`, `low`).
        *   `createMesh`: Creates a `THREE.Group`. Creates the main planet body (`THREE.SphereGeometry`) using the material returned by the abstract `getMaterial` method. Segments of the sphere are adapted based on the `detailLevel` option. Stores the object and material in maps. Calls `addRings` if the object has ring properties.
        *   `addRings`: Checks `object.properties.rings`. If rings exist, it calls `createRings` (from `../rings/rings`) to generate the ring geometry and materials, adds the resulting group, and stores the `RingMaterial` instances in `ringMaterials`.
        *   `getMaterial` (Abstract Method): Must be implemented by subclasses to return the specific `BaseGasGiantMaterial` for that gas giant class.
        *   `update(time, lightSources, camera)`: Updates `elapsedTime`. Iterates through managed materials:
            *   Retrieves the latest object state from `celestialObjectsStore`.
            *   Determines the primary light source position from the `lightSources` map (using `primaryLightSourceId` from the object state or falling back to the first available light source).
            *   Calls `material.update(t, lightSourcePosition)`.
            *   If a `camera` is provided, calculates the distance to the object, determines an LOD level (0-3) based on `lodThresholds`, and calls `material.updateLOD(lodLevel)`.
            *   Calls `updateRingMaterials` (from `../rings/rings`) to update any associated ring materials.
        *   `dispose`: Cleans up materials (body and rings) and geometries associated with specific object IDs.

3.  **Specific Gas Giant Renderers (`class-i.ts` through `class-v.ts`)**:
    *   Each file defines a specific renderer (e.g., `ClassIGasGiantRenderer`) extending `BaseGasGiantRenderer` and a corresponding material (e.g., `ClassIMaterial`) extending `BaseGasGiantMaterial`.
    *   **Material (`ClassIMaterial`, etc.)**:
        *   Loads specific vertex and fragment shaders for that class (e.g., `class-i.vertex.glsl`, `class-i.fragment.glsl`). These shaders implement the distinct visual appearance (cloud patterns, colors, atmospheric effects) for each class, often using procedural noise (like the 4D Simplex noise in `class-i.fragment.glsl`).
        *   Defines uniforms specific to its shader (e.g., `mainColor1`, `mainColor2`, `darkColor`, `uSeed`, `uWarpOctaves`, `uColorOctaves` in `ClassIMaterial`).
        *   The constructor typically takes options relevant to its appearance (e.g., `atmosphereColor`, `cloudColor`, `seed` for Class I).
        *   Implements `updateLOD(lodLevel)` to modify shader uniforms based on the LOD level. For example, `ClassIMaterial` adjusts the `uWarpOctaves` and `uColorOctaves` uniforms to reduce noise complexity at lower LODs.
    *   **Renderer (`ClassIGasGiantRenderer`, etc.)**:
        *   Implements the `getMaterial` method. This method retrieves necessary properties from the `CelestialObject` (like `atmosphereColor`, `cloudColor`, `seed` from `GasGiantProperties`) and instantiates the corresponding Material class (e.g., `ClassIMaterial`) with these properties.

4.  **Shaders (`../../shaders/gas-giants/`)**:
    *   Contains the GLSL vertex and fragment shaders for each gas giant class (`basic`, `class-i`, `class-ii`, etc.).
    *   These shaders are responsible for the detailed visual appearance, often involving complex procedural noise functions (e.g., 4D Simplex noise, fractal noise) and custom lighting/atmospheric scattering models.

**Key Characteristics & Design:**

*   **Class-Based System**: Organizes renderers based on the Sudarsky classification for gas giants, allowing distinct visual styles for each class.
*   **Inheritance Model**: Uses abstract base classes (`BaseGasGiantMaterial`, `BaseGasGiantRenderer`) to enforce structure and share common logic (mesh creation, update loop, ring handling, LOD framework).
*   **External Shaders**: Loads GLSL shaders from separate files (`.glsl`), unlike the star renderer's embedded approach. This promotes shader maintainability.
*   **LOD Implementation**: Features a Level of Detail system integrated into the `update` loop and material classes. Materials can adjust their complexity (e.g., shader uniform values like noise octaves) based on camera distance via the `updateLOD` method.
*   **Ring Integration**: Seamlessly integrates with the separate `rings` renderer module (`../rings/rings`) via the `addRings` method and calls to `createRings` and `updateRingMaterials`.
*   **State Dependency**: The `update` method relies on fetching the latest object state (including `primaryLightSourceId` and `position`) from the central `celestialObjectsStore`.
*   **Procedural Focus**: Relies heavily on procedural generation within GLSL shaders for the surface appearance of the gas giants. 