# Lighting Unification & Physically-Based Night Illumination Spec

## Summary

This spec defines a unified lighting pipeline for all celestials in Teskooano and replaces ad-hoc night-side lighting hacks with a physically-based approach. The goal is to ensure consistent light selection, attenuation, ambient contribution, and shadow handling across all renderers and shaders, while improving near-star ambient behavior and eliminating shader-level “night light” flags.

## Goals

- **Single shared lighting system** for every celestial renderer (planets, rings, gas giants, asteroids, comets, satellites, etc.).
- **Consistent light data contract** across all shaders and materials.
- **Physically based night illumination** using ambient + scattering + exposure, without per-shader night-light flags.
- **Ambient light scales more strongly near stars** while preserving minimum visibility in deep space.
- **Reusable CPU-side lighting helpers** that populate shader uniforms consistently.

## Non-Goals

- Full global illumination or path tracing.
- Rewriting all shaders to PBR at once.
- Introducing heavy runtime costs from high light counts.

## Current State (Key Observations)

- Light selection is handled via `LightingManager.getInfluentialLights()` (max 4) but consumed inconsistently in materials.
- `LightingCalculator` already computes distance attenuation and dynamic ambient, but shader pipelines don’t always use it consistently.
- Terrestrial shaders add a hardcoded “night light” term, causing night-side glow artifacts.
- Rings and atmospheres use separate light uniform schemas and shadow logic.

## Proposed Architecture

### 1) Unified Lighting Contract (Shader Inputs)

Standardize a shared uniform schema for all lighting-aware shaders:

- `uNumLights`
- `uLightPositions[MAX_LIGHTS]`
- `uLightColors[MAX_LIGHTS]`
- `uLightIntensities[MAX_LIGHTS]`
- `uAmbientColor`
- `uAmbientIntensity`
- `uNumShadowCasters`
- `uShadowCasters[MAX_SHADOW_CASTERS]`

All materials should accept these names (or be adapted to them). Shader includes should assume this schema, removing per-material variance.

### 2) CPU-Side Lighting Pack Helper

Create a shared helper (e.g. `LightingUniformPack`) that:

- Fetches influential lights from `LightingManager`.
- Applies distance attenuation via `LightingCalculator.applyDistanceAttenuation()`.
- Computes ambient via `LightingCalculator.calculateDynamicAmbientLight()`.
- Converts results into uniform arrays for shaders.
- Populates shadow caster arrays in a consistent format.

This helper becomes the **single place** to build all lighting uniform data for materials.

### 3) Ambient Scaling Near Stars

Adjust `LightingCalculator.calculateDynamicAmbientLight()` to strengthen ambient contribution near stars:

- Increase the base ambient multiplier and/or reduce ambient falloff factor.
- Keep a minimum ambient clamp for deep space visibility.
- Allow optional tuning using system-level lighting properties.

### 4) Remove Night-Light Hacks

Replace shader-side “night light” or emissive lifting with:

- Ambient irradiance from the unified pipeline.
- Atmospheric scattering where applicable.
- Renderer/post-processing exposure controls (camera adaptation).

This eliminates per-shader flags and gives physically plausible night-side visibility.

### 5) Unified Shadow Handling

Standardize the shadow caster structure and shadow evaluation logic in shared GLSL includes. Ring and planet shaders should converge on the same shadow data layout and helper functions.

## Night Illumination Long-Term Solution

Night-side visibility should be explained by:

1. **Dynamic ambient irradiance** computed from nearby stars (CPU).
2. **Scattering** (atmospheres) driven by the same light field.
3. **Surface material response** (albedo/specular) at low intensity.
4. **Exposure/tone mapping** in the renderer to preserve visibility without adding emissive hacks.

This replaces “night light” terms and makes night-side brightness a system property.

## Data Flow (Target)

1. Renderer selects influential lights (max 4).
2. LightingCalculator attenuates per object distance.
3. LightingCalculator computes ambient intensity.
4. LightingUniformPack fills standard light + ambient + shadow uniforms.
5. All materials consume the same uniform schema.
6. Optional renderer-level exposure/tone mapping ensures visibility.

## Implementation Plan (Phased)

### Phase 1: Core Lighting Contract

- Add `LightingUniformPack` helper in renderer-celestial or lighting package.
- Define shared uniform interface (TypeScript + GLSL include).

### Phase 2: Core Material Integration

- Update terrestrial, ring, and atmosphere materials to use the uniform pack.
- Remove shader-specific light naming differences.

### Phase 3: Night Illumination Cleanup

- Remove hardcoded night-light terms in shaders.
- Ensure ambient/scattering/exposure provide visibility without hacks.

### Phase 4: Full Celestial Coverage

- Roll the unified contract across gas giants, comets, asteroids, satellites, and any remaining custom materials.

## Impact on App & Users

- **Visual consistency**: day/night transitions, shadows, and ambient lighting match across all celestial types.
- **Multi-star fidelity**: ambient and direct lighting blend star colors instead of using a single tint.
- **Reduced artifacts**: removes night-side glow hacks in favor of ambient + scattering + exposure.
- **Performance**: maintains the existing light cap (4) and avoids per-frame allocations via shared uniform buffers.
- **Panel isolation**: each renderer panel keeps its own lighting context to avoid cross-panel leakage.

## Risks & Mitigations

- **Visual regressions**: staged rollout, shader comparisons, and screenshots for core materials.
- **Performance**: keep light count capped (4), reuse uniform arrays, and avoid per-frame allocations.
- **Tuning complexity**: provide system-level lighting defaults and tuning hooks.

## Testing & Validation

- Add unit tests for `LightingUniformPack` (array sizing, attenuation, ambient scaling).
- Visual validation: controlled scenes for day/night, multi-star systems, and deep space.
- Ensure no night-side emissive artifacts are visible with ambient + exposure alone.

## Decisions & Clarifications

- **Ambient color source**: derived from the weighted mix of influential star colors (multi-star systems blend), not a single fixed color.
- **Ambient coefficients**: use physically-motivated attenuation with tuning against real scale; no special per-material coefficients unless validated by reference data.
- **Panel scope**: lighting remains panel-scoped via the renderer’s panel services; exposure/tone mapping should follow that same per-panel context.
