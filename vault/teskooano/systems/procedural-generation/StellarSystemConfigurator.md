---
aliases: [StellarSystemConfigurator]
tags: [systems, procedural]
type: Class
package: "@teskooano/systems-procedural-generation"
name: StellarSystemConfigurator
functions: ["determineStellarConfiguration"]
status: active
---

# StellarSystemConfigurator

Randomly chooses a stellar system topology (single, close/wide binary, triple, complex) with tuned weights for variety.

## Outputs

- `{ type, stars, systemName, description }` consumed by [[CelestialZoneManager]]
