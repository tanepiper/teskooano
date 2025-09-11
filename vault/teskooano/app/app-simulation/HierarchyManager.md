---
aliases: [HierarchyManager]
tags: [app, simulation]
type: Class
package: "@teskooano/app-simulation"
name: HierarchyManager
dependencies: ["@teskooano/core-state", "@teskooano/core-physics", "@teskooano/data-values"]
functions: ["updateHierarchies"]
status: active
---

# HierarchyManager

Applies simple, incremental rules to maintain orbital parentage (moons, satellites, orphaned objects), using centralized WASM spatial partitioning when available.

## Rules (examples)

- Moon escapes parent if distance > 0.1 AU → becomes dwarf planet and reassigns to dominant body
- Satellite escapes > 0.05 AU → becomes asteroid and reassigns
- Orphaned objects (parent removed) find new parent via dominance

## Performance

- Processes one object per tick (`updateIndex`) to spread work
- Queries `StateAccessor.getActiveObjects()` and `physicsSystemAdapter` snapshots

