import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { ControlsManager } from "../ControlsManager";
import * as THREE from "three";
import { simulationState } from "@teskooano/core-state";

vi.mock("@teskooano/core-state", () => ({
  simulationState: {
    get: vi.fn().mockReturnValue({
      camera: {
        position: { x: 0, y: 0, z: 1000 },
        target: { x: 0, y: 0, z: 0 },
      },
    }),
    set: vi.fn(),
  },
}));

describe("ControlsManager", () => {
  let controlsManager: ControlsManager;
  let camera: THREE.PerspectiveCamera;
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    container.style.width = "800px";
    container.style.height = "600px";
    document.body.appendChild(container);

    camera = new THREE.PerspectiveCamera(75, 800 / 600, 0.1, 100000);
    camera.position.set(0, 0, 1000);

    controlsManager = new ControlsManager(camera, container);
  });

  afterEach(() => {
    controlsManager.dispose();
    document.body.removeChild(container);
    vi.clearAllMocks();
  });

  it("should initialize with default settings", () => {
    expect(controlsManager.controls).toBeDefined();
    expect(controlsManager.controls.enableDamping).toBe(true);
    expect(controlsManager.controls.dampingFactor).toBe(0.1);
    expect(controlsManager.controls.screenSpacePanning).toBe(false);
    expect(controlsManager.controls.minDistance).toBe(0.1);
    expect(controlsManager.controls.maxDistance).toBe(50000);
    expect(controlsManager.controls.maxPolarAngle).toBe(Math.PI);
    expect(controlsManager.controls.enableZoom).toBe(true);
    expect(controlsManager.controls.zoomSpeed).toBe(0.7);
    expect(controlsManager.controls.enableRotate).toBe(true);
    expect(controlsManager.controls.rotateSpeed).toBe(0.5);
    expect(controlsManager.controls.enablePan).toBe(true);
    expect(controlsManager.controls.panSpeed).toBe(1.0);
  });

  it("should update camera target", () => {
    const newTarget = new THREE.Vector3(100, 200, 300);
    controlsManager.updateTarget(newTarget);

    expect(controlsManager.controls.target.x).toBe(100);
    expect(controlsManager.controls.target.y).toBe(200);
    expect(controlsManager.controls.target.z).toBe(300);
  });

  it("should update controls when called", () => {
    const updateSpy = vi.spyOn(controlsManager.controls, "update");

    controlsManager.update();

    expect(updateSpy).toHaveBeenCalled();
  });

  it("should enable and disable controls", () => {
    controlsManager.setEnabled(false);
    expect(controlsManager.controls.enabled).toBe(false);

    controlsManager.setEnabled(true);
    expect(controlsManager.controls.enabled).toBe(true);
  });

  it("should update simulation state when controls change", () => {
    camera.position.set(100, 200, 300);
    controlsManager.controls.target.set(10, 20, 30);

    controlsManager.controls.dispatchEvent({ type: "change" });

    expect(simulationState.set).toHaveBeenCalledWith({
      camera: {
        position: expect.any(THREE.Vector3),
        target: expect.any(THREE.Vector3),
      },
    });

    const setCall = vi.mocked(simulationState.set).mock.calls[0][0];
    const cameraState = setCall.camera;

    expect(cameraState.position.x).toBe(100);
    expect(cameraState.position.y).toBe(200);
    expect(cameraState.position.z).toBe(300);

    expect(cameraState.target.x).toBe(10);
    expect(cameraState.target.y).toBe(20);
    expect(cameraState.target.z).toBe(30);
  });

  it("should not update simulation state when controls are disabled", () => {
    controlsManager.setEnabled(false);

    camera.position.set(100, 200, 300);
    controlsManager.controls.target.set(10, 20, 30);

    controlsManager.controls.dispatchEvent({ type: "change" });

    expect(simulationState.set).not.toHaveBeenCalled();
  });

  it("should dispose controls properly", () => {
    const disposeSpy = vi.spyOn(controlsManager.controls, "dispose");

    controlsManager.dispose();

    expect(disposeSpy).toHaveBeenCalled();
  });
});
