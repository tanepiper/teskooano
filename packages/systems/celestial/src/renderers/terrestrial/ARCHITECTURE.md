## Terrestrial Renderer Analysis

This directory contains the rendering logic for terrestrial planets and moons within the Open Space engine.

**Core Components:**

1.  **`index.ts`**:
    *   Acts as the main export point for the terrestrial rendering module.
    *   Provides a factory function `createTerrestrialRenderer(object: CelestialObject)`. This function currently instantiates and returns `BaseTerrestrialRenderer` for any `CelestialObject` of type `PLANET`, `MOON`, or `DWARF_PLANET`. It doesn't differentiate renderer types based on the object, relying on the object's properties passed during mesh creation to define its appearance.
    *   Exports the `BaseTerrestrialRenderer` class and the associated material classes (`AtmosphereMaterial`, `ProceduralPlanetMaterial`, `TexturedPlanetMaterial`).

2.  **`base-terrestrial.ts` (`BaseTerrestrialRenderer` class)**:
    *   This is the primary class responsible for creating and managing the visual representation (Three.js `Object3D`) of a terrestrial body.
    *   **Mesh Creation (`createMesh`)**:
        *   Creates a `THREE.Group` to hold the planet body and atmosphere.
        *   Calculates a scaled radius for the planet using `scaleSize` from `@teskooano/data-types`.
        *   Calls `createPlanetMaterial` to get the appropriate material for the planet body.
        *   Uses `createLODMesh` (imported from `@teskooano/threejs-effects`) to create the main planet body mesh, handling Level of Detail internally.
        *   Calls `loadPlanetTextures` asynchronously to fetch or generate textures.
        *   Calls `addAtmosphere` to add an atmosphere mesh if the object has atmosphere properties and the detail level isn't "very-low".
    *   **Material Creation (`createPlanetMaterial`)**:
        *   Determines whether to use a procedural or textured material based on the `object.properties.surface` type.
        *   **Currently focused on `ProceduralSurfaceProperties`**: It instantiates `ProceduralPlanetMaterial` using the properties defined in `object.properties.surface`.
        *   *Note: Logic for `TexturedSurfaceProperties` exists but seems less developed.*
    *   **Texture Handling (`loadPlanetTextures`)**:
        *   **Procedural Focus**: Primarily handles the generation and caching of procedural textures.
        *   Generates a `cacheKey` based on the object's ID and procedural properties (seed, colors, transitions etc.).
        *   **IndexedDB Caching**: Attempts to retrieve pre-generated texture blobs (color and normal maps) from IndexedDB using the `cacheKey` via `getTextureFromDB`.
        *   **Generation**: If the texture isn't cached, it calls `generateTerrainTexture` (from `../../generation/procedural-texture`) which likely performs the actual procedural generation logic (e.g., using noise functions) on a `Canvas`. This function returns both a color `canvas` and a `normalCanvas`.
        *   **Blob Conversion & Caching**: Converts the generated canvases to `Blob` objects. It then saves these blobs (color and normal) to IndexedDB using `saveTextureToDB` with the `cacheKey`.
        *   **Texture Creation**: Creates `THREE.CanvasTexture` instances from the generated or loaded canvases/blobs.
        *   **Material Update**: Assigns the created color texture to `material.map` and the normal texture to `material.normalMap`. Sets `needsUpdate` flags.
        *   **Event Dispatch**: Dispatches custom events (`texture-progress`) during the process to indicate loading/generation status.
    *   **IndexedDB Helpers**: Contains tightly coupled helper functions (`openTextureDB`, `getTextureFromDB`, `saveTextureToDB`) for managing the texture cache in the browser's IndexedDB.
    *   **Atmosphere (`addAtmosphere`)**:
        *   Creates a slightly larger sphere (`THREE.SphereGeometry`) than the planet body.
        *   Instantiates `AtmosphereMaterial`.
        *   Creates a `THREE.Mesh` with this geometry and material and adds it to the main group.
    *   **Update (`update`)**:
        *   Updates shader uniforms for time (`elapsedTime`).
        *   Updates lighting uniforms (`lightDirection`, `lightColor`) in the planet body material based on provided `lightSources` and the camera position. Requires calculating light direction relative to the object's view space.
        *   Updates the `AtmosphereMaterial` uniforms (`time`, `sunPosition`).

