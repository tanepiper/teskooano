import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as THREE from "three";
import { UIManager } from "../UIManager";
import {
  CSS2DRenderer,
  CSS2DObject,
} from "three/examples/jsm/renderers/CSS2DRenderer.js";

describe("UIManager", () => {
  let container: HTMLDivElement;
  let uiManager: UIManager;

  beforeEach(() => {
    // Create a container element
    container = document.createElement("div");
    container.style.width = "800px";
    container.style.height = "600px";
    document.body.appendChild(container);

    // Create the UI manager
    uiManager = new UIManager(container);
  });

  afterEach(() => {
    // Clean up
    uiManager.dispose();
    document.body.removeChild(container);
  });

  it("should initialize with a CSS2DRenderer", () => {
    expect(uiManager["labelRenderer"]).toBeInstanceOf(CSS2DRenderer);
    expect(container.querySelector("div")).toBeTruthy();
  });

  it("should create toggle buttons", () => {
    // Check that toggle buttons were created
    const toggleContainer = container.querySelector("div:nth-child(2)");
    expect(toggleContainer).toBeTruthy();

    // Check that the toggle buttons were created
    const buttons = toggleContainer?.querySelectorAll("button");
    expect(buttons?.length).toBe(3);

    // Check button text
    expect(buttons?.[0].textContent).toBe("Toggle Labels");
    expect(buttons?.[1].textContent).toBe("Toggle Grid");
    expect(buttons?.[2].textContent).toBe("Toggle Background Debug");
  });

  it("should create a label for a celestial object", () => {
    // Create a parent object
    const parent = new THREE.Object3D();

    // Create a label
    uiManager.createLabel("test-object", "Test Object", parent, 100);

    // Check that the label was created and added to the parent
    expect(parent.children.length).toBe(1);
    expect(parent.children[0]).toBeInstanceOf(CSS2DObject);

    // Check that the label was stored in the labels map
    expect(uiManager["labels"].has("test-object")).toBe(true);
  });

  it("should position the label correctly", () => {
    // Create a parent object
    const parent = new THREE.Object3D();

    // Create a label
    uiManager.createLabel("test-object", "Test Object", parent, 100);

    // Get the label
    const label = parent.children[0] as CSS2DObject;

    // Check that the label was positioned correctly
    expect(label.position.y).toBe(150); // radius * 1.5
  });

  it("should remove a label", () => {
    // Create a parent object
    const parent = new THREE.Object3D();

    // Create a label
    uiManager.createLabel("test-object", "Test Object", parent, 100);

    // Remove the label
    uiManager.removeLabel("test-object");

    // Check that the label was removed from the parent
    expect(parent.children.length).toBe(0);

    // Check that the label was removed from the labels map
    expect(uiManager["labels"].has("test-object")).toBe(false);
  });

  it("should toggle label visibility", () => {
    // Create a parent object
    const parent = new THREE.Object3D();

    // Create a label
    uiManager.createLabel("test-object", "Test Object", parent, 100);

    // Get the label
    const label = parent.children[0] as CSS2DObject;

    // Check that the label is visible by default
    expect(label.visible).toBe(true);

    // Toggle label visibility
    uiManager.toggleLabels();

    // Check that the label is now hidden
    expect(label.visible).toBe(false);

    // Toggle label visibility again
    uiManager.toggleLabels();

    // Check that the label is visible again
    expect(label.visible).toBe(true);
  });

  it("should render labels", () => {
    // Create a scene and camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera();

    // Create a spy on the render method
    const renderSpy = vi.spyOn(uiManager["labelRenderer"], "render");

    // Render labels
    uiManager.render(scene, camera);

    // Check that the renderer's render method was called
    expect(renderSpy).toHaveBeenCalledWith(scene, camera);
  });

  it("should handle resize events", () => {
    // Create a spy on the setSize method
    const setSizeSpy = vi.spyOn(uiManager["labelRenderer"], "setSize");

    // Resize the UI manager
    uiManager.onResize(1024, 768);

    // Check that the renderer's setSize method was called
    expect(setSizeSpy).toHaveBeenCalledWith(1024, 768);
  });

  it("should dispatch toggle grid event when grid button is clicked", () => {
    // Get the grid toggle button
    const toggleContainer = container.querySelector("div:nth-child(2)");
    const gridButton = toggleContainer?.querySelector(
      "button:nth-child(2)",
    ) as HTMLButtonElement;

    // Create a spy for the custom event
    const eventSpy = vi.fn();
    container.addEventListener("toggleGrid", eventSpy);

    // Click the grid toggle button
    if (gridButton) {
      gridButton.dispatchEvent(new MouseEvent("click"));
    }

    // Check that the custom event was dispatched
    expect(eventSpy).toHaveBeenCalled();
  });

  it("should dispatch toggle background debug event when background debug button is clicked", () => {
    // Get the background debug toggle button
    const toggleContainer = container.querySelector("div:nth-child(2)");
    const backgroundDebugButton = toggleContainer?.querySelector(
      "button:nth-child(3)",
    ) as HTMLButtonElement;

    // Create a spy for the custom event
    const eventSpy = vi.fn();
    container.addEventListener("toggleBackgroundDebug", eventSpy);

    // Click the background debug toggle button
    if (backgroundDebugButton) {
      backgroundDebugButton.dispatchEvent(new MouseEvent("click"));
    }

    // Check that the custom event was dispatched
    expect(eventSpy).toHaveBeenCalled();
  });

  it("should clean up resources on dispose", () => {
    // Create a parent object
    const parent = new THREE.Object3D();

    // Create a label
    uiManager.createLabel("test-object", "Test Object", parent, 100);

    // Create a spy on the removeChild method
    const removeChildSpy = vi.spyOn(container, "removeChild");

    // Dispose the UI manager
    uiManager.dispose();

    // Check that the label renderer's DOM element was removed
    expect(removeChildSpy).toHaveBeenCalled();

    // Check that the labels map was cleared
    expect(uiManager["labels"].size).toBe(0);
  });
});
