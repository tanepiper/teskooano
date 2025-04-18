# Celestial System Architecture Analysis

This document provides a consolidated overview of the architecture within the `packages/systems/celestial` package, synthesizing analyses from its subdirectories (renderers, generation, textures, shaders, utils).

## I. Overview

The `celestial` package is responsible for defining, generating, and rendering various celestial objects within the Open Space engine. It encompasses:

- **Data Representation**: (Assumed, defined in `@teskooano/data-types`) Defines the properties and types of celestial objects (Stars, Planets, Moons, Asteroids, Black Holes, etc.).
- **Procedural Generation**: Creates procedural textures (color, normal maps) for object surfaces, primarily using 3D Simplex noise.
- **Texture Management**: Provides a framework for generating and potentially caching different types of textures.
- **Rendering**: Contains various renderers responsible for creating and managing the Three.js visual representations (`Object3D`) of different celestial object types, utilizing custom shaders and materials.
- **Shaders**: Holds the GLSL shader code implementing visual effects, lighting, and procedural patterns.
- **Common Utilities**: Includes shared components like gravitational lensing effects and event dispatchers.

## II. Core Sub-Systems Analysis

### A. Renderers (`src/renderers/`)

This is the largest and most complex part, containing specific logic for different object categories.

- **Overall Structure**: Organized into subdirectories per object type (terrestrial, stars, gas-giants, rings, particles, earth, common).
- **Renderer Interface**: Most renderers implement a common (though not formally defined in a shared file) `CelestialRenderer` interface with methods like `createMesh`, `update`, and `dispose`.
- **Common Patterns**:
  - **Mesh Creation (`createMesh`)**: Typically creates a `THREE.Group`, determines appropriate geometry (often `SphereGeometry`, `RingGeometry`, `PlaneGeometry`, or `Points`), instantiates custom materials, potentially adds secondary elements (atmosphere, clouds, rings, corona, jets), and loads/assigns textures or triggers procedural generation.
  - **Material Management**: Renderers often manage instances of custom `THREE.ShaderMaterial` subclasses, storing them in Maps keyed by object ID.
  - **Update Loop (`update`)**: Called per frame to update time-based uniforms in materials, handle animations, update LOD, and potentially react to changes in light sources or camera position.
  - **Disposal (`dispose`)**: Cleans up associated Three.js resources (geometries, materials, textures) for specific objects.
- **Variations & Inconsistencies**:
  - **Base Classes**: Some renderers use abstract base classes (`BaseStarRenderer`, `BaseGasGiantRenderer`) to share logic, while others are self-contained (`Terrestrial`, `Earth`, `Particles`).
  - **Factory Functions**: Some have factory functions (`createStarRenderer`, `createEarthRenderer`, `createTerrestrialRenderer`), while others don't (`GasGiants`, `Particles`, `Rings`).
  - **LOD**: Level of Detail is handled differently: via external helpers (`createLODMesh`, `createLODSphereMesh` used by Terrestrial/Earth), integrated into the material (`updateLOD` in Gas Giants), or by adjusting particle counts (`OortCloudRenderer`). Stars use multiple fixed meshes/planes for corona LOD.
  - **Shader Handling**: Most load external `.glsl` files, but the `Star` renderer embeds shaders as strings.
  - **Lighting**: Lighting calculations and uniform requirements vary. Some shaders expect world-space positions, others might use view-space. Multi-light support exists in some shaders but isn't consistently applied across all renderers. Update methods fetch light source info from a `lightSources` map passed in, often falling back to defaults.
  - **State Dependency**: Many `update` methods rely on fetching object state (position, `primaryLightSourceId`) directly from `celestialObjectsStore`.
  - **Texture Handling**: Terrestrial renderer handles procedural texture generation _and_ IndexedDB caching directly within its `loadPlanetTextures` method. Earth renderer loads specific static textures. Other renderers likely expect textures to be provided or generated via the `TextureFactory`.
