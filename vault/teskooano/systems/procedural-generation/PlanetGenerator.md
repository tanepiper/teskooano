---
aliases: [PlanetGenerator, RoguePlanetGenerator]
tags: [systems, procedural]
type: Class
package: "@teskooano/systems-procedural-generation"
name: PlanetGenerator
functions: ["generate"]
status: active
---

# PlanetGenerator / RoguePlanetGenerator

RxJS-based generators that emit fully specified `CelestialObject` planets (and rings) given zone context and parent star.

## Pipeline

- Determine base type/properties → mass/radius → type-specific properties → ring system → assemble final object with orbit

## Rogue Planets

- Use hyperbolic `eccentricity > 1` with negative semi-major axis; include `isHyperbolic: true`
