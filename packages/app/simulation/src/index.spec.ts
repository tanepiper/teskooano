import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { simulationManager, SimulationManager } from "./index";
import {
  celestialFactory,
  getSimulationState,
  setSimulationState,
} from "@teskooano/core-state";
import { OSVector3 } from "@teskooano/core-math"; // Import OSVector3
import { ModularSpaceRenderer } from "@teskooano/renderer-threejs"; // Import for mock verification
import type { CelestialObject } from "@teskooano/data-types";
import { CelestialType } from "@teskooano/data-types";

// Mock core-state
vi.mock("@teskooano/core-state", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@teskooano/core-state")>();
  return {
    ...actual,
    celestialFactory: {
      ...actual.celestialFactory,
      clearState: vi.fn(),
    },
    getSimulationState: vi.fn(), // Default mock setup in beforeEach
    setSimulationState: vi.fn(),
    physicsSystemAdapter: {
      getPhysicsBodies: vi.fn(() => []),
      getCelestialObjectsSnapshot: vi.fn(() => ({})),
      updateStateFromResult: vi.fn(),
    },
  };
});

// Mock renderer-threejs
const mockRendererInstance = {
  onResize: vi.fn(),
  dispose: vi.fn(),
  startRenderLoop: vi.fn(),
  // Add other methods if SimulationManager interacts with them
};
vi.mock("@teskooano/renderer-threejs", () => ({
  ModularSpaceRenderer: vi.fn().mockImplementation(() => mockRendererInstance),
}));

