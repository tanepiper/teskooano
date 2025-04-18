## Shader Analysis

This directory contains all the GLSL shader code used by the various renderers. Shaders are organized into subdirectories based on the type of celestial object they primarily apply to (e.g., `terrestrial`, `gas-giants`, `star`, `earth`, `ring`).

**Organization & Structure:**

- **Categorization**: Shaders are grouped logically by the type of object they render.
- **Vertex/Fragment Pairs**: Most shaders come in pairs: a `.vertex.glsl` file and a `.fragment.glsl` file. The vertex shader handles vertex transformations (position, normals, UVs) and passes data (varyings) to the fragment shader. The fragment shader calculates the final color and opacity for each pixel.
- **Naming Conventions**: Files often indicate their specific purpose (e.g., `procedural.fragment.glsl`, `atmosphere.fragment.glsl`, `class-i.fragment.glsl`).
- **Imports**: TypeScript files in the `renderers` directories import these `.glsl` files, typically as raw strings (e.g., `import shaderSource from './shader.glsl?raw';`). _Note: The `star` renderer embeds shader code directly as strings, rather than importing files._

**Common Shader Techniques Observed:**

- **Procedural Noise**: Many fragment shaders (especially for terrestrial planets and gas giants) utilize procedural noise functions (Simplex noise, Fractal Brownian Motion - FBM) to generate surface details, cloud patterns, and color variations. The noise functions are often sampled using 3D coordinates derived from the object's surface position or UVs mapped to a sphere.
- **Lighting Models**: Various lighting models are used:
  - Simple ambient + diffuse (e.g., `basic.fragment.glsl` for gas giants, `ring.fragment.glsl`).
  - Blinn-Phong (or similar) with diffuse and specular components (e.g., implied in `procedural.fragment.glsl`, explicitly in `earth.fragment.glsl`).
  - Multi-light support is implemented in some shaders (e.g., `procedural.fragment.glsl` has loops and arrays for `uLightPositions`, `uLightColors`).
  - World-space lighting calculations are performed in some shaders (e.g., Earth) using world position, world normal, and world light/camera position uniforms.
- **Texturing**: Shaders support standard texture mapping (`texture2D(mapSampler, vUv)`).
  - Earth shader blends day/night textures based on lighting.
  - Specular maps are used for shininess (Earth).
  - Bump/Normal mapping is used for surface detail (Earth, procedural terrestrial - requires `normalMap` sampler and calculation).
- **Atmospheric Effects**: `atmosphere.fragment.glsl` uses Fresnel calculations (`dot(viewDir, normal)`) to create a glow effect around the limb of a planet, modulating opacity based on view angle and density uniforms.
- **Color Mapping**: Terrestrial and gas giant shaders often map a noise value (representing height or density) to complex color gradients using multiple color uniforms and smoothstep/mix functions, based on the logic defined in `getColorForHeight` in the TypeScript generation code.
- **Shadows**: The ring shader (`ring.fragment.glsl`) implements shadow casting from the parent planet using a ray-sphere intersection test in world space.
- **Gravitational Lensing**: The common lensing shader samples a pre-rendered background texture using distorted UV coordinates calculated based on distance from the center and other parameters.

**Key Characteristics & Design:**

- **Separation of Concerns**: GLSL code is kept separate from TypeScript logic (mostly), allowing independent editing and focusing shaders on visual calculations.
- **Modularity**: Grouping by object type allows for specialized shaders.
- **Uniform-Driven**: Shaders are highly configurable via uniforms passed from the TypeScript material classes (e.g., colors, noise parameters, light positions, textures, time).
- **Varying Usage**: Vertex shaders compute and pass necessary interpolated data (world position, normals, UVs, view/light directions) to fragment shaders via `varying` variables.
- **Performance**: Techniques like LOD (controlled by uniforms like `uWarpOctaves` in gas giant shaders) and potentially simpler lighting models in some cases hint at performance considerations.
- **Inconsistency**: The `star` renderer embeds shaders directly, differing from the external file approach used elsewhere.
