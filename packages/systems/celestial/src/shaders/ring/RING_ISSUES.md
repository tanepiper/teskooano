# Debugging Ring Lighting and Shadow Issues

This document outlines the steps taken to debug the lighting and shadow rendering for celestial rings after a recent engine pipeline update.

**Initial Problem:** Rings were observed to be unlit or only faintly visible, and shadows from the parent planet were not rendering correctly.

**Debugging Steps:**

1.  **Verify Uniforms Passed from TypeScript (`ObjectManager.ts`):**

    - **Initial Finding:** The `updateRingMaterials` function was being called with the light source's _position_ vector instead of the calculated _direction_ vector needed by the shader's `uSunDirection` uniform.
    - **Action:** Modified `ObjectManager.ts` to calculate the normalized direction vector from the parent object's position to the light source's position.
    - **Result:** Issue persisted.
    - **Action:** Added `console.debug` to log the calculated `sunDirection` vector being passed.
    - **Result:** Confirmed that a valid, normalized world-space direction vector was being passed to `updateRingMaterials`.

2.  **Isolate Fragment Shader Logic (`ring.fragment.glsl`):**

    - **Action:** Stripped shader down to output only the base `uniform color` and `uniform opacity`.
    - **Result:** Rings rendered correctly with their base color and expected opacity, confirming geometry and basic uniforms were being passed correctly.
    - **Action:** Restored basic diffuse + ambient lighting (`dot(normalize(vNormal), normalize(uSunDirection)) + ambient`), removing shadows and variation.
    - **Result:** Rings became visible, indicating basic lighting calculation could work.
    - **Action:** Restored shadow calculation and variation noise.
    - **Result:** Rings became very dim or black again.
    - **Action:** Reduced `ambientIntensity` significantly.
    - **Result:** Rings became _even more_ invisible, suggesting the diffuse component was contributing almost nothing (close to zero).
    - **Action:** Visualized the `diffuseFactor` (`max(0.0, dot(normalize(vNormal), normalize(uSunDirection)))`) directly as grayscale.
    - **Result:** Rings were solid black, confirming the dot product was always <= 0.

3.  **Investigate Normals (`ring.vertex.glsl` & `ring.fragment.glsl`):**
    - **Hypothesis:** The world-space normal (`vNormal`) being passed from the vertex shader was incorrect or pointing away from the light.
    - **Action:** Modified vertex shader to calculate world-space `vNormal` using `normalize(mat3(modelMatrix) * normal)` (simpler method).
    - **Action:** Modified fragment shader to visualize `vNormal`.
    - **Result:** Rings rendered as solid color, indicating `vNormal` was constant.
    - **Action:** Modified vertex shader to use `normalize(transpose(inverse(mat3(modelMatrix))) * normal)` (robust method).
    - **Result:** Rings still rendered as solid color (purple) when visualizing `vNormal`.
    - **Action:** Passed raw geometry `normal` attribute from vertex to fragment shader and visualized it.
    - **Result:** Rings rendered as solid lilac, indicating raw normals were consistently `(0, 0, 1)` (correct for base `RingGeometry`).
    - **Conclusion:** The world-space transformation in the vertex shader was correctly transforming the `(0, 0, 1)` normal, but the resulting world-space normal was constant across the mesh surface.
    - **Action:** Modified fragment shader to simulate double-sided lighting by flipping `vNormal` if `dot(vNormal, uSunDirection) < 0.0`.
    - **Action:** Visualized the `diffuseFactor` again (using the flipped normal).
    - **Result:** Rings still solid black.
    - **Action:** Visualized the potentially flipped normal (`normalForLighting`).
    - **Result:** Rings solid lime green, indicating the final normal used for lighting was consistently `(0, 1, 0)` or `(0, -1, 0)`.
    - **Action:** Changed vertex shader logic: Calculate `vNormal` by directly rotating the known post-mesh-rotation local normal `(0, -1, 0)` using `mat3(modelMatrix)`.
    - **Action:** Restored full fragment shader logic (including double-side simulation).
    - **Result:** Rings still appear unlit.

**Current Status:**

Despite verifying uniforms, geometry, and trying multiple standard methods for calculating and using world-space normals (including simulating double-sided lighting), the diffuse lighting component remains zero. The core issue seems to be that the calculated world-space normal (`vNormal`) is consistently perpendicular or facing away from the light direction (`uSunDirection`), even after attempting to correct for backfaces.
