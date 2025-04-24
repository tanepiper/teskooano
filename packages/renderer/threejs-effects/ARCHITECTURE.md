## Three.js Effects Analysis (`@teskooano/renderer-threejs-effects`)

This package provides managers and utilities for handling visual effects and optimizations like lighting and Level of Detail (LOD) within the Three.js rendering pipeline for the Teskooano engine.

**Key Goals:**

- **Performance Optimization**: Reduce GPU load by simplifying distant objects (`LODManager`).
- **Visual Enhancement**: Manage scene lighting, particularly star illumination (`LightManager`).
- **Encapsulation**: Isolate effect-related logic from core rendering and object-specific code.

**Core Components:**

1.  **`EffectsManager` (`index.ts`)**: A facade class that aggregates and coordinates the various effect managers.

    - Instantiates and holds references to `LightManager` and `LODManager`.
    - Provides a central `update()` method to drive the update cycles of its managed components (currently updates `LODManager`).
    - Handles the disposal of managed components.

2.  **`LightManager` (`LightManager.ts`)**: Responsible for managing dynamic light sources in the scene.

    - Manages a default `THREE.AmbientLight` for global illumination.
    - Tracks star point lights (`THREE.PointLight`) using a `Map`, keyed by the star's object ID.
    - Offers methods to `addStarLight`, `updateStarLight` (position), and `removeStarLight`.
    - Provides utility functions (`getStarLightPositions`, `getStarLightsData`) to access positional and color data of managed star lights, useful for shaders or other systems.
    - Includes a `dispose()` method to remove all managed lights.

3.  **`LODManager` (`LODManager.ts`)**: Manages Level of Detail for scene objects, primarily leveraging Three.js's built-in `THREE.LOD` system.

    - Requires a reference to the main `THREE.PerspectiveCamera` for distance calculations.
    - Maintains a `Map` (`objectLODs`) associating object IDs with their corresponding `THREE.LOD` instances.
    - Utilizes helper functions from the `lod-manager/` subdirectory for creating LOD mesh variations.
    - `createLODMesh(object, material, baseGeometry)`: Orchestrates the creation of a `THREE.LOD` instance for a given object, delegating mesh generation to `lod-mesh-builder`.
    - `update()`: Must be called each frame. Iterates through managed `THREE.LOD` objects and calls their internal `lod.update(this.camera)` method, which automatically switches the visible mesh based on camera distance.
    - Integrates optional debug visualization capabilities (`toggleDebug`, `updateDebugLabel`) using helpers from `lod-manager/debug-visualizer.ts`.
    - Provides `remove(objectId)` and `clear()` for cleanup.

4.  **`lod-manager/` (Subdirectory)**: Contains specialized logic for LOD mesh creation and distance calculations.
    - **`lod-mesh-builder.ts`**: Core logic for constructing `THREE.LOD` objects and their associated meshes.
      - `createReducedDetailMesh`: Generates a single `THREE.Mesh` with simplified geometry (Sphere or Icosahedron) for a specific LOD level. Crucially computes tangents if required by the material (e.g., for normal mapping).
      - `createLODSphereMesh`: Specialized function for creating LOD spheres (used by `EarthRenderer`).
      - `createLODMesh`: The primary function used by `LODManager`. Calculates distance thresholds (`calculateLODDistances`), determines geometry types (`getDetailSegments`), generates meshes for different levels (`createReducedDetailMesh`), and assembles them into a `THREE.LOD` object.
    - **`distance-calculator.ts`**: Calculates appropriate distance thresholds for LOD switching based on object type and size.
    - **`debug-visualizer.ts`**: Utility functions for creating and managing text-based debug labels (using `three-spritetext`) to show LOD info.

**Integration:**

- This package is intended to be consumed by the main `@teskooano/renderer-threejs` package, which would likely instantiate the `EffectsManager` and call its `update` method within the main render loop.
- Specific renderers (e.g., `PlanetRenderer`, `StarRenderer`) would interact with `LightManager` (to add/update star lights) and `LODManager` (to create LOD versions of the objects they manage).
