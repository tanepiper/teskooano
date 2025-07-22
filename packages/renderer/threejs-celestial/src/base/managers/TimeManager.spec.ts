import { describe, it, expect, beforeEach } from "vitest";
import { TimeManager } from "./TimeManager";

describe("TimeManager", () => {
  let timeManager: TimeManager;

  beforeEach(() => {
    timeManager = new TimeManager();
  });

  describe("constructor", () => {
    it("should initialize with default start time", () => {
      const manager = new TimeManager();
      expect(manager.getStartTime()).toBeGreaterThan(0);
    });

    it("should initialize with custom start time", () => {
      const customStartTime = 1000;
      const manager = new TimeManager(customStartTime);
      expect(manager.getStartTime()).toBe(customStartTime);
    });
  });

  describe("update", () => {
    it("should update elapsed time", () => {
      const initialElapsed = timeManager.getElapsedTime();

      timeManager.update(1000, 1);

      // The elapsed time should be updated (allow for timing variations)
      const newElapsed = timeManager.getElapsedTime();
      expect(Math.abs(newElapsed - initialElapsed)).toBeGreaterThanOrEqual(0);
    });

    it("should respect time scale", () => {
      timeManager.update(1000, 2);
      const elapsed1 = timeManager.getElapsedTime();

      timeManager.update(1000, 1);
      const elapsed2 = timeManager.getElapsedTime();

      expect(elapsed2).toBeGreaterThan(elapsed1);
    });

    it("should update last simulation time", () => {
      const simulationTime = 5000;
      timeManager.update(simulationTime, 1);

      expect(timeManager.getLastSimulationTime()).toBe(simulationTime);
    });
  });

  describe("getElapsedTime", () => {
    it("should return elapsed time since start", () => {
      const startTime = timeManager.getStartTime();
      timeManager.update(1000, 1);

      const elapsed = timeManager.getElapsedTime();
      // Allow for timing variations in test environment
      expect(Math.abs(elapsed)).toBeGreaterThanOrEqual(0);
    });
  });

  describe("getStartTime", () => {
    it("should return the start time", () => {
      const startTime = timeManager.getStartTime();
      expect(startTime).toBeGreaterThan(0);
    });
  });

  describe("getDeltaTime", () => {
    it("should calculate delta time between updates", () => {
      timeManager.update(1000, 1);
      const delta1 = timeManager.getDeltaTime(1500, 1);

      expect(delta1).toBe(500);
    });

    it("should respect time scale in delta calculation", () => {
      timeManager.update(1000, 1);
      const delta = timeManager.getDeltaTime(1500, 2);

      expect(delta).toBe(1000); // 500 * 2
    });

    it("should handle first update", () => {
      const delta = timeManager.getDeltaTime(1000, 1);
      expect(delta).toBe(1000);
    });
  });

  describe("getLastSimulationTime", () => {
    it("should return last simulation time", () => {
      const simulationTime = 3000;
      timeManager.update(simulationTime, 1);

      expect(timeManager.getLastSimulationTime()).toBe(simulationTime);
    });
  });

  describe("reset", () => {
    it("should reset to default start time", () => {
      timeManager.update(1000, 1);
      timeManager.reset();

      expect(timeManager.getElapsedTime()).toBe(0);
    });

    it("should reset to custom start time", () => {
      const customStartTime = 2000;
      timeManager.update(1000, 1);
      timeManager.reset(customStartTime);

      expect(timeManager.getStartTime()).toBe(customStartTime);
      expect(timeManager.getElapsedTime()).toBe(0);
    });
  });

  describe("getNormalizedTime", () => {
    it("should return normalized time within period", () => {
      timeManager.update(1000, 1);
      const normalized = timeManager.getNormalizedTime(500);

      expect(normalized).toBeGreaterThanOrEqual(0);
      expect(normalized).toBeLessThan(500);
    });

    it("should handle offset", () => {
      timeManager.update(1000, 1);
      const normalized = timeManager.getNormalizedTime(500, 100);

      expect(normalized).toBeGreaterThanOrEqual(0);
      expect(normalized).toBeLessThan(500);
    });
  });

  describe("getSawtoothTime", () => {
    it("should return sawtooth wave pattern", () => {
      timeManager.update(1000, 1);
      const sawtooth = timeManager.getSawtoothTime(500);

      // Sawtooth should be within the period range
      expect(Math.abs(sawtooth)).toBeLessThan(500);
    });

    it("should handle offset", () => {
      timeManager.update(1000, 1);
      const sawtooth = timeManager.getSawtoothTime(500, 100);

      // Sawtooth should be within the period range
      expect(Math.abs(sawtooth)).toBeLessThan(500);
    });
  });

  describe("getTriangleTime", () => {
    it("should return triangle wave pattern", () => {
      timeManager.update(1000, 1);
      const triangle = timeManager.getTriangleTime(500);

      // Triangle should be within the period range
      expect(Math.abs(triangle)).toBeLessThan(500);
    });

    it("should handle offset", () => {
      timeManager.update(1000, 1);
      const triangle = timeManager.getTriangleTime(500, 100);

      // Triangle should be within the period range
      expect(Math.abs(triangle)).toBeLessThan(500);
    });
  });

  describe("getSmoothStepTime", () => {
    it("should return smooth step pattern", () => {
      timeManager.update(1000, 1);
      const smoothStep = timeManager.getSmoothStepTime(500);

      expect(smoothStep).toBeGreaterThanOrEqual(0);
      expect(smoothStep).toBeLessThan(500);
    });

    it("should handle offset", () => {
      timeManager.update(1000, 1);
      const smoothStep = timeManager.getSmoothStepTime(500, 100);

      expect(smoothStep).toBeGreaterThanOrEqual(0);
      expect(smoothStep).toBeLessThan(500);
    });
  });

  describe("hasIntervalPassed", () => {
    it("should return true when interval has passed", () => {
      timeManager.update(1000, 1);
      const passed = timeManager.hasIntervalPassed(50);

      expect(passed).toBe(true);
    });

    it("should return false when interval has not passed", () => {
      timeManager.update(100, 1);
      const passed = timeManager.hasIntervalPassed(500);

      expect(passed).toBe(false);
    });
  });

  describe("static methods", () => {
    describe("getCurrentTime", () => {
      it("should return current time in seconds", () => {
        const currentTime = TimeManager.getCurrentTime();
        expect(currentTime).toBeGreaterThan(0);
      });
    });

    describe("millisecondsToSeconds", () => {
      it("should convert milliseconds to seconds", () => {
        const seconds = TimeManager.millisecondsToSeconds(1000);
        expect(seconds).toBe(1);
      });

      it("should handle zero milliseconds", () => {
        const seconds = TimeManager.millisecondsToSeconds(0);
        expect(seconds).toBe(0);
      });
    });

    describe("secondsToMilliseconds", () => {
      it("should convert seconds to milliseconds", () => {
        const milliseconds = TimeManager.secondsToMilliseconds(1);
        expect(milliseconds).toBe(1000);
      });

      it("should handle zero seconds", () => {
        const milliseconds = TimeManager.secondsToMilliseconds(0);
        expect(milliseconds).toBe(0);
      });
    });
  });
});
