import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { ControlsManager } from "../ControlsManager";
import * as THREE from "three";
import { simulationStateService } from "@teskooano/core-state";

// Mock the simulationStateService
vi.mock("@teskooano/core-state", () => ({
  simulationStateService: {
    setSimulationState: vi.fn(),
  },
  StateSubscriptionMixin: class {
    subscribeToState() {}
    dispose() {}
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
    expect(controlsManager.controls.dampingFactor).toBe(0.5);
    expect(controlsManager.controls.screenSpacePanning).toBe(false);
    expect(controlsManager.controls.minDistance).toBe(0.0001);
    expect(controlsManager.controls.maxDistance).toBe(1e8);
    expect(controlsManager.controls.maxPolarAngle).toBe(Math.PI);
    expect(controlsManager.controls.enableZoom).toBe(true);
    expect(controlsManager.controls.zoomSpeed).toBe(1.0);
    expect(controlsManager.controls.enableRotate).toBe(true);
    expect(controlsManager.controls.rotateSpeed).toBe(1.0);
    expect(controlsManager.controls.enablePan).toBe(true);
    expect(controlsManager.controls.panSpeed).toBe(1.0);
  });

  it("should update camera target", () => {
    const newTarget = new THREE.Vector3(100, 200, 300);
    controlsManager.controls.target.set(newTarget.x, newTarget.y, newTarget.z);

    expect(controlsManager.controls.target.x).toBe(100);
    expect(controlsManager.controls.target.y).toBe(200);
    expect(controlsManager.controls.target.z).toBe(300);
  });

  it("should update controls when called", () => {
    const updateSpy = vi.spyOn(controlsManager.controls, "update");

    controlsManager.controls.update();

    expect(updateSpy).toHaveBeenCalled();
  });

  it("should enable and disable controls", () => {
    controlsManager.setEnabled(false);
    expect(controlsManager.controls.enabled).toBe(false);

    controlsManager.setEnabled(true);
    expect(controlsManager.controls.enabled).toBe(true);
  });

  it("should handle controls end event", () => {
    // Ensure controls are enabled
    controlsManager.setEnabled(true);

    camera.position.set(100, 200, 300);
    controlsManager.controls.target.set(10, 20, 30);

    // Trigger the end event - this should not throw an error
    expect(() => {
      controlsManager.controls.dispatchEvent({ type: "end" });
    }).not.toThrow();
  });

  it("should not dispatch custom event when controls are disabled", () => {
    const eventSpy = vi.spyOn(container, "dispatchEvent");

    controlsManager.setEnabled(false);

    camera.position.set(100, 200, 300);
    controlsManager.controls.target.set(10, 20, 30);

    controlsManager.controls.dispatchEvent({ type: "end" });

    expect(eventSpy).not.toHaveBeenCalled();
  });

  it("should dispose controls properly", () => {
    const disposeSpy = vi.spyOn(controlsManager.controls, "dispose");

    controlsManager.dispose();

    expect(disposeSpy).toHaveBeenCalled();
  });
});
