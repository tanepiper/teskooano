# `@/celestial-uniforms` Architecture

## 1. Purpose

The `@/celestial-uniforms` plugin provides a UI panel that allows for the real-time editing of shader uniforms and other physical properties of a selected celestial object. It dynamically generates a set of controls (sliders, color pickers) based on the specific properties of the focused object.

This plugin is solely responsible for providing raw editing controls. It does **not** display formatted or read-only information; that is the responsibility of other plugins, such as `@/celestial-info`.

## 2. Core Pattern: MVC with Strategy/Factory

To ensure separation of concerns and high extensibility, this plugin uses a combination of Model-View-Controller (MVC) with the **Strategy** and **Factory** design patterns for its core logic.

### 2.1. View: `celestial-uniforms/view/CelestialUniforms.view.ts`

- **Class:** `CelestialUniformsEditor` (Custom Element: `<celestial-uniforms-editor>`)
- **Responsibilities:**
  - Acts as the "dumb" view layer. Its only job is to manage the DOM structure.
  - It implements Dockview's `IContentRenderer` interface.
  - On initialization, it creates its `ShadowRoot`, finds references to key DOM elements, and instantiates the `CelestialUniformsController`.
  - It delegates all logic and event handling to the controller.

### 2.2. Controller: `celestial-uniforms/controller/CelestialUniforms.controller.ts`

- **Class:** `CelestialUniformsController`
- **Responsibilities:**
  - Acts as a "smart" orchestrator.
  - Manages the lifecycle of the view and its own subscriptions.
  - Subscribes to global focus events to know which object is selected.
  - **Delegates UI generation:** Instead of containing complex rendering logic itself, it uses the `UniformsRendererFactory` to get the correct "strategy" for the selected object.

### 2.3. Uniform Renderers (Strategy/Factory Pattern)

The logic for building the UI for different celestial types is abstracted into specialized classes.

- **Directory:** `controller/uniform-renderers/`
- **`BaseUniformsRenderer.ts` (Abstract Strategy):**
  - Defines the common interface that all concrete renderers must implement (a `render` method).
  - Contains the shared, low-level helper methods for creating UI controls (`_createNumericInput`, `_createColorInput`, etc.) and handling state updates.
- **Concrete Renderers (e.g., `StarUniformsRenderer.ts`, `TerrestrialUniformsRenderer.ts`):**
  - Each class extends `BaseUniformsRenderer` and implements the `render` method for a _specific_ celestial type (e.g., `Star`).
  - This isolates the complex UI generation logic for each type into its own maintainable file.
- **`UniformsRendererFactory.ts` (Factory):**
  - A static class that contains a method `getRendererForCelestial(celestial)`.
  - This method acts as a router, containing the `switch` statement that determines which concrete renderer class to instantiate based on the `celestial.type`.

## 3. Data Flow

1.  A global focus event is fired with a `celestialObjectId`.
2.  The `CelestialUniformsController` catches this event and retrieves the `CelestialObject` data.
3.  The controller passes the object to the `UniformsRendererFactory`.
4.  The factory returns the appropriate concrete renderer instance (e.g., `StarUniformsRenderer`).
5.  The controller calls the `render()` method on this instance.
6.  The renderer uses the helper methods from its base class to create the specific DOM elements (sliders, color pickers) and their RxJS subscriptions, returning the subscriptions to the controller.
7.  The user interacts with a control.
8.  The control's subscription (managed by the base renderer logic) fires, dispatching an `actions.updateCelestialObject` action with the new data.
9.  The global state updates, causing the 3D renderer to re-render the object with the new uniform values.

This architecture makes the system highly extensible. To support a new celestial type (e.g., a Gas Giant), one only needs to create a new `GasGiantUniformsRenderer.ts` and add a single case to the factory, with no changes required to the main controller.
