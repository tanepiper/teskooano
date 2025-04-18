## Three.js Effects Analysis (`threejs-effects`)

This package provides managers and utilities for handling visual effects and optimizations like lighting and Level of Detail (LOD) within the Three.js rendering pipeline.

**Core Components:**

1.  **`EffectsManager` (`index.ts`)**: A facade class aggregating effect managers.
    *   Instantiates `LightManager` and `LODManager`.
    *   Provides an `update()` method that calls the update logic for lighting (currently empty) and LOD.
    *   Handles disposal.

2.  **`LightManager.ts` (`LightManager`)**: Manages dynamic light sources, primarily point lights representing stars.
    *   Holds a reference to the main `THREE.Scene`.
    *   Creates and manages a default `THREE.AmbientLight`.
    *   Keeps track of star point lights (`THREE.PointLight`) in a Map (`starLights`) keyed by object ID.
    *   Provides methods to `addStarLight`, `updateStarLight` (position), and `removeStarLight`.
    *   `getStarLightPositions()`: Returns a Map of star IDs to their `THREE.Vector3` positions.
    *   `getStarLightsData()`: Returns a Map of star IDs to `{ position: THREE.Vector3, color: THREE.Color }`, intended for use by renderers/shaders that need color information.
    *   `dispose()`: Removes all managed lights from the scene.

3.  **`LODManager.ts` (`LODManager`)**: Manages Level of Detail (LOD) for scene objects, primarily using Three.js's built-in `THREE.LOD` class.
    *   Holds a reference to the main `THREE.PerspectiveCamera`.
    *   Maintains a Map (`objectLODs`) of object IDs to their corresponding `THREE.LOD` instances.
    *   Integrates functionality from the `lod-manager/` subdirectory.
    *   `createLODMesh(object, material, baseGeometry)`: Delegates to `createLODMesh` from `lod-manager/lod-mesh-builder.ts` to create a `THREE.LOD` object for a given `CelestialObject`, stores it, and returns it.
    *   `update()`: Iterates through all managed `THREE.LOD` objects and calls their internal `lod.update(this.camera)` method. This method (part of Three.js) automatically selects the appropriate detail level based on distance to the camera.
    *   Includes optional debug visualization (`toggleDebug`, `updateDebugLabel`) using helpers from `lod-manager/debug-visualizer.ts`.
    *   Provides `remove(objectId)` and `clear()` methods for cleanup.

4.  **`lod-manager/` (Subdirectory)**: Contains the core logic for building LOD meshes and calculating distances.
    *   **`lod-mesh-builder.ts`**: Contains the primary logic for constructing `THREE.LOD` objects.
        *   `createReducedDetailMesh(object, segments, material, baseGeometry, shapeHint)`: Creates a single `THREE.Mesh` with simplified geometry (Sphere or Icosahedron based on `shapeHint` and `segments`). Critically, it computes tangents (`geometry.computeTangents()`) if the material requires them (checking for `MeshStandardMaterial` with `normalMap` or specifically `TexturedPlanetMaterial`), necessary for normal mapping.
        *   `createLODSphereMesh(radius, material, levels)`: A specialized function (used by `EarthRenderer`) to create a `THREE.LOD` specifically with sphere geometries at different segment counts based on predefined distance levels.
        *   `createLODMesh(object, material, baseGeometry)`: The main function used by `LODManager` and likely most celestial renderers.
            *   Determines a `shapeHint` ('sphere' or 'asteroid') based on object properties.
            *   Calculates distance thresholds using `calculateLODDistances`.
            *   Creates multiple `THREE.Mesh` instances using `createReducedDetailMesh` with varying segment counts determined by `getDetailSegments` for different LOD levels (high, medium, low, very-low).
            *   Adds these meshes to a `THREE.LOD` object at the calculated distance thresholds.
            *   Handles potential use of a provided `baseGeometry` for the highest detail level.
            *   *Includes commented-out/incomplete logic for adding rings directly within this function, which seems misplaced (ring logic is typically handled by the Gas Giant renderer using the dedicated `rings` module).* 
    *   **`distance-calculator.ts`**: Calculates appropriate LOD distance thresholds based on object type and radius.
        *   `calculateLODDistances(object)`: Returns `{ closeDistance, mediumDistance, farDistance }`.
        *   `getDetailSegments(type, level)`: Returns the number of geometry segments appropriate for a given object type and detail level string ('high', 'medium', etc.).
    *   **`debug-visualizer.ts`**: Provides functions (`createDebugLabel`, `updateDebugLabel`, `disposeDebugLabel`) for creating and managing text-based debug labels (using `three-spritetext`) attached to LOD objects to display distance and level information.

**Key Characteristics & Design:**

*   **Effect Separation**: Isolates lighting and LOD management from core scene setup (`threejs-core`) and specific object rendering (`systems/celestial`).
*   **Manager Classes**: Uses dedicated managers (`LightManager`, `LODManager`) to encapsulate related functionality.
*   **Leverages THREE.LOD**: `LODManager` primarily utilizes the built-in `THREE.LOD` class for distance-based switching.
*   **Modular LOD Building**: The `lod-manager` subdirectory provides reusable functions for creating LOD meshes with different geometries and calculating distances, used by `LODManager` and potentially directly by renderers.
*   **Tangent Calculation**: Correctly includes logic to compute tangents for LOD meshes when normal mapping is required by the material.
*   **Centralized Light Info**: `LightManager` provides a way to get consolidated light data (`getStarLightsData`) needed by shaders/renderers.
*   **Debug Capabilities**: `LODManager` includes built-in, toggleable debug visualizations. 