- **Specialized Renderers**:
  - **Terrestrial**: Focuses on procedural texture generation (using `../generation/procedural-texture.ts`) and IndexedDB caching. Includes atmosphere rendering.
  - **Stars**: Handles various spectral types and exotics (neutron stars, black holes). Uses embedded shaders, billboarded corona effects, and integrates the common `GravitationalLensingHelper`.
  - **Gas Giants**: Uses a class-based system (Sudarsky classification) with distinct shaders per class. Integrates the `rings` renderer and has material-level LOD.
  - **Rings**: A modular, data-driven system using `RingGeometry` and shaders with shadow calculations. Designed to be used by other renderers.
  - **Particles**: Uses `THREE.Points` and `PointsMaterial` for asteroid fields and Oort clouds, with procedural placement and distinct `sizeAttenuation` settings.
  - **Earth**: A highly specialized renderer for Earth using specific textures, layered materials (body, clouds), and LOD.
- **Common (`src/renderers/common/`)**:
  - **`GravitationalLensingHelper`**: Provides reusable lensing effect via render-to-texture and a custom shader material. Implies multi-pass rendering.

### B. Procedural Generation (`src/generation/`)

Responsible for creating procedural textures on the CPU.

- **Primary Method**: Uses 3D Simplex Noise via `simplex-noise` library (`procedural-texture.ts`).
- **Key Technique**: Maps 2D texture coordinates to 3D sphere coordinates (`mapEquirectangularToSphere`) before sampling 3D noise, ensuring seamless spherical textures.
- **Color Mapping**: Complex `getColorForHeight` function maps normalized noise values (height) to colors based on detailed `SurfacePropertiesUnion` types, supporting blending.
- **Output**: Generates color and normal maps as `OffscreenCanvas` objects.
- **Caching**: Simple in-memory cache for generated textures.
- **Legacy Code**: Contains an apparently unused `diamond-square.ts` implementation with significant code duplication (helpers, `getColorForHeight`).

### C. Texture System (`src/textures/`)

Provides a framework and factory for accessing texture generators.

- **Resource Management**: `TextureResourceManager` provides centralized management of WebGL resources (renderer, render target, scene, camera) for efficient texture generation.
- **Generators**: Separate generator classes (`TerrestrialTextureGenerator`, `GasGiantTextureGenerator`, etc.) extend `TextureGeneratorBase`.
- **Base Class**: `TextureGeneratorBase` provides shared WebGL resources (via the resource manager) for texture generation with built-in caching.
- **Factory**: `TextureFactory` manages instances of texture generators and provides a simplified API with additional caching.
- **Mixed Approaches**: Supports both WebGL shader-based generation and CPU canvas-based generation as appropriate for each texture type.
- **Standardized Results**: All generators return a consistent `TextureResult` interface from `TextureTypes.ts`.
- **Instance Methods**: Uses instance-based architecture instead of static methods for better state management and resource control.
- **Type Integration**: Leverages types from `@teskooano/data-types` for configuration options.

### D. Shaders (`src/shaders/`)

Contains GLSL code defining the visual appearance and effects.

- **Organization**: Grouped into subdirectories by object type.
- **Techniques**: Employs procedural noise (Simplex, FBM), various lighting models (Ambient/Diffuse, Blinn-Phong, Multi-light), texturing (including day/night blending, specular, normal maps), atmospheric scattering (Fresnel), shadow mapping (rings), and distortion effects (lensing).
- **Configuration**: Highly configurable via uniforms passed from materials.
- **Inconsistency**: Star shaders are embedded in TypeScript, unlike others which are external `.glsl` files.

### E. Utilities (`src/utils/`)

Small helper modules.

- **Event Dispatch**: Provides functions (`dispatchTextureProgress`, `dispatchTextureGenerationComplete`) to dispatch custom DOM events for texture generation status, enabling decoupled communication (used by `BaseTerrestrialRenderer`).
- **Types**: Defines the structure for event details (`TextureProgressEventDetail`).

## III. Strengths

