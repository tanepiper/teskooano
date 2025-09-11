---
aliases: [LightingHelper]
tags: [renderer, threejs, helpers, lighting]
type: Class
package: "@teskooano/renderer-threejs-helpers"
name: LightingHelper
dependencies: ["three"]
functions: ["createAmbientLight", "createDirectionalLight", "createHemisphereLight", "createPointLight", "createSpotLight", "createRectAreaLight", "createLightProbe", "createLightHelpers"]
status: active
---

# LightingHelper

Factory helpers for common light types with consistent defaults and optional shadow configuration.

## Key Functions

- `createDirectionalLight(color, intensity, position, castShadow, shadowMapSize)`
- `createPointLight({ color, intensity, distance, decay, position, castShadow, shadowMapSize, name })`
- Helpers for ambient/hemisphere/spot/rectarea/probe
- `createLightHelpers(lights, helperSize, show)` builds debug helpers

## Usage

- Used by renderers for quick prototyping and debug lighting; production lighting is managed by [[threejs-lighting|LightingManager]].

