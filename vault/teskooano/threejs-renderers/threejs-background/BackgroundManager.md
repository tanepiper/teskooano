---
aliases: [BackgroundManager]
tags: [renderer, threejs, background]
type: Class
package: "@teskooano/renderer-threejs-background"
name: BackgroundManager
dependencies: ["three", "StarField", "NebulaField", "GalaxyField", "@teskooano/core-math", "@teskooano/core-state"]
functions: ["addField", "toggleDebug", "setCamera", "getGroup", "update", "dispose"]
status: active
---

# BackgroundManager

Composes multiple background `Field` layers (stars, nebulae, galaxies) at a base distance with optional parallax. Seeds are read from core-state to keep backgrounds deterministic per system.

## Behavior

- Creates default `StarField` and `NebulaField` (Galaxy optional) at construction
- Parents all layers under a group that follows camera position
- Debug mode overlays depth reference visuals

## Methods

- `addField(field: Field)` register and add to group
- `toggleDebug()` apply/remove debug visuals and propagate to fields
- `update(dt)` positions group at camera and updates fields

