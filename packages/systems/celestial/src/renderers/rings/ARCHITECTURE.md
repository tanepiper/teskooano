## Planetary Ring Renderer Analysis

This directory contains the rendering logic specifically for planetary rings, designed to be used by other renderers (like the Gas Giant renderer).

**Core Components:**

1.  **`index.ts`**:
    *   Only exports `rings.ts`. It doesn't export the `RingMaterial` or helper functions directly, suggesting they are primarily intended for internal use or use via the `rings.ts` functions.

2.  **`rings.ts`**:
    *   Contains the main logic for creating, updating, and disposing of ring systems.
    *   **`RingMaterial`**: Extends `THREE.ShaderMaterial`.
        *   Loads vertex (`ring.vertex.glsl`) and fragment (`ring.fragment.glsl`) shaders.
        *   Defines uniforms for appearance (`color`, `opacity`, `textureMap`, `hasTexture`), lighting/shadows (`uSunDirection`, `uParentPosition`, `uParentRadius`), animation (`time`), quality (`qualityFactor`), and variation (`ringIndex`, `ringType`).
        *   Constructor takes `ringColor` and options including `opacity`, `textureMap`, `detailLevel`, `ringIndex`, and `ringType`. The `detailLevel` adjusts a `qualityFactor` uniform, and `ringType` sets a `typeCoef` uniform, presumably for shader variations (though the provided fragment shader doesn't use them).
        *   `update(time, sunDirection, parentPosition, parentRadius)`: Updates `time`, `uSunDirection`, `uParentPosition`, and `uParentRadius` uniforms. Ensures `sunDirection` is normalized.
        *   `dispose`: Disposes of the `textureMap` if it exists.
    *   **`createRings(object, rings, options)` (Function)**:
        *   The primary function for generating the ring visuals.
        *   Takes the parent `CelestialObject`, an array of `RingProperties`, and rendering `options` (currently just `detailLevel`).
        *   Creates a `THREE.Group` (`ringsGroup`) to hold all the individual ring meshes.
        *   Iterates through the `rings` array (each `ringData` in `RingProperties`).
        *   Calculates the scaled inner and outer radii for each ring by multiplying the relative radii in `ringData` by the parent `object.radius` (which is assumed to be the *scaled* radius of the parent body).
        *   Creates a `THREE.RingGeometry` for each ring.
        *   Loads textures using `THREE.TextureLoader` if `ringData.texture` is provided.
        *   Instantiates a `RingMaterial` for each ring, passing color, opacity, texture, detail level, and ring index.
        *   Creates a `THREE.Mesh` for each ring, rotates it flat (`rotation.x = Math.PI / 2`), and adds it to `ringsGroup`.
        *   Applies the axial tilt from the parent `object.axialTilt` to the entire `ringsGroup`.
        *   Stores the created `RingMaterial` instances in the `ringsGroup.userData.ringMaterials` array for later access.
        *   Returns the `ringsGroup`.
    *   **`updateRingMaterials(materials, time, sunDirection, parentPosition, parentRadius)` (Function)**:
        *   A helper function to iterate through an array of `RingMaterial` instances and call their `update` method, passing the necessary lighting and position parameters.
    *   **`disposeRingMaterials(materials)` (Function)**:
        *   A helper function to iterate through an array of `RingMaterial` instances and call their `dispose` method.

3.  **Shaders (`../../shaders/ring/`)**:
    *   **`ring.vertex.glsl` (Not read, but implied)**: Likely handles transforming vertex positions and calculating varyings like `vUv`, world position (`vPosition`), world normal (`vNormal`), and potentially others needed by the fragment shader.
    *   **`ring.fragment.glsl`**: Calculates the final color and opacity.
        *   Implements basic lighting (ambient + diffuse) using the world normal (`vNormal`) and sun direction (`uSunDirection`).
        *   Includes a shadow calculation (`checkShadow`) using ray-sphere intersection between the fragment position (`vPosition`), parent body position (`uParentPosition`), parent radius (`uParentRadius`), and sun direction (`uSunDirection`). This correctly simulates the planet casting a shadow on its rings.
        *   Applies a simple variation based on distance from the center (`vUv`) and time.
        *   Combines lighting, shadow factor, and variation with the base `color` and `opacity` uniforms.

**Key Characteristics & Design:**

*   **Modular & Reusable**: Designed as a distinct module (`rings.ts`) with functions (`createRings`, `updateRingMaterials`, `disposeRingMaterials`) that can be easily called by other renderers (like `BaseGasGiantRenderer`) that need to display rings.
*   **Data-Driven**: `createRings` takes an array of `RingProperties`, allowing complex ring systems to be defined purely through data.
*   **Geometry**: Uses standard `THREE.RingGeometry` for each distinct ring defined in the properties.
*   **External Shaders**: Loads GLSL shaders from separate files.
*   **Lighting & Shadows**: Implements world-space lighting and includes a relatively accurate shadow calculation for the parent body casting shadows on the rings.
*   **Performance Considerations**: Includes a `qualityFactor` uniform derived from `detailLevel`, suggesting potential for shader-based performance scaling (though not utilized in the provided fragment shader). `depthWrite` is set to `false`, which is common for transparent effects like rings to avoid sorting issues but can sometimes cause draw order problems.
*   **Coordinate Spaces**: Handles calculations (like shadows) correctly in world space by using uniforms (`uSunDirection`, `uParentPosition`) and varyings (`vPosition`, `vNormal`) passed from the vertex shader.
*   **Scalability**: Uses the parent object's *scaled* radius (`object.radius`) when calculating ring dimensions, ensuring rings scale appropriately with the parent body's visual representation. 