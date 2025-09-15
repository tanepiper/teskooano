---
aliases: [systems-procedural-generation, procedural-generation]
tags: [systems, procedural, rxjs]
type: index
package: "@teskooano/systems-procedural-generation"
version: "0.4.0-dev.0"
dependencies:
  [
    "@teskooano/data-types",
    "@teskooano/data-values",
    "@teskooano/core-math",
    "rxjs",
  ]
classes:
  [
    "CelestialZoneManager",
    "ZoneScaler",
    "ZoneSelector",
    "StellarSystemConfigurator",
    "StarZoneFactory",
    "PlanetGenerator",
    "RoguePlanetGenerator",
    "CometGenerator",
  ]
status: active
---

# Procedural Generation (`@teskooano/systems-procedural-generation`)

Creates deterministic star systems from a seed using a reactive pipeline.

## 📚 Key Classes

- CelestialZoneManager, ZoneScaler, ZoneSelector, StellarSystemConfigurator, StarZoneFactory
- PlanetGenerator, RoguePlanetGenerator
- CometGenerator

## 🔗 Related

- Outputs objects consumed by [[core-state]] and rendered by [[threejs-objects]]