1.  **Modularity (Partial)**: Dividing renderers and shaders by celestial type allows for specialization (e.g., detailed Earth, specific Gas Giant classes, complex Star effects). The `rings` and `common/gravitational-lensing` modules are good examples of reusable components.
2.  **Procedural Power**: Leverages procedural generation effectively (especially 3D Simplex noise for seamless spherical textures) for creating varied terrestrial surfaces and potentially other effects (gas giants, stars).
3.  **Data-Driven Configuration**: Uses data types (`@teskooano/data-types`) and specific options (`TextureTypes.ts`) to configure object appearance and generation. Ring creation is purely data-driven.
4.  **Advanced Effects**: Implements complex visual effects like gravitational lensing, day/night cycles (Earth), atmospheric glow, and planetary shadows on rings.
5.  **Decoupled Communication**: Uses DOM events (`utils/event-dispatch.ts`) for texture progress reporting, avoiding tight coupling between generation and UI.

## IV. Weaknesses & Inconsistencies

1.  **Inconsistent Renderer Structure**: Lack of a strictly enforced base class or interface for all renderers leads to variations in structure and capabilities (e.g., factory functions, LOD handling, update method signatures).
2.  **Inconsistent Shader Handling**: Star renderer embeds shaders, while others load external files. This makes star shaders harder to manage and edit.
3.  **Code Duplication**: Significant duplication of helper functions (color math, `getColorForHeight`) between `generation/diamond-square.ts` (legacy) and `generation/procedural-texture.ts`.
4.  **Tight Coupling (Specific Cases)**:
    - `BaseTerrestrialRenderer` directly handles IndexedDB caching logic instead of using a dedicated caching service/module.
    - Many renderer `update` methods directly access the global `celestialObjectsStore` for position/lighting info, creating a dependency.
5.  **LOD Handling Variations**: Level of Detail is implemented differently across renderers (external helpers, material methods, particle counts, fixed meshes), lacking a unified strategy.
6.  **Legacy Code**: Presence of the apparently unused `diamond-square.ts` adds clutter.

## V. Suggestions & Next Steps

1.  **Define a Unified Renderer Interface/Base Class**: Create a formal `CelestialRenderer` interface or an abstract base class in a central location (e.g., `src/renderers/index.ts` or `src/renderers/common/`). Enforce consistent methods (`createMesh`, `update`, `dispose`) and potentially common utility functions or properties (e.g., managing materials).
2.  **Consolidate Texture Generation**:
    - A new `TextureResourceManager` for efficient WebGL resource sharing.
    - Standardized `TextureResult` interface across all generators.
    - Instance-based generators with built-in caching.
    - Support for both WebGL and canvas-based approaches as appropriate.
3.  **Refactor Shader Handling**: Modify the `Star` renderer to load shaders from external `.glsl` files, consistent with other renderers. Store these in `src/shaders/star/`.
4.  **Decouple Concerns**:
    - Extract IndexedDB logic from `BaseTerrestrialRenderer` into a dedicated caching module/service (e.g., `packages/core/caching` or `src/caching`).
    - Reduce direct dependency on `celestialObjectsStore` in renderer `update` methods. Consider passing necessary object state (position, light source ID) explicitly as arguments to `update` or via subscription patterns if renderers become more stateful.
5.  **Standardize LOD**: Develop a common LOD strategy. This could involve:
    - Using the external helpers (`createLODMesh`, `createLODSphereMesh`) more broadly.
    - Standardizing the material `updateLOD` method approach used by Gas Giants.
    - Defining clear LOD thresholds and corresponding actions (geometry change, shader complexity change, texture resolution change) centrally.
6.  **Review Static Usage**: Evaluate if the static nature of `TextureFactory` and generators is optimal. Consider if instance-based approaches might offer more flexibility or testability, especially if generators need internal state or dependencies.
7.  **Refine Atmosphere Rendering**: Address the transparency issue noted for the terrestrial atmosphere by adjusting the Fresnel/opacity logic in `shaders/terrestrial/atmosphere.fragment.glsl`.
8.  **Improve Normal Maps**: Investigate why terrestrial procedural normal maps appear flat. Check the `generateNormalMapFromHeightData` logic, the `normalStrength` parameter, and ensure the procedural shader (`procedural.fragment.glsl`) correctly samples `normalMap` and applies `normalScale`.

**Priority Suggestion:** Start by unifying the renderer structure (Suggestion 1), then tackle decoupling (Suggestion 4).
