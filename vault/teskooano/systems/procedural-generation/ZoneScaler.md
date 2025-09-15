---
aliases: [ZoneScaler]
tags: [systems, procedural]
type: Class
package: "@teskooano/systems-procedural-generation"
name: ZoneScaler
functions:
  [
    "calculateScalingFactor",
    "calculateCombinedLuminosity",
    "getComplexityFactor",
    "scaleZones",
  ]
status: active
---

# ZoneScaler

Computes scaling factors for zone distances based on stellar luminosity/type/spectral class, with gameplay caps and complexity modifiers.

## Logic

- Prefer star.properties.luminosity; fallback mass-luminosity (M^3.5)
- Spectral/type multipliers (e.g., WR ↑, M ↓)
- Clamp scaling within [0.1, 5.0]
- Multi-star: average scaling × complexity factor
