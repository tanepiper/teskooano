# @teskooano/app-services

Centralized service layer for the Teskooano application, providing business logic extraction and state management for improved MVC architecture.

## Overview

This package implements **Phase 1** of the Teskooano MVC Architecture Improvement Specification by extracting business logic from controllers into dedicated services. It provides four core services that centralize state management and operations:

- **CameraService**: Centralized camera state and operations
- **HierarchyService**: Celestial object hierarchy management
- **PanelService**: Panel lifecycle and coordination
- **RendererService**: Renderer state and operations

## Architecture Benefits

### 🎯 **Separation of Concerns**
- **Views**: Pure DOM manipulation and event delegation
- **Controllers**: Orchestration and coordination
- **Services**: Business logic and state management

### 🧪 **Testability**
- Services can be unit tested independently
- Controllers can be tested with mocked services
- Clear separation enables focused testing strategies

### 🔄 **Reusability**
- Services can be shared across multiple plugins
- Consistent patterns across the application
- Reduced code duplication

### 🔧 **Maintainability**
- Clear data flow: Service → Controller → View
- Centralized state management
- Observable patterns for reactive updates

## Services

### CameraService

Manages camera state and operations with reactive updates.

```typescript
import { CameraService } from '@teskooano/app-services/camera';

const cameraService = new CameraService({
  initialFov: 75,
  initialFocusedObjectId: 'earth'
});

// Focus on an object
cameraService.focusOnObject('mars');

// Subscribe to state changes
cameraService.state$.subscribe(state => {
  console.log('Camera position:', state.currentPosition);
  console.log('Focused object:', state.focusedObjectId);
});

// Update FOV
cameraService.setFov(90);

// Reset camera
cameraService.resetCameraView();
```

**Key Features:**
- Automatic viewing distance calculation
- Smooth transition state management
- Observable camera state
- Object focus with distance calculation

### HierarchyService

Manages celestial object hierarchies with dynamic relationship building.

```typescript
import { HierarchyService } from '@teskooano/app-services/hierarchy';

const hierarchyService = new HierarchyService();

// Build hierarchy from objects
const hierarchyTree = hierarchyService.buildHierarchyTree(celestialObjects);

// Subscribe to hierarchy changes
hierarchyService.state$.subscribe(state => {
  console.log('Root objects:', state.rootObjectIds);
  console.log('Hierarchy tree:', state.hierarchyTree);
});

// Update hierarchies based on physics
hierarchyService.updateHierarchies();

// Find best parent for orphaned object
const bestParent = hierarchyService.findBestParent(object, physicsState, allObjects, allPhysicsStates);
```

**Key Features:**
- Dynamic hierarchy building
- Escape logic for moons and satellites
- Orphaned object handling
- Tree structure with depth tracking

### PanelService

Coordinates panel lifecycle and state management.

```typescript
import { PanelService, PanelLifecycleState } from '@teskooano/app-services/panel';

const panelService = new PanelService({
  autoLifecycle: true,
  onCreatePanel: (id, component) => console.log(`Creating panel: ${id}`),
  onDestroyPanel: (id) => console.log(`Destroying panel: ${id}`)
});

// Register a panel
panelService.registerPanel({
  id: 'celestial-info-1',
  componentName: 'celestial-info',
  title: 'Celestial Information',
  isVisible: true,
  isActive: false
});

// Activate a panel
panelService.activatePanel('celestial-info-1');

// Subscribe to panel state
panelService.state$.subscribe(state => {
  console.log('Active panels:', state.activePanelCount);
  console.log('Current active panel:', state.activePanelId);
});
```

**Key Features:**
- Panel instance tracking
- Lifecycle state management
- Auto-lifecycle based on celestial objects
- Observable panel state

### RendererService

Manages renderer instances and visual settings.

```typescript
import { RendererService } from '@teskooano/app-services/renderer';

const rendererService = new RendererService({
  onRendererCreated: (id, renderer) => console.log(`Renderer created: ${id}`),
  onVisualSettingsChanged: (settings) => console.log('Settings updated:', settings)
});

// Register a renderer
rendererService.registerRenderer('main-renderer', modularSpaceRenderer, containerElement);

// Start rendering
rendererService.startRendering('main-renderer');

// Update visual settings
rendererService.updateVisualSettings({
  trailLengthMultiplier: 200,
  timeScale: 2
});

// Subscribe to renderer state
rendererService.state$.subscribe(state => {
  console.log('Active renderers:', state.activeRendererCount);
  console.log('Visual settings:', state.visualSettings);
});
```

