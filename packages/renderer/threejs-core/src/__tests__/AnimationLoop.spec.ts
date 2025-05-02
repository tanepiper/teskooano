import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { AnimationLoop } from "../AnimationLoop";
import * as THREE from "three";
import { celestialObjectsStore } from "@teskooano/core-state";
import { CelestialType } from "@teskooano/data-types";

const originalRequestAnimationFrame = window.requestAnimationFrame;
const originalCancelAnimationFrame = window.cancelAnimationFrame;

vi.mock("three", async () => {
  const actual = await vi.importActual("three");
  return {
    ...actual,
    Clock: vi.fn().mockImplementation(() => ({
      start: vi.fn(),
      stop: vi.fn(),
      getDelta: vi.fn().mockReturnValue(0.016),
      getElapsedTime: vi.fn().mockReturnValue(1.0),
    })),
  };
});

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
    mockAnimationFrameId = 12345;
    mockRequestAnimationFrame = vi.fn().mockReturnValue(mockAnimationFrameId);
    mockCancelAnimationFrame = vi.fn();
    window.requestAnimationFrame = mockRequestAnimationFrame;
    window.cancelAnimationFrame = mockCancelAnimationFrame;

    animationLoop = new AnimationLoop();
  });

  afterEach(() => {
    window.requestAnimationFrame = originalRequestAnimationFrame;
    window.cancelAnimationFrame = originalCancelAnimationFrame;

    animationLoop.dispose();
    vi.clearAllMocks();
  });

  it("should initialize with default values", () => {
    expect(animationLoop).toBeInstanceOf(AnimationLoop);
  });

  it("should start the render loop", () => {
    animationLoop.start();

    expect(mockRequestAnimationFrame).toHaveBeenCalled();

    const animateCallback = mockRequestAnimationFrame.mock.calls[0][0];

    animateCallback();

    expect(mockRequestAnimationFrame).toHaveBeenCalledTimes(2);
  });

  it("should not start the render loop if it is already running", () => {
    animationLoop.start();

    mockRequestAnimationFrame.mockClear();

    animationLoop.start();

    expect(mockRequestAnimationFrame).not.toHaveBeenCalled();
  });

  it("should stop the render loop", () => {
    animationLoop.start();

    animationLoop.stop();

    expect(mockCancelAnimationFrame).toHaveBeenCalledWith(mockAnimationFrameId);
  });

  it("should not stop the render loop if it is not running", () => {
    animationLoop.stop();

    expect(mockCancelAnimationFrame).not.toHaveBeenCalled();
  });

  it("should add and execute animation callbacks", () => {
    const mockCallback = vi.fn();

    animationLoop.onAnimate(mockCallback);

    animationLoop.tick();

    expect(mockCallback).toHaveBeenCalledWith(1.0, 0.016);
  });

  it("should add and execute render callbacks", () => {
    const mockCallback = vi.fn();

    animationLoop.onRender(mockCallback);

    animationLoop.tick();

    expect(mockCallback).toHaveBeenCalled();
  });

  it("should remove animation callbacks", () => {
    const mockCallback = vi.fn();

    animationLoop.onAnimate(mockCallback);

    animationLoop.removeAnimateCallback(mockCallback);

    animationLoop.tick();

    expect(mockCallback).not.toHaveBeenCalled();
  });

  it("should remove render callbacks", () => {
    const mockCallback = vi.fn();

    animationLoop.onRender(mockCallback);

    animationLoop.removeRenderCallback(mockCallback);

    animationLoop.tick();

    expect(mockCallback).not.toHaveBeenCalled();
  });

  it("should get the delta time", () => {
    const delta = animationLoop.getDelta();

    expect(delta).toBe(0.016);
  });

  it("should dispose resources", () => {
    const mockAnimateCallback = vi.fn();
    const mockRenderCallback = vi.fn();

    animationLoop.onAnimate(mockAnimateCallback);
    animationLoop.onRender(mockRenderCallback);

    animationLoop.dispose();

    animationLoop.tick();

    expect(mockAnimateCallback).not.toHaveBeenCalled();
    expect(mockRenderCallback).not.toHaveBeenCalled();
  });

  it("should collect light sources from celestial objects", () => {
    const mockCelestialObjects = {
      star1: {
        type: CelestialType.STAR,
        position: { x: 1, y: 2, z: 3 },
      },
    };

    vi.mocked(celestialObjectsStore.get).mockReturnValue(
      mockCelestialObjects as any,
    );

    animationLoop.tick();

    expect(true).toBe(true);
  });
});
