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
- **Incompleteness**: The main `InteractionManager` facade seems unfinished or incorrect.
- **Separate UI Container**: Creates a distinct container for standard clickable UI elements, separate from the non-interactive CSS2D overlay.
