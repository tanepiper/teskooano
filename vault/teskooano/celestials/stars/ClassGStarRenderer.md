---
aliases: [ClassGStarRenderer, ClassGStarMaterial]
tags: [renderer, threejs, stars]
type: Class
package: "@teskooano/celestials-stars"
name: ClassGStarRenderer
dependencies: ["three", "EnhancedStarMaterial", "MainSequenceStarRenderer"]
functions: ["update"]
status: active
---

# ClassGStarRenderer & Material

G-class main-sequence star renderer with spectral subclass support (G0–G9). Material derives color palettes from B–V index and adjusts turbulence and lighting by physical properties.

## Material Inputs

- Spectral subclass from `spectralClass` (e.g., G2V)
- Palette: hot/surface/cool derived from B–V conversion
- Noise scale/intensity tuned by luminosity, temperature, mass

## Renderer

- `createMaterial(object)` returns configured ClassGStarMaterial
- `update()` tweaks uniforms each frame (e.g., time-based noise)

