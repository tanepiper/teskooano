## Star Renderer Analysis

This directory contains the rendering logic for various types of stars and stellar remnants (like neutron stars and black holes) within the Open Space engine.

**Core Components:**

1.  **`index.ts`**:

    - Exports all individual star renderer classes (e.g., `ClassGStarRenderer`, `NeutronStarRenderer`, `KerrBlackHoleRenderer`) and the base classes/materials.
    - Provides a factory function `createStarRenderer(spectralClass?: string, stellarType?: StellarType): BaseStarRenderer`. This function acts as a central point to instantiate the correct renderer based on the star's `StellarType` (which takes precedence) or its `spectralClass`. It handles mapping these properties to the corresponding renderer class (e.g., `StellarType.NEUTRON_STAR` maps to `NeutronStarRenderer`, spectral class 'G' maps to `ClassGStarRenderer`). Returns a `MainSequenceStarRenderer` as a default if no specific match is found.

2.  **`base-star.ts`**:

    - Defines the core rendering logic and base classes used by all specific star types.
    - **`starVertexShader`, `starFragmentShader`, `coronaFragmentShader`**: Contains GLSL shader code embedded as template literals.
      - `starFragmentShader`: Implements effects like surface turbulence (using noise/turbulence functions), limb darkening (though heavily reduced), pulsing, temperature variation, a "metallic fluid" effect, and a basic glow. It takes uniforms like `time`, `starColor`, `coronaIntensity`, `pulseSpeed`, `glowIntensity`, `temperatureVariation`, `metallicEffect`.
      - `coronaFragmentShader`: Designed for billboarded planes around the star. Creates a pulsing, noisy, radial gradient effect using uniforms like `time`, `starColor`, `opacity`, `pulseSpeed`, `noiseScale`.
    - **`BaseStarMaterial` (Abstract Class)**: Extends `THREE.ShaderMaterial`. Uses `starVertexShader` and `starFragmentShader`. It accepts a base `color` and options for shader effects (`coronaIntensity`, `pulseSpeed`, etc.) in its constructor. Provides an `update(time)` method to update the `time` uniform. Specific star materials inherit from this.
    - **`CoronaMaterial`**: Extends `THREE.ShaderMaterial`. Uses a standard vertex shader (implied, not shown) and `coronaFragmentShader`. Used for rendering the billboarded corona effect. Takes `color` and options (`scale`, `opacity`, `pulseSpeed`, `noiseScale`). Provides an `update(time)` method.
    - **`BaseStarRenderer` (Abstract Class)**: Implements `CelestialRenderer`. Manages the creation and animation of star meshes.
      - `materials`: Map to store the main `BaseStarMaterial` for each star instance.
      - `coronaMaterials`: Map to store arrays of `CoronaMaterial` instances (multiple planes per star) for the corona effect.
      - `createMesh`: Creates a `THREE.Group`. Creates the main star body (a `THREE.SphereGeometry` mesh) using the material returned by the abstract `getMaterial` method. Calls `addCorona` to add the corona effect.
      - `addCorona`: Creates multiple (`coronaScales.length` \* 3) `THREE.PlaneGeometry` meshes, arranged as billboards (facing the camera, achieved via `rotation.order = 'YXZ'` and likely updated in `animate` or `update`). Each plane uses a `CoronaMaterial` with varying scales and opacities to create a layered effect. Stores materials in `coronaMaterials` map.
      - `getMaterial` (Abstract Method): Must be implemented by subclasses to return the specific `BaseStarMaterial` for that star type.
      - `getStarColor` (Protected Method): Provides a default way to get the star's color from `object.properties.color`, defaulting to yellow if not specified. Subclasses can override this.
      - `update(time)`: Updates the `elapsedTime` and calls `update` on all stored `BaseStarMaterial` and `CoronaMaterial` instances.
      - `animate()`: Intended for animations specific to the renderer (e.g., rotating billboards to face the camera, although the implementation might be in `update` or handled by Three.js `Billboard` class if used). Currently empty in the base class.
      - `dispose`: Cleans up materials and geometries associated with specific object IDs.

3.  **Specific Star Renderers (`main-sequence-star.ts`, `class-g.ts`, `neutron-star.ts`, `kerr-black-hole.ts`, etc.)**:
    - Most main-sequence class renderers (`class-o.ts` to `class-m.ts`, `main-sequence-star.ts`) are very simple:
      - They extend `BaseStarRenderer`.
      - They often define a corresponding Material class (e.g., `MainSequenceStarMaterial`) that extends `BaseStarMaterial`, primarily just calling the `super` constructor with specific default options or color.
      - They implement `getMaterial` to return an instance of their specific material, usually passing the color obtained from `getStarColor`.
      - They might override `getStarColor` to return a specific color for that spectral type (e.g., `ClassOStarRenderer` likely returns a blueish color).
    - **Exotic Renderers (e.g., `neutron-star.ts`, `schwarzschild-black-hole.ts`, `kerr-black-hole.ts`)**:
      - Extend `BaseStarRenderer` but often add more complex features.
      - **`NeutronStarRenderer`**:
        - Uses `NeutronStarMaterial` (extends `BaseStarMaterial` with specific intense/fast options and pale blue color).
        - Defines `PulsarJetMaterial` (custom `ShaderMaterial`) for rendering cones.
        - Overrides `createMesh` to add radiation jets (`addRadiationJets`) and an enhanced glow (`addEnhancedGlow`).
        - Overrides `addCorona` to use much larger scales and higher opacities to make the physically small neutron star visible.
        - Includes `addRadiationJets` to create cone meshes with `PulsarJetMaterial`.
        - Includes logic for `GravitationalLensingHelper`.
        - Overrides `update` to update jet materials and the lensing helper.
        - Overrides `dispose` to clean up jet materials and lensing helper.
      - **Black Hole Renderers (`schwarzschild-black-hole.ts`, `kerr-black-hole.ts`)**:
        - Do _not_ typically render a central body mesh in the same way as stars.
        - Define specific materials (e.g., `AccretionDiskMaterial`, `EventHorizonMaterial`) using custom shaders (embedded as strings).
        - Override `createMesh` significantly to build the visual representation from components like an accretion disk (often a `THREE.RingGeometry` or custom geometry), potentially jets, and the event horizon effect.
        - Rely heavily on `GravitationalLensingHelper` for the visual distortion effect.
        - Override `update` and `dispose` to manage their specific materials and the lensing helper.

**Key Characteristics & Design:**

- **Inheritance Model**: Uses a base renderer (`BaseStarRenderer`) and base material (`BaseStarMaterial`) with abstract methods (`getMaterial`) to enforce structure, allowing specific star types to provide their unique materials and colors.
- **Shader Embedding**: Shaders (vertex, fragment) are embedded directly as strings within the TypeScript files (`base-star.ts`, black hole renderers, etc.) rather than being loaded from separate `.glsl` files. This simplifies the build process but makes shaders harder to edit and manage independently.
- **Factory Function**: `createStarRenderer` provides a centralized way to get the correct renderer instance.
- **Corona Effect**: Uses multiple billboarded, textured planes with additive blending for the corona, managed by `BaseStarRenderer` and `CoronaMaterial`.
- **Exotic Object Complexity**: Renderers for neutron stars and black holes significantly override base functionality to add unique visual elements like jets, accretion disks, and gravitational lensing.
- **Gravitational Lensing**: A separate helper (`GravitationalLensingHelper`) is used by neutron stars and black holes, indicating a reusable component for this complex effect.