3.  **`materials/procedural-planet.material.ts` (`ProceduralPlanetMaterial` class)**:
    *   Extends `THREE.ShaderMaterial`.
    *   Loads vertex (`procedural.vertex.glsl`) and fragment (`procedural.fragment.glsl`) shader code.
    *   Defines uniforms required by the procedural shaders:
        *   Basic lighting parameters (ambient, diffuse, specular, shininess, light direction/color).
        *   Procedural color bands (`color1` to `color5`).
        *   Transition points (`transition2` to `transition5`) and blend factors (`blend12` to `blend45`) for the color bands.
        *   `roughness`.
    *   Takes `ProceduralSurfaceProperties` in its constructor to initialize the color/transition/blend uniforms.
    *   Includes an `update` method specifically for updating light direction and color uniforms.

4.  **`materials/atmosphere.material.ts` (`AtmosphereMaterial` class)**:
    *   Extends `THREE.ShaderMaterial`.
    *   Loads vertex (`atmosphere.vertex.glsl`) and fragment (`atmosphere.fragment.glsl`) shader code.
    *   Defines uniforms: `time`, `atmosphereColor`, `atmosphereDensity`, `atmosphereOpacity`, `atmosphereScale`, `atmosphereSpeed`, `sunPosition`.
    *   **Rendering Style**: Configured with `transparent: true`, `side: THREE.BackSide`, `blending: THREE.AdditiveBlending`, and `depthWrite: false`. This combination is key to its appearance:
        *   `transparent: true`, `blending: THREE.AdditiveBlending`: Makes the material see-through and adds its color to whatever is behind it, creating a glow effect.
        *   `side: THREE.BackSide`: Renders only the *inside* surface of the atmosphere sphere. When looking at the planet, you see the inner surface of the far side of the atmosphere sphere, creating the halo effect around the planet's limb.
        *   `depthWrite: false`: Prevents the atmosphere from obscuring objects behind it in the depth buffer, which is usually desired for this kind of effect.
    *   Includes an `update` method to update `time` and `sunPosition`.

**Addressing Your Points:**

1.  **Procedural Generation Focus**: Yes, the current implementation heavily relies on procedural generation via `ProceduralPlanetMaterial` and the `generateTerrainTexture` function. The `TexturedPlanetMaterial` exists but seems secondary.
2.  **IndexedDB Coupling**: You are correct. The IndexedDB logic (`openTextureDB`, `getTextureFromDB`, `saveTextureToDB`) is directly within `base-terrestrial.ts`.
    *   **Decoupling Strategy**: This logic could be extracted into a separate module (e.g., `packages/core/caching/texture-cache.ts` or similar). This module could expose an interface like:
        ```typescript
        interface TextureCache {
          get(key: string): Promise<{ colorBlob: Blob; normalBlob: Blob } | null>;
          set(key: string, colorBlob: Blob, normalBlob: Blob): Promise<void>;
          clear(): Promise<void>; // For managing the cache
          // Potentially add methods to list keys or check size
        }
        ```
        `BaseTerrestrialRenderer` would then interact with this interface, making it easier to swap caching mechanisms, monitor the cache, or add UI controls for clearing it.
3.  **Normal/Bump Maps**: The system *is* set up to handle normal maps for procedurally generated textures.
    *   `generateTerrainTexture` is expected to return both a `colorCanvas` and a `normalCanvas`.
    *   `loadPlanetTextures` saves/loads both `colorBlob` and `normalBlob` to/from IndexedDB.
    *   It creates a `THREE.CanvasTexture` for the normal map and assigns it to `material.normalMap`.
    *   The `ProceduralPlanetMaterial` itself doesn't explicitly *use* the normal map in its current `*.material.ts` file (uniforms don't show `normalMap` or `normalScale`), but the *shader code* (`procedural.fragment.glsl`, which we haven't seen) *must* be using `texture2D(normalMap, vUv)` and applying it to the surface normal for the effect to work. The flatness suggests either the normal map generation in `generateTerrainTexture` is weak/incorrect, the `normalScale` (if used in the shader) is too low, or the lighting calculation in the shader isn't correctly utilizing the perturbed normal.
4.  **Atmosphere Appearance**: The "ring" effect is a direct consequence of rendering the atmosphere using `THREE.BackSide` and `THREE.AdditiveBlending`.
    *   You only see the *inside* faces of the atmosphere sphere.
    *   When looking directly at the planet center, the back faces you see are the ones on the far side of the sphere, forming the glowing edge (limb).
    *   The faces directly between you and the planet *are* being rendered, but because they are additive and potentially have lower opacity/density values based on view angle (often controlled by a Fresnel calculation in the shader: `atmosphere.fragment.glsl`), they appear very transparent against the bright planet surface.
    *   To make the atmosphere more visible across the front face, the logic within `atmosphere.fragment.glsl` needs adjustment, likely by reducing the impact of the Fresnel effect or increasing the base opacity/density when viewing the surface head-on.
