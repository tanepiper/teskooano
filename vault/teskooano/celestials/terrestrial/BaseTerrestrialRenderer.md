---
aliases: [BaseTerrestrialRenderer]
tags: [renderer, threejs, terrestrial]
type: Class
package: "@teskooano/celestials-terrestrial"
name: BaseTerrestrialRenderer
dependencies: ["three", "@teskooano/renderer-threejs-celestial", "@teskooano/celestials-rings"]
functions: ["getLODLevels", "update", "dispose", "registerRingShadowCasters"]
status: active
---

# BaseTerrestrialRenderer

LODs and material orchestration for terrestrial planets and moons, with optional composition of [[celestials-rings|RingSystemRenderer]].

## Responsibilities

- Create high/medium/billboard LODs with procedural planet material
- Conditionally instantiate RingSystemRenderer and merge ring LODs with body LODs
- Update materials: surface uniforms, dynamic ambient, shadow casters
- Manage atmosphere materials and texture lifecycles

## LODs

- L0: high-detail sphere + atmosphere
- L1: medium-detail sphere
- L2: billboard sprite (via billboardManager)

## Update Flow

- Update light sources, compute dynamic ambient, set surface uniforms
- Convert ring shadow casters for shader input via `ShadowCasterUtils`
- Propagate `update` to rings if present

