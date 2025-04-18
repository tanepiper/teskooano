## Common Renderer Utilities Analysis

This directory holds reusable rendering components or helpers that can be utilized by multiple specific celestial object renderers.

**Core Components:**

1.  **`gravitational-lensing.ts`**: Provides functionality to simulate gravitational lensing effects, typically used for very massive objects like black holes and neutron stars.
    - **`GravitationalLensingMaterial`**: Extends `THREE.ShaderMaterial`.
      - Defines uniforms: `tBackground` (a texture sampler for the background scene), `intensity`, `radius` (likely controlling the effect's size/falloff), `distortionScale`, `time`, and `resolution`.
      - Loads vertex and fragment shaders embedded as strings.
      - **Fragment Shader Logic**: Calculates distortion based on screen position (`vUv`), distance from center, `intensity`, `distortionScale`, and `time`. It attempts to simulate an Einstein ring effect. Critically, it samples the `tBackground` texture using distorted UV coordinates (`distortedUv = gl_FragCoord.xy / resolution + offset`) to achieve the lensing look. It also calculates an alpha value based on distortion strength and distance to fade the effect out.
      - Material settings include `transparent: true`, `depthWrite: false`, and `CustomBlending` using `SrcAlphaFactor` and `OneMinusSrcAlphaFactor`.
      - `update(time, renderTarget)`: Updates the `time`, `tBackground` (with the texture from the provided `renderTarget`), and `resolution` uniforms.
      - Provides methods to set `intensity`, `radius`, and `distortionScale` after instantiation.
    - **`GravitationalLensingHelper`**: A helper class to manage the setup and update process for the lensing effect.
      - **Constructor**: Takes the `THREE.WebGLRenderer`, `scene`, `camera`, the target `THREE.Object3D` (e.g., the black hole group), and options (`intensity`, `radius`, `distortionScale`, `lensSphereScale`).
        - Creates a `THREE.WebGLRenderTarget` (often at a lower resolution) to capture the scene background.
        - Instantiates `GravitationalLensingMaterial`.
        - Creates a large `THREE.SphereGeometry` scaled relative to the target object's bounding box (`lensSphereScale`).
        - Creates a `THREE.Mesh` using this geometry and the `GravitationalLensingMaterial`.
        - Sets a high `renderOrder` (e.g., 1000) to ensure the lens mesh renders after the main scene content.
        - Adds the lens mesh as a child of the target `object`.
        - Adds a window resize listener (`onWindowResize`) to resize the internal `renderTarget`.
      - **`update(renderer, scene, camera)`**: This method orchestrates the effect **before** the main scene rendering pass where the lens mesh itself is drawn.
        - Temporarily hides the lens mesh (`this.mesh.visible = false`).
        - Sets the internal `renderTarget` on the `renderer`.
        - Renders the `scene` with the provided `camera` _into_ the `renderTarget` (capturing the background view without the lens mesh).
        - Resets the `renderer` back to its original render target.
        - Calls `this.material.update(time, this.renderTarget)` to pass the captured background texture and current time to the lens material's uniforms.
        - Makes the lens mesh visible again (`this.mesh.visible = true`) so it will be drawn in the subsequent main render pass, using the captured background texture for distortion.
      - **`onWindowResize(renderer)`**: Updates the size of the internal `renderTarget` and the `resolution` uniform in the material.
      - **`dispose()`**: Disposes of the material, geometry, render target, and removes the resize listener.

**Key Characteristics & Design:**

- **Reusable Helper**: Provides a complex visual effect (gravitational lensing) as a self-contained helper class that can be easily added to different renderers (like black holes, neutron stars).
- **Render-to-Texture**: Core technique involves rendering the scene background to a texture (`WebGLRenderTarget`) and then using that texture within the lensing shader to create the distortion.
- **Multi-Pass Rendering**: The `GravitationalLensingHelper.update` method implies a multi-pass rendering approach: one pass to capture the background to a texture, followed by the main scene render pass which includes the lensing mesh sampling that texture.
- **Shader Logic**: The distortion effect itself is implemented entirely within the `GravitationalLensingMaterial`'s fragment shader.
- **Performance**: Uses a potentially lower-resolution render target for the background capture as a performance optimization.
- **Integration**: Designed to be attached to an existing `Object3D` representing the massive object.
