---
aliases: [Dependency Graph, dependencies]
tags: [architecture, diagram]
type: pattern
status: active
---

# Dependency Graph

High-level package dependency overview showing the hierarchical structure and relationships between all Teskooano packages.

## Overview

The Teskooano architecture follows a layered dependency model where:

- **Data Layer**: Foundation packages providing core data structures and constants
- **Core Layer**: Essential systems for math, physics, state management, and debugging
- **Renderer Layer**: Three.js-based rendering system with specialized components
- **Celestials Layer**: Specific renderers for different types of celestial objects

## Dependency Principles

### Layered Architecture

- Each layer depends only on layers below it
- No circular dependencies between packages
- Clear separation of concerns

### Package Relationships

- **Data packages** are foundation packages with no dependencies
- **Core packages** depend only on data packages
- **Renderer packages** depend on core and data packages
- **Celestial packages** depend on renderer, core, and data packages

## 📦 Renderer Stack (Mermaid)

```mermaid
graph LR
  subgraph Data
    DT[@teskooano/data-types]
    DV[@teskooano/data-values]
  end

  subgraph Core
    CM[@teskooano/core-math]
    CS[@teskooano/core-state]
    CP[@teskooano/core-physics]
    CD[@teskooano/core-debug]
  end

  subgraph Renderer
    R3[@teskooano/renderer-threejs]
    RC[@teskooano/renderer-threejs-core]
    RL[@teskooano/renderer-threejs-lighting]
    RO[@teskooano/renderer-threejs-orbits]
    RObj[@teskooano/renderer-threejs-objects]
    RLab[@teskooano/renderer-threejs-labels]
    RBg[@teskooano/renderer-threejs-background]
    RCam[@teskooano/renderer-threejs-camera]
    RCtrl[@teskooano/renderer-threejs-controls]
    RHel[@teskooano/renderer-threejs-helpers]
    RCel[@teskooano/renderer-threejs-celestial]
  end

  subgraph Celestials
    CTer[@teskooano/celestials-terrestrial]
    CGas[@teskooano/celestials-gas-giants]
    CSta[@teskooano/celestials-stars]
    CAst[@teskooano/celestials-asteroid]
    CAField[@teskooano/celestials-asteroid-field]
    CCom[@teskooano/celestials-comet]
    CRing[@teskooano/celestials-rings]
    COort[@teskooano/celestials-oort-cloud]
    CSat[@teskooano/celestials-satellite]
  end

  DV --> DT
  CM --> DT
  DT --> CS
  DT --> CP
  DV --> CS
  CM --> CP

  RC --> CS
  RC --> DT
  RL --> RC
  RL --> CS
  RO --> RC
  RO --> CS
  RObj --> RC
  RLab --> RObj
  RCam --> R3
  RCtrl --> RC
  RBg --> RC
  RHel --> RC
  RCel --> RL

  R3 --> RC
  R3 --> RObj
  R3 --> RL
  R3 --> RO
  R3 --> RLab
  R3 --> RBg
  R3 --> RCam
  R3 --> RCtrl

  RCel --> CTer
  RCel --> CGas
  RCel --> CSta
  RCel --> CRing
  RCel --> CAst
  RCel --> CAField
  RCel --> CCom
  RCel --> COort
  RCel --> CSat
```

## Package Descriptions

### Data Layer

- **[[data/data-types/data-types|@teskooano/data-types]]**: Core type definitions and interfaces
- **[[data/data-values/data-values|@teskooano/data-values]]**: Constants, enums, and default values

### Core Layer

- **[[core/core-math/core-math|@teskooano/core-math]]**: Mathematical utilities and vector operations
- **[[core/core-state/core-state|@teskooano/core-state]]**: State management and data flow
- **[[core/core-physics/core-physics|@teskooano/core-physics]]**: Physics simulation and orbital mechanics
- **[[core/core-debug/core-debug|@teskooano/core-debug]]**: Debugging utilities and performance monitoring

### Renderer Layer

- **[[renderer/threejs/threejs|@teskooano/renderer-threejs]]**: Main Three.js renderer orchestrator
- **[[renderer/threejs-core/threejs-core|@teskooano/renderer-threejs-core]]**: Core rendering infrastructure
- **[[renderer/threejs-lighting/threejs-lighting|@teskooano/renderer-threejs-lighting]]**: Lighting system and light source management
- **[[renderer/threejs-orbits/threejs-orbits|@teskooano/renderer-threejs-orbits]]**: Orbital visualization and trajectory rendering
- **[[renderer/threejs-objects/threejs-objects|@teskooano/renderer-threejs-objects]]**: Object management and lifecycle
- **[[renderer/threejs-labels/threejs-labels|@teskooano/renderer-threejs-labels]]**: 2D label rendering and management
- **[[renderer/threejs-background/threejs-background|@teskooano/renderer-threejs-background]]**: Background rendering and skybox
- **[[renderer/threejs-camera/threejs-camera|@teskooano/renderer-threejs-camera]]**: Camera management and controls
- **[[renderer/threejs-controls/threejs-controls|@teskooano/renderer-threejs-controls]]**: User input and interaction controls
- **[[renderer/threejs-helpers/threejs-helpers|@teskooano/renderer-threejs-helpers]]**: Utility helpers and debugging aids
- **[[renderer/threejs-celestial/threejs-celestial|@teskooano/renderer-threejs-celestial]]**: Celestial object rendering framework

### Celestials Layer

- **[[celestials/terrestrial/celestials-terrestrial|@teskooano/celestials-terrestrial]]**: Terrestrial planets and moons
- **[[celestials/gas-giants/celestials-gas-giants|@teskooano/celestials-gas-giants]]**: Gas giant planets
- **[[celestials/stars/celestials-stars|@teskooano/celestials-stars]]**: Stellar objects and stellar evolution
- **[[celestials/asteroid/celestials-asteroid|@teskooano/celestials-asteroid]]**: Individual asteroid rendering
- **[[celestials/asteroid-field/celestials-asteroid-field|@teskooano/celestials-asteroid-field]]**: Asteroid field rendering
- **[[celestials/comet/celestials-comet|@teskooano/celestials-comet]]**: Comet rendering with tails and comas
- **[[celestials/rings/celestials-rings|@teskooano/celestials-rings]]**: Planetary ring systems
- **[[celestials/oort-cloud/celestials-oort-cloud|@teskooano/celestials-oort-cloud]]**: Oort cloud rendering
- **[[celestials/satellite/celestials-satellite|@teskooano/celestials-satellite]]**: Artificial satellites and space stations

## 🔗 Related

- [[architecture/Layer Pattern|Layer Pattern]] - Architectural pattern used throughout the system
- [[architecture/Manager Pattern|Manager Pattern]] - Management and coordination patterns
- [[architecture/Strategy Pattern|Strategy Pattern]] - Algorithm selection and switching
- [[architecture/Performance Pattern|Performance Pattern]] - Performance optimization strategies
