## Terrestrial Renderer Analysis

This directory contains the rendering logic for terrestrial planets and moons within the Open Space engine.

**Core Components:**

1.  **`index.ts`**:

    - Acts as the main export point for the terrestrial rendering module.
    - Provides a factory function `createTerrestrialRenderer(object: CelestialObject)`. This function currently instantiates and returns `BaseTerrestrialRenderer` for any `CelestialObject` of type `PLANET`, `MOON`, or `DWARF_PLANET`. It doesn't differentiate renderer types based on the object, relying on the object's properties passed during mesh creation to define its appearance.
    - Exports the `BaseTerrestrialRenderer` class and the associated material classes (`AtmosphereMaterial`, `ProceduralPlanetMaterial`, `TexturedPlanetMaterial`).

2.  **`base-terrestrial.ts` (`BaseTerrestrialRenderer` class)**:

    - This is the primary class responsible for creating and managing the visual representation (Three.js `Object3D`) of a terrestrial body.
    - **Instantiation**: Creates instances of `PlanetMaterialService` and `AtmosphereCloudService` from the `./utils/` directory to handle specific creation tasks.
    - **Mesh Creation (`getLODLevels`)**:
      - Generates an array of `LODLevel` objects suitable for a `THREE.LOD` instance.
      - **High Detail (Level 0)**: Creates a `THREE.Group` for the highest detail level.
        - Calls the `materialService.createMaterial` method to get the appropriate material (e.g., `ProceduralPlanetMaterial`) for the planet body based on `object.properties`.
        - Creates the main planet body mesh (`THREE.Mesh`) with `THREE.SphereGeometry` and the created material.
        - Calls the `atmosphereCloudService.createCloudMesh` method. If clouds are defined and a mesh/material result is returned, it adds the cloud mesh to the group and stores the material.
        - Calls the `atmosphereCloudService.createAtmosphereMesh` method. If an atmosphere is defined and a mesh/material result is returned, it adds the atmosphere mesh to the group and stores the material.
      - **Medium/Low Detail (Level 1+)**: Creates simpler representations, often using `THREE.MeshStandardMaterial` or `THREE.MeshBasicMaterial` with a base color derived from `materialService.getBaseColor(object)`.
    - **Material Storage**: Maintains `Map` instances (`materials`, `atmosphereMaterials`, `cloudMaterials`) to hold references to the materials created via the services, keyed by the object ID. This allows the `update` method to access them.
    - **Update (`update`)**:
      - Updates shader uniforms for time (`elapsedTime`) for all relevant stored materials (`ProceduralPlanetMaterial`, `CloudMaterial`, `AtmosphereMaterial`).
      - Updates lighting uniforms (e.g., `sunPosition`, `lightPositions`) in the stored materials based on provided `lightSources` and the camera position.

3.  **`utils/planet-material-utils.ts` (`PlanetMaterialService` class)**:

    - Encapsulates the logic for creating planet body materials and determining base colors.
    - **`createMaterial`**: Takes a `RenderableCelestialObject` and returns an appropriate material (currently focused on `ProceduralPlanetMaterial`) based on the object's surface properties.
    - **`getBaseColor`**: Determines a representative `THREE.Color` for the planet, often used for lower LOD levels, based on surface properties or planet type.

4.  **`utils/atmosphere-cloud-utils.ts` (`AtmosphereCloudService` class)**:

    - Encapsulates the logic for creating atmosphere and cloud meshes and their associated materials.
    - **`createCloudMesh`**: Creates a `THREE.SphereGeometry` and `CloudMaterial`. Returns an object containing the `THREE.Mesh` and the `CloudMaterial` instance, or `null` if no clouds are defined.
    - **`createAtmosphereMesh`**: Creates a slightly larger `THREE.SphereGeometry` and `AtmosphereMaterial`. Returns an object containing the `THREE.Mesh` and the `AtmosphereMaterial` instance, or `null` if no atmosphere is defined.

5.  **`materials/procedural-planet.material.ts` (`ProceduralPlanetMaterial` class)**:

    - Extends `THREE.ShaderMaterial`.
    - Loads vertex (`procedural.vertex.glsl`) and fragment (`procedural.fragment.glsl`) shader code.
    - Defines uniforms required by the procedural shaders, including noise parameters, color bands, and lighting (supports multiple lights via uniform arrays).
    - Takes `ProceduralSurfaceProperties` in its constructor to initialize the relevant uniforms.
    - Includes an `update` method to update time and lighting uniforms.

6.  **`materials/atmosphere.material.ts` (`AtmosphereMaterial` class)**:

    - Extends `THREE.ShaderMaterial`.
    - Loads vertex (`atmosphere.vertex.glsl`) and fragment (`atmosphere.fragment.glsl`) shader code.
    - Defines uniforms: `time`, `atmosphereColor`, `atmosphereOpacity`, `sunPosition`.
    - **Rendering Style**: Configured with `transparent: true`, `side: THREE.BackSide` (key for halo effect), `blending: THREE.NormalBlending`, and `depthWrite: false`.
    - Includes an `update` method to update `time` and `sunPosition`.

7.  **`materials/clouds.material.ts` (`CloudMaterial` class)**:

    - Extends `THREE.ShaderMaterial`.
    - Loads vertex (`clouds.vertex.glsl`) and fragment (`clouds.fragment.glsl`) shader code.
    - Defines uniforms: `time`, `sunPosition`, `cameraPosition`, `cloudColor`, `cloudOpacity`, `cloudSpeed`.
    - **Rendering Style**: Configured with `transparent: true`, `depthWrite: false`, `blending: THREE.NormalBlending`, `side: THREE.FrontSide`.
    - Includes an `update` method to update `time`, `cameraPosition`, and `sunPosition`.

8.  **`materials/textured-planet.material.ts` (`TexturedPlanetMaterial` class)**:
    - Extends `THREE.ShaderMaterial`.
    - Designed for pre-baked textures (color, normal, height).
    - Loads vertex (`simple_texture.vertex.glsl`) and fragment (`simple_texture.fragment.glsl`) shader code.
    - Defines uniforms for textures and basic Blinn-Phong lighting (supports only a _single_ light source).
    - Includes helper methods (`setNormalScale`, `setLightingStyle`) for easier parameter adjustment.
    - Includes an `update` method to update light direction and color.

**Key Changes & Observations:**

- **Service Layer**: Material, cloud, and atmosphere creation logic is now delegated to dedicated services (`PlanetMaterialService`, `AtmosphereCloudService`) in the `utils` directory, improving separation of concerns in `BaseTerrestrialRenderer`.
- **No More IndexedDB**: The tight coupling to IndexedDB within `BaseTerrestrialRenderer` has been removed.
- **Focus**: The primary renderer (`BaseTerrestrialRenderer`) coordinates the use of these services and materials to build the final visual representation with LOD.
- **Material Differences**: Note the lighting differences between `ProceduralPlanetMaterial` (multi-light) and `TexturedPlanetMaterial` (single-light).
