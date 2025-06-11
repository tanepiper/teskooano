# Architecture: `@teskooano/settings`

This document outlines the architecture of the `@teskooano/settings` plugin, which provides the primary settings panel for the application.

## 1. Overview

The plugin follows a strict **Model-View-Controller (MVC)** pattern to ensure a clear separation of concerns, making the component more modular, testable, and maintainable. It is responsible for rendering the UI for application settings and synchronizing those settings with the global application state (`@teskooano/core-state`).

- **Model:** The "Model" is the global `simulationState`, managed by `simulationStateService` from `@teskooano/core-state`. The settings panel reads from and writes to this state.
- **View:** The `SettingsPanel` custom element (`<teskooano-settings-panel>`) is the "View." It is a 'dumb' component responsible only for rendering the UI and delegating all user interactions to the Controller.
- **Controller:** The `SettingsController` is a dedicated class that contains all the business logic. It handles user input, updates the Model, and reacts to Model changes to keep the View synchronized.

## 2. Directory Structure

The plugin's files are organized to reflect the MVC pattern:

```
settings/
├── controller/
│   └── SettingsController.ts   # (Controller) Business logic and state management.
├── view/
│   ├── SettingsPanel.ts        # (View) The custom element definition.
│   └── Settings.template.ts    # HTML and CSS for the view.
├── index.ts                    # Plugin registration and definition.
└── ARCHITECTURE.md             # This file.
```

## 3. Component Breakdown

### 3.1. `view/SettingsPanel.ts` (View)

- **Type:** `CustomElement` (`<teskooano-settings-panel>`)
- **Responsibilities:**
  - Implements `IContentRenderer` for integration with Dockview.
  - Attaches a Shadow DOM and stamps the HTML from `Settings.template.ts`.
  - On `connectedCallback`, it queries the DOM for its interactive elements (slider, select inputs).
  - **Instantiates `SettingsController`**, passing it the references to the UI elements.
  - On `disconnectedCallback`, it calls the controller's `dispose()` method to clean up event listeners and subscriptions.
- **Key Principle:** This class contains **no business logic**. It only knows how to render itself and who its controller is.

### 3.2. `controller/SettingsController.ts` (Controller)

- **Type:** `Class`
- **Responsibilities:**
  - Receives the UI element references from the `SettingsPanel` via its constructor.
  - **Event Handling:** Adds all necessary event listeners (`change`, `submit`, custom events) to the UI elements.
  - **State Subscription:** Subscribes to the `simulationState$` observable from `@teskooano/core-state`.
  - **State Synchronization (View -> Model):** When a user interacts with a control (e.g., changes the physics engine), the corresponding event handler calls the appropriate method on `simulationStateService` to update the global state.
  - **State Synchronization (Model -> View):** When the `simulationState$` emits a new value, the controller updates the values of the UI controls to reflect the current state. This ensures the UI is always in sync, even if the state is changed by another part of the application.
  - **Lifecycle Management:** The `dispose()` method removes all event listeners and unsubscribes from the RxJS observable to prevent memory leaks.

## 4. Data Flow

1.  **Initialization:**

    - `PluginManager` loads the `teskooano-settings` plugin.
    - User clicks the toolbar button, and `Dockview` creates an instance of `SettingsPanel`.
    - `SettingsPanel.connectedCallback()` fires.
    - `SettingsPanel` creates an instance of `SettingsController`, passing its elements.
    - `SettingsController` subscribes to `simulationState$` and immediately updates the view with the current state.

2.  **User Interaction (e.g., changing Performance Profile):**

    - User selects "High" from the performance profile `<select>` element.
    - The `change` event fires on the element.
    - `SettingsController.handleProfileChange()` is executed.
    - The handler calls `simulationStateService.setPerformanceProfile('high')`.
    - The global `simulationState` is updated.

3.  **State Update Propagation:**
    - The `simulationState$` observable emits the new state.
    - The `SettingsController`'s subscription receives the new state.
    - The `updateControlStates()` method is called within the controller.
    - It compares the new state with the view's current values. If there's a discrepancy (e.g., if another plugin had changed the state), it updates the UI controls accordingly.

This architecture ensures a robust, unidirectional data flow and a clean separation between the presentation layer and the application's business logic.
