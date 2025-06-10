# Engine Toolbar Plugin

This plugin provides the `EngineToolbarManager` service, which is responsible for creating and managing individual `EngineToolbar` instances that are displayed within engine panels (e.g., the main 3D view).

## Architecture

The system follows a consistent depenency pattern.

1.  **Initialization via Function**: The `EngineToolbarManager` is not created automatically. Instead, the plugin provides an `engine-toolbar:initialize` function. The main application bootstrap process must execute this function to create the singleton instance of the manager, passing it the application's `PluginExecutionContext`.
2.  **`EngineToolbarManager` (Singleton Service)**: The manager instance acts as a factory. It holds the execution context and uses it to create `EngineToolbar` instances.
3.  **`EngineToolbar` (UI Component Instance)**: A UI component created on-demand by the manager. It also receives the `PluginExecutionContext` and is therefore fully self-contained, able to interact with any other part of the application through the context.

This architecture ensures that all parts of the system are decoupled and receive their dependencies explicitly, making them more robust and testable.

## Features

- **Context-Driven**: Operates entirely within the `PluginExecutionContext`, ensuring it has access to all core controllers and services without relying on globals.
- **Plugin-Driven Content**: Toolbars are populated dynamically. Any plugin can add items by registering a configuration with the `target` property set to `"engine-toolbar"`.
- **Instance-Specific Context**: The `parentEngine` instance can be passed through to newly created panels, allowing them to communicate with the engine that opened them.
- **State Management**: The manager uses RxJS to handle the expanded/collapsed state for each toolbar instance independently.

## Usage

A panel that hosts an "engine" (like `composite-engine-view`) must be created with the `EngineToolbarManager` instance passed into its `params`. The main application is responsible for initializing the manager and passing it.

### Example: Inside an Engine Panel Component

```typescript
import { IContentRenderer, PanelInitParameters } from "dockview-core";
import {
  EngineToolbar,
  EngineToolbarManager,
  PluginExecutionContext,
} from "@teskooano/core"; // Adjust path

// The init params must now include the manager instance
export type MyEnginePanelParams = PanelInitParameters & {
  params: {
    engineToolbarManager: EngineToolbarManager;
    context: PluginExecutionContext;
  };
};

export class MyEnginePanel implements IContentRenderer {
  private _element: HTMLElement;
  private _toolbar: EngineToolbar | null = null;
  private _toolbarManager: EngineToolbarManager;

  constructor() {
    this._element = document.createElement("div");
    this._element.style.position = "relative"; // Required for overlay
  }

  init(parameters: MyEnginePanelParams) {
    // Get the manager from the panel's init parameters
    this._toolbarManager = parameters.params.engineToolbarManager;

    // The panel's api.id provides a unique identifier for the toolbar
    this._toolbar = this._toolbarManager.createToolbarForPanel(
      parameters.api.id,
      this._element, // The toolbar will be appended here
      this, // Pass a reference to this engine instance
    );
  }

  dispose() {
    if (this._toolbar) {
      // Use the manager to clean up the toolbar
      this._toolbarManager.disposeToolbarForPanel(this._toolbar.api.id);
    }
  }

  // ... other panel logic
}
```

### Example: Adding a Button to the Engine Toolbar

Another plugin can add a button to all engine toolbars like this:

```typescript
// in another plugin's definition
import { TeskooanoPlugin } from "@teskooano/ui-plugin";
import MyIcon from "./my-icon.svg?raw";

export const plugin: TeskooanoPlugin = {
  id: "my-engine-feature",
  // ...
  toolbarRegistrations: [
    {
      target: "engine-toolbar", // <-- Target the engine toolbar
      id: "my-engine-button",
      type: "panel",
      title: "Open My Feature",
      iconSvg: MyIcon,
      componentName: "my-feature-panel",
      behaviour: "toggle",
    },
  ],
};
```
