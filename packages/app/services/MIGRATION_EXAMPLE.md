# Migration Example: Refactoring EngineCameraManager to use CameraService

This document demonstrates how to extract business logic from existing controllers to use the new `@teskooano/app-services` package.

## Before: Direct CameraManager Usage

```typescript
// apps/teskooano/src/plugins/engine-panel/panels/camera-manager/EngineCameraManager.ts
import { CameraManager } from "@teskooano/renderer-threejs-controls";

export class EngineCameraManager {
  private _cameraManager: CameraManager | undefined;
  private _panelApiId: string | undefined;

  constructor(cameraManager?: CameraManager, panelApiId?: string) {
    this._cameraManager = cameraManager;
    this._panelApiId = panelApiId;
  }

  public focusOnObject(objectId: string): void {
    this._cameraManager?.followObject(objectId);
  }

  public setFov(fov: number): void {
    this._cameraManager?.setFov(fov);
  }

  public resetCameraView(): void {
    this._cameraManager?.resetCameraView();
  }
}
```

## After: Using CameraService

```typescript
// apps/teskooano/src/plugins/engine-panel/panels/camera-manager/EngineCameraManager.ts
import { CameraService } from "@teskooano/app-services/camera";
import { Subscription } from "rxjs";

export class EngineCameraManager {
  private _cameraService: CameraService;
  private _panelApiId: string | undefined;
  private _subscription = new Subscription();

  constructor(cameraService: CameraService, panelApiId?: string) {
    this._cameraService = cameraService;
    this._panelApiId = panelApiId;
    
    // Subscribe to camera state changes for UI updates
    this._subscription.add(
      this._cameraService.state$.subscribe(state => {
        this._handleCameraStateChange(state);
      })
    );
  }

  public focusOnObject(objectId: string | null): void {
    this._cameraService.focusOnObject(objectId);
  }

  public setFov(fov: number): void {
    this._cameraService.setFov(fov);
  }

  public resetCameraView(): void {
    this._cameraService.resetCameraView();
  }

  public setCameraPosition(position: OSVector3): void {
    this._cameraService.setCameraPosition(position);
  }

  public setCameraTarget(target: OSVector3): void {
    this._cameraService.setCameraTarget(target);
  }

  private _handleCameraStateChange(state: CameraServiceState): void {
    // Handle camera state changes for UI updates
    console.debug(`[EngineCameraManager] Camera state updated:`, state);
  }

  public dispose(): void {
    this._subscription.unsubscribe();
  }
}
```

## Key Benefits of the Migration

### 1. **Separation of Concerns**
- **Before**: Controller directly managed camera operations
- **After**: Controller orchestrates UI, service handles business logic

### 2. **Testability**
- **Before**: Hard to test camera operations in isolation
- **After**: CameraService can be unit tested independently

### 3. **Reusability**
- **Before**: Camera logic tied to specific panel implementation
- **After**: CameraService can be shared across multiple components

### 4. **State Management**
- **Before**: State scattered across different managers
- **After**: Centralized, observable camera state

## Migration Steps

### Step 1: Install the Services Package

Add the new services package to your dependencies:

```json
{
  "dependencies": {
    "@teskooano/app-services": "workspace:*"
  }
}
```

### Step 2: Update Constructor Dependencies

Replace direct manager dependencies with service dependencies:

```typescript
// Before
constructor(cameraManager?: CameraManager) {
  this._cameraManager = cameraManager;
}

// After
constructor(cameraService: CameraService) {
  this._cameraService = cameraService;
}
```

### Step 3: Replace Direct Method Calls

Update method implementations to use service methods:

```typescript
// Before
public focusOnObject(objectId: string): void {
  this._cameraManager?.followObject(objectId);
}

// After
public focusOnObject(objectId: string | null): void {
  this._cameraService.focusOnObject(objectId);
}
```

### Step 4: Subscribe to Service State

Add reactive state handling:

```typescript
// Add subscription to service state
this._subscription.add(
  this._cameraService.state$.subscribe(state => {
    this._handleCameraStateChange(state);
  })
);
```

### Step 5: Update Panel Coordinators

Update coordinators to create and inject services:

```typescript
// apps/teskooano/src/plugins/engine-panel/panels/composite-panel/managers/PanelCameraCoordinator.ts
import { CameraService } from "@teskooano/app-services/camera";

export class PanelCameraCoordinator {
  private _cameraService: CameraService;
  private _engineCameraManager: EngineCameraManager;

  constructor(/* ... */) {
    // Create camera service instance
    this._cameraService = new CameraService({
      initialFov: options.initialFov,
      initialFocusedObjectId: options.initialFocusedObjectId
    });

    // Create engine camera manager with service
    this._engineCameraManager = new EngineCameraManager(
      this._cameraService,
      panelApiId
    );
  }
}
```

## Complete Example: HierarchyService Integration

Here's how to integrate the HierarchyService into an existing controller:

```typescript
// Before: Direct hierarchy management
export class CelestialHierarchyController {
  private focusListManager: FocusListManager;

  private populateHierarchy(objects: Record<string, CelestialObject>): void {
    // Complex hierarchy building logic...
    const dynamicHierarchy = new Map<string | null, string[]>();
    // ... lots of manual hierarchy logic
  }
}

// After: Using HierarchyService
export class CelestialHierarchyController {
  private hierarchyService: HierarchyService;
  private focusListManager: FocusListManager;

  constructor(hierarchyService: HierarchyService) {
    this.hierarchyService = hierarchyService;
    
    // Subscribe to hierarchy changes
    this.hierarchyService.state$.subscribe(state => {
      this.updateUI(state.hierarchyTree);
    });
  }

  private updateUI(hierarchyTree: HierarchyNode[]): void {
    // Simple UI update based on service state
    this.focusListManager.renderHierarchy(hierarchyTree);
  }
}
```

## Migration Checklist

- [ ] Install `@teskooano/app-services` package
- [ ] Identify controllers with business logic to extract
- [ ] Create service instances in appropriate coordinators
- [ ] Update controller constructors to receive services
- [ ] Replace direct manager calls with service methods
- [ ] Add service state subscriptions for reactive updates
- [ ] Update unit tests to mock services instead of managers
- [ ] Remove direct manager dependencies where no longer needed
- [ ] Update documentation to reflect new architecture

## Next Steps

1. **Phase 2**: Continue with View Simplification
2. **Phase 3**: Implement Controller Refactoring with base classes
3. **Phase 4**: Add unified state management with ServiceContainer