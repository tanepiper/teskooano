# Teskooano Controllers

This directory contains controller classes that manage various aspects of the Teskooano application.

## DockviewController

The `DockviewController` is responsible for managing the UI layout of the application using the Dockview library. It provides a simple API for creating and managing panel groups, adding panels to these groups, and controlling the UI layout.

### Key Features:

- **Component Registry**: Register component classes that can be instantiated by Dockview
- **Named Group Management**: Create logical groups and refer to them by name instead of ID
- **Panel Management**: Add panels to groups, either by group reference or name
- **View Maximization**: Toggle between normal and maximized views

### Usage Examples:

#### Initialize the Controller

```typescript
// In your main application initialization
const dockviewContainer = document.getElementById('dockview-container');
const dockviewController = new DockviewController(dockviewContainer);

// Pass the controller to other components that need to interact with the UI
const toolbarController = new ToolbarController(
  document.getElementById('toolbar-container'), 
  dockviewController
);
```

#### Register Component Types

```typescript
// Register a custom panel component
dockviewController.registerComponent('my_custom_panel', MyCustomPanelClass);
```

#### Working with Groups

```typescript
// Create (or get existing) named group
const controlsGroup = dockviewController.createOrGetGroup('controls');

// Add a panel directly to a group
dockviewController.addPanelToGroup(controlsGroup, {
  id: 'settings_panel',
  component: 'settings',
  title: 'Settings'
});

// Add a panel to a named group (creates the group if it doesn't exist)
dockviewController.addPanelToNamedGroup('engine_views', {
  id: 'main_engine_view',
  component: 'composite_engine_view',
  title: 'Main Engine View'
});

// Maximize a group by name
dockviewController.maximizeGroupByName('engine_views');

// Exit maximized view
dockviewController.exitMaximizedGroup();
```

### Best Practices

1. **Use Logical Group Names**: Always use consistent, logical names for groups, such as 'engine_views' or 'controls'.

2. **Panel IDs**: Give each panel a unique, descriptive ID. This helps with tracking and manipulating panels later.

3. **Component Registration**: Register all custom panel components before attempting to use them.

4. **Error Handling**: The controller methods provide robust error handling and return `null` when operations fail. Always check return values.

## ToolbarController

The `ToolbarController` is responsible for managing the toolbar UI and adding engine views. It uses the DockviewController to add panels to the UI.

## TourController

The `TourController` manages application tours that guide users through features of the application. 