# Terrestrial Renderer Materials

This directory contains the `THREE.ShaderMaterial` implementations used by the `BaseTerrestrialRenderer`.

## Materials Overview

- **`procedural-planet.material.ts`**: Handles the rendering of planet surfaces generated procedurally using GLSL shaders (`procedural.vertex.glsl`, `procedural.fragment.glsl`). It takes procedural parameters (noise settings, colors) as input via `ProceduralSurfaceProperties` and sets up the shader uniforms. Supports multiple light sources.
- **`textured-planet.material.ts`**: Handles the rendering of planets using pre-baked texture maps (color, normal, height). Uses simpler shaders (`simple_texture.vertex.glsl`, `simple_texture.fragment.glsl`) and a basic Blinn-Phong lighting model supporting only a single light source.
- **`atmosphere.material.ts`**: Renders a planetary atmosphere effect using `atmosphere.vertex.glsl` and `atmosphere.fragment.glsl`. Uses `THREE.BackSide` rendering for the characteristic limb halo effect.
- **`clouds.material.ts`**: Renders dynamic cloud layers using `clouds.vertex.glsl` and `clouds.fragment.glsl`.

## Procedural Shader (`procedural.fragment.glsl`) Analysis & TODO

The current procedural fragment shader (`procedural.fragment.glsl`) uses a Fractal Brownian Motion (FBM) algorithm based on 3D gradient noise to generate a height value, which is then mapped to colors using a series of `smoothstep` blends. Lighting is calculated using a basic Blinn-Phong model supporting multiple lights.

**Current Algorithm:**

1.  **Input**: Object-space position, world position, world normal, uniforms for noise, colors, and lighting.
2.  **Noise**: Calculates FBM noise based on object position, using custom `gradientNoise` and parameters (`persistence`, `lacunarity`, `uOctaves`, `uSimplePeriod`).
3.  **Color Mapping**: Blends between `uColorLow`, `uColorMid1`, `uColorMid2`, `uColorHigh` using cascaded `smoothstep` functions based on the noise value.
4.  **Lighting**: Calculates ambient, diffuse, and basic Blinn-Phong specular contributions for up to `MAX_LIGHTS`.
5.  **Output**: Final lit color.

**TODO / Potential Improvements:**

- [ ] **Noise Function**: Replace the custom `gradientNoise` with a 3D Simplex noise implementation for potentially fewer grid artifacts.
- [ ] **FBM Variations**: Experiment with different FBM types (e.g., Ridged Multifractal, Billow) for more varied terrain features (mountains, valleys).
- [ ] **Color Mapping**: Refine the color mapping. Consider:
  - Using a 1D gradient texture lookup.
  - More explicit transition/blend controls (like the previously commented-out uniforms).
  - Ensure the current `smoothstep` ranges are logical and provide good artistic control.
- [ ] **Feature Generation**: Add more sophisticated geological features:
  - Use secondary noise functions for details (craters, continents).
  - Incorporate the `vHeight` varying for height-based effects (e.g., snow caps).
  - Explore domain warping for river-like or flow patterns.
- [ ] **Lighting Model**: Upgrade from basic Blinn-Phong to a PBR model (e.g., Cook-Torrance):
  - Introduce `roughness` and `metalness` uniforms (potentially derived from noise or properties).
  - Implement energy conservation.
- [ ] **Normal Mapping**: Implement proper normal calculation based on the procedural noise within the fragment shader (using derivatives or neighbor sampling) to give the surface actual bumpy detail that interacts with light.
- [ ] **Uniform Cleanup**: Remove commented-out / unused uniforms in the shader for clarity.
