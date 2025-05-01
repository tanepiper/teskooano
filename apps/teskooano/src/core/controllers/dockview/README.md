# Dockview Plugin (@teskooano/dockview)

This plugin provides the core integration and management for the Dockview library within the Teskooano engine.

## Purpose

Manages the creation, layout, and interaction of panels and groups within the main application window using Dockview.

## Features

- Initializes the main Dockview container.
- Provides controllers (`DockviewController`, `GroupManager`, `OverlayManager`) for managing panels, groups, and overlays.
- Handles component registration and rendering within Dockview panels.
- Defines standard panel types and behaviors.

## Usage

Import the plugin and call its `initialize` method during application setup.

```typescript
import { dockviewPlugin } from "./index";

// During app initialization
const dockviewApi = dockviewPlugin.initialize(/* options */);

// Use dockviewApi.DockviewController, etc.
```
