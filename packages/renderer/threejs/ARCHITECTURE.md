# Architecture: `@teskooano/renderer-threejs`

This document describes the architecture of the `@teskooano/renderer-threejs` package. This package acts as the **integrator** for the various modular Three.js rendering components within the Teskooano engine.

## Overview

This package does not contain the core rendering logic itself. Instead, it imports components from the other `@teskooano/renderer-threejs-*` packages and wires them together to provide a unified rendering facade.

Its primary class, `ModularSpaceRenderer`, instantiates and coordinates managers for:

- **Core**: Scene, Camera, Renderer, Animation Loop, State (`@teskooano/renderer-threejs-core`)
- **Visualization**: Object Management, Orbits, Background (`@teskooano/renderer-threejs-visualization`)
- **Interaction**: Controls, CSS2D Labels (`@teskooano/renderer-threejs-interaction`)
- **Effects**: Lighting, Level of Detail (`@teskooano/renderer-threejs-effects`)

It also includes `RendererStateAdapter` to manage visual settings or states specific to the integrated renderer.

```mermaid
graph TD
    subgraph Application
        State[Core State @teskooano/core-state];
        AppUI[Application UI]
    end

    subgraph Integrator[@teskooano/renderer-threejs]
        direction TB
        MSR[ModularSpaceRenderer];
        RSA[RendererStateAdapter];
    end

    subgraph Core[@teskooano/renderer-threejs-core]
        SceneMgr(SceneManager);
        AnimLoop(AnimationLoop);
        StateMgr(StateManager);
    end

    subgraph Viz[@teskooano/renderer-threejs-visualization]
        ObjMgr(ObjectManager);
        OrbitMgr(OrbitManager);
        BgMgr(BackgroundManager);
    end

    subgraph Interact[@teskooano/renderer-threejs-interaction]
        CtrlMgr(ControlsManager);
        CSSMgr(CSS2DManager);
    end

    subgraph Effects[@teskooano/renderer-threejs-effects]
        LightMgr(LightManager);
        LODMgr(LODManager);
    end

    AppUI -- Instantiates --> MSR;
    MSR -- Instantiates & Coordinates --> SceneMgr;
    MSR -- Instantiates & Coordinates --> AnimLoop;
    MSR -- Instantiates & Coordinates --> StateMgr;
    MSR -- Instantiates & Coordinates --> ObjMgr;
    MSR -- Instantiates & Coordinates --> OrbitMgr;
    MSR -- Instantiates & Coordinates --> BgMgr;
    MSR -- Instantiates & Coordinates --> CtrlMgr;
    MSR -- Instantiates & Coordinates --> CSSMgr;
    MSR -- Instantiates & Coordinates --> LightMgr;
    MSR -- Instantiates & Coordinates --> LODMgr;
    MSR -- Uses --> RSA;

    StateMgr -- Reads --> State;
    ObjMgr -- Reads --> State;
    OrbitMgr -- Reads --> State;
    SceneMgr -- Reads --> State;

    AnimLoop -- Calls Update --> MSRCallback[MSR Main Callback];
    MSRCallback -- Updates --> ObjMgr;
    MSRCallback -- Updates --> OrbitMgr;
    MSRCallback -- Updates --> BgMgr;
    MSRCallback -- Renders --> SceneMgr;
    MSRCallback -- Renders --> CSSMgr;

    OrbitMgr -- Uses --> RSA;

    ObjMgr -- Uses --> LightMgr;
    ObjMgr -- Uses --> CSSMgr;
    LODMgr -- Uses --> SceneMgr(Camera);
    CtrlMgr -- Uses --> SceneMgr(Camera, DOM Element);
    LightMgr -- Modifies --> SceneMgr(Scene);
    BgMgr -- Modifies --> SceneMgr(Scene);
    ObjMgr -- Modifies --> SceneMgr(Scene);
    OrbitMgr -- Modifies --> SceneMgr(Scene);
```

## Core Components within this Package

1.  **`ModularSpaceRenderer` (`ModularSpaceRenderer.ts`)**: The primary facade class.

    - **Responsibility**: Instantiates managers from all the `threejs-*` sub-modules, passes necessary dependencies between them (e.g., scene, camera, state store references), sets up the main animation loop callbacks, provides high-level control methods (start/stop loop, toggle features), and handles disposal.
    - It acts as the central point of configuration and control for the entire rendering system.

2.  **`RendererStateAdapter` (`RendererStateAdapter.ts`)**:

    - **Responsibility**: Seems to primarily manage state related to visual settings or modes that affect multiple visualization components (like orbit visibility preferences). It might subscribe to specific state atoms or provide methods for the `ModularSpaceRenderer` or other managers to call to change these settings.
    - It works alongside the `StateManager` from `threejs-core`, which handles the main object and camera state subscriptions.

3.  **`index.ts`**: Exports `ModularSpaceRenderer` and potentially other necessary types/interfaces.

## Data Flow & Coordination

1.  The application instantiates `ModularSpaceRenderer`, passing the container element and configuration options.
2.  `ModularSpaceRenderer` constructor initializes all required managers from the sub-modules in the correct order, resolving dependencies (e.g., `SceneManager` first, then components needing the scene).
3.  It registers a main update callback with the `AnimationLoop` from `threejs-core`.
4.  When the loop runs (`tick`), it calls the main update callback.
5.  This callback orchestrates the `update` calls for various managers (e.g., `OrbitManager.updateAllVisualizations`, `ObjectManager.updateRenderers`, `BackgroundManager.update`).
6.  It triggers rendering via `SceneManager.render()` and `CSS2DManager.render()`.
7.  State changes from `@teskooano/core-state` are primarily handled by `StateManager` (in `threejs-core`), which notifies relevant managers (like `ObjectManager`) via callbacks/subscriptions set up during initialization.
8.  User interactions (like camera control) are handled by `ControlsManager` (in `threejs-interaction`), which directly updates the camera managed by `SceneManager`.

This architecture keeps the concerns separated: core setup, specific visualizations, interaction logic, and effects are in their own packages, while this package focuses solely on integrating them into a cohesive whole.
