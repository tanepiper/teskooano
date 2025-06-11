# Panel State (`@teskooano/engine-panel/panels/state`)

This directory contains modules related to the internal state management of the `CompositeEnginePanel` and its associated components. The primary module here is the `layoutStore.ts`.

## `layoutStore.ts`

- **Purpose**: To provide a reactive, global source of truth for the current screen orientation (portrait or landscape).
- **Architecture**: It uses an RxJS `BehaviorSubject` to store and emit orientation changes. It listens to the `window.matchMedia` API for `(orientation: portrait)` changes and updates the subject accordingly.
- **Usage**: Components and managers (e.g., `PanelEventManager`) can subscribe to the `layoutOrientation$` observable to react to layout changes and adjust UI elements or trigger necessary rendering updates (like resizing the 3D renderer).
- **Cleanup**: Includes a `cleanupOrientationListener()` function to properly remove the event listener when no longer needed, preventing memory leaks.

This module adheres to a simple, observable-based state pattern, ensuring that orientation changes are handled reactively across the application.
