---
aliases: [CelestialZoneManager]
tags: [systems, procedural]
type: Class
package: "@teskooano/systems-procedural-generation"
name: CelestialZoneManager
dependencies: ["ZoneScaler", "ZoneSelector", "StarZoneFactory"]
functions:
  [
    "createForStar",
    "determineStellarConfiguration",
    "getAdjustedZones",
    "selectZonesForPlacement",
    "getAllZones",
    "getZoneForDistance",
  ]
status: active
---

# CelestialZoneManager

Coordinates zone scaling, selection, and star-specific zone generation for procedural systems.

## Flow

- `createForStar(star, rng)`: scale base zones by luminosity/type
- `determineStellarConfiguration()`: single/binary/multi-star decision
- `getAdjustedZones(stars, config)`: apply [[ZoneScaler]]
- `selectZonesForPlacement(stars, config)`: choose active zones with [[ZoneSelector]]
