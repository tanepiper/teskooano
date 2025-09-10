---
aliases: [Dependency Graph, dependencies]
tags: [architecture, diagram]
type: pattern
status: active
---

# Dependency Graph

High-level package dependency overview.

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

