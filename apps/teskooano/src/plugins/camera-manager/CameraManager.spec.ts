import { describe, it, expect, vi, beforeEach } from "vitest";
import { CameraManager } from "./CameraManager";
import { ModularSpaceRenderer } from "@teskooano/renderer-threejs";
import * as THREE from "three";
import { renderableObjects$ } from "@teskooano/core-state";
import { BehaviorSubject, firstValueFrom } from "rxjs";
import type { CameraManagerState } from "./types";

vi.mock("@teskooano/renderer-threejs");
vi.mock("@teskooano/core-state", () => ({
  renderableObjects$: new BehaviorSubject<Record<string, any>>({}),
}));

const createMockRenderable = (id: string, position: THREE.Vector3) => ({
  celestialObjectId: id,
  position: position.clone(),
  name: `Mock ${id}`,
  type: "PLANET",
  status: "MOCK_STATUS",

  radius: 10,
  mass: 1000,
  rotation: new THREE.Euler(),
  realRadius_m: 100000,
  orbit: null,
  renderType: "mesh",
  celestialBodyType: "PLANET",
  isSelected: false,
});

describe("CameraManager", () => {
  let mockRenderer: ModularSpaceRenderer;
  let cameraManager: CameraManager;
  let mockRenderableObjects$: BehaviorSubject<Record<string, any>>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRenderableObjects$ = renderableObjects$ as BehaviorSubject<
      Record<string, any>
    >;
    mockRenderableObjects$.next({});

    mockRenderer = new ModularSpaceRenderer({} as HTMLCanvasElement) as any;

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

    cameraManager = new CameraManager();
  });

  const getCameraManagerValue = () =>
    (
      cameraManager.getCameraState$() as BehaviorSubject<CameraManagerState>
    ).getValue();

  it("should initialize with default values if none provided", () => {
    const state = getCameraManagerValue();
    expect(state.fov).toBe(75);
    expect(state.focusedObjectId).toBeNull();
    expect(state.currentPosition.equals(new THREE.Vector3(200, 200, 200))).toBe(
      true,
    );
    expect(state.currentTarget.equals(new THREE.Vector3(0, 0, 0))).toBe(true);
    expect(mockRenderer.sceneManager.setFov).toHaveBeenCalledWith(75);
  });

  it("should initialize with provided options", () => {
    const initialPosition = new THREE.Vector3(10, 20, 30);
    const initialTarget = new THREE.Vector3(1, 2, 3);
    const initialFov = 60;
    const initialFocusId = "obj1";

    mockRenderableObjects$.next({
      [initialFocusId]: createMockRenderable(
        initialFocusId,
        initialTarget,
      ) as any,
    });

    cameraManager = new CameraManager();

    const state = getCameraManagerValue();
    expect(state.fov).toBe(initialFov);
    expect(state.focusedObjectId).toBe(initialFocusId);
    expect(state.currentPosition.equals(initialPosition)).toBe(true);
    expect(state.currentTarget.equals(initialTarget)).toBe(true);
    expect(mockRenderer.sceneManager.setFov).toHaveBeenCalledWith(initialFov);
  });

  it("initializeCameraPosition should set renderer camera and controls target", () => {
    const initialPosition = new THREE.Vector3(10, 20, 30);
    const initialTarget = new THREE.Vector3(1, 2, 3);
    cameraManager = new CameraManager();

    cameraManager.initializeCameraPosition();

    expect(mockRenderer.camera.position.equals(initialPosition)).toBe(true);
    expect(
      mockRenderer.controlsManager.controls.target.equals(initialTarget),
    ).toBe(true);
    expect(mockRenderer.controlsManager.controls.update).toHaveBeenCalled();
  });

  it("setFov should update state and call renderer", () => {
    const newFov = 90;
    cameraManager.setFov(newFov);
    const state = (
      cameraManager.getCameraState$() as BehaviorSubject<any>
    ).getValue();
    expect(state.fov).toBe(newFov);
    expect(mockRenderer.sceneManager.setFov).toHaveBeenCalledWith(newFov);
  });

  it("setFov should not update if fov is the same", () => {
    const initialFov = (
      cameraManager.getCameraState$() as BehaviorSubject<any>
    ).getValue().fov;
    vi.clearAllMocks();
    cameraManager.setFov(initialFov);
    expect(mockRenderer.sceneManager.setFov).not.toHaveBeenCalled();
  });

  it("focusOnObject should call renderer methods and update internal state intent", () => {
    const objectId = "testObj";
    const objectPosition = new THREE.Vector3(100, 0, 0);
    mockRenderableObjects$.next({
      [objectId]: createMockRenderable(objectId, objectPosition) as any,
    });

    cameraManager.followObject(objectId);

    expect(
      (cameraManager.getCameraState$() as BehaviorSubject<any>).getValue()
        .focusedObjectId,
    ).toBe(objectId);

    expect(mockRenderer.setFollowTarget).toHaveBeenCalledWith(
      objectId,
      expect.any(THREE.Vector3),
      expect.any(THREE.Vector3),
    );
    const expectedTarget = objectPosition;
    const expectedPosition = expect.any(THREE.Vector3);
    expect(mockRenderer.setFollowTarget).toHaveBeenCalledWith(
      objectId,
      expectedTarget,
      expectedPosition,
    );

    expect(mockRenderer.controlsManager.moveToPosition).not.toHaveBeenCalled();
  });

  it("focusOnObject(null) should clear focus and move to default", () => {
    const objectId = "testObj";
    const objectPosition = new THREE.Vector3(100, 0, 0);
    mockRenderableObjects$.next({
      [objectId]: createMockRenderable(objectId, objectPosition) as any,
    });
    cameraManager.followObject(objectId);
    expect(
      (cameraManager.getCameraState$() as BehaviorSubject<any>).getValue()
        .focusedObjectId,
    ).toBe(objectId);

    cameraManager.followObject(null);

    expect(
      (cameraManager.getCameraState$() as BehaviorSubject<any>).getValue()
        .focusedObjectId,
    ).toBeNull();
    expect(mockRenderer.setFollowTarget).toHaveBeenCalledWith(null);
    expect(mockRenderer.controlsManager.moveToPosition).toHaveBeenCalledWith(
      expect.any(THREE.Vector3),
      expect.any(THREE.Vector3),
    );
    expect(mockRenderer.controlsManager.moveToPosition).toHaveBeenCalledWith(
      expect.objectContaining({ x: 200, y: 200, z: 200 }),
      expect.objectContaining({ x: 0, y: 0, z: 0 }),
    );
  });

  it("focusOnObject should handle missing object", () => {
    const objectId = "nonExistent";
    cameraManager.followObject(objectId);

    expect(
      (cameraManager.getCameraState$() as BehaviorSubject<any>).getValue()
        .focusedObjectId,
    ).toBeNull();
    expect(mockRenderer.setFollowTarget).not.toHaveBeenCalled();
    expect(mockRenderer.controlsManager.moveToPosition).not.toHaveBeenCalled();
  });

  it("resetCameraView should clear focus and move to default", () => {
    const objectId = "testObj";
    const objectPosition = new THREE.Vector3(100, 0, 0);
    mockRenderableObjects$.next({
      [objectId]: createMockRenderable(objectId, objectPosition) as any,
    });
    cameraManager.followObject(objectId);
    expect(
      (cameraManager.getCameraState$() as BehaviorSubject<any>).getValue()
        .focusedObjectId,
    ).toBe(objectId);

    cameraManager.resetCameraView();

    expect(
      (cameraManager.getCameraState$() as BehaviorSubject<any>).getValue()
        .focusedObjectId,
    ).toBeNull();
    expect(mockRenderer.setFollowTarget).toHaveBeenCalledWith(null);
    expect(mockRenderer.controlsManager.moveToPosition).toHaveBeenCalledWith(
      expect.objectContaining({ x: 200, y: 200, z: 200 }),
      expect.objectContaining({ x: 0, y: 0, z: 0 }),
    );
  });

  it("pointCameraAt should call controlsManager method", () => {
    const targetPosition = new THREE.Vector3(50, 50, 50);
    cameraManager.pointCameraAt(targetPosition);

    expect(mockRenderer.controlsManager.startFollowing).toHaveBeenCalledWith(
      expect.objectContaining({ x: 50, y: 50, z: 50 }),
      true,
    );

    expect(
      (cameraManager.getCameraState$() as BehaviorSubject<any>).getValue()
        .focusedObjectId,
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

    (cameraManager as any).handleCameraTransitionComplete(mockEvent);

    const state = (
      cameraManager.getCameraState$() as BehaviorSubject<any>
    ).getValue();
    expect(state.currentPosition.equals(finalPosition)).toBe(true);
    expect(state.currentTarget.equals(finalTarget)).toBe(true);
    expect(state.focusedObjectId).toBe(finalFocusId);
  });

  it("handleCameraTransitionComplete should update state position/target from event without focus id", () => {
    const finalPosition = new THREE.Vector3(1, 1, 1);
    const finalTarget = new THREE.Vector3(2, 2, 2);

    const initialVal = (
      cameraManager.getCameraState$() as BehaviorSubject<any>
    ).getValue();
    (cameraManager.getCameraState$() as BehaviorSubject<any>).next({
      ...initialVal,
      focusedObjectId: "initialFocus",
    });

    const mockEvent = new CustomEvent("camera-transition-complete", {
      detail: {
        position: finalPosition,
        target: finalTarget,
      },
    });

    (cameraManager as any).handleCameraTransitionComplete(mockEvent);

    const state = (
      cameraManager.getCameraState$() as BehaviorSubject<any>
    ).getValue();
    expect(state.currentPosition.equals(finalPosition)).toBe(true);
    expect(state.currentTarget.equals(finalTarget)).toBe(true);

    expect(state.focusedObjectId).toBe("initialFocus");
  });

  it("handleCameraTransitionComplete should update state after manual interaction (no detail)", () => {
    const newCamPos = new THREE.Vector3(55, 66, 77);
    const newTargetPos = new THREE.Vector3(5, 6, 7);

    mockRenderer.camera.position.copy(newCamPos);
    mockRenderer.controlsManager.controls.target.copy(newTargetPos);

    const mockEvent = new Event("camera-transition-complete");

    (cameraManager as any).handleCameraTransitionComplete(mockEvent);

    const state = (
      cameraManager.getCameraState$() as BehaviorSubject<any>
    ).getValue();
    expect(state.currentPosition.equals(newCamPos)).toBe(true);
    expect(state.currentTarget.equals(newTargetPos)).toBe(true);

    expect(state.focusedObjectId).toBeNull();
  });

  it("handleCameraTransitionComplete should call onFocusChangeCallback", () => {
    const mockCallback = vi.fn();
    const managerWithCallback = new CameraManager();

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

    const mockEventClear = new CustomEvent("camera-transition-complete", {
      detail: {
        position: new THREE.Vector3(),
        target: new THREE.Vector3(),
        focusedObjectId: null,
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
      (cameraManager as any).handleCameraTransitionComplete,
    );
  });
});
