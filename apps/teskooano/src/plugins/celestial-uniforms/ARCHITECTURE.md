# `@/celestial-uniforms` Architecture

## 1. Purpose

The `@/celestial-uniforms` plugin provides a UI panel that allows for the real-time editing of shader uniforms and other physical properties of a selected celestial object. It dynamically generates a set of controls (sliders, color pickers) based on the specific properties of the focused object (e.g., a star's color, a planet's procedural surface parameters).

This plugin is solely responsible for providing raw editing controls. It does **not** display formatted or read-only information; that is the responsibility of other plugins, such as `@/celestial-info`.

## 2. Core Pattern: Model-View-Controller (MVC)

To ensure separation of concerns, testability, and maintainability, this plugin will be refactored to follow the project's standard MVC pattern.

### 2.1. View: `celestial-uniforms/view/CelestialUniforms.view.ts`

- **Class:** `CelestialUniformsEditor` (Custom Element: `<celestial-uniforms-editor>`)
- **Responsibilities:**
  - Acts as the "dumb" view layer. Its only job is to manage the DOM.
  - It will implement Dockview's `IContentRenderer` interface.
  - On initialization, it will create its `ShadowRoot` and find references to key DOM elements (the main container, title, placeholder).
  - It will instantiate the `CelestialUniformsController`.
  - It will pass its DOM element references to the controller's constructor.
  - It will provide public methods for the controller to call to update the UI (e.g., `renderControls(elements)`, `showPlaceholder(message)`, `setTitle(text)`).
  - It will have **NO** business logic, state subscriptions, or event handling logic beyond what is necessary to instantiate and link the controller.

### 2.2. Controller: `celestial-uniforms/controller/CelestialUniforms.controller.ts`

- **Class:** `CelestialUniformsController`
- **Responsibilities:**
  - Acts as the "smart" logic layer. It contains all the business logic for the plugin.
  - **State Management:**
    - It subscribes to the global `celestialObjects$` store to react to changes in object data.
    - It listens for global focus events (`renderer-focus-changed`, `focus-request-initiated`) to know which object is selected.
  - **UI Generation:**
    - When the focused object changes, the controller is responsible for generating the appropriate UI controls.
    - It contains the helper methods (`_createNumericInput`, `_createColorInput`, etc.) that create the `teskooano-slider` and other input elements.
  - **Event Handling:**
    - It sets up RxJS subscriptions on the generated UI controls' events (`SLIDER_CHANGE`, `change`).
    - When a control's value changes, the controller clones the latest object properties from the state store, updates the relevant value, and dispatches a `updateCelestialObject` action.
  - **Lifecycle Management:**
    - It exposes `initialize` and `dispose` methods to manage its subscriptions and event listeners, which are called by the View.

### 2.3. Template: `celestial-uniforms/view/CelestialUniforms.template.ts`

- **Responsibilities:**
  - Contains the static HTML `<template>` and CSS for the component.
  - This file is used by the View to create the initial Shadow DOM structure.

## 3. Data Flow

1.  A global event (e.g., `renderer-focus-changed`) is fired with a `celestialObjectId`.
2.  The `CelestialUniformsController` catches this event.
3.  The controller retrieves the full `CelestialObject` data from the `celestialObjects$` state store using the ID.
4.  The controller analyzes the object's `type` and `properties` to determine which UI controls to generate.
5.  The controller calls its private UI generation methods (e.g., `_renderProceduralSurfaceControls`), which create an array of DOM elements and their associated RxJS `Subscription` objects.
6.  The controller calls a public method on the `CelestialUniformsEditor` (View), passing the array of DOM elements to be rendered in the panel.
7.  The user interacts with a control (e.g., moves a slider).
8.  The control fires an event (e.g., `SLIDER_CHANGE`).
9.  The controller's RxJS subscription for that control is triggered.
10. The controller dispatches an `actions.updateCelestialObject` action with the new property data.
11. The global state updates, causing the 3D renderer to re-render the object with the new uniform values.

This architecture decouples the complex logic of state management and UI generation from the DOM representation, making the plugin more robust, maintainable, and aligned with the project's standards.
