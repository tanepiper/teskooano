## Three.js Interaction Analysis (`threejs-interaction`)

This package manages user interactions within the Three.js scene, including camera controls and potentially UI elements overlaid on the 3D view.

**Core Components:**

1.  **`InteractionManager` (`index.ts`)**: Intended as a facade class, but seems incomplete or outdated.

    - Instantiates `ControlsManager`.
    - Instantiates a `UIManager` which is **not defined or exported** within the current code, causing errors.
    - Provides an `update()` method that attempts to call `updateCamera()` (which exists) and `updateUI()` (which doesn't exist on the referenced managers).
    - References `handleInput` which doesn't exist on child managers.
    - Needs significant revision to reflect the actual available components (`ControlsManager`, `CSS2DManager`).

2.  **`ControlsManager.ts` (`ControlsManager`)**: Manages camera interaction using `OrbitControls`.

    - Instantiates `OrbitControls` from `three/examples/jsm/controls/OrbitControls.js`.
    - Configures `OrbitControls` with settings suitable for space simulation (damping, distance limits, zoom/pan/rotate speeds).
    - Adds a `change` event listener to the controls.
      - When the user manipulates the controls (`controls.enabled === true`), it reads the camera `position` and controls `target`.
      - Updates the `simulationState` (from `@teskooano/core-state`) with the new camera position and target vectors.
    - Provides methods `updateTarget` (to programmatically set the orbit center), `setEnabled` (to toggle user control), and `update` (which must be called each frame to apply damping).
    - `dispose()`: Disposes of the `OrbitControls` instance.

3.  **`CSS2DManager.ts` (`CSS2DManager`)**: Manages HTML elements positioned in the 3D scene using `CSS2DRenderer`.
    - Instantiates `CSS2DRenderer` from `three/examples/jsm/renderers/CSS2DRenderer.js`.
    - Appends the `CSS2DRenderer`'s DOM element to the main container, styled to overlay the WebGL canvas.
    - **Important**: Applies CSS styles to ensure the CSS2D overlay and its children have `pointer-events: none` to avoid interfering with WebGL canvas interactions (like `OrbitControls`).
    - Defines `CSS2DLayerType` enum (`CELESTIAL_LABELS`, `UI_CONTROLS`, `TOOLTIPS`) for organizing elements.
    - Maintains a Map (`elements`) storing `CSS2DObject` instances, organized by layer type and then by a unique ID.
    - Maintains layer visibility states (`layerVisibility`).
    - `createCelestialLabel(object)`: Creates a `<div>` element with the object's name, wraps it in a `CSS2DObject`, positions it relative to the object's scaled radius, attaches it to the object's corresponding mesh in the main scene (found by name), stores it in the `CELESTIAL_LABELS` layer, and sets its initial visibility.
    - `createCustomElement(...)`: Allows adding arbitrary HTML elements as `CSS2DObject`s to specific layers and parents.
    - `removeElement(layerType, id)`: Removes an element from its parent and internal tracking.
    - `updateCelestialLabel(object)`: Updates the position offset of an existing label (potentially needed if scaled radius changes).
    - `setLayerVisibility(layerType, visible)` / `toggleLayerVisibility(layerType)` / `getLayerVisibility(layerType)`: Manages the visibility of all elements within a specific layer.
    - `createUIControlsContainer()`: Creates a separate HTML container (`.threejs-ui-controls`) positioned absolutely at the bottom-right, intended for standard HTML UI buttons/controls (with `pointer-events: auto`). _Note: The code for adding actual buttons (Toggle Labels, Grid, etc.) is commented out, suggesting these might be handled elsewhere now (e.g., main application UI)._
    - `addUIButton(text, onClick)`: Helper to add a button to the UI controls container.
    - `render(camera)`: **Must be called each frame after the main WebGL render** to render the CSS2D elements using the provided camera.
    - `onResize(width, height)`: Resizes the `CSS2DRenderer`.
    - `dispose()`: Removes the renderer's DOM element.

**Key Characteristics & Design:**

- **Camera Control**: Uses standard `OrbitControls` for user navigation.
- **State Synchronization**: `ControlsManager` updates the global `simulationState` with camera changes driven by user input.
- **HTML Overlay**: `CSS2DManager` leverages `CSS2DRenderer` to position HTML elements (like labels) relative to 3D objects.
- **Layer Management**: Organizes CSS2D elements into logical layers with visibility controls.
- **Interaction Handling**: Explicitly sets `pointer-events: none` on the CSS2D overlay to prevent it from blocking underlying WebGL interactions.
- **Separate UI Container**: Creates a distinct container for standard clickable UI elements, separate from the non-interactive CSS2D overlay.

# Architecture: `@teskooano/renderer-threejs-interaction`

This document outlines the architecture and design decisions for the `threejs-interaction` package, focusing on the `ControlsManager` and `CSS2DManager` classes.

## Overview

The primary goal of this package is to provide robust and intuitive camera control and interaction within the Three.js environment for the Teskooano simulation. It encapsulates the logic for:

1.  **Standard Orbit Controls:** Leveraging `THREE.OrbitControls` for basic user navigation (zoom, pan, rotate) via `ControlsManager`.
2.  **Animated Transitions:** Using GSAP for smooth, non-jarring camera movements when programmatically changing the view (e.g., focusing on an object) via `ControlsManager`.
3.  **Object Following:** Enabling the camera to track a moving `THREE.Object3D` while preserving the user's ability to orbit around that object, managed by `ControlsManager`.
4.  **HTML Overlays:** Rendering HTML elements (like labels and markers) positioned relative to 3D objects using `CSS2DRenderer` via `CSS2DManager`.

## Core Class: `ControlsManager`

This is the central low-level driver for all camera control and movement logic. It is designed to be stateless regarding the application's overall simulation state.

### Responsibilities:

- **Initialization:** Creates and configures an `OrbitControls` instance, attaching it to the camera and DOM element.
- **Update Loop (`update()`):** This method is crucial and **must** be called every frame from the main renderer loop. It performs two key functions:
  - **Following Logic:** If `followingTargetObject` is set and not programmatically animating (`isAnimating`), it calculates the target's movement delta since the last frame and applies this delta to both the camera position and the `controls.target`.
  - **OrbitControls Update:** It calls `controls.update()` to apply damping and process any user input relative to the camera's current state.
- **Transitions (`transitionTo`, `transitionTargetTo`):** Provides a public API for programmatic, animated camera movements using GSAP for smooth sequencing and cancellation.
  - A transition temporarily sets an `isAnimating` flag to prevent the `update()` loop's follow logic from interfering with the animation.
- **Following (`startFollowing`, `stopFollowing`):** Provides a public API to make the camera track a moving `THREE.Object3D`. This is typically called by a higher-level manager (`CameraManager`) after a transition is complete.
- **Event Dispatching:**
  - Fires a `USER_CAMERA_MANIPULATION` custom event when the user finishes a manual camera movement (e.g., dragging with the mouse).
  - Fires a `CAMERA_TRANSITION_COMPLETE` custom event when a programmatic GSAP transition finishes.
- **Cleanup (`dispose()`):** Removes event listeners, disposes of `OrbitControls`, and cancels any active GSAP animations.

### Interactions Diagram:

```mermaid
graph TD
    subgraph "External Callers (e.g., CameraManager)"
        A[High-Level Logic]
    end

    subgraph "User"
        B[Mouse/Touch Input]
    end

    subgraph "ControlsManager"
        C(OrbitControls)
        D(GSAP Timeline)
        E[Update Loop]
        F[Event Dispatcher]
    end

    subgraph "Events Dispatched"
        G[USER_CAMERA_MANIPULATION]
        H[CAMERA_TRANSITION_COMPLETE]
    end

    A -- "Commands (e.g., transitionTo, startFollowing)" --> ControlsManager;
    B --> C;
    C -- "triggers" --> F -- "on user interaction end" --> G;
    ControlsManager -- "creates" --> D;
    D -- "animates" --> C;
    D -- "onComplete triggers" --> F -- "on transition end" --> H;
    E -- "is called every frame" --> C;

```

### Key Design Decisions for `ControlsManager`:

- **Stateless Driver:** `ControlsManager` has no knowledge of the application's simulation state (like `focusedObjectId` or whether the simulation is paused). It simply executes commands and reports its actions.
- **GSAP for Transitions:** Provides reliable, controllable, and cancellable animations superior to simple lerping. The `isAnimating` flag ensures these transitions are not interrupted by the follow logic.
- **Delta-Based Following:** The `update` loop calculates the target's frame-to-frame movement delta and applies it directly to both the camera position and the `OrbitControls` target. This ensures the camera keeps pace precisely.
- **`OrbitControls.update()` is Key:** Crucially, `controls.update()` is called _after_ the delta logic. This allows `OrbitControls` to apply damping and user input _relative_ to the camera's new position/target dictated by the follow logic.
- **Event-Driven Communication:** Instead of writing to a state store, the manager dispatches specific events. This decouples it from higher-level application logic, which can listen for these events and update state accordingly.
- **Initialization of `previousFollowTargetPos`:** This value is crucial for the delta calculation. It's initialized when following begins (`startFollowing`) and at the end of a transition (`_endTransition`) to ensure the first frame of following is always correct.

## Core Class: `CSS2DManager`

Manages HTML elements overlaid onto the 3D scene using `THREE.CSS2DRenderer`.

### Responsibilities:

- **Initialization:** Creates and configures a `CSS2DRenderer` instance, adding its DOM element to the provided container. Sets necessary styles (`position: absolute`, `pointer-events: none`). Injects CSS rules to ensure `pointer-events: none` on all children.
- **Layer Management:** Defines distinct layers (`CSS2DLayerType`: `CELESTIAL_LABELS`, `TOOLTIPS`, `AU_MARKERS`) for different types of UI elements. Manages internal maps (`elements`) to store `CSS2DObject` instances per layer and tracks layer visibility (`layerVisibility`).
- **Element Creation:** Provides methods to create specific types of elements:
  - `createCelestialLabel`: Creates name labels for celestial objects, positioning them based on object type/radius (with special handling for Oort Cloud) and attaching them to the object's mesh.
  - `createAuMarkerLabel`: Creates labels for AU distance markers, attaching them directly to the scene.
  - `createCustomElement`: (Internal/Private) Helper for creating positioned labels with common styling.
- **Element Management:**
  - `removeElement`: Removes an element from the scene and internal tracking.
  - `clearLayer`: Removes all elements from a specific layer.
  - `updateCelestialLabel`: (Not currently implemented/used - positioning happens at creation).
  - `setLayerVisibility`/`toggleLayerVisibility`/`getLayerVisibility`: Controls the visibility of entire layers by toggling the `visible` property of contained `CSS2DObject`s.
  - `showLabel`/`hideLabel`: Controls the visibility of individual labels using CSS classes (`label-hidden`) for potentially faster/more direct control.
- **Rendering (`render()`):** **Must be called every frame** after the main WebGL render pass. It performs pre-render checks for orphaned labels (elements whose parent object might have been removed from the scene) and then calls the internal `renderer.render()` method.
- **Resize Handling (`onResize()`):** Updates the `CSS2DRenderer` size when the container resizes.
- **Cleanup (`dispose()`):** Removes all created elements and the renderer's DOM element.

### Interactions Diagram:

```mermaid
graph TD
    subgraph Application/Renderer
        App[Main Application/Renderer Logic] -- Creates --> CSSMgr(CSS2DManager)
        App -- Provides --> Scn(Scene)
        App -- Provides --> Ctr(Container Element)
        App -- Calls --> Ren(CSS2DManager.render)
        App -- Calls --> Res(CSS2DManager.onResize)
        App -- Calls --> Disp(CSS2DManager.dispose)
        App -- Calls --> CLyr(CSS2DManager.clearLayer)
        App -- Calls --> Vis(CSS2DManager.setLayerVisibility)
        App -- Calls --> AddLbl(CSS2DManager.createCelestialLabel)
        App -- Calls --> AddAu(CSS2DManager.createAuMarkerLabel)
        App -- Calls --> Rem(CSS2DManager.removeElement)
        App -- Calls --> Show(CSS2DManager.showLabel)
        App -- Calls --> Hide(CSS2DManager.hideLabel)
    end

    subgraph CSS2DManager
        CSSMgr -- Instantiates --> Rndr(CSS2DRenderer)
        CSSMgr -- Manages --> LyrMap(Layer Maps: Map<LayerType, Map<ID, CSS2DObject>>)
        CSSMgr -- Manages --> VisMap(Layer Visibility: Map<LayerType, boolean>)
        CSSMgr -- Creates/Adds --> El(CSS2DObject)
        El -- Contains --> HTMLElm(HTML Element)
    end

    Rndr -- Renders --> CSSDOM(CSS2D DOM Element)
    CSSDOM -- Appended to --> Ctr
    El -- Added to --> Scn(For AU Markers)
    El -- Added to --> ParentObj(THREE.Object3D for Celestial Labels)
    Ren -- Uses --> Cam(Camera)
    Ren -- Calls --> Rndr
    Ren -- Performs --> OrphanCheck[Orphan Label Check]
```

### Key Design Decisions for `CSS2DManager`:

- **`CSS2DRenderer`:** Standard Three.js approach for placing HTML elements in 3D space.
- **Layer System:** Allows logical grouping and independent visibility control for different UI categories (e.g., hide all AU markers).
- **`pointer-events: none`:** Essential for ensuring the CSS2D overlay doesn't block interaction with the underlying WebGL canvas (handled by `ControlsManager`). CSS is injected to enforce this.
- **Element Lifecycles:** Provides explicit methods for creating, removing (`removeElement`, `clearLayer`), and managing elements to keep the internal state consistent with the scene graph.
- **Orphan Check:** The `render` method includes a pre-check to find and remove labels whose parent object might have been removed from the scene unexpectedly, preventing errors in the underlying `CSS2DRenderer`.
- **Dual Visibility Control:** Offers layer-level visibility (`setLayerVisibility` toggling `CSS2DObject.visible`) and individual label visibility (`showLabel`/`hideLabel` using CSS classes). Choose based on use case (performance vs. granularity).
- **Specific Creation Methods:** Favors distinct methods (`createCelestialLabel`, `createAuMarkerLabel`) over a generic one for clarity and type safety.