describe("SimulationManager", () => {
  let container: HTMLElement;

  beforeEach(() => {
    vi.clearAllMocks();

    container = document.createElement("div");
    document.body.appendChild(container);

    // Use vi.mocked to correctly type the mocked function for further interactions
    vi.mocked(getSimulationState).mockReturnValue({
      time: 0,
      timeScale: 1,
      paused: false,
      selectedObject: null,
      focusedObjectId: null,
      camera: {
        position: new OSVector3(0, 0, 0), // Use OSVector3
        target: new OSVector3(0, 0, 0), // Use OSVector3
        fov: 75,
      },
      physicsEngine: "verlet",
      visualSettings: { trailLengthMultiplier: 1 },
      performanceProfile: "medium",
    } as any); // Cast to any to satisfy the full SimulationState if OSVector3 is not perfectly matching THREE.Vector3 in type
    // Reset the singleton instance for test isolation BEFORE each test that might use it
    // This ensures initialize can be called cleanly.
    (SimulationManager as any).instance = null;
  });

  afterEach(() => {
    simulationManager.dispose(); // Calls internal stopLoop, disposeRenderer etc.
    // Ensure static instance is cleared AFTER tests if not done in beforeEach or if a test fails mid-way
    (SimulationManager as any).instance = null;
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  });

  describe("getInstance", () => {
    it("should return the same instance", () => {
      const instance1 = SimulationManager.getInstance();
      const instance2 = SimulationManager.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe("initialization", () => {
    it("should initialize the renderer and setup event listeners", () => {
      const addEventSpy = vi.spyOn(window, "addEventListener");
      simulationManager.initialize(container);
      expect(ModularSpaceRenderer).toHaveBeenCalledWith(container);
      expect(addEventSpy).toHaveBeenCalledWith("resize", expect.any(Function));
      addEventSpy.mockRestore();
    });

    it("should warn if already initialized and dispose old renderer", () => {
      const consoleWarnSpy = vi
        .spyOn(console, "warn")
        .mockImplementation(() => {});
      simulationManager.initialize(container); // First init
      const firstRendererDisposeSpy = mockRendererInstance.dispose;

      simulationManager.initialize(container); // Second init
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "SimulationManager already initialized.",
      );
      expect(firstRendererDisposeSpy).toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });
  });

  describe("loop control", () => {
    it("should not start loop if not initialized", () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      // Access via getInstance to ensure manager is attempted to be used "fresh" if instance was nulled
      SimulationManager.getInstance().startLoop();
      expect(SimulationManager.getInstance().isLoopRunning).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Renderer not initialized. Call initialize() before starting the loop.",
      );
      consoleErrorSpy.mockRestore();
    });

    it("should start and stop the simulation loop", () => {
      simulationManager.initialize(container);
      simulationManager.startLoop();
      expect(simulationManager.isLoopRunning).toBe(true);

      simulationManager.stopLoop();
      expect(simulationManager.isLoopRunning).toBe(false);
    });
  });

  describe("resetSystem", () => {
    it("should call celestialFactory.clearState and emit onResetTime event", async () => {
      simulationManager.initialize(container);
      const resetTimePromise = new Promise<void>((resolve) => {
        const sub = simulationManager.onResetTime.subscribe(() => {
          resolve();
          sub.unsubscribe();
        });
      });

      simulationManager.resetSystem(false);
      // Use vi.mocked for type-safe access to the mock
      expect(vi.mocked(celestialFactory.clearState)).toHaveBeenCalledWith({
        resetCamera: false,
        resetTime: true,
        resetSelection: true,
      });
      await expect(resetTimePromise).resolves.toBeUndefined();
    });

    it("should skip celestialFactory.clearState if skipStateClear is true but still emit event", async () => {
      simulationManager.initialize(container);
      // Use vi.mocked for type-safe access to the mock for setting return value
      vi.mocked(getSimulationState).mockReturnValueOnce({
        time: 100,
        paused: false,
        timeScale: 1,
        camera: {
          position: new OSVector3(0, 0, 0),
          target: new OSVector3(0, 0, 0),
          fov: 75,
        },
      } as any); // Cast to any if type is complex
      const resetTimePromise = new Promise<void>((resolve) => {
        const sub = simulationManager.onResetTime.subscribe(() => {
          resolve();
          sub.unsubscribe();
        });
      });

      simulationManager.resetSystem(true);

      expect(vi.mocked(celestialFactory.clearState)).not.toHaveBeenCalled();
      await expect(resetTimePromise).resolves.toBeUndefined();
      expect(vi.mocked(setSimulationState)).toHaveBeenCalledWith(
        expect.objectContaining({ time: 0 }),
      );
    });
  });

  describe("event observables", () => {
    it("onOrbitUpdate should allow subscription and emit", async () => {
      simulationManager.initialize(container);
      const orbitUpdatePromise = new Promise<any>((resolve) => {
        const sub = simulationManager.onOrbitUpdate.subscribe((payload) => {
          expect(payload).toBeDefined();
          resolve(payload);
          sub.unsubscribe();
        });
      });
      (simulationManager as any)._orbitUpdate$.next({
        positions: { test: { x: 1, y: 1, z: 1 } },
      });
      await expect(orbitUpdatePromise).resolves.toEqual({
        positions: { test: { x: 1, y: 1, z: 1 } },
      });
    });

    it("onDestructionOccurred should allow subscription and emit", async () => {
      simulationManager.initialize(container);
      const destructionPromise = new Promise<any>((resolve) => {
        const sub = simulationManager.onDestructionOccurred.subscribe(
          (event) => {
            expect(event).toBeDefined();
            resolve(event);
            sub.unsubscribe();
          },
        );
      });
      const testEvent = { type: "collision", primaryId: "1", secondaryId: "2" };
      (simulationManager as any)._destructionOccurred$.next(testEvent);
      await expect(destructionPromise).resolves.toEqual(testEvent);
    });
  });

  describe("dispose", () => {
    it("should stop the loop, dispose renderer, and remove event listeners", () => {
      simulationManager.initialize(container);
      simulationManager.startLoop();

      const removeEventSpy = vi.spyOn(window, "removeEventListener");
      const initialRendererDisposeSpy = mockRendererInstance.dispose;

      simulationManager.dispose();

      expect(simulationManager.isLoopRunning).toBe(false); // stopLoop makes this false
      expect(initialRendererDisposeSpy).toHaveBeenCalled();
      expect(removeEventSpy).toHaveBeenCalledWith(
        "resize",
        expect.any(Function),
      );
      removeEventSpy.mockRestore();
    });

    it("should complete all event subjects on dispose", async () => {
      simulationManager.initialize(container);
      const onComplete = (subjectName: string) =>
        new Promise<void>((resolve) => {
          // Access private subject for testing completion
          (simulationManager as any)[subjectName].subscribe({
            complete: () => resolve(),
          });
        });

      const resetCompletePromise = onComplete("_resetTime$");
      const orbitCompletePromise = onComplete("_orbitUpdate$");
      const destructionCompletePromise = onComplete("_destructionOccurred$");

      simulationManager.dispose();

      await expect(resetCompletePromise).resolves.toBeUndefined();
      await expect(orbitCompletePromise).resolves.toBeUndefined();
      await expect(destructionCompletePromise).resolves.toBeUndefined();
    });
  });

  // The old tests for addObject, removeObject, and direct keyboard event handling
  // are removed as that functionality is not part of SimulationManager.
});
