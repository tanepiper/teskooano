# Changelog - @teskooano/celestial

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- **Major Refactor (Materials & Textures)**:
  - Removed the entire old procedural texture generation system (deleted `textures/` directory including `TextureFactory.ts`, `TextureGeneratorBase.ts`, and individual generator classes like `GasGiantTextureGenerator.ts`, `TerrestrialTextureGenerator.ts`, etc.).
  - Removed the old material management system (deleted `MaterialFactory.ts` and individual material classes like `PlanetMaterial.ts`, `StarMaterial.ts`, etc.).
  - Introduced a new `materials/` directory with dedicated functions for material creation:
    - `createProceduralPlanetMaterial.ts`: For generating planet materials, likely using shaders and uniforms defined in `types/procedural.ts`.
    - `createRingMaterial.ts`: For ring system materials.
    - `createStarMaterial.ts`: For star materials.
  - Updated `BaseTerrestrialRenderer.ts`, `RingSystemRenderer.ts`, and `BaseStarRenderer.ts` to use these new material creation functions instead of the old factories.
- Added `types/procedural.ts` defining `ProceduralPlanetUniforms` for shader-based planet rendering.
- General comment cleanup and minor refactoring in `utils/event-dispatch.ts` and `vitest.config.ts`.

### Removed

- Deleted `AtmosphereMaterial.ts`, `BaseCelestialMaterial.ts`, `GasGiantMaterial.ts`, `SpaceRockMaterial.ts`, `SunMaterial.ts` as part of the material system overhaul.
- Deleted `textures/RingTextureGenerator.ts` (and other texture generators as noted above).

## [0.1.0] - 2025-04-24

### Added

- **Core Renderer Interface (`CelestialRenderer`)**: Basic contract for creating, updating, and disposing celestial object meshes.
- **Terrestrial Planet/Moon Renderer (`BaseTerrestrialRenderer`)**: Unified renderer for terrestrial bodies.
  - Supports procedural texture generation using 3D Simplex Noise (`generation/procedural-texture.ts`).
  - Includes generation of color and normal map textures (`OffscreenCanvas`).
  - Implements detailed color mapping based on surface properties (`getColorForHeight`).
  - Integrates basic IndexedDB caching for generated textures.
  - Includes `AtmosphereMaterial` for atmospheric haze effect (Fresnel-based).
  - Uses external LOD helper (`@teskooano/threejs-effects`).
  - Dispatches `texture-progress` events (`utils/event-dispatch.ts`).
- **Star Renderers (`renderers/stars/`)**: Renderers for main sequence spectral types (O, B, A, F, G, K, M) and exotic objects.
  - `BaseStarRenderer` with common logic and embedded shaders (`star.vertex.glsl`, `star.fragment.glsl`).
  - Surface effects include turbulence, pulsing, metallic fluid look.
  - `CoronaMaterial` for billboarded corona effect.
  - Specific renderers for Neutron Stars (with jets), White Dwarfs, Wolf-Rayet, Schwarzschild & Kerr Black Holes.
  - Integration with `GravitationalLensingHelper` for relevant objects.
- **Gas Giant Renderers (`renderers/gas-giants/`)**: Class-based system (Sudarsky I-V).
  - `BaseGasGiantRenderer` with common logic.
  - Specific materials and external GLSL shaders per class using procedural noise.
  - Material-level LOD support (`updateLOD`).
  - Integration with `rings` renderer.
- **Planetary Ring Renderer (`renderers/rings/`)**: Modular system for creating rings.
  - Data-driven `createRings` function based on `RingProperties`.
  - Uses `RingGeometry` and `RingMaterial` with external shaders.
  - Includes basic lighting and parent body shadow casting on rings.
- **Particle Renderers (`renderers/particles/`)**: Uses `THREE.Points`.
  - `AsteroidFieldRenderer` for disk-shaped fields.
  - `OortCloudRenderer` for spherical shell clouds (includes particle count LOD).
  - Uses shared embedded point sprite texture.
- **Earth Renderer (`renderers/earth/`)**: Specialized renderer for Earth.
  - Uses specific textures (day, night, specular, bump, cloud).
  - Layered approach with `EarthMaterial` and `CloudMaterial`.
  - Utilizes external LOD helper (`createLODSphereMesh`).
  - Implements day/night cycle based on lighting.
- **Common Utilities (`renderers/common/`)**:
  - `GravitationalLensingHelper`: Reusable gravitational lensing effect using render-to-texture.
- **Texture Generation System (`textures/`)**:
  - `TextureFactory` facade.
  - Specific generator classes (`TerrestrialTextureGenerator`, etc.).
  - `TextureTypes.ts` defining configuration options.
  - `TextureGeneratorBase` for potential shader-based generation (currently mismatched with terrestrial).
- **Shaders (`shaders/`)**: Organized GLSL shaders for various effects mentioned above.
- **Utilities (`utils/`)**:
  - Event dispatching for texture progress.
  - Type definitions for events.

### Changed

- **Texture Generation System Refactor**:
  - Added `TextureResourceManager` for centralized WebGL resource management.
  - Refactored texture generators to use instance methods instead of static methods.
  - Standardized `TextureResult` interface for all texture generators.
  - Improved texture caching with built-in caching in base generator class.
  - Enhanced resource management for efficient WebGL context usage.
  - Added support for both WebGL shader-based and canvas-based generation approaches.

## [0.2.0] - 2025-05-15

### Added

- **New features and improvements**:
  - Added new features and improvements to the existing system.

### Changed

- **Texture Generation System Refactor**:
  - Added new texture generation capabilities.

### Removed

- **Removed obsolete features**:
  - Removed obsolete features from the system.
