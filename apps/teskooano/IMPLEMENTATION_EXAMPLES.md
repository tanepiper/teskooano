# Implementation Examples for Architecture Improvements

This document provides concrete implementation examples for the recommendations outlined in [CODE_QUALITY_ANALYSIS.md](./CODE_QUALITY_ANALYSIS.md).

## 🏗️ Fixing Architectural Misplacement

### Example 5: Separating UI from Business Logic

**Create business logic in core:**

```typescript
// packages/core/physics/src/camera/CameraPhysics.ts
import type { CelestialObject } from "@teskooano/data-types";
import { OSVector3 } from "@teskooano/core-math";

/**
 * Pure physics calculations for camera positioning.
 * No UI dependencies - can be tested in isolation.
 */
export class CameraPhysics {
  /**
   * Calculate optimal viewing distance for an object based on its size.
   */
  calculateOptimalViewingDistance(object: CelestialObject): number {
    const baseRadius = object.physicalCharacteristics.radius;
    const massInfluence = Math.log10(object.physicalCharacteristics.mass) * 0.1;

    // Standard viewing distance is 3x the radius, adjusted for mass
    return baseRadius * 3 * (1 + massInfluence);
  }

  /**
   * Calculate safe approach distance (minimum distance to avoid collision).
   */
  calculateSafeApproachDistance(object: CelestialObject): number {
    return object.physicalCharacteristics.radius * 1.5;
  }

  /**
   * Calculate transition path between two points with physics constraints.
   */
  calculateTransitionPath(
    startPosition: OSVector3,
    targetPosition: OSVector3,
    duration: number,
  ): OSVector3[] {
    // Implement smooth transition curve (e.g., Bézier curve)
    const steps = Math.ceil(duration * 60); // 60 FPS
    const path: OSVector3[] = [];

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      // Simple linear interpolation (could be improved with curves)
      const position = startPosition.lerp(targetPosition, t);
      path.push(position);
    }

    return path;
  }
}
```

**UI orchestration in application layer:**

```typescript
// apps/teskooano/src/camera/UICameraManager.ts
import { CameraPhysics } from "@teskooano/core-physics/camera";
import type { ModularSpaceRenderer } from "@teskooano/renderer-threejs";
import type { CelestialObject } from "@teskooano/data-types";
import { BehaviorSubject, Observable } from "rxjs";

interface CameraState {
  focusedObjectId: string | null;
  isFollowing: boolean;
  targetPosition: { x: number; y: number; z: number } | null;
}

/**
 * UI layer camera manager that orchestrates business logic with rendering.
 */
export class UICameraManager {
  private physics: CameraPhysics;
  private cameraState$ = new BehaviorSubject<CameraState>({
    focusedObjectId: null,
    isFollowing: false,
    targetPosition: null,
  });

  constructor(private renderer: ModularSpaceRenderer) {
    this.physics = new CameraPhysics();
    this.setupUserInteractionListeners();
  }

  /**
   * Public API for focusing on an object.
   */
  async focusOnObject(object: CelestialObject): Promise<void> {
    const optimalDistance =
      this.physics.calculateOptimalViewingDistance(object);
    const safeDistance = Math.max(
      optimalDistance,
      this.physics.calculateSafeApproachDistance(object),
    );

    await this.transitionToObject(object, safeDistance);

    this.updateState({
      focusedObjectId: object.id,
      isFollowing: false,
      targetPosition: object.position,
    });
  }

  /**
   * Start following an object (camera moves with it).
   */
  startFollowing(object: CelestialObject): void {
    const followDistance = this.physics.calculateOptimalViewingDistance(object);

    this.renderer.setFollowTargetObject(
      this.renderer.getObjectById(object.id),
      new THREE.Vector3(0, 0, followDistance),
    );

    this.updateState({
      focusedObjectId: object.id,
      isFollowing: true,
      targetPosition: object.position,
    });
  }

  /**
   * Observable camera state for UI components.
   */
  get cameraState(): Observable<CameraState> {
    return this.cameraState$.asObservable();
  }

  private async transitionToObject(
    object: CelestialObject,
    distance: number,
  ): Promise<void> {
    // Use business logic to calculate transition
    const currentPos = this.renderer.camera.position;
    const targetPos = object.position;

    // Delegate to renderer for actual movement
    return new Promise((resolve) => {
      this.renderer.controlsManager.transitionTo(targetPos, distance);

      // Listen for transition complete event
      const handleComplete = () => {
        document.removeEventListener(
          "camera-transition-complete",
          handleComplete,
        );
        resolve();
      };
      document.addEventListener("camera-transition-complete", handleComplete);
    });
  }

  private setupUserInteractionListeners(): void {
    // Listen for user camera manipulation to clear focus
    document.addEventListener("camera-user-manipulation", () => {
      this.updateState({
        focusedObjectId: null,
        isFollowing: false,
        targetPosition: null,
      });
    });
  }

  private updateState(partialState: Partial<CameraState>): void {
    const currentState = this.cameraState$.value;
    this.cameraState$.next({ ...currentState, ...partialState });
  }
}
```

**Plugin integration:**

```typescript
// apps/teskooano/src/plugins/celestial-hierarchy/controller/CelestialHierarchy.controller.ts
import { UICameraManager } from "../../../camera/UICameraManager.js";
import type { CelestialObject } from "@teskooano/data-types";

export class CelestialHierarchyController {
  constructor(
    private cameraManager: UICameraManager,
    // ... other dependencies
  ) {}

  /**
   * Handle user clicking on an object in the hierarchy.
   */
  async handleObjectClick(objectId: string): Promise<void> {
    const object = this.getCelestialObject(objectId);
    if (!object) return;

    // Delegate to UI camera manager (which uses business logic)
    await this.cameraManager.focusOnObject(object);

    // Update UI state
    this.setSelectedObject(objectId);
  }

  /**
   * Handle user requesting to follow an object.
   */
  handleFollowRequest(objectId: string): void {
    const object = this.getCelestialObject(objectId);
    if (!object) return;

    this.cameraManager.startFollowing(object);
    this.setSelectedObject(objectId);
  }
}
```

This separation provides:

- ✅ **Pure business logic** in core packages (testable, reusable)
- ✅ **UI orchestration** in application layer (framework-specific)
- ✅ **Clear boundaries** between concerns
- ✅ **Dependency injection** instead of tight coupling

---

_These examples demonstrate how the recommendations from the code quality analysis can be practically implemented to reduce duplication, complexity, and architectural issues._
