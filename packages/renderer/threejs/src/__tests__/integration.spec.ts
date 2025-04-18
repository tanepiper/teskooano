import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { ModularSpaceRenderer } from "../index";
import { CelestialType } from "@teskooano/data-types";

// Mock the core-state dependencies
vi.mock("@teskooano/core-state", () => {
  const mockCelestialObjects = {};
  const mockSimState = {
    camera: {
      position: { x: 0, y: 0, z: 1000 },
      target: { x: 0, y: 0, z: 0 },
    },
  };

  return {
    simulationState: {
      get: vi.fn(() => mockSimState),
      subscribe: vi.fn((callback) => {
        callback(mockSimState);
        return vi.fn(); // Unsubscribe function
      }),
    },
    celestialObjectsStore: {
      get: vi.fn(() => mockCelestialObjects),
      subscribe: vi.fn((callback) => {
        callback(mockCelestialObjects);
        return vi.fn(); // Unsubscribe function
      }),
    },
    getChildrenOfObject: vi.fn(() => []),
    actions: {
      updateCamera: vi.fn(),
    },
  };
});

describe("ThreeJS Renderer Integration Tests", () => {
  let container: HTMLElement;
  let renderer: ModularSpaceRenderer;

  beforeEach(() => {
    // Create a container for the renderer
    container = document.createElement("div");
    container.id = "renderer-container";
    container.style.width = "800px";
    container.style.height = "600px";
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (renderer) {
      renderer.dispose();
    }
    document.body.removeChild(container);
    vi.clearAllMocks();
  });

  it("should initialize and subscribe to state changes", async () => {
    // Initialize the renderer
    renderer = new ModularSpaceRenderer(container);

    // Import the mocked state modules
    const { simulationState, celestialObjectsStore } = await import(
      "@teskooano/core-state"
    );

    // Verify that the renderer has subscribed to state changes
    expect(simulationState.subscribe).toHaveBeenCalled();
    expect(celestialObjectsStore.subscribe).toHaveBeenCalled();
  });

  it("should update when celestial objects change", async () => {
    // Initialize the renderer
    renderer = new ModularSpaceRenderer(container);

    // Import the mocked state module
    const { celestialObjectsStore } = await import("@teskooano/core-state");

    // Get the subscription callback
    const mockSubscribe = celestialObjectsStore.subscribe as any;
    const subscribeCallback = mockSubscribe.mock.calls[0][0];

    // Create a test object
    const testStar = {
      id: "test-star",
      name: "Test Star",
      type: CelestialType.STAR,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      scale: { x: 10, y: 10, z: 10 },
      mass: 10000,
      radius: 1000,
    };

    // Mock the update with a new object
    const updatedObjects = { "test-star": testStar };

    // Call the subscription callback with the updated objects
    subscribeCallback(updatedObjects);

    // Verify that the renderer handles the update correctly
    expect(() => renderer.render()).not.toThrow();
  });

  it("should update when camera state changes", async () => {
    // Initialize the renderer
    renderer = new ModularSpaceRenderer(container);

    // Import the mocked state module
    const { simulationState } = await import("@teskooano/core-state");

    // Get the subscription callback
    const mockSubscribe = simulationState.subscribe as any;
    const subscribeCallback = mockSubscribe.mock.calls[0][0];

    // Create new camera state
    const newCameraState = {
      camera: {
        position: { x: 500, y: 1000, z: 1500 },
        target: { x: 100, y: 200, z: 300 },
      },
    };

    // Call the subscription callback with the updated camera state
    subscribeCallback(newCameraState);

    // Verify that the renderer handles the update correctly
    expect(() => renderer.render()).not.toThrow();
  });
});
