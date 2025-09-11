---
aliases: [ProceduralPlanetMaterial]
tags: [renderer, threejs, material, shader, terrestrial]
type: Class
package: "@teskooano/celestials-terrestrial"
name: ProceduralPlanetMaterial
dependencies: ["three", "LightArrayUtils"]
functions: ["update"]
status: active
---

# ProceduralPlanetMaterial

ShaderMaterial for terrestrial surfaces with noise-driven terrain, palette blending, and multi-light/shadow arrays.

## Uniforms

- Lighting: `uNumLights`, `uLights[]`, `uAmbientLightColor`, `uAmbientLightIntensity`, `uCameraPosition`
- Shadows: `uNumShadowCasters`, `uShadowCasters[]`
- Terrain/noise: `persistence`, `lacunarity`, `uSimplePeriod`, `uOctaves`, `uUndulation`
- Colors: `uColor1..uColor5`, heights `uHeight1..uHeight5`
- Material: `uBumpScale`, `uRoughness`, `uShininess`, `uSpecularStrength`, `uTerrain*`

## Update

- Copies camera position, resizes light/shadow arrays on demand, uploads light/shadow data, advances time

