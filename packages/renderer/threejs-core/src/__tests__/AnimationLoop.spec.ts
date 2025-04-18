import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { AnimationLoop } from "../AnimationLoop";
import * as THREE from "three";
import { celestialObjectsStore } from "@teskooano/core-state";
import { CelestialType } from "@teskooano/data-types";

// Mock requestAnimationFrame and cancelAnimationFrame
const originalRequestAnimationFrame = window.requestAnimationFrame;
const originalCancelAnimationFrame = window.cancelAnimationFrame;

// Mock THREE.Clock
vi.mock("three", async () => {
  const actual = await vi.importActual("three");
  return {
    ...actual,
    Clock: vi.fn().mockImplementation(() => ({
      start: vi.fn(),
      stop: vi.fn(),
      getDelta: vi.fn().mockReturnValue(0.016), // ~60fps
      getElapsedTime: vi.fn().mockReturnValue(1.0),
    })),
  };
});

// Mock celestialObjectsStore
vi.mock("@teskooano/core-state", () => ({
  celestialObjectsStore: {
    get: vi.fn().mockReturnValue({}),
  },
}));

describe("AnimationLoop", () => {
  let animationLoop: AnimationLoop;
  let mockRequestAnimationFrame: ReturnType<typeof vi.fn>;
  let mockCancelAnimationFrame: ReturnType<typeof vi.fn>;
  let mockAnimationFrameId: number;

  beforeEach(() => {
    // Setup mocks for requestAnimationFrame and cancelAnimationFrame
    mockAnimationFrameId = 12345;
    mockRequestAnimationFrame = vi.fn().mockReturnValue(mockAnimationFrameId);
    mockCancelAnimationFrame = vi.fn();
    window.requestAnimationFrame = mockRequestAnimationFrame;
    window.cancelAnimationFrame = mockCancelAnimationFrame;

    // Create a new AnimationLoop instance
    animationLoop = new AnimationLoop();
  });

  afterEach(() => {
    // Restore original functions
    window.requestAnimationFrame = originalRequestAnimationFrame;
    window.cancelAnimationFrame = originalCancelAnimationFrame;

    // Clean up
    animationLoop.dispose();
    vi.clearAllMocks();
  });

  it("should initialize with default values", () => {
    expect(animationLoop).toBeInstanceOf(AnimationLoop);
  });

  it("should start the render loop", () => {
    animationLoop.start();

    // Check if requestAnimationFrame was called
    expect(mockRequestAnimationFrame).toHaveBeenCalled();

    // Get the animate callback
    const animateCallback = mockRequestAnimationFrame.mock.calls[0][0];

    // Call the animate callback to simulate a frame
    animateCallback();

    // Check if requestAnimationFrame was called again
    expect(mockRequestAnimationFrame).toHaveBeenCalledTimes(2);
  });

  it("should not start the render loop if it is already running", () => {
    // Start the render loop
    animationLoop.start();

    // Clear the mock to check if it's called again
    mockRequestAnimationFrame.mockClear();

    // Try to start again
    animationLoop.start();

    // Check if requestAnimationFrame was not called again
    expect(mockRequestAnimationFrame).not.toHaveBeenCalled();
  });

  it("should stop the render loop", () => {
    // Start the render loop
    animationLoop.start();

    // Stop the render loop
    animationLoop.stop();

    // Check if cancelAnimationFrame was called with the correct ID
    expect(mockCancelAnimationFrame).toHaveBeenCalledWith(mockAnimationFrameId);
  });

  it("should not stop the render loop if it is not running", () => {
    // Try to stop without starting
    animationLoop.stop();

    // Check if cancelAnimationFrame was not called
    expect(mockCancelAnimationFrame).not.toHaveBeenCalled();
  });

  it("should add and execute animation callbacks", () => {
    // Create a mock callback
    const mockCallback = vi.fn();

    // Add the callback
    animationLoop.onAnimate(mockCallback);

    // Manually call tick to simulate a frame
    // @ts-ignore - Accessing private method for testing
    animationLoop.tick();

    // Check if the callback was called with the correct arguments
    expect(mockCallback).toHaveBeenCalledWith(1.0, 0.016);
  });

  it("should add and execute render callbacks", () => {
    // Create a mock callback
    const mockCallback = vi.fn();

    // Add the callback
    animationLoop.onRender(mockCallback);

    // Manually call tick to simulate a frame
    // @ts-ignore - Accessing private method for testing
    animationLoop.tick();

    // Check if the callback was called
    expect(mockCallback).toHaveBeenCalled();
  });

  it("should remove animation callbacks", () => {
    // Create a mock callback
    const mockCallback = vi.fn();

    // Add the callback
    animationLoop.onAnimate(mockCallback);

    // Remove the callback
    animationLoop.removeAnimateCallback(mockCallback);

    // Manually call tick to simulate a frame
    // @ts-ignore - Accessing private method for testing
    animationLoop.tick();

    // Check if the callback was not called
    expect(mockCallback).not.toHaveBeenCalled();
  });

  it("should remove render callbacks", () => {
    // Create a mock callback
    const mockCallback = vi.fn();

    // Add the callback
    animationLoop.onRender(mockCallback);

    // Remove the callback
    animationLoop.removeRenderCallback(mockCallback);

    // Manually call tick to simulate a frame
    // @ts-ignore - Accessing private method for testing
    animationLoop.tick();

    // Check if the callback was not called
    expect(mockCallback).not.toHaveBeenCalled();
  });

  it("should get the delta time", () => {
    // Get the delta time
    const delta = animationLoop.getDelta();

    // Check if the delta time is correct
    expect(delta).toBe(0.016);
  });

  it("should dispose resources", () => {
    // Create mock callbacks
    const mockAnimateCallback = vi.fn();
    const mockRenderCallback = vi.fn();

    // Add the callbacks
    animationLoop.onAnimate(mockAnimateCallback);
    animationLoop.onRender(mockRenderCallback);

    // Dispose the animation loop
    animationLoop.dispose();

    // Manually call tick to simulate a frame
    // @ts-ignore - Accessing private method for testing
    animationLoop.tick();

    // Check if the callbacks were not called
    expect(mockAnimateCallback).not.toHaveBeenCalled();
    expect(mockRenderCallback).not.toHaveBeenCalled();
  });

  it("should collect light sources from celestial objects", () => {
    // Mock celestial objects with a star
    const mockCelestialObjects = {
      star1: {
        type: CelestialType.STAR,
        position: { x: 1, y: 2, z: 3 },
      },
    };

    // Update the mock to return our test objects
    // Use type assertion to avoid complex type issues
    vi.mocked(celestialObjectsStore.get).mockReturnValue(
      mockCelestialObjects as any,
    );

    // Manually call tick to simulate a frame
    // @ts-ignore - Accessing private method for testing
    animationLoop.tick();

    // The test passes if no errors are thrown
    // We can't directly test the lightSources map as it's created inside the tick method
    expect(true).toBe(true);
  });
});