**Key Features:**
- Multi-renderer management
- Visual settings synchronization
- Renderer lifecycle control
- State transformation and adaptation

## Installation

```bash
npm install @teskooano/app-services
```

## Usage Patterns

### Service Injection in Controllers

```typescript
export class MyController {
  constructor(
    private cameraService: CameraService,
    private hierarchyService: HierarchyService
  ) {
    // Subscribe to service state changes
    this.cameraService.state$.subscribe(state => this.handleCameraChange(state));
    this.hierarchyService.state$.subscribe(state => this.handleHierarchyChange(state));
  }

  private handleCameraChange(state: CameraServiceState): void {
    // Update UI based on camera state
  }

  private handleHierarchyChange(state: HierarchyServiceState): void {
    // Update UI based on hierarchy state
  }
}
```

### Service Creation in Coordinators

```typescript
export class PanelCoordinator {
  private services: {
    camera: CameraService;
    hierarchy: HierarchyService;
    panel: PanelService;
    renderer: RendererService;
  };

  constructor() {
    // Create service instances
    this.services = {
      camera: new CameraService({ initialFov: 75 }),
      hierarchy: new HierarchyService(),
      panel: new PanelService({ autoLifecycle: true }),
      renderer: new RendererService()
    };

    // Wire services together if needed
    this.setupServiceInteractions();
  }

  private setupServiceInteractions(): void {
    // Example: Update camera when hierarchy changes
    this.services.hierarchy.state$.subscribe(state => {
      if (state.rootObjectIds.length > 0) {
        this.services.camera.focusOnObject(state.rootObjectIds[0]);
      }
    });
  }
}
```

## Migration Guide

See [MIGRATION_EXAMPLE.md](./MIGRATION_EXAMPLE.md) for detailed examples of how to migrate existing controllers to use the new services.

### Quick Migration Steps

1. **Install the package**:
   ```bash
   npm install @teskooano/app-services
   ```

2. **Import services**:
   ```typescript
   import { CameraService } from '@teskooano/app-services/camera';
   ```

3. **Replace direct manager usage**:
   ```typescript
   // Before
   this._cameraManager?.followObject(objectId);
   
   // After
   this._cameraService.focusOnObject(objectId);
   ```

4. **Subscribe to state changes**:
   ```typescript
   this._cameraService.state$.subscribe(state => {
     this.updateUI(state);
   });
   ```

## API Reference

### CameraService

| Method | Description |
|--------|-------------|
| `focusOnObject(objectId, distance?)` | Focus camera on celestial object |
| `pointCameraAt(position)` | Point camera at specific position |
| `resetCameraView()` | Reset to default camera view |
| `setFov(fov)` | Update field of view |
| `setCameraPosition(position)` | Set camera position manually |
| `setCameraTarget(target)` | Set camera target manually |

### HierarchyService

| Method | Description |
|--------|-------------|
| `buildHierarchyTree(objects)` | Build hierarchy from celestial objects |
| `updateHierarchies()` | Update hierarchies based on physics |
| `findBestParent(obj, state, objects, states)` | Find best parent for object |
| `getObjectsAtLevel(level)` | Get objects at specific hierarchy level |
| `getDescendants(parentId)` | Get all descendant objects |

### PanelService

| Method | Description |
|--------|-------------|
| `registerPanel(panelInfo)` | Register new panel instance |
| `unregisterPanel(panelId)` | Unregister panel instance |
| `activatePanel(panelId)` | Activate/focus panel |
| `deactivatePanel(panelId)` | Deactivate panel |
| `setPanelVisibility(panelId, visible)` | Set panel visibility |
| `getPanel(panelId)` | Get specific panel instance |

### RendererService

| Method | Description |
|--------|-------------|
| `registerRenderer(id, renderer, container)` | Register renderer instance |
| `unregisterRenderer(id)` | Unregister renderer instance |
| `startRendering(id)` | Start rendering for renderer |
| `stopRendering(id)` | Stop rendering for renderer |
| `updateVisualSettings(settings)` | Update visual settings |
| `resizeAllRenderers()` | Resize all active renderers |

## Development

### Building

This package exports TypeScript files directly, so no build step is required.

### Testing

```bash
npm test
```

### Contributing

1. Follow the established patterns in existing services
2. Ensure all methods are properly documented
3. Add unit tests for new functionality
4. Update this README for any API changes

## License

MIT