# Panel State (`@teskooano/engine-panel/panels/state`)

This directory contains modules related to the internal state management of the `CompositeEnginePanel` and its associated components. The primary module here is the `layoutStore.ts`.

## `layoutStore.ts`

- **Purpose**: Provides a comprehensive, class-based layout management system for the composite engine panel that tracks multiple layout concerns beyond just orientation.
- **Architecture**: Uses the `LayoutStore` class that encapsulates an RxJS `BehaviorSubject` to store and emit complete layout state changes. It listens to multiple browser APIs for various layout changes and updates the state accordingly.
- **Layout State Interface**: The `LayoutState` interface includes:
  - `orientation`: Current screen orientation (portrait/landscape)
  - `viewportWidth`/`viewportHeight`: Current viewport dimensions
  - `isFullscreen`: Whether the panel is in fullscreen mode
  - `isMaximized`: Whether the panel is maximized within its container
  - `devicePixelRatio`: Current device pixel ratio
- **Usage**:
  - Instantiate `LayoutStore` class and subscribe to `layoutStore.layoutState$` for complete state
  - Use `layoutStore.orientation$` for orientation-only updates
  - Access current state via `currentLayoutState` or `currentOrientation` getters
- **Features**:
  - Configurable tracking options via `LayoutStoreConfig` (viewport, fullscreen, auto-start)
  - Comprehensive event listening (orientation, resize, fullscreen changes)
  - Proper lifecycle management with `startListening()`, `stopListening()`, and `dispose()` methods
  - Panel state integration via `setMaximized()` method
  - Automatic cleanup to prevent memory leaks
- **Integration**: The `SubscriptionCoordinator` subscribes to `layoutState$` to trigger layout updates and renderer resizing when any layout property changes.

This module follows the established class-based pattern used throughout the composite engine panel, providing comprehensive layout management with better encapsulation and lifecycle management.
