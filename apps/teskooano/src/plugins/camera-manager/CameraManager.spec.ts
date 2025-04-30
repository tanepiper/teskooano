import { describe, it, expect, vi, beforeEach } from "vitest";
import { CameraManager } from "./CameraManager";
import { ModularSpaceRenderer } from "@teskooano/renderer-threejs";
import * as THREE from "three";
import { atom } from "nanostores";
import { renderableObjectsStore } from "@teskooano/core-state";

// Mocks
vi.mock("@teskooano/renderer-threejs");
vi.mock("@teskooano/core-state", () => ({
  renderableObjectsStore: atom<Record<string, any>>({}),
}));

// Helper to create mock renderable objects
const createMockRenderable = (id: string, position: THREE.Vector3) => ({
  celestialObjectId: id,
  position: position.clone(),
  name: `Mock ${id}`,
  type: "PLANET",
  status: "MOCK_STATUS",
  // Add missing properties based on linter feedback
  radius: 10, // Mock radius
  mass: 1000, // Mock mass
  rotation: new THREE.Euler(), // Mock rotation
  realRadius_m: 100000, // Mock real radius
  orbit: null, // Keep previous placeholders just in case
  renderType: "mesh",
  celestialBodyType: "PLANET",
  isSelected: false,
});

describe("CameraManager", () => {
  let mockRenderer: ModularSpaceRenderer;
  let cameraManager: CameraManager;

  beforeEach(() => {
    // Reset mocks and stores before each test
    vi.clearAllMocks();
    renderableObjectsStore.set({}); // Clear renderables

    // Create a new mock renderer instance for each test
    mockRenderer = new ModularSpaceRenderer({} as HTMLCanvasElement) as any;

    // Mock necessary properties and methods on the renderer
    (mockRenderer as any).camera = new THREE.PerspectiveCamera();
    mockRenderer.sceneManager = {
      setFov: vi.fn(),
    } as any;
    mockRenderer.controlsManager = {
      controls: {
        target: new THREE.Vector3(),
        update: vi.fn(),
      },
      moveToPosition: vi.fn(),
      pointCameraAtTarget: vi.fn(),
    } as any;
    mockRenderer.setFollowTarget = vi.fn();

    // Instantiate CameraManager
    cameraManager = new CameraManager({ renderer: mockRenderer });
  });

  it("should initialize with default values if none provided", () => {
    const state = cameraManager.getCameraStateAtom().getValue();
    expect(state.fov).toBe(75); // DEFAULT_FOV
    expect(state.focusedObjectId).toBeNull();
    expect(state.currentPosition.equals(new THREE.Vector3(200, 200, 200))).toBe(
      true,
    ); // DEFAULT_CAMERA_POSITION
    expect(state.currentTarget.equals(new THREE.Vector3(0, 0, 0))).toBe(true); // DEFAULT_CAMERA_TARGET
    expect(mockRenderer.sceneManager.setFov).toHaveBeenCalledWith(75);
  });

  it("should initialize with provided options", () => {
    const initialPosition = new THREE.Vector3(10, 20, 30);
    const initialTarget = new THREE.Vector3(1, 2, 3);
    const initialFov = 60;
    const initialFocusId = "obj1";

    renderableObjectsStore.set({
      [initialFocusId]: createMockRenderable(
        initialFocusId,
        initialTarget,
      ) as any,
    });

    const managerWithOptions = new CameraManager({
      renderer: mockRenderer,
      initialFov: initialFov,
      initialFocusedObjectId: initialFocusId,
      initialCameraPosition: initialPosition,
      initialCameraTarget: new THREE.Vector3(99, 99, 99), // Target should be derived from focus object
    });

    const state = managerWithOptions.getCameraStateAtom().getValue();
    expect(state.fov).toBe(initialFov);
    expect(state.focusedObjectId).toBe(initialFocusId);
    expect(state.currentPosition.equals(initialPosition)).toBe(true);
    expect(state.currentTarget.equals(initialTarget)).toBe(true); // Should match focus object
    expect(mockRenderer.sceneManager.setFov).toHaveBeenCalledWith(initialFov);
  });

  it("initializeCameraPosition should set renderer camera and controls target", () => {
    const initialPosition = new THREE.Vector3(10, 20, 30);
    const initialTarget = new THREE.Vector3(1, 2, 3);
    const manager = new CameraManager({
      renderer: mockRenderer,
      initialCameraPosition: initialPosition,
      initialCameraTarget: initialTarget,
    });

    manager.initializeCameraPosition();

    expect(mockRenderer.camera.position.equals(initialPosition)).toBe(true);
    expect(
      mockRenderer.controlsManager.controls.target.equals(initialTarget),
    ).toBe(true);
    expect(mockRenderer.controlsManager.controls.update).toHaveBeenCalled();
  });

  it("setFov should update state and call renderer", () => {
    const newFov = 90;
    cameraManager.setFov(newFov);
    const state = cameraManager.getCameraStateAtom().getValue();
    expect(state.fov).toBe(newFov);
    expect(mockRenderer.sceneManager.setFov).toHaveBeenCalledWith(newFov);
  });

  it("setFov should not update if fov is the same", () => {
    const initialFov = cameraManager.getCameraStateAtom().getValue().fov;
    vi.clearAllMocks(); // Clear initial setup call
    cameraManager.setFov(initialFov);
    expect(mockRenderer.sceneManager.setFov).not.toHaveBeenCalled();
  });

  it("focusOnObject should call renderer methods and update internal state intent", () => {
    const objectId = "testObj";
    const objectPosition = new THREE.Vector3(100, 0, 0);
    renderableObjectsStore.set({
      [objectId]: createMockRenderable(objectId, objectPosition) as any,
    });

    cameraManager.focusOnObject(objectId);

    // Check internal state reflects the *intent* immediately
    expect(cameraManager.getCameraStateAtom().getValue().focusedObjectId).toBe(
      objectId,
    );

    // Check renderer methods are called
    expect(mockRenderer.setFollowTarget).toHaveBeenCalledWith(
      objectId,
      expect.any(THREE.Vector3),
      expect.any(THREE.Vector3),
    );
    const expectedTarget = objectPosition;
    const expectedPosition = expect.any(THREE.Vector3); // Position depends on offset and distance
    expect(mockRenderer.setFollowTarget).toHaveBeenCalledWith(
      objectId,
      expectedTarget,
      expectedPosition,
    );

    // Check controlsManager.moveToPosition is NOT called directly by focusOnObject
    expect(mockRenderer.controlsManager.moveToPosition).not.toHaveBeenCalled();
  });

  it("focusOnObject(null) should clear focus and move to default", () => {
    // First focus on something
    const objectId = "testObj";
    const objectPosition = new THREE.Vector3(100, 0, 0);
    renderableObjectsStore.set({
      [objectId]: createMockRenderable(objectId, objectPosition) as any,
    });
    cameraManager.focusOnObject(objectId);
    expect(cameraManager.getCameraStateAtom().getValue().focusedObjectId).toBe(
      objectId,
    ); // Verify initial focus

    // Now clear focus
    cameraManager.focusOnObject(null);

    expect(
      cameraManager.getCameraStateAtom().getValue().focusedObjectId,
    ).toBeNull(); // Intent updated
    expect(mockRenderer.setFollowTarget).toHaveBeenCalledWith(null);
    expect(mockRenderer.controlsManager.moveToPosition).toHaveBeenCalledWith(
      expect.any(THREE.Vector3), // Default Position
      expect.any(THREE.Vector3), // Default Target
    );
    expect(mockRenderer.controlsManager.moveToPosition).toHaveBeenCalledWith(
      expect.objectContaining({ x: 200, y: 200, z: 200 }),
      expect.objectContaining({ x: 0, y: 0, z: 0 }),
    );
  });

  it("focusOnObject should handle missing object", () => {
    const objectId = "nonExistent";
    cameraManager.focusOnObject(objectId);

    // State should remain unfocused (or revert if previously focused)
    expect(
      cameraManager.getCameraStateAtom().getValue().focusedObjectId,
    ).toBeNull();
    expect(mockRenderer.setFollowTarget).not.toHaveBeenCalled();
    expect(mockRenderer.controlsManager.moveToPosition).not.toHaveBeenCalled();
    // Optional: Check console.error was called? Requires spyOn(console, 'error')
  });

  it("resetCameraView should clear focus and move to default", () => {
    // Focus on something first
    const objectId = "testObj";
    const objectPosition = new THREE.Vector3(100, 0, 0);
    renderableObjectsStore.set({
      [objectId]: createMockRenderable(objectId, objectPosition) as any,
    });
    cameraManager.focusOnObject(objectId);
    expect(cameraManager.getCameraStateAtom().getValue().focusedObjectId).toBe(
      objectId,
    );

    cameraManager.resetCameraView();

    expect(
      cameraManager.getCameraStateAtom().getValue().focusedObjectId,
    ).toBeNull();
    expect(mockRenderer.setFollowTarget).toHaveBeenCalledWith(null);
    expect(mockRenderer.controlsManager.moveToPosition).toHaveBeenCalledWith(
      expect.objectContaining({ x: 200, y: 200, z: 200 }), // Default Position
      expect.objectContaining({ x: 0, y: 0, z: 0 }), // Default Target
    );
  });

  it("pointCameraAt should call controlsManager method", () => {
    const targetPosition = new THREE.Vector3(50, 50, 50);
    cameraManager.pointCameraAt(targetPosition);

    expect(
      mockRenderer.controlsManager.pointCameraAtTarget,
    ).toHaveBeenCalledWith(
      expect.objectContaining({ x: 50, y: 50, z: 50 }), // Ensure it's the correct vector
      true, // Use transition
    );
    // pointCameraAt should NOT change the focusedObjectId state
    expect(
      cameraManager.getCameraStateAtom().getValue().focusedObjectId,
    ).toBeNull();
  });

  it("handleCameraTransitionComplete should update state from event detail", () => {
    const finalPosition = new THREE.Vector3(1, 1, 1);
    const finalTarget = new THREE.Vector3(2, 2, 2);
    const finalFocusId = "objFinal";

    const mockEvent = new CustomEvent("camera-transition-complete", {
      detail: {
        position: finalPosition,
        target: finalTarget,
        focusedObjectId: finalFocusId,
      },
    });

    // Manually trigger the handler
    (cameraManager as any).handleCameraTransitionComplete(mockEvent);

    const state = cameraManager.getCameraStateAtom().getValue();
    expect(state.currentPosition.equals(finalPosition)).toBe(true);
    expect(state.currentTarget.equals(finalTarget)).toBe(true);
    expect(state.focusedObjectId).toBe(finalFocusId);
  });

  it("handleCameraTransitionComplete should update state position/target from event without focus id", () => {
    const finalPosition = new THREE.Vector3(1, 1, 1);
    const finalTarget = new THREE.Vector3(2, 2, 2);

    // Set an initial focus
    const initialVal = cameraManager.getCameraStateAtom().getValue();
    cameraManager
      .getCameraStateAtom()
      .next({ ...initialVal, focusedObjectId: "initialFocus" });

    const mockEvent = new CustomEvent("camera-transition-complete", {
      detail: {
        position: finalPosition,
        target: finalTarget,
        // No focusedObjectId in this event (e.g., manual pan)
      },
    });

    // Manually trigger the handler
    (cameraManager as any).handleCameraTransitionComplete(mockEvent);

    const state = cameraManager.getCameraStateAtom().getValue();
    expect(state.currentPosition.equals(finalPosition)).toBe(true);
    expect(state.currentTarget.equals(finalTarget)).toBe(true);
    // Focus ID should remain unchanged if not provided in event
    expect(state.focusedObjectId).toBe("initialFocus");
  });

  it("handleCameraTransitionComplete should update state after manual interaction (no detail)", () => {
    const newCamPos = new THREE.Vector3(55, 66, 77);
    const newTargetPos = new THREE.Vector3(5, 6, 7);

    // Simulate renderer state after manual move
    mockRenderer.camera.position.copy(newCamPos);
    mockRenderer.controlsManager.controls.target.copy(newTargetPos);

    const mockEvent = new Event("camera-transition-complete"); // Event without detail

    // Manually trigger the handler
    (cameraManager as any).handleCameraTransitionComplete(mockEvent);

    const state = cameraManager.getCameraStateAtom().getValue();
    expect(state.currentPosition.equals(newCamPos)).toBe(true);
    expect(state.currentTarget.equals(newTargetPos)).toBe(true);
    // Manual interaction should clear focus
    expect(state.focusedObjectId).toBeNull();
  });

  it("handleCameraTransitionComplete should call onFocusChangeCallback", () => {
    const mockCallback = vi.fn();
    const managerWithCallback = new CameraManager({
      renderer: mockRenderer,
      onFocusChangeCallback: mockCallback,
    });

    const finalFocusId = "objFinalCallback";
    const mockEvent = new CustomEvent("camera-transition-complete", {
      detail: {
        position: new THREE.Vector3(),
        target: new THREE.Vector3(),
        focusedObjectId: finalFocusId,
      },
    });

    (managerWithCallback as any).handleCameraTransitionComplete(mockEvent);
    expect(mockCallback).toHaveBeenCalledWith(finalFocusId);

    // Test clearing focus
    const mockEventClear = new CustomEvent("camera-transition-complete", {
      detail: {
        position: new THREE.Vector3(),
        target: new THREE.Vector3(),
        focusedObjectId: null, // Explicitly clear focus
      },
    });
    (managerWithCallback as any).handleCameraTransitionComplete(mockEventClear);
    expect(mockCallback).toHaveBeenCalledWith(null);
  });

  it("destroy should remove event listener", () => {
    const removeSpy = vi.spyOn(document, "removeEventListener");
    cameraManager.destroy();
    expect(removeSpy).toHaveBeenCalledWith(
      "camera-transition-complete",
      (cameraManager as any).handleCameraTransitionComplete, // Ensure it's the bound handler instance
    );
  });
});
