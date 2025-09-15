---
aliases: [SimulationOrchestrator]
tags: [app, simulation]
type: Class
package: "@teskooano/app-simulation"
name: SimulationOrchestrator
dependencies: ["@teskooano/core-physics", "@teskooano/core-state", "rxjs"]
functions:
  [
    "getInstance",
    "startLoop",
    "stopLoop",
    "isLoopRunning",
    "createPhysicsCallback",
    "resetSystem",
    "resetTime",
    "dispose",
  ]
events: ["onResetTime", "onOrbitUpdate"]
status: active
---

# SimulationOrchestrator

Singleton that wires the physics loop, state adapters, hierarchy updates, and events. Exposes a physics callback to integrate with the renderer’s frame loop.

## Responsibilities

- Initialize and drive core-physics `SimulationManager` and centralized `WasmSpatialService`
- Maintain simulation time vs real time; apply timeScale
- Emit orbit updates and reset events
- Update object hierarchies (via [[HierarchyManager]]) when in non-ideal modes

## Loop

- `createPhysicsCallback()` returns `(deltaTime) => {...}` performing: time accumulation → parameters prep → simulate → state update → hierarchies → emit